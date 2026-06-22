from django.contrib import admin
from .models import NewsSource, Article

@admin.register(NewsSource)
class NewsSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'url')

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'source', 'category', 'political_leaning', 'published_at')
    list_filter = ('category', 'political_leaning', 'language', 'source')
    search_fields = ('title', 'raw_content')
    readonly_fields = ('published_at', 'created_at', 'updated_at')
