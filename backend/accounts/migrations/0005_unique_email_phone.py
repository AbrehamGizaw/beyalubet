from django.db import migrations, models


def normalize_phone(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(phone='').update(phone=None)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_add_is_email_verified'),
    ]

    operations = [
        migrations.RunPython(normalize_phone, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
    ]
