# Celery removed — scrape_rss_feeds is now called directly by the scraper-cron service
import json
import os
import trafilatura
from groq import Groq
from .models import ArticleSummary
import feedparser
from .models import NewsSource, Article
from django.utils import timezone
import datetime
import time
import requests
import re


def strip_html(text: str) -> str:
    """Remove HTML tags and decode common HTML entities from a string."""
    if not text:
        return ''
    # Remove script/style blocks entirely
    text = re.sub(r'<(script|style)[^>]*>.*?</(script|style)>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Remove all remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode common HTML entities
    text = (text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
                .replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' '))
    # Collapse whitespace
    return ' '.join(text.split()).strip()


def extract_image(entry) -> str:
    """Try multiple RSS fields to find an article thumbnail URL, falling back to scraping the article's og:image."""
    # 1. media:content tag (most common in modern feeds)
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if media.get('url') and media.get('type', '').startswith('image'):
                return media['url']

    # 2. media:thumbnail tag
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        return entry.media_thumbnail[0].get('url', '')

    # 3. Enclosures (image attachments in the feed)
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get('type', '').startswith('image'):
                return enc.get('href', enc.get('url', ''))

    # 4. Parse first <img> from the raw description HTML
    content = getattr(entry, 'description', '') or getattr(entry, 'summary', '')
    if content:
        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content, re.IGNORECASE)
        if img_match:
            return img_match.group(1)
            
    # 5. Ultimate Fallback: Scrape the actual article URL for Open Graph (og:image)
    if hasattr(entry, 'link') and entry.link:
        try:
            # Add a generic user-agent to prevent blocks from sites like Kathmandu Post
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            resp = requests.get(entry.link, headers=headers, timeout=5)
            if resp.status_code == 200:
                og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', resp.text, re.IGNORECASE)
                if not og_match:
                    # Some sites swap property and content order
                    og_match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', resp.text, re.IGNORECASE)
                
                if og_match:
                    return og_match.group(1)
        except Exception as e:
            print(f"Failed to fetch og:image for {entry.link}: {e}")

    return ''


def scrape_rss_feeds():
    """
    Periodic task to scrape all active NewsSource RSS feeds.
    Strips HTML from descriptions, extracts thumbnail images,
    and saves clean article records to PostgreSQL.
    """
    sources = NewsSource.objects.filter(is_active=True)
    new_articles_count = 0

    for source in sources:
        feed = feedparser.parse(source.rss_feed_url)

        for entry in feed.entries:
            # Skip duplicates (Check by URL or identical Title)
            if Article.objects.filter(url=entry.link).exists() or Article.objects.filter(title=entry.title).exists():
                continue

            # Parse publish date
            published_at = timezone.now()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                import calendar
                published_at = datetime.datetime.fromtimestamp(
                    calendar.timegm(entry.published_parsed),
                    tz=datetime.timezone.utc
                )

            # Strip HTML tags from the raw description before storing
            raw_html = getattr(entry, 'description', '') or getattr(entry, 'summary', '')
            raw_content = strip_html(raw_html)

            # Extract the best available thumbnail image URL
            image_url = extract_image(entry)

            ml_data = {
                "category": None,
                "language": None,
                "political_leaning": None,
                "summary": None
            }

            # Request enrichment from Groq API directly (Replaces ml-fastapi)
            groq_api_key = os.environ.get("GROQ_API_KEY")
            if groq_api_key:
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        client = Groq(api_key=groq_api_key)
                        prompt = f"""
You are a news classifier. Analyze this article and return ONLY valid JSON.
Source: {source.name}
Title: {entry.title}
Content: {raw_content[:2000]}

Respond EXACTLY with this JSON structure:
{{
  "category": "Technology" | "Business" | "Politics" | "Science" | "Sports" | "Health" | "Entertainment" | "World" | "General",
  "language": "en" | "ne" | "hi",
  "political_leaning": "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Far Right",
  "summary": ["A short 1-2 sentence summary of the article."]
}}
"""
                        response = client.chat.completions.create(
                            messages=[{"role": "user", "content": prompt}],
                            model="llama-3.1-8b-instant",
                            temperature=0.1,
                            response_format={"type": "json_object"}
                        )
                        ml_data = json.loads(response.choices[0].message.content)
                        time.sleep(2) # Small pause to help prevent hitting the rate limit
                        break # Success, break out of retry loop
                    except Exception as e:
                        error_str = str(e)
                        if "429" in error_str or "rate_limit" in error_str.lower():
                            if attempt < max_retries - 1:
                                wait_time = 3 ** (attempt + 1)
                                print(f"Rate limit hit. Waiting {wait_time}s before retry... (Attempt {attempt + 1}/{max_retries})")
                                time.sleep(wait_time)
                            else:
                                print(f"Groq API Rate Limit failed after {max_retries} attempts for {entry.link}: {e}")
                        else:
                            print(f"Groq API Error for {entry.link}: {e}")
                            break # Break on non-429 errors
            else:
                print("GROQ_API_KEY not found in environment, skipping enrichment.")

            # Save the clean, enriched article to the database
            Article.objects.create(
                source=source,
                title=entry.title,
                url=entry.link,
                raw_content=raw_content,
                image_url=image_url,
                published_at=published_at,
                category=ml_data.get("category"),
                language=ml_data.get("language"),
                political_leaning=ml_data.get("political_leaning"),
                summary=ml_data.get("summary")
            )
            new_articles_count += 1

    return f"Scraped {new_articles_count} new articles."

