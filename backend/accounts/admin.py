from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SellerProfile, BuyerProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Contact', {'fields': ('role', 'phone', 'profile_image')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role & Contact', {'fields': ('role', 'phone', 'email')}),
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
