from django.db import models
import uuid

class NewsSource(models.Model):
    """
    Tracks the origin of RSS feeds.
    """
    SOURCE_TYPE_CHOICES = [
        ('newspaper', 'Newspaper'),
        ('magazine', 'Magazine'),
        ('digital', 'Digital Native'),
        ('broadcast', 'Broadcast'),
        ('wire', 'Wire Service'),
        ('blog', 'Blog / Opinion'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    url = models.URLField(unique=True)
    rss_feed_url = models.URLField(unique=True)
    country = models.CharField(
        max_length=2, null=True, blank=True, db_index=True,
        help_text="ISO 3166-1 alpha-2 country code (e.g. US, UK, IN)"
    )
    source_type = models.CharField(
        max_length=20, choices=SOURCE_TYPE_CHOICES, null=True, blank=True, db_index=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Article(models.Model):
    """
    Core article model designed for high-throughput reads/writes.
    Includes explicit indexes for fast querying.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.ForeignKey(NewsSource, on_delete=models.CASCADE, related_name='articles')
    title = models.CharField(max_length=500)
    url = models.URLField(max_length=2000, unique=True, db_index=True)
    image_url = models.URLField(max_length=2000, null=True, blank=True, help_text="Thumbnail image extracted from RSS feed")
    raw_content = models.TextField(help_text="Clean text scraped from the source (HTML stripped)")
    
    # ML Enriched Metadata
    category = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    language = models.CharField(max_length=10, null=True, blank=True)
    political_leaning = models.CharField(max_length=50, null=True, blank=True)
    summary = models.JSONField(null=True, blank=True, help_text="ML Extractive summary bullets")
    
    published_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['-published_at', 'category']),
        ]

    def __str__(self):
        return self.title
