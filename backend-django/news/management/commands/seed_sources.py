from django.core.management.base import BaseCommand
from news.models import NewsSource


# ---------------------------------------------------------------------------
# Curated RSS Feed List — edit freely to add more sources
# ---------------------------------------------------------------------------
SOURCES = [
    # ── International / Wire ──────────────────────────────────────────────
    {
        "name": "BBC News",
        "url": "https://www.bbc.com",
        "rss_feed_url": "http://feeds.bbci.co.uk/news/rss.xml",
        "country": "GB",
        "source_type": "broadcast",
    },
    {
        "name": "The Guardian",
        "url": "https://www.theguardian.com",
        "rss_feed_url": "https://www.theguardian.com/world/rss",
        "country": "GB",
        "source_type": "newspaper",
    },
    {
        "name": "Al Jazeera English",
        "url": "https://www.aljazeera.com",
        "rss_feed_url": "https://www.aljazeera.com/xml/rss/all.xml",
        "country": "QA",
        "source_type": "broadcast",
    },

    # ── US News ───────────────────────────────────────────────────────────
    {
        "name": "CNN",
        "url": "https://www.cnn.com",
        "rss_feed_url": "http://rss.cnn.com/rss/edition.rss",
        "country": "US",
        "source_type": "broadcast",
    },
    {
        "name": "The New York Times",
        "url": "https://www.nytimes.com",
        "rss_feed_url": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        "country": "US",
        "source_type": "newspaper",
    },
    {
        "name": "The Washington Post",
        "url": "https://www.washingtonpost.com",
        "rss_feed_url": "https://feeds.washingtonpost.com/rss/world",
        "country": "US",
        "source_type": "newspaper",
    },

    # ── Tech / Digital ────────────────────────────────────────────────────
    {
        "name": "TechCrunch",
        "url": "https://techcrunch.com",
        "rss_feed_url": "https://techcrunch.com/feed/",
        "country": "US",
        "source_type": "digital",
    },
    {
        "name": "The Verge",
        "url": "https://www.theverge.com",
        "rss_feed_url": "https://www.theverge.com/rss/index.xml",
        "country": "US",
        "source_type": "digital",
    },
    {
        "name": "Wired",
        "url": "https://www.wired.com",
        "rss_feed_url": "https://www.wired.com/feed/rss",
        "country": "US",
        "source_type": "magazine",
    },

    # ── Business / Finance ────────────────────────────────────────────────
    {
        "name": "Bloomberg",
        "url": "https://www.bloomberg.com",
        "rss_feed_url": "https://feeds.bloomberg.com/markets/news.rss",
        "country": "US",
        "source_type": "digital",
    },
    {
        "name": "Financial Times",
        "url": "https://www.ft.com",
        "rss_feed_url": "https://www.ft.com/rss/home/uk",
        "country": "GB",
        "source_type": "newspaper",
    },

    # ── South Asia ────────────────────────────────────────────────────────
    {
        "name": "The Kathmandu Post",
        "url": "https://kathmandupost.com",
        "rss_feed_url": "https://kathmandupost.com/rss",
        "country": "NP",
        "source_type": "newspaper",
    },
    {
        "name": "The Hindu",
        "url": "https://www.thehindu.com",
        "rss_feed_url": "https://www.thehindu.com/news/national/feeder/default.rss",
        "country": "IN",
        "source_type": "newspaper",
    },
    {
        "name": "NDTV",
        "url": "https://www.ndtv.com",
        "rss_feed_url": "https://feeds.feedburner.com/ndtvnews-top-stories",
        "country": "IN",
        "source_type": "broadcast",
    },

    # ── Science / General ─────────────────────────────────────────────────
    {
        "name": "Science Daily",
        "url": "https://www.sciencedaily.com",
        "rss_feed_url": "https://www.sciencedaily.com/rss/all.xml",
        "country": "US",
        "source_type": "digital",
    },
    {
        "name": "NASA Breaking News",
        "url": "https://www.nasa.gov",
        "rss_feed_url": "https://www.nasa.gov/rss/dyn/breaking_news.rss",
        "country": "US",
        "source_type": "digital",
    },
]


class Command(BaseCommand):
    help = "Seed the database with a curated list of real-world RSS news sources."

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing NewsSource entries before seeding.',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count, _ = NewsSource.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} existing sources."))

        created_count = 0
        skipped_count = 0

        for source_data in SOURCES:
            obj, created = NewsSource.objects.update_or_create(
                url=source_data['url'],
                defaults={
                    'name': source_data['name'],
                    'rss_feed_url': source_data['rss_feed_url'],
                    'country': source_data.get('country'),
                    'source_type': source_data.get('source_type'),
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  ✅ Created: {obj.name} ({obj.country or '??'})"))
            else:
                skipped_count += 1
                self.stdout.write(f"  ↩️  Updated: {obj.name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\n🌐 Seeding complete — {created_count} created, {skipped_count} updated.\n"
                f"   Run 'python manage.py scrape_rss' or trigger Celery Beat to start fetching articles.\n"
            )
        )
