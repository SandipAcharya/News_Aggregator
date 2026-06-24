import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Article, ArticleSummary
from .tasks import generate_article_summary

@csrf_exempt
@require_http_methods(["POST"])
def trigger_summary(request, article_id):
    """
    Synchronously generates an AI summary if it doesn't exist.
    Called internally by the Node.js API on a cache miss.
    """
    try:
        # Check if already exists
        article = Article.objects.get(id=article_id)
        if hasattr(article, 'ai_summary'):
            summary = article.ai_summary
        else:
            # Generate synchronously for immediate return
            generate_article_summary(article_id) # Call the function directly (sync), not .delay()
            article.refresh_from_db()
            if not hasattr(article, 'ai_summary'):
                return JsonResponse({"error": "Failed to generate summary"}, status=500)
            summary = article.ai_summary

        return JsonResponse({
            "bullet_points": summary.bullet_points,
            "sentiment": summary.sentiment,
            "sentiment_reason": summary.sentiment_reason,
            "key_entities": summary.key_entities,
            "reading_time_mins": summary.reading_time_mins,
            "complexity": summary.complexity
        })
    except Article.DoesNotExist:
        return JsonResponse({"error": "Article not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
