from django.contrib import admin
from .models import SubscriptionPlan, SellerSubscription


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration', 'price', 'max_products', 'is_active', 'is_popular']
    list_editable = ['is_active', 'is_popular', 'price']


@admin.register(SellerSubscription)
class SellerSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['seller', 'plan', 'status', 'is_active', 'start_date', 'end_date', 'amount_paid']
    list_filter = ['status', 'is_active', 'plan']
    search_fields = ['seller__username', 'payment_reference']
    actions = ['activate_subscriptions']

    def activate_subscriptions(self, request, queryset):
        for sub in queryset:
            sub.activate()
        self.message_user(request, f'{queryset.count()} subscription(s) activated.')
    activate_subscriptions.short_description = 'Activate selected subscriptions'
