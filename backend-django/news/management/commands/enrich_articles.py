import re
from django.core.management.base import BaseCommand
from news.models import Article


# ---------------------------------------------------------------------------
# Inline Lightweight ML — No external service needed
# ---------------------------------------------------------------------------

CATEGORY_KEYWORDS = {
    "Technology": [
        "ai", "artificial intelligence", "machine learning", "software", "app", "tech",
        "smartphone", "iphone", "android", "computer", "internet", "cyber", "robot",
        "algorithm", "data", "cloud", "startup", "silicon", "chip", "semiconductor",
        "5g", "quantum", "hack", "privacy", "social media", "tiktok", "facebook",
        "google", "microsoft", "apple", "amazon", "openai", "gpt", "digital", "code",
        "video game", "console", "gaming", "vr", "ar", "metaverse", "bitcoin", "crypto",
    ],
    "Business": [
        "economy", "market", "stock", "shares", "inflation", "gdp", "trade", "tariff",
        "bank", "finance", "investment", "profit", "revenue", "earnings", "ipo",
        "acquisition", "merger", "venture", "entrepreneur", "retail", "supply chain",
        "oil", "energy", "dollar", "currency", "interest rate", "fed", "recession",
    ],
    "Politics": [
        "government", "president", "prime minister", "parliament", "election", "vote",
        "policy", "law", "senate", "congress", "minister", "democrat", "republican",
        "political", "treaty", "sanction", "nato", "un ", "united nations", "diplomat",
        "war", "conflict", "military", "army", "defence", "defense", "protest",
        "rights", "constitution", "legislation", "white house", "kremlin",
    ],
    "Science": [
        "research", "study", "scientist", "discovery", "experiment", "space", "nasa",
        "planet", "climate", "environment", "genome", "dna", "gene", "medicine",
        "drug", "vaccine", "crispr", "biology", "chemistry", "physics", "particle",
        "telescope", "mars", "moon", "asteroid", "fossil", "geology",
    ],
    "Sports": [
        "football", "soccer", "basketball", "tennis", "cricket", "rugby", "golf",
        "olympics", "world cup", "championship", "league", "match", "player",
        "team", "coach", "stadium", "score", "goal", "transfer", "nba", "nfl",
        "fifa", "wimbledon", "marathon", "athlete", "boxing", "f1", "formula",
    ],
    "Health": [
        "health", "hospital", "doctor", "patient", "disease", "cancer", "diabetes",
        "mental health", "nhs", "covid", "virus", "pandemic", "obesity", "diet",
        "exercise", "wellness", "surgery", "treatment", "therapy", "medical",
    ],
    "Entertainment": [
        "movie", "film", "music", "celebrity", "actor", "actress", "singer", "album",
        "concert", "streaming", "netflix", "disney", "hollywood", "award", "oscar",
        "grammy", "tv show", "series", "fashion", "culture", "theatre",
    ],
}

SOURCE_LEANING = {
    "bbc": "Center",
    "reuters": "Center",
    "associated press": "Center",
    "guardian": "Center-Left",
    "new york times": "Center-Left",
    "washington post": "Center-Left",
    "cnn": "Center-Left",
    "msnbc": "Left",
    "fox news": "Right",
    "breitbart": "Right",
    "daily mail": "Center-Right",
    "the sun": "Center-Right",
    "wall street journal": "Center-Right",
    "financial times": "Center",
    "al jazeera": "Center",
    "techcrunch": "Center",
    "the verge": "Center",
    "wired": "Center-Left",
    "bloomberg": "Center",
    "kathmandu post": "Center",
}


def classify_category(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score
    return max(scores, key=scores.get) if scores else "General"


def classify_leaning(source_name: str) -> str:
    if source_name:
        name_lower = source_name.lower()
        for key, leaning in SOURCE_LEANING.items():
            if key in name_lower:
                return leaning
    return "Center"


def classify_language(text: str) -> str:
    try:
        from langdetect import detect
        return detect(text)
    except Exception:
        return "en"


def extract_summary(text: str, num_sentences: int = 3) -> list:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    return sentences[:num_sentences] if sentences else ["No summary available."]


# ---------------------------------------------------------------------------
# Management Command
# ---------------------------------------------------------------------------
class Command(BaseCommand):
    help = 'Re-enrich existing articles with ML metadata (runs entirely inside Django, no ML service needed)'

    def handle(self, *args, **options):
        articles = Article.objects.filter(category__isnull=True) | Article.objects.filter(category='')
        total = articles.count()
        self.stdout.write(self.style.HTTP_INFO(f'\nFound {total} articles to enrich...\n'))

        enriched = 0
        for article in articles:
            content = article.raw_content or article.title or ''
            combined = f"{article.title} {content}"

            article.category = classify_category(combined)
            article.political_leaning = classify_leaning(
                article.source.name if article.source else ''
            )
            article.language = classify_language(combined)
            article.summary = extract_summary(content) if content else [article.title]
            article.save(update_fields=['category', 'political_leaning', 'language', 'summary'])

            enriched += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'  [{enriched}/{total}] {article.category:<16} | {article.political_leaning:<14} | {article.title[:55]}'
                )
            )

        self.stdout.write(self.style.SUCCESS(f'\n✅ Done! {enriched} articles enriched successfully.\n'))
