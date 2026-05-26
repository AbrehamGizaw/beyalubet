from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from .models import User, SellerProfile, BuyerProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email_with_status', 'phone', 'role', 'is_active', 'detail_link']
    list_display_links = ['username']
    list_filter = ['role', 'is_active', 'is_staff', 'is_email_verified']
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Contact', {'fields': ('role', 'phone', 'profile_image', 'is_email_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role & Contact', {'fields': ('role', 'phone', 'email')}),
    )

    @admin.display(description='Email')
    def email_with_status(self, obj):
        color = '#28a745' if obj.is_email_verified else '#dc3545'
        label = 'Verified' if obj.is_email_verified else 'Unverified'
        return format_html(
            '{}&nbsp;<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px;font-weight:600;">{}</span>',
            obj.email, color, label,
        )

    @admin.display(description='Detail')
    def detail_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.pk])
        return format_html(
            '<a href="{}" style="color:#417690;font-weight:600;">View&nbsp;→</a>', url
        )


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'is_verified', 'created_at']
    list_filter = ['is_verified']
    search_fields = ['business_name', 'user__username']
    actions = ['verify_sellers']

    def verify_sellers(self, request, queryset):
        queryset.update(is_verified=True)
    verify_sellers.short_description = 'Mark selected sellers as verified'


@admin.register(BuyerProfile)
class BuyerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'country', 'created_at']
    search_fields = ['user__username', 'city']
