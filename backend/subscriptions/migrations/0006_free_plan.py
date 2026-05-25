from django.db import migrations, models


def seed_free_plan(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    if not SubscriptionPlan.objects.filter(is_free=True).exists():
        SubscriptionPlan.objects.create(
            name='Free Trial',
            duration='monthly',
            price=0,
            description='One month free trial for new sellers',
            max_products=30,
            features='List up to 30 products\nOne month duration\nNo payment required\nFor new sellers only',
            is_active=True,
            is_popular=False,
            is_free=True,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0005_subscription_screenshot'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptionplan',
            name='is_free',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(seed_free_plan, migrations.RunPython.noop),
    ]
