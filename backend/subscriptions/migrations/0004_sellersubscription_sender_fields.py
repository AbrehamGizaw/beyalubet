from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0003_rename_payment_reference_transaction_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='sellersubscription',
            name='sender_name',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='sellersubscription',
            name='sender_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
