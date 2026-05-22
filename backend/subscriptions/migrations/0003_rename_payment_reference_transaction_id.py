from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('subscriptions', '0002_platformsettings'),
    ]
    operations = [
        migrations.RenameField(
            model_name='sellersubscription',
            old_name='payment_reference',
            new_name='transaction_id',
        ),
        migrations.AlterField(
            model_name='sellersubscription',
            name='transaction_id',
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
    ]
