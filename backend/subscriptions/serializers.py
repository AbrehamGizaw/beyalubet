from rest_framework import serializers
from .models import SubscriptionPlan, SellerSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features_list = serializers.SerializerMethodField()
    duration_display = serializers.CharField(source='get_duration_display', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'duration', 'duration_display', 'price',
                  'description', 'max_products', 'features', 'features_list',
                  'is_popular', 'is_active']

    def get_features_list(self, obj):
        return obj.get_features_list()


class SellerSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    duration_days = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_remaining = serializers.ReadOnlyField()
    is_valid = serializers.ReadOnlyField()

    class Meta:
        model = SellerSubscription
        fields = ['id', 'plan', 'plan_name', 'duration_days', 'status', 'status_display',
                  'is_active', 'is_valid', 'transaction_id', 'sender_name', 'payment_screenshot',
                  'amount_paid', 'start_date', 'end_date', 'days_remaining', 'created_at']
        read_only_fields = ['status', 'is_active', 'start_date', 'end_date', 'amount_paid']

    def get_duration_days(self, obj):
        duration_map = {'monthly': 30, 'quarterly': 90, 'biannual': 180, 'yearly': 365}
        return duration_map.get(obj.plan.duration, 30)
