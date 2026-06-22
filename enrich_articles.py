from news.models import Article

KEYWORDS = {
    'Technology': ['ai','tech','software','app','smartphone','computer','internet','robot','data','cloud','chip','hack','privacy','social media','tiktok','google','microsoft','apple','amazon','openai','gpt','digital','video game','console','gaming','bitcoin','crypto','regulator'],
    'Business': ['economy','market','stock','inflation','trade','bank','finance','investment','profit','merger','oil','energy','dollar','recession','business'],
    'Politics': ['government','president','parliament','election','vote','policy','law','minister','military','army','protest','rights','legislation'],
    'Science': ['research','study','scientist','space','nasa','climate','environment','vaccine','medicine','biology','physics','telescope','mars','moon'],
    'Sports': ['football','soccer','basketball','tennis','cricket','rugby','golf','olympics','championship','league','match','player','team','goal','nba','fifa','athlete'],
    'Health': ['health','hospital','doctor','patient','disease','cancer','nhs','covid','virus','pandemic','surgery','treatment'],
    'Entertainment': ['movie','film','music','celebrity','actor','singer','album','concert','streaming','netflix','disney','hollywood','award'],
}

articles = list(Article.objects.filter(category__isnull=True)) + list(Article.objects.filter(category=''))
count = 0
for a in articles:
    text = (a.title or '').lower()
    cat = 'Technology'
    for c, kws in KEYWORDS.items():
        if any(kw in text for kw in kws):
            cat = c
            break
    a.category = cat
    a.language = 'en'
    a.political_leaning = 'Center'
    if not a.summary:
        a.summary = [a.raw_content[:200] if a.raw_content else a.title]
    a.save(update_fields=['category', 'language', 'political_leaning', 'summary'])
    count += 1
    print(f'{cat:15} | {a.title[:60]}')

print(f'\nDone! {count} articles enriched.')
