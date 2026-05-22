from django.db import models
import uuid


class Cart(models.Model):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def item_count(self):
        from django.db.models import Sum
        result = self.items.aggregate(total=Sum('quantity'))['total']
        return result or 0

    def __str__(self):
        return f"Cart of {self.user.username}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product.title}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('submitted', 'Awaiting Seller Approval'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    order_number = models.CharField(max_length=25, unique=True, blank=True)
    buyer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=15, choices=PAYMENT_STATUS_CHOICES, default='pending')
    shipping_name = models.CharField(max_length=200)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_country = models.CharField(max_length=100)
    shipping_phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_reference = models.CharField(max_length=100, blank=True, null=True, default='')
    payment_method = models.CharField(max_length=20, blank=True, null=True, default='', choices=[
        ('telebirr', 'Telebirr'),
        ('cbe', 'CBE Bank Transfer'),
        ('other', 'Other Bank Transfer'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = 'ORD-' + uuid.uuid4().hex[:10].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_number

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    seller = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sale_items')
    product_title = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product_title}"
