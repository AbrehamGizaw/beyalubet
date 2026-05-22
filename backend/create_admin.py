import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'akshoponline.settings')
django.setup()

from accounts.models import User

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@akshoponline.com', 'admin1234')
    print('Superuser created: admin / admin1234')
else:
    print('Superuser already exists.')
