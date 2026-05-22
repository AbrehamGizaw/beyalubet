from rest_framework import serializers
from django.db.models import Avg, Count
from .models import Product, Category, ProductImage, Review



class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'name_am', 'slug', 'description', 'icon', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_main']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_name_am = serializers.CharField(source='category.name_am', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    seller_name = serializers.SerializerMethodField()
    seller_business = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    seller_phone = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'title', 'slug', 'price', 'original_price', 'discount_percentage',
                  'stock', 'condition', 'location', 'views', 'created_at',
                  'category', 'category_name', 'category_name_am', 'category_icon', 'category_slug',
                  'seller', 'seller_name', 'seller_business', 'seller_phone',
                  'main_image', 'is_featured', 'avg_rating', 'review_count']

    def get_seller_name(self, obj):
        return obj.seller.get_full_name() or obj.seller.username

    def get_seller_business(self, obj):
        try:
            return obj.seller.seller_profile.business_name
        except Exception:
            return obj.seller.username

    def get_main_image(self, obj):
        request = self.context.get('request')
        img = obj.main_image()
        if img and img.image:
            url = img.image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_avg_rating(self, obj):
        agg = obj.reviews.aggregate(avg=Avg('rating'))
        return round(agg['avg'] or 0, 1)

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_seller_phone(self, obj):
        return obj.seller.phone or ''


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    seller_payment = serializers.SerializerMethodField()
    review_stats = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            'description', 'images', 'seller_payment', 'updated_at', 'review_stats',
        ]

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

    def get_review_stats(self, obj):
        agg = obj.reviews.aggregate(avg=Avg('rating'), count=Count('id'))
        return {'count': agg['count'] or 0, 'average': round(agg['avg'] or 0, 1)}


class ReviewSerializer(serializers.ModelSerializer):
    buyer_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'buyer_name', 'rating', 'comment', 'created_at', 'updated_at', 'is_mine']
        read_only_fields = ['created_at', 'updated_at']

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name() or obj.buyer.username

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and request.user == obj.buyer)


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['title', 'category', 'description', 'price', 'original_price',
                  'stock', 'condition', 'location', 'is_active']
