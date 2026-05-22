from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.conf import settings
from .models import SubscriptionPlan, SellerSubscription
from .forms import PaymentConfirmationForm


def plans(request):
    all_plans = SubscriptionPlan.objects.filter(is_active=True)
    current_sub = None
    if request.user.is_authenticated and request.user.is_seller():
        current_sub = SellerSubscription.objects.filter(
            seller=request.user, is_active=True
        ).first()
    return render(request, 'subscriptions/plans.html', {
        'plans': all_plans,
        'current_sub': current_sub,
    })


@login_required
def subscribe(request, plan_id):
    if not request.user.is_seller():
        messages.error(request, 'Only sellers can subscribe to plans.')
        return redirect('home')

    plan = get_object_or_404(SubscriptionPlan, pk=plan_id, is_active=True)

    if request.method == 'POST':
        form = PaymentConfirmationForm(request.POST)
        if form.is_valid():
            sub = SellerSubscription.objects.create(
                seller=request.user,
                plan=plan,
                amount_paid=plan.price,
                payment_reference=form.cleaned_data['payment_reference'],
                status='pending',
            )
            # Auto-activate for demo (in production, admin verifies payment first)
            sub.activate()
            messages.success(
                request,
                f'Subscription activated! You can now post up to {plan.max_products} products.'
            )
            return redirect('subscriptions:my_subscription')
    else:
        form = PaymentConfirmationForm()

    platform_info = {
        'bank_name': getattr(settings, 'PLATFORM_BANK_NAME', 'Commercial Bank'),
        'account_number': getattr(settings, 'PLATFORM_ACCOUNT_NUMBER', '1000123456'),
        'account_holder': getattr(settings, 'PLATFORM_ACCOUNT_HOLDER', 'AkShopOnline'),
        'mobile_money': getattr(settings, 'PLATFORM_MOBILE_MONEY', '+251 91 234 5678'),
    }
    return render(request, 'subscriptions/subscribe.html', {
        'plan': plan,
        'form': form,
        'platform_info': platform_info,
    })


@login_required
def my_subscription(request):
    if not request.user.is_seller():
        return redirect('home')
    subscriptions = SellerSubscription.objects.filter(seller=request.user).select_related('plan')
    active_sub = subscriptions.filter(is_active=True).first()
    return render(request, 'subscriptions/my_subscription.html', {
        'subscriptions': subscriptions,
        'active_sub': active_sub,
    })
