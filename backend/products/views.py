from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Product, Category, ProductImage
from .forms import ProductForm, ProductImageForm


def product_list(request):
    products = Product.objects.filter(is_active=True).select_related('category', 'seller')
    categories = Category.objects.all()

    category_slug = request.GET.get('category', '')
    search_query = request.GET.get('q', '')
    condition = request.GET.get('condition', '')
    sort = request.GET.get('sort', '-created_at')
    min_price = request.GET.get('min_price', '')
    max_price = request.GET.get('max_price', '')

    if category_slug:
        products = products.filter(category__slug=category_slug)
    if search_query:
        products = products.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(category__name__icontains=search_query)
        )
    if condition:
        products = products.filter(condition=condition)
    if min_price:
        try:
            products = products.filter(price__gte=float(min_price))
        except ValueError:
            pass
    if max_price:
        try:
            products = products.filter(price__lte=float(max_price))
        except ValueError:
            pass

    sort_map = {
        '-created_at': '-created_at',
        'price_asc': 'price',
        'price_desc': '-price',
        '-views': '-views',
    }
    products = products.order_by(sort_map.get(sort, '-created_at'))

    active_category = None
    if category_slug:
        active_category = Category.objects.filter(slug=category_slug).first()

    return render(request, 'products/list.html', {
        'products': products,
        'categories': categories,
        'active_category': active_category,
        'search_query': search_query,
        'condition': condition,
        'sort': sort,
        'min_price': min_price,
        'max_price': max_price,
    })


def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)
    product.views += 1
    product.save(update_fields=['views'])
    related = Product.objects.filter(
        category=product.category, is_active=True
    ).exclude(pk=product.pk)[:4]
    return render(request, 'products/detail.html', {
        'product': product,
        'related_products': related,
    })


@login_required
def create_product(request):
    if not request.user.is_seller():
        messages.error(request, 'Only sellers can post products.')
        return redirect('home')

    if not request.user.has_active_subscription():
        messages.warning(request, 'You need an active subscription to post products.')
        return redirect('subscriptions:plans')

    # Check product limit
    from subscriptions.models import SellerSubscription
    active_sub = SellerSubscription.objects.filter(
        seller=request.user, is_active=True
    ).select_related('plan').first()
    if active_sub:
        product_count = Product.objects.filter(seller=request.user, is_active=True).count()
        if product_count >= active_sub.plan.max_products:
            messages.error(
                request,
                f'You have reached your plan limit of {active_sub.plan.max_products} products. '
                'Please upgrade your subscription.'
            )
            return redirect('subscriptions:plans')

    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save(commit=False)
            product.seller = request.user
            product.save()
            if form.cleaned_data.get('main_image'):
                ProductImage.objects.create(
                    product=product,
                    image=form.cleaned_data['main_image'],
                    is_main=True
                )
            messages.success(request, f'Product "{product.title}" posted successfully!')
            return redirect('products:my_products')
    else:
        form = ProductForm()
    return render(request, 'products/create.html', {'form': form})


@login_required
def edit_product(request, slug):
    product = get_object_or_404(Product, slug=slug, seller=request.user)

    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            form.save()
            if form.cleaned_data.get('main_image'):
                ProductImage.objects.filter(product=product, is_main=True).update(is_main=False)
                ProductImage.objects.create(
                    product=product,
                    image=form.cleaned_data['main_image'],
                    is_main=True
                )
            messages.success(request, 'Product updated!')
            return redirect('products:my_products')
    else:
        form = ProductForm(instance=product)
    return render(request, 'products/edit.html', {'form': form, 'product': product})


@login_required
def delete_product(request, slug):
    product = get_object_or_404(Product, slug=slug, seller=request.user)
    if request.method == 'POST':
        title = product.title
        product.is_active = False
        product.save()
        messages.success(request, f'"{title}" has been removed.')
        return redirect('products:my_products')
    return render(request, 'products/delete_confirm.html', {'product': product})


@login_required
def my_products(request):
    if not request.user.is_seller():
        return redirect('home')
    products = Product.objects.filter(seller=request.user).order_by('-created_at')
    return render(request, 'products/my_products.html', {'products': products})
