from fastapi import FastAPI
from pydantic import BaseModel
import re

app = FastAPI(title="News Aggregator ML Service - Lightweight")

# ---------------------------------------------------------------------------
# Keyword-based Category Classifier
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS = {
    "Technology": [
        "ai", "artificial intelligence", "machine learning", "software", "app", "tech",
        "smartphone", "iphone", "android", "computer", "internet", "cyber", "robot",
        "algorithm", "data", "cloud", "startup", "silicon", "chip", "semiconductor",
        "5g", "quantum", "hack", "privacy", "social media", "tiktok", "facebook",
        "google", "microsoft", "apple", "amazon", "openai", "gpt", "digital", "code",
        "programming", "video game", "console", "gaming", "vr", "ar", "metaverse",
    ],
    "Business": [
        "economy", "market", "stock", "shares", "inflation", "gdp", "trade", "tariff",
        "bank", "finance", "investment", "profit", "revenue", "earnings", "ipo",
        "acquisition", "merger", "startup", "venture", "entrepreneur", "retail",
        "supply chain", "oil", "energy", "commodity", "dollar", "currency", "bitcoin",
        "crypto", "interest rate", "fed", "central bank", "recession",
    ],
    "Politics": [
        "government", "president", "prime minister", "parliament", "election", "vote",
        "policy", "law", "senate", "congress", "minister", "democrat", "republican",
        "political", "treaty", "sanction", "nato", "un", "united nations", "diplomat",
        "foreign", "war", "conflict", "military", "army", "defence", "defense",
        "protest", "activist", "rights", "constitution", "legislation",
    ],
    "Science": [
        "research", "study", "scientist", "discovery", "experiment", "space", "nasa",
        "planet", "climate", "environment", "biodiversity", "genome", "dna", "gene",
        "medicine", "drug", "vaccine", "crispr", "biology", "chemistry", "physics",
        "particle", "telescope", "mars", "moon", "asteroid", "fossil",
    ],
    "Sports": [
        "football", "soccer", "basketball", "tennis", "cricket", "rugby", "golf",
        "olympics", "world cup", "championship", "league", "match", "game", "player",
        "team", "coach", "stadium", "score", "goal", "transfer", "nba", "nfl", "fifa",
        "wimbledon", "marathon", "athlete",
    ],
    "Health": [
        "health", "hospital", "doctor", "patient", "disease", "cancer", "diabetes",
        "mental health", "nhs", "covid", "virus", "pandemic", "obesity", "diet",
        "exercise", "wellness", "nutrition", "surgery", "treatment", "therapy",
    ],
    "Entertainment": [
        "movie", "film", "music", "celebrity", "actor", "actress", "singer", "album",
        "concert", "streaming", "netflix", "disney", "hollywood", "award", "oscar",
        "grammy", "tv show", "series", "podcast", "fashion", "culture",
    ],
}

# ---------------------------------------------------------------------------
# Source → Political Leaning Map (based on known media bias ratings)
# ---------------------------------------------------------------------------
SOURCE_LEANING = {
    "bbc": "Center",
    "reuters": "Center",
    "associated press": "Center",
    "the guardian": "Center-Left",
    "new york times": "Center-Left",
    "washington post": "Center-Left",
    "cnn": "Center-Left",
    "msnbc": "Left",
    "fox news": "Right",
    "breitbart": "Far Right",
    "daily mail": "Center-Right",
    "the sun": "Center-Right",
    "wall street journal": "Center-Right",
    "financial times": "Center",
    "al jazeera": "Center",
    "techcrunch": "Center",
    "the verge": "Center",
    "wired": "Center-Left",
    "bloomberg": "Center",
    
}


def detect_category(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score
    if scores:
        return max(scores, key=scores.get)
    return "General"


def detect_leaning(source_name: str, text: str) -> str:
    if source_name:
        for known_source, leaning in SOURCE_LEANING.items():
            if known_source in source_name.lower():
                return leaning
    return "Center"


def extractive_summary(text: str, num_sentences: int = 3) -> list:
    """Extract the first N meaningful sentences as the summary."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    return sentences[:num_sentences] if sentences else ["No summary available."]


def detect_language(text: str) -> str:
    try:
        from langdetect import detect
        return detect(text)
    except Exception:
        return "en"


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------
class ArticleInput(BaseModel):
    text: str
    source_name: str = ""


@app.get("/health")
def health():
    return {"status": "ok", "mode": "lightweight-keyword-based"}


@app.post("/api/ml/analyze")
async def analyze_article(data: ArticleInput):
    text = data.text[:2000]  # Use more context for better classification

    category = detect_category(text)
    political_leaning = detect_leaning(data.source_name, text)
    language = detect_language(text)
    summary = extractive_summary(text)

    return {
        "category": category,
        "language": language,
        "political_leaning": political_leaning,
        "summary": summary,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
