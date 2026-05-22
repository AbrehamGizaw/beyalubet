"""
Run with: python create_platform_admin.py
Creates a platform admin account (role='admin').
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'akshoponline.settings')
django.setup()

from accounts.models import User

username = 'platformadmin'
password = 'Admin@1234'
email = 'admin@akshoponline.com'

if User.objects.filter(username=username).exists():
    print(f"Admin '{username}' already exists.")
else:
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name='Platform',
        last_name='Admin',
        role='admin',
    )
    print(f"Platform admin created!")
    print(f"  Username : {username}")
    print(f"  Password : {password}")
    print(f"  Role     : admin")
