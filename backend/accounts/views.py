from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import User, SellerProfile, BuyerProfile
from .forms import RegistrationForm, LoginForm, SellerProfileForm, BuyerProfileForm


def register(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            if user.role == 'seller':
                SellerProfile.objects.create(
                    user=user,
                    business_name=f"{user.first_name or user.username}'s Store"
                )
            else:
                BuyerProfile.objects.create(user=user)
            login(request, user)
            messages.success(request, f'Welcome to AkShopOnline, {user.first_name or user.username}!')
            if user.role == 'seller':
                messages.info(request, 'Please subscribe to start posting products.')
                return redirect('subscriptions:plans')
            return redirect('home')
    else:
        form = RegistrationForm()
    return render(request, 'accounts/register.html', {'form': form})


def user_login(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f'Welcome back, {user.first_name or user.username}!')
            next_url = request.GET.get('next', 'home')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})


@login_required
def user_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out.')
    return redirect('home')


@login_required
def dashboard(request):
    user = request.user
    context = {'user': user}

    if user.is_seller():
        from products.models import Product
        from orders.models import OrderItem
        products = Product.objects.filter(seller=user).order_by('-created_at')
        order_items = OrderItem.objects.filter(seller=user).select_related(
            'order', 'product'
        ).order_by('-order__created_at')
        paid_items = [i for i in order_items if i.order.payment_status == 'paid']
        total_revenue = sum(i.subtotal for i in paid_items)
        context.update({
            'products': products[:5],
            'order_items': order_items[:10],
            'product_count': products.count(),
            'order_count': order_items.values('order').distinct().count(),
            'total_revenue': total_revenue,
        })
        try:
            context['seller_profile'] = user.seller_profile
        except SellerProfile.DoesNotExist:
            pass
    else:
        from orders.models import Order
        orders = Order.objects.filter(buyer=user).order_by('-created_at')
        context['orders'] = orders[:10]
        context['order_count'] = orders.count()

    return render(request, 'accounts/dashboard.html', context)


@login_required
def profile(request):
    user = request.user
    if request.method == 'POST':
        if user.is_seller():
            try:
                profile_obj = user.seller_profile
            except SellerProfile.DoesNotExist:
                profile_obj = SellerProfile(user=user)
            form = SellerProfileForm(request.POST, instance=profile_obj)
        else:
            try:
                profile_obj = user.buyer_profile
            except BuyerProfile.DoesNotExist:
                profile_obj = BuyerProfile(user=user)
            form = BuyerProfileForm(request.POST, instance=profile_obj)

        if form.is_valid():
            profile_obj = form.save(commit=False)
            profile_obj.user = user
            profile_obj.save()
            user.phone = request.POST.get('phone', user.phone)
            user.first_name = request.POST.get('first_name', user.first_name)
            user.last_name = request.POST.get('last_name', user.last_name)
            user.email = request.POST.get('email', user.email)
            user.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('accounts:profile')
    else:
        if user.is_seller():
            try:
                profile_obj = user.seller_profile
            except SellerProfile.DoesNotExist:
                profile_obj = SellerProfile(user=user)
            form = SellerProfileForm(instance=profile_obj)
        else:
            try:
                profile_obj = user.buyer_profile
            except BuyerProfile.DoesNotExist:
                profile_obj = BuyerProfile(user=user)
            form = BuyerProfileForm(instance=profile_obj)

    return render(request, 'accounts/profile.html', {'form': form})
