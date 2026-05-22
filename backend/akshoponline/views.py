from django.shortcuts import render
from products.models import Product, Category


def home(request):
    categories = Category.objects.all()
    featured_products = Product.objects.filter(is_active=True, is_featured=True).select_related(
        'category', 'seller'
    )[:8]
    latest_products = Product.objects.filter(is_active=True).select_related(
        'category', 'seller'
    ).order_by('-created_at')[:12]
    context = {
        'categories': categories,
        'featured_products': featured_products,
        'latest_products': latest_products,
    }
    return render(request, 'home.html', context)
