from django.db import models
from django.utils import timezone
from datetime import timedelta


class PlatformSettings(models.Model):
    """Singleton — always use PlatformSettings.get()."""
    bank_name = models.CharField(max_length=120, blank=True)
    account_number = models.CharField(max_length=60, blank=True)
    account_holder = models.CharField(max_length=120, blank=True)
    telebirr = models.CharField(max_length=30, blank=True)
    mobile_money = models.CharField(max_length=30, blank=True)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Platform Payment Settings'

    class Meta:
        verbose_name = 'Platform Settings'


class SubscriptionPlan(models.Model):
    DURATION_CHOICES = [
        ('monthly', 'Monthly (1 Month)'),
        ('quarterly', 'Quarterly (3 Months)'),
        ('biannual', 'Biannual (6 Months)'),
        ('yearly', 'Yearly (12 Months)'),
    ]
    name = models.CharField(max_length=100)
    duration = models.CharField(max_length=10, choices=DURATION_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    max_products = models.IntegerField(default=50)
    features = models.TextField(blank=True, help_text='One feature per line')
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_duration_days(self):
        mapping = {'monthly': 30, 'quarterly': 90, 'biannual': 180, 'yearly': 365}
        return mapping.get(self.duration, 30)

    def get_features_list(self):
        return [f.strip() for f in self.features.splitlines() if f.strip()]

    def __str__(self):
        return f"{self.name} — ${self.price}"

    class Meta:
        ordering = ['price']


class SellerSubscription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    seller = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='subscriptions'
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=False)
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    sender_name = models.CharField(max_length=150, blank=True, default='')
    payment_screenshot = models.ImageField(upload_to='subscription_screenshots/', null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def activate(self):
        now = timezone.now()
        self.start_date = now
        self.end_date = now + timedelta(days=self.plan.get_duration_days())
        self.status = 'active'
        self.is_active = True
        self.save()
        # Deactivate other subscriptions for this seller
        SellerSubscription.objects.filter(
            seller=self.seller, is_active=True
        ).exclude(pk=self.pk).update(is_active=False, status='cancelled')

    @property
    def is_valid(self):
        return self.is_active and self.end_date and self.end_date >= timezone.now()

    @property
    def days_remaining(self):
        if self.end_date:
            delta = self.end_date - timezone.now()
            return max(0, delta.days)
        return 0

    def __str__(self):
        return f"{self.seller.username} — {self.plan.name} ({self.status})"

    class Meta:
        ordering = ['-created_at']
