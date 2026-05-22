from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_review'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='review',
            unique_together=set(),
        ),
    ]
