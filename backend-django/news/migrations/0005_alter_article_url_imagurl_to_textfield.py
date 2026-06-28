from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('news', '0004_article_image_url_alter_article_raw_content_and_more'),
    ]

    operations = [
        # Change url from URLField(max_length=2000) to TextField
        # so manually uploaded base64 images and very long URLs never overflow
        migrations.AlterField(
            model_name='article',
            name='url',
            field=models.TextField(unique=True, db_index=True),
        ),
        # Change image_url from URLField(max_length=2000) to TextField
        # to support base64 data URIs from the Article Composer image upload
        migrations.AlterField(
            model_name='article',
            name='image_url',
            field=models.TextField(
                null=True,
                blank=True,
                help_text='Thumbnail image extracted from RSS feed or uploaded via Article Composer',
            ),
        ),
    ]
