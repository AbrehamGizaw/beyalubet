from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Product, Category, ProductImage, Review
from .serializers import (
    CategorySerializer, ProductListSerializer,
    ProductDetailSerializer, ProductCreateSerializer, ReviewSerializer,
)


class CategoryListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cats = Category.objects.all()
        return Response(CategorySerializer(cats, many=True).data)


class ProductListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Product.objects.filter(is_active=True).select_related(
            'category', 'seller', 'seller__seller_profile'
        ).prefetch_related('images', 'reviews')

        category = request.query_params.get('category')
        q = request.query_params.get('q')
        condition = request.query_params.get('condition')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        featured = request.query_params.get('featured')
        ordering = request.query_params.get('ordering', '-created_at')

        if category:
            qs = qs.filter(category__slug=category)
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
        if condition:
            qs = qs.filter(condition=condition)
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except ValueError:
                pass
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except ValueError:
                pass
        if featured:
            qs = qs.filter(is_featured=True)

        sort_map = {'-created_at': '-created_at', 'price': 'price', '-price': '-price', '-views': '-views'}
        qs = qs.order_by(sort_map.get(ordering, '-created_at'))

        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get('limit', 12))
        page = paginator.paginate_queryset(qs, request)
        serializer = ProductListSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated or not request.user.is_seller():
            return Response({'detail': 'Only sellers can post products.'}, status=403)
        if not request.user.has_active_subscription():
            return Response({'detail': 'An active subscription is required to post products.'}, status=403)

        from subscriptions.models import SellerSubscription
        active_sub = SellerSubscription.objects.filter(
            seller=request.user, is_active=True
        ).select_related('plan').first()
        if active_sub:
            count = Product.objects.filter(seller=request.user, is_active=True).count()
            if count >= active_sub.plan.max_products:
                return Response(
                    {'detail': f'Plan limit of {active_sub.plan.max_products} products reached.'},
                    status=403
                )

        serializer = ProductCreateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save(seller=request.user)
            image = request.FILES.get('image')
            if image:
                ProductImage.objects.create(product=product, image=image, is_main=True)
            return Response(
                ProductDetailSerializer(product, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=400)


class ProductDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        product.views += 1
        product.save(update_fields=['views'])
        return Response(ProductDetailSerializer(product, context={'request': request}).data)

    def patch(self, request, slug):
        product = get_object_or_404(Product, slug=slug, seller=request.user)
        serializer = ProductCreateSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            image = request.FILES.get('image')
            if image:
                ProductImage.objects.filter(product=product, is_main=True).update(is_main=False)
                ProductImage.objects.create(product=product, image=image, is_main=True)
            return Response(ProductDetailSerializer(product, context={'request': request}).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, slug):
        product = get_object_or_404(Product, slug=slug, seller=request.user)
        product.is_active = False
        product.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyProductsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_seller():
            return Response({'detail': 'Sellers only.'}, status=403)
        products = Product.objects.filter(seller=request.user).select_related(
            'category'
        ).prefetch_related('images', 'reviews').order_by('-created_at')
        return Response(ProductListSerializer(products, many=True, context={'request': request}).data)

    def post(self, request):
        if not request.user.is_seller():
            return Response({'detail': 'Only sellers can post products.'}, status=403)
        if not request.user.has_active_subscription():
            return Response({'detail': 'An active subscription is required to post products.'}, status=403)

        from subscriptions.models import SellerSubscription
        active_sub = SellerSubscription.objects.filter(
            seller=request.user, is_active=True
        ).select_related('plan').first()
        if active_sub:
            count = Product.objects.filter(seller=request.user, is_active=True).count()
            if count >= active_sub.plan.max_products:
                return Response(
                    {'detail': f'Plan limit of {active_sub.plan.max_products} products reached.'},
                    status=403
                )

        serializer = ProductCreateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save(seller=request.user)
            for key, f in request.FILES.items():
                if key.startswith('images'):
                    is_main = not product.images.exists()
                    ProductImage.objects.create(product=product, image=f, is_main=is_main)
            return Response(
                ProductDetailSerializer(product, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=400)


class MyProductDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, seller=request.user)
        return Response(ProductDetailSerializer(product, context={'request': request}).data)

    def patch(self, request, slug):
        product = get_object_or_404(Product, slug=slug, seller=request.user)
        serializer = ProductCreateSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            for key, f in request.FILES.items():
                if key.startswith('images'):
                    is_main = not product.images.filter(is_main=True).exists()
                    ProductImage.objects.create(product=product, image=f, is_main=is_main)
            product.refresh_from_db()
            return Response(ProductDetailSerializer(product, context={'request': request}).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, slug):
        product = get_object_or_404(Product, slug=slug, seller=request.user)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageDeleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, slug, img_id):
        image = get_object_or_404(ProductImage, pk=img_id, product__slug=slug, product__seller=request.user)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductReviewsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug)
        reviews = product.reviews.select_related('buyer').all()
        return Response(ReviewSerializer(reviews, many=True, context={'request': request}).data)

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        if not request.user.is_buyer():
            return Response({'detail': 'Only buyers can write reviews.'}, status=403)
        if product.seller == request.user:
            return Response({'detail': 'You cannot review your own product.'}, status=403)

        try:
            rating = int(request.data.get('rating', 0))
        except (ValueError, TypeError):
            rating = 0
        if rating not in range(1, 6):
            return Response({'detail': 'Rating must be between 1 and 5.'}, status=400)

        review = Review.objects.create(
            product=product,
            buyer=request.user,
            rating=rating,
            comment=(request.data.get('comment') or '').strip(),
        )
        return Response(ReviewSerializer(review, context={'request': request}).data, status=201)


class ReviewDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, slug, review_id):
        review = get_object_or_404(Review, pk=review_id, product__slug=slug, buyer=request.user)
        try:
            rating = int(request.data.get('rating', review.rating))
        except (ValueError, TypeError):
            rating = review.rating
        if rating not in range(1, 6):
            return Response({'detail': 'Rating must be between 1 and 5.'}, status=400)
        review.rating = rating
        review.comment = (request.data.get('comment') or '').strip()
        review.save(update_fields=['rating', 'comment', 'updated_at'])
        return Response(ReviewSerializer(review, context={'request': request}).data)

    def delete(self, request, slug, review_id):
        product = get_object_or_404(Product, slug=slug)
        review = get_object_or_404(Review, pk=review_id, product=product)
        # Buyer deletes their own review OR seller removes a review on their product
        if review.buyer != request.user and product.seller != request.user:
            return Response({'detail': 'Not authorized.'}, status=403)
        review.delete()
        return Response(status=204)