def generate_article_summary(article_id):
    """
    Fetch full article text using trafilatura and generate a JSON summary using Groq Llama 3.3.
    """
    try:
        article = Article.objects.get(id=article_id)
        if hasattr(article, 'ai_summary'):
            return "Summary already exists"

        # 1. Fetch full body
        downloaded = trafilatura.fetch_url(article.url)
        full_text = trafilatura.extract(downloaded) if downloaded else None
        
        if not full_text:
            full_text = article.raw_content
            
        article.full_content = full_text
        article.save(update_fields=['full_content'])

        # 2. Call Groq
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            return "GROQ_API_KEY not set"
            
        client = Groq(api_key=groq_api_key)
        
        prompt = f"""
You are a professional news editor. Analyze this article and respond ONLY with valid JSON.

Article Title: {article.title}
Article Source: {article.source.name}
Article Body: {full_text}

Respond with this exact JSON structure (no markdown tags, just raw JSON):
{{
  "summary_paragraphs": [
    "First paragraph: A comprehensive 3-5 sentence introduction covering the main event, key figures, and immediate context.",
    "Second paragraph: A detailed 3-5 sentence explanation of the background, implications, and any statements made by authorities or involved parties.",
    "Third paragraph (optional): A 2-4 sentence conclusion regarding future steps, broader impact, or related ongoing events."
  ],
  "sentiment": "Positive" or "Neutral" or "Negative" or "Mixed",
  "sentiment_reason": "Brief explanation of the sentiment",
  "key_people": ["Person 1", "Person 2"],
  "key_places": ["Location 1"],
  "key_organizations": ["Org 1", "Org 2"],
  "reading_time_mins": 3,
  "complexity": "Beginner" or "Intermediate" or "Expert"
}}
"""
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        result_json = json.loads(response.choices[0].message.content)
        
        # 3. Save Summary
        ArticleSummary.objects.create(
            article=article,
            bullet_points=[], # Leaving empty since we switched to paragraphs
            sentiment=result_json.get("sentiment", "Neutral"),
            sentiment_reason=result_json.get("sentiment_reason", ""),
            key_entities={
                "people": result_json.get("key_people", []),
                "places": result_json.get("key_places", []),
                "orgs": result_json.get("key_organizations", []),
                "summary_paragraphs": result_json.get("summary_paragraphs", [])
            },
            reading_time_mins=result_json.get("reading_time_mins", 1),
            complexity=result_json.get("complexity", "Intermediate"),
            ai_model="llama-3.3-70b-versatile",
            tokens_used=response.usage.total_tokens if response.usage else None
        )
        
        article.status = 'enriched'
        article.save(update_fields=['status'])
        
        return f"Summary generated for {article.title}"
        
    except Exception as e:
        print(f"Failed to generate summary for {article_id}: {str(e)}")
        # Fallback to HuggingFace could go here
        return f"Error: {str(e)}"
