import os
import threading
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

@csrf_exempt
@require_POST
def trigger_scrape(request):
    """
    HTTP endpoint for cron-job.org to trigger scraping.
    Protected by a secret token to prevent unauthorized calls.
    """
    secret = request.headers.get('X-Scrape-Secret', '')
    expected = os.environ.get('SCRAPE_SECRET', 'change-me-in-production')
    if secret != expected:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    try:
        from news.tasks import scrape_rss_feeds
        # Run in a background thread so we don't timeout the HTTP request
        thread = threading.Thread(target=scrape_rss_feeds)
        thread.start()
        return JsonResponse({'status': 'ok', 'message': 'Scraping started in background'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'detail': str(e)}, status=500)
