from django.db import migrations, models


def normalize_phone(apps, schema_editor):
    schema_editor.execute("UPDATE accounts_user SET phone = NULL WHERE phone = ''")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_add_is_email_verified'),
    ]

    operations = [
        # Step 1: allow NULL on phone so we can set empty strings to NULL
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        # Step 2: convert empty strings to NULL
        migrations.RunPython(normalize_phone, migrations.RunPython.noop),
        # Step 3: add unique constraint now that NULLs are clean
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
        # Step 4: make email unique
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
    ]
