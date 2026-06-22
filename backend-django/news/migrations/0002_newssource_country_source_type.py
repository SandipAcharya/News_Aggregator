from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Adds country (ISO 3166-1 alpha-2) and source_type fields to NewsSource.
    These fields power the Country and Source Type filter dropdowns in the React frontend.
    """

    dependencies = [
        ('news', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='newssource',
            name='country',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='ISO 3166-1 alpha-2 country code (e.g. US, UK, IN)',
                max_length=2,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='newssource',
            name='source_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('newspaper', 'Newspaper'),
                    ('magazine', 'Magazine'),
                    ('digital', 'Digital Native'),
                    ('broadcast', 'Broadcast'),
                    ('wire', 'Wire Service'),
                    ('blog', 'Blog / Opinion'),
                ],
                db_index=True,
                max_length=20,
                null=True,
            ),
        ),
    ]
