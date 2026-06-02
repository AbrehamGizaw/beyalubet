from django.db import migrations


def remove_duplicate_reviews(apps, schema_editor):
    """Keep only the most recent review per (buyer, product) pair."""
    Review = apps.get_model('products', 'Review')
    seen = {}
    for review in Review.objects.order_by('-created_at'):
        key = (review.buyer_id, review.product_id)
        if key in seen:
            review.delete()
        else:
            seen[key] = review.pk


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_add_brand_slightly_used'),
    ]

    operations = [
        migrations.RunPython(remove_duplicate_reviews, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name='review',
            unique_together={('buyer', 'product')},
        ),
    ]
