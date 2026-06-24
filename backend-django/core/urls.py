from django.contrib import admin
from django.urls import path
from news.views import trigger_summary

urlpatterns = [
    path("admin/", admin.site.urls),
    path("internal/api/articles/<uuid:article_id>/summary", trigger_summary, name="trigger_summary"),
]
