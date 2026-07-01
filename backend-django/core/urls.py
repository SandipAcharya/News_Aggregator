from django.contrib import admin
from django.urls import path
from news.views import trigger_summary
from news.scrape_views import trigger_scrape

urlpatterns = [
    path("admin/", admin.site.urls),
    path("internal/api/articles/<uuid:article_id>/summary", trigger_summary, name="trigger_summary"),
    path("api/scrape/", trigger_scrape, name="trigger_scrape"),
]
