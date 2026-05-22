from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['subtotal']

    def subtotal(self, obj):
        return obj.subtotal


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'item_count', 'total', 'updated_at']
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']

    def subtotal(self, obj):
        return obj.subtotal


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'buyer', 'status', 'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_status']
    search_fields = ['order_number', 'buyer__username', 'shipping_name']
    list_editable = ['status', 'payment_status']
    inlines = [OrderItemInline]
    readonly_fields = ['order_number', 'created_at']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_title', 'seller', 'quantity', 'unit_price']
