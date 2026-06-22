UPDATE news_article
SET
    language = 'en',
    political_leaning = 'Center',
    summary = ARRAY[substring(raw_content, 1, 200)],
    category = CASE
        WHEN lower(title) ~ '(ai|tech|software|app|smartphone|iphone|android|computer|internet|cyber|robot|data|cloud|chip|hack|privacy|social media|tiktok|google|microsoft|apple|amazon|openai|gpt|digital|video game|console|gaming|vr|metaverse|bitcoin|crypto|5g|quantum|regulator|ban)'
            THEN 'Technology'
        WHEN lower(title) ~ '(economy|market|stock|inflation|gdp|trade|tariff|bank|finance|investment|profit|revenue|earnings|merger|startup|oil|energy|dollar|currency|recession|business)'
            THEN 'Business'
        WHEN lower(title) ~ '(government|president|prime minister|parliament|election|vote|policy|law|senate|congress|minister|democrat|republican|treaty|sanction|nato|military|army|defence|protest|rights|legislation)'
            THEN 'Politics'
        WHEN lower(title) ~ '(research|study|scientist|discovery|space|nasa|planet|climate|environment|genome|dna|vaccine|medicine|drug|biology|chemistry|physics|telescope|mars|moon|fossil)'
            THEN 'Science'
        WHEN lower(title) ~ '(football|soccer|basketball|tennis|cricket|rugby|golf|olympics|world cup|championship|league|match|player|team|coach|goal|nba|nfl|fifa|wimbledon|athlete)'
            THEN 'Sports'
        WHEN lower(title) ~ '(health|hospital|doctor|patient|disease|cancer|diabetes|mental health|nhs|covid|virus|pandemic|obesity|diet|exercise|surgery|treatment)'
            THEN 'Health'
        WHEN lower(title) ~ '(movie|film|music|celebrity|actor|actress|singer|album|concert|streaming|netflix|disney|hollywood|award|oscar|grammy|fashion)'
            THEN 'Entertainment'
        ELSE 'Technology'
    END
WHERE category IS NULL OR category = '';

SELECT title, category, political_leaning FROM news_article ORDER BY published_at DESC;
