# Generated by Django 5.0.3 on 2025-04-06 14:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='section',
            name='content_type',
            field=models.CharField(choices=[('video', 'Video'), ('pdf', 'PDF Document'), ('both', 'Both Video & PDF'), ('text', 'Text Content'), ('quiz', 'Quiz')], default='video', max_length=20),
        ),
        migrations.AddField(
            model_name='section',
            name='pdf_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='section',
            name='video_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
