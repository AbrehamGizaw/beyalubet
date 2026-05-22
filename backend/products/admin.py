from django.contrib import admin
from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'seller', 'category', 'price', 'stock', 'is_active', 'is_featured', 'created_at']
    list_filter = ['is_active', 'is_featured', 'category', 'condition']
    list_editable = ['is_active', 'is_featured']
    search_fields = ['title', 'seller__username', 'description']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ProductImageInline]
    readonly_fields = ['views', 'created_at', 'updated_at']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_main', 'created_at']
