from celery import shared_task
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


@shared_task
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
            # Skip duplicates
            if Article.objects.filter(url=entry.link).exists():
                continue

            # Parse publish date
            published_at = timezone.now()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_at = datetime.datetime.fromtimestamp(
                    time.mktime(entry.published_parsed),
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

            # Request enrichment from the ML FastAPI microservice
            try:
                ml_url = "http://ml-fastapi:8000/api/ml/analyze"
                response = requests.post(ml_url, json={"text": raw_content}, timeout=10)
                if response.status_code == 200:
                    ml_data = response.json()
            except requests.RequestException as e:
                print(f"ML Service unavailable for article {entry.link}: {e}")

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
