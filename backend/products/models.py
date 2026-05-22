from django.db import models
from django.utils.text import slugify
import uuid


class Category(models.Model):
    name = models.CharField(max_length=100)
    name_am = models.CharField(max_length=100, blank=True, default='')
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, default='bi-grid')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']


class Product(models.Model):
    CONDITION_CHOICES = [
        ('new', 'Brand New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
    ]
    seller = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='products'
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name='products'
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    original_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    stock = models.PositiveIntegerField(default=1)
    condition = models.CharField(max_length=15, choices=CONDITION_CHOICES, default='new')
    location = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)
            self.slug = f"{base}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    @property
    def discount_percentage(self):
        if self.original_price and self.original_price > self.price:
            return int((self.original_price - self.price) / self.original_price * 100)
        return 0

    def main_image(self):
        img = self.images.filter(is_main=True).first()
        return img or self.images.first()

    def in_stock(self):
        return self.stock > 0

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    buyer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()  # 1–5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.buyer.username} → {self.product.title} ({self.rating}★)'


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_main:
            ProductImage.objects.filter(product=self.product, is_main=True).update(is_main=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.product.title}"
