from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    item_count = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count']


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()
    seller_name = serializers.SerializerMethodField()
    seller_payment = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_title', 'quantity', 'unit_price', 'subtotal',
                  'seller', 'seller_name', 'seller_payment', 'product_image']

    def get_seller_name(self, obj):
        return obj.seller.get_full_name() or obj.seller.username

    def get_seller_payment(self, obj):
        try:
            sp = obj.seller.seller_profile
            return {
                'business_name': sp.business_name,
                'bank_name': sp.bank_name,
                'account_number': sp.account_number,
                'account_holder': sp.account_holder,
                'mobile_money': sp.mobile_money,
                'telebirr_number': sp.telebirr_number,
            }
        except Exception:
            return None

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product:
            img = obj.product.main_image()
            if img and img.image:
                url = img.image.url
                return request.build_absolute_uri(url) if request else url
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    buyer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'buyer_name', 'status', 'status_display', 'payment_status',
                  'payment_status_display', 'shipping_name', 'shipping_address', 'shipping_city',
                  'shipping_country', 'shipping_phone', 'notes', 'total_amount',
                  'payment_reference', 'payment_method', 'items', 'created_at', 'updated_at']
        read_only_fields = ['order_number', 'total_amount', 'created_at']

    def get_buyer_name(self, obj):
        return obj.shipping_name or obj.buyer.get_full_name() or obj.buyer.username


class OrderListSerializer(serializers.ModelSerializer):
    """Compact serializer for order lists (no nested items)."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'status_display', 'payment_status',
                  'payment_status_display', 'total_amount', 'item_count', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()
