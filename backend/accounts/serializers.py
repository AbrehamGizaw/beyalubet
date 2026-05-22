from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, SellerProfile, BuyerProfile


class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['business_name', 'business_description', 'business_address',
                  'bank_name', 'account_number', 'account_holder', 'mobile_money', 'telebirr_number', 'is_verified']
        read_only_fields = ['is_verified']


class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = ['shipping_address', 'city', 'country', 'postal_code']


class UserSerializer(serializers.ModelSerializer):
    seller_profile = SellerProfileSerializer(read_only=True)
    buyer_profile = BuyerProfileSerializer(read_only=True)
    has_active_subscription = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone', 'profile_image', 'is_email_verified',
                  'seller_profile', 'buyer_profile', 'has_active_subscription']

    def get_has_active_subscription(self, obj):
        if obj.is_seller():
            return obj.has_active_subscription()
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'role', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if attrs.get('role') == 'admin':
            raise serializers.ValidationError({'role': 'Cannot self-register as admin.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class SellerPaymentInfoSerializer(serializers.ModelSerializer):
    """Minimal seller payment info shown to buyers on order pages."""
    class Meta:
        model = SellerProfile
        fields = ['business_name', 'bank_name', 'account_number', 'account_holder', 'mobile_money', 'telebirr_number']
