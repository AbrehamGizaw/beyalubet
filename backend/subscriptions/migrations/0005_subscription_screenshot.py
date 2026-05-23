from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0004_sellersubscription_sender_fields'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sellersubscription',
            name='sender_amount',
        ),
        migrations.AddField(
            model_name='sellersubscription',
            name='payment_screenshot',
            field=models.ImageField(blank=True, null=True, upload_to='subscription_screenshots/'),
        ),
    ]
