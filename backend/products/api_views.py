from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Avg
from django.shortcuts import get_object_or_404
from accounts.models import User
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
        if Review.objects.filter(product=product, buyer=request.user).exists():
            return Response(
                {'detail': 'You have already reviewed this product. Edit your existing review instead.'},
                status=409,
            )

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


class SellersByCategoryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        categories = Category.objects.filter(
            products__is_active=True,
            products__seller__role='seller',
        ).distinct().order_by('name')

        result = []
        for cat in categories:
            sellers_qs = (
                User.objects
                .filter(role='seller', products__category=cat, products__is_active=True)
                .distinct()
                .annotate(
                    product_count=Count(
                        'products',
                        filter=Q(products__category=cat, products__is_active=True),
                        distinct=True,
                    ),
                    avg_rating=Avg(
                        'products__reviews__rating',
                        filter=Q(products__category=cat),
                    ),
                )
                .order_by('-product_count')[:8]
            )

            sellers = []
            for s in sellers_qs:
                try:
                    business = s.seller_profile.business_name or s.username
                except Exception:
                    business = s.username
                sellers.append({
                    'id': s.id,
                    'username': s.username,
                    'business_name': business,
                    'product_count': s.product_count,
                    'avg_rating': round(float(s.avg_rating or 0), 1),
                })

            if sellers:
                result.append({
                    'id': cat.id,
                    'name': cat.name,
                    'name_am': cat.name_am,
                    'icon': cat.icon or 'bi-grid',
                    'slug': cat.slug,
                    'seller_count': len(sellers),
                    'sellers': sellers,
                })

        return Response(result)


class SellersListAPIView(APIView):
    """Flat list of all active sellers — public, no auth required."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        sellers_qs = (
            User.objects
            .filter(role='seller', is_active=True, is_deleted=False, products__is_active=True)
            .distinct()
            .annotate(
                product_count=Count('products', filter=Q(products__is_active=True), distinct=True),
                avg_rating=Avg('products__reviews__rating'),
            )
            .order_by('-product_count')
        )
        if q:
            sellers_qs = sellers_qs.filter(
                Q(username__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(seller_profile__business_name__icontains=q)
            )

        data = []
        for s in sellers_qs:
            try:
                business = s.seller_profile.business_name or s.username
                is_verified = s.seller_profile.is_verified
            except Exception:
                business = s.username
                is_verified = False
            categories = Category.objects.filter(
                products__seller=s, products__is_active=True
            ).distinct().values('id', 'name', 'name_am', 'icon', 'slug')
            data.append({
                'id': s.id,
                'username': s.username,
                'business_name': business,
                'is_verified': is_verified,
                'is_email_verified': s.is_email_verified,
                'product_count': s.product_count,
                'avg_rating': round(float(s.avg_rating or 0), 1),
                'categories': list(categories),
            })
        return Response(data)


class SellerPublicAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        seller = get_object_or_404(User, username=username, role='seller', is_deleted=False)

        try:
            sp = seller.seller_profile
            business_name = sp.business_name or seller.username
            business_description = sp.business_description
            is_verified = sp.is_verified
        except Exception:
            business_name = seller.username
            business_description = ''
            is_verified = False

        products_qs = Product.objects.filter(seller=seller, is_active=True)

        category_slug = request.query_params.get('category', '')
        if category_slug:
            products_qs = products_qs.filter(category__slug=category_slug)

        ordering = request.query_params.get('ordering', '-created_at')
        if ordering not in ('-created_at', 'created_at', 'price', '-price'):
            ordering = '-created_at'
        products_qs = products_qs.order_by(ordering)

        all_products = Product.objects.filter(seller=seller, is_active=True)
        stats = all_products.aggregate(
            avg_rating=Avg('reviews__rating'),
            total_products=Count('id'),
        )
        categories = Category.objects.filter(
            products__seller=seller, products__is_active=True
        ).distinct().order_by('name')

        return Response({
            'id': seller.id,
            'username': seller.username,
            'full_name': seller.get_full_name() or seller.username,
            'business_name': business_name,
            'business_description': business_description,
            'is_email_verified': seller.is_email_verified,
            'is_verified': is_verified,
            'date_joined': seller.date_joined,
            'avg_rating': round(float(stats['avg_rating'] or 0), 1),
            'total_products': stats['total_products'],
            'categories': CategorySerializer(categories, many=True).data,
            'products': ProductListSerializer(products_qs[:48], many=True, context={'request': request}).data,
        })
