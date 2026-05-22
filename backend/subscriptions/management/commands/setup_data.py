from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionPlan
from products.models import Category


class Command(BaseCommand):
    help = 'Create initial subscription plans and product categories'

    def handle(self, *args, **options):
        self._create_plans()
        self._create_categories()
        self.stdout.write(self.style.SUCCESS('Initial data created successfully!'))

    def _create_plans(self):
        plans = [
            {
                'name': 'Monthly Plan',
                'duration': 'monthly',
                'price': '9.99',
                'max_products': 30,
                'is_popular': False,
                'features': 'Post up to 30 products\nBasic store page\nOrder management\nEmail support',
            },
            {
                'name': 'Quarterly Plan',
                'duration': 'quarterly',
                'price': '24.99',
                'max_products': 100,
                'is_popular': False,
                'features': 'Post up to 100 products\nCustom store page\nOrder management\nPriority support\nSave 17% vs monthly',
            },
            {
                'name': 'Biannual Plan',
                'duration': 'biannual',
                'price': '44.99',
                'max_products': 250,
                'is_popular': True,
                'features': 'Post up to 250 products\nFeatured store listing\nAdvanced order management\nPriority support\nAnalytics dashboard\nSave 25% vs monthly',
            },
            {
                'name': 'Yearly Plan',
                'duration': 'yearly',
                'price': '79.99',
                'max_products': 1000,
                'is_popular': False,
                'features': 'Unlimited product listings\nTop featured store\nFull analytics & reports\n24/7 premium support\nProduct promotion tools\nSave 33% vs monthly',
            },
        ]
        for data in plans:
            plan, created = SubscriptionPlan.objects.get_or_create(
                duration=data['duration'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  Created plan: {plan.name}')
            else:
                self.stdout.write(f'  Plan already exists: {plan.name}')

    def _create_categories(self):
        categories = [
            {'name': 'Electronics', 'slug': 'electronics', 'icon': 'bi-phone', 'description': 'Phones, laptops, TVs, and gadgets'},
            {'name': 'Furniture', 'slug': 'furniture', 'icon': 'bi-house-door', 'description': 'Sofas, beds, tables, and chairs'},
            {'name': 'Clothes & Fashion', 'slug': 'clothes-fashion', 'icon': 'bi-bag', 'description': 'Men, women, and kids clothing'},
            {'name': 'Home Materials', 'slug': 'home-materials', 'icon': 'bi-tools', 'description': 'Cookware, bedding, and home essentials'},
            {'name': 'Vehicles & Parts', 'slug': 'vehicles-parts', 'icon': 'bi-car-front', 'description': 'Cars, motorcycles, and spare parts'},
            {'name': 'Food & Beverages', 'slug': 'food-beverages', 'icon': 'bi-basket', 'description': 'Groceries, snacks, and drinks'},
            {'name': 'Sports & Outdoors', 'slug': 'sports-outdoors', 'icon': 'bi-bicycle', 'description': 'Sports equipment and outdoor gear'},
            {'name': 'Health & Beauty', 'slug': 'health-beauty', 'icon': 'bi-heart-pulse', 'description': 'Cosmetics, skincare, and wellness'},
            {'name': 'Books & Education', 'slug': 'books-education', 'icon': 'bi-book', 'description': 'Books, stationery, and learning materials'},
            {'name': 'Other', 'slug': 'other', 'icon': 'bi-grid', 'description': 'Miscellaneous items'},
        ]
        for data in categories:
            cat, created = Category.objects.get_or_create(slug=data['slug'], defaults=data)
            if created:
                self.stdout.write(f'  Created category: {cat.name}')
