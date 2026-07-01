from django.core.management.base import BaseCommand
from news.tasks import scrape_rss_feeds

class Command(BaseCommand):
    help = 'Manually triggers the RSS scraping task (Replaces Celery Beat/Worker)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting RSS feed scrape...'))
        try:
            # Calling the celery task directly as a normal synchronous Python function
            result = scrape_rss_feeds()
            self.stdout.write(self.style.SUCCESS(f'Scrape complete: {result}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error scraping feeds: {e}'))
