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
    url = models.TextField(unique=True, db_index=True)
    image_url = models.TextField(null=True, blank=True, help_text="Thumbnail image extracted from RSS feed")
    raw_content = models.TextField(help_text="Clean text scraped from the source (HTML stripped)")
    
    # ML Enriched Metadata
    category = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    language = models.CharField(max_length=10, null=True, blank=True)
    political_leaning = models.CharField(max_length=50, null=True, blank=True)
    summary = models.JSONField(null=True, blank=True, help_text="ML Extractive summary bullets")
    
    published_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # CMS Workflow Fields
    STATUS_CHOICES = [
        ('auto_scraped', 'Auto Scraped'),
        ('enriched', 'Enriched'),
        ('editorial_reviewed', 'Editorial Reviewed'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='auto_scraped', db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    full_content = models.TextField(null=True, blank=True, help_text="Full scraped body (from trafilatura)")

    class Meta:
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['-published_at', 'category']),
        ]

    def __str__(self):
        return self.title

class ArticleSummary(models.Model):
    """
    AI-generated summary for the article.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.OneToOneField(Article, on_delete=models.CASCADE, related_name='ai_summary')
    bullet_points = models.JSONField(help_text='["point1", "point2", ...]')
    sentiment = models.CharField(max_length=50)
    sentiment_reason = models.TextField(null=True, blank=True)
    key_entities = models.JSONField(help_text='{"people": [], "places": [], "orgs": []}')
    reading_time_mins = models.IntegerField(default=1)
    complexity = models.CharField(max_length=50, null=True, blank=True)
    ai_model = models.CharField(max_length=100) # Replaced gemini_model with ai_model
    generated_at = models.DateTimeField(auto_now_add=True)
    tokens_used = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Summary for {self.article.title}"
