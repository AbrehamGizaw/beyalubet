from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import timedelta
from .models import User, SellerProfile
from .serializers import UserSerializer
from subscriptions.models import SellerSubscription, SubscriptionPlan, PlatformSettings
from subscriptions.serializers import SellerSubscriptionSerializer, SubscriptionPlanSerializer
from .email_utils import send_subscription_result
from orders.models import Order, OrderItem
from products.models import Product, Review


class IsPlatformAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


# ── Dashboard ───────────────────────────────────────────────────────────────

class AdminDashboardAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_users = User.objects.exclude(role='admin').count()
        sellers = User.objects.filter(role='seller').count()
        buyers = User.objects.filter(role='buyer').count()
        new_users_30d = User.objects.filter(date_joined__gte=thirty_days_ago).exclude(role='admin').count()

        total_orders = Order.objects.count()
        orders_30d = Order.objects.filter(created_at__gte=thirty_days_ago).count()
        order_revenue = Order.objects.filter(
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        pending_subs = SellerSubscription.objects.filter(status='pending').count()
        active_subs = SellerSubscription.objects.filter(is_active=True).count()
        sub_revenue = SellerSubscription.objects.filter(
            status__in=['active', 'expired']
        ).aggregate(total=Sum('amount_paid'))['total'] or 0

        total_products = Product.objects.filter(is_active=True).count()

        recent_subs = SellerSubscription.objects.filter(
            status='pending'
        ).select_related('seller', 'plan').order_by('-created_at')[:5]

        return Response({
            'users': {
                'total': total_users, 'sellers': sellers,
                'buyers': buyers, 'new_30d': new_users_30d,
            },
            'orders': {
                'total': total_orders, 'last_30d': orders_30d,
                'revenue': str(order_revenue),
            },
            'subscriptions': {
                'pending': pending_subs, 'active': active_subs,
                'revenue': str(sub_revenue),
            },
            'products': {'total': total_products},
            'pending_subscriptions': SellerSubscriptionSerializer(recent_subs, many=True).data,
        })


# ── Users ────────────────────────────────────────────────────────────────────

class AdminUsersAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request, pk=None):
        if pk:
            return self._user_detail(pk)
        role = request.query_params.get('role', '')
        q = request.query_params.get('q', '')
        qs = User.objects.exclude(role='admin').order_by('-date_joined')
        if role:
            qs = qs.filter(role=role)
        if q:
            qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q) |
                           Q(first_name__icontains=q) | Q(last_name__icontains=q))

        data = []
        for u in qs[:100]:
            sub = None
            if u.role == 'seller':
                sub = u.subscriptions.filter(is_active=True).first()
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'full_name': u.get_full_name() or u.username,
                'role': u.role,
                'phone': u.phone,
                'date_joined': u.date_joined,
                'is_active': u.is_active,
                'is_email_verified': u.is_email_verified,
                'order_count': Order.objects.filter(buyer=u).count() if u.role == 'buyer' else None,
                'product_count': Product.objects.filter(seller=u, is_active=True).count() if u.role == 'seller' else None,
                'subscription_status': sub.status if sub else ('pending' if u.subscriptions.filter(status='pending').exists() else None),
            })
        return Response(data)

    def _user_detail(self, pk):
        user = get_object_or_404(User, pk=pk)
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name() or user.username,
            'phone': user.phone,
            'role': user.role,
            'is_active': user.is_active,
            'is_email_verified': user.is_email_verified,
            'date_joined': user.date_joined,
            'profile_image': user.profile_image.url if user.profile_image else None,
        }

        if user.role == 'buyer':
            orders = Order.objects.filter(buyer=user).prefetch_related('items').order_by('-created_at')[:20]
            data['orders'] = [{
                'order_number': o.order_number,
                'status': o.status,
                'payment_status': o.payment_status,
                'total_amount': str(o.total_amount),
                'created_at': o.created_at,
                'items': [{'product_title': i.product_title, 'quantity': i.quantity, 'unit_price': str(i.unit_price)} for i in o.items.all()],
            } for o in orders]
            paid = Order.objects.filter(buyer=user, payment_status='paid').aggregate(t=Sum('total_amount'))['t'] or 0
            data['stats'] = {
                'total_orders': Order.objects.filter(buyer=user).count(),
                'total_spent': str(paid),
            }
            reviews = Review.objects.filter(buyer=user).select_related('product').order_by('-created_at')[:20]
            data['reviews'] = [{
                'product_title': r.product.title,
                'product_slug': r.product.slug,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at,
            } for r in reviews]

        elif user.role == 'seller':
            try:
                sp = user.seller_profile
                data['seller_profile'] = {
                    'business_name': sp.business_name,
                    'business_description': sp.business_description,
                    'bank_name': sp.bank_name,
                    'account_number': sp.account_number,
                    'account_holder': sp.account_holder,
                    'telebirr_number': sp.telebirr_number,
                    'mobile_money': sp.mobile_money,
                    'is_verified': sp.is_verified,
                }
            except Exception:
                data['seller_profile'] = None
            products = Product.objects.filter(seller=user).order_by('-created_at')[:20]
            data['products'] = [{
                'title': p.title,
                'slug': p.slug,
                'price': str(p.price),
                'stock': p.stock,
                'views': p.views,
                'is_active': p.is_active,
                'created_at': p.created_at,
                'avg_rating': Review.objects.filter(product=p).aggregate(avg=Avg('rating'))['avg'],
            } for p in products]
            subs = SellerSubscription.objects.filter(seller=user).select_related('plan').order_by('-created_at')
            data['subscriptions'] = [{
                'plan_name': s.plan.name,
                'status': s.status,
                'start_date': s.start_date,
                'end_date': s.end_date,
                'amount_paid': str(s.amount_paid) if s.amount_paid else None,
            } for s in subs]
            revenue = OrderItem.objects.filter(seller=user, order__payment_status='paid').aggregate(t=Sum('unit_price'))['t'] or 0
            data['stats'] = {
                'total_products': Product.objects.filter(seller=user).count(),
                'active_products': Product.objects.filter(seller=user, is_active=True).count(),
                'total_revenue': str(revenue),
                'total_orders': OrderItem.objects.filter(seller=user).values('order').distinct().count(),
                'avg_rating': round(Review.objects.filter(product__seller=user).aggregate(avg=Avg('rating'))['avg'] or 0, 1),
            }

        return Response(data)

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
            user.save(update_fields=['is_active'])
        return Response({'id': user.id, 'is_active': user.is_active})


# ── Subscriptions ────────────────────────────────────────────────────────────

class AdminSubscriptionsAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status', '')
        qs = SellerSubscription.objects.select_related(
            'seller', 'plan'
        ).order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)

        data = []
        for sub in qs[:100]:
            s = SellerSubscriptionSerializer(sub).data
            s['seller_username'] = sub.seller.username
            s['seller_email'] = sub.seller.email
            s['seller_name'] = sub.seller.get_full_name() or sub.seller.username
            data.append(s)
        return Response(data)


class AdminSubscriptionActionAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def patch(self, request, pk):
        sub = get_object_or_404(SellerSubscription, pk=pk)
        action = request.data.get('action')
        if action == 'approve':
            sub.activate()
            send_subscription_result(sub, approved=True)
            return Response({'status': 'approved', 'subscription': SellerSubscriptionSerializer(sub).data})
        elif action == 'reject':
            sub.status = 'cancelled'
            sub.is_active = False
            sub.save(update_fields=['status', 'is_active'])
            send_subscription_result(sub, approved=False)
            return Response({'status': 'rejected'})
        elif 'transaction_id' in request.data:
            txn_id = (request.data['transaction_id'] or '').strip() or None
            if not txn_id:
                return Response({'detail': 'transaction_id cannot be empty.'}, status=400)
            if SellerSubscription.objects.filter(transaction_id=txn_id).exclude(pk=pk).exists():
                return Response({'detail': 'This transaction ID is already in use.'}, status=400)
            sub.transaction_id = txn_id
            sub.save(update_fields=['transaction_id'])
            s = SellerSubscriptionSerializer(sub).data
            s['seller_username'] = sub.seller.username
            s['seller_email'] = sub.seller.email
            s['seller_name'] = sub.seller.get_full_name() or sub.seller.username
            return Response(s)
        return Response({'detail': 'Provide action (approve/reject) or transaction_id.'}, status=400)


class AdminSubscriptionPlanAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        plans = SubscriptionPlan.objects.all().order_by('price')
        return Response(SubscriptionPlanSerializer(plans, many=True).data)

    def post(self, request):
        required = ['name', 'duration', 'price', 'max_products']
        for f in required:
            if request.data.get(f) in [None, '']:
                return Response({'detail': f'{f} is required.'}, status=400)
        plan = SubscriptionPlan.objects.create(
            name=request.data['name'],
            duration=request.data['duration'],
            price=request.data['price'],
            max_products=request.data['max_products'],
            features=request.data.get('features', ''),
            is_active=request.data.get('is_active', True),
            is_popular=request.data.get('is_popular', False),
            is_free=request.data.get('is_free', False),
        )
        return Response(SubscriptionPlanSerializer(plan).data, status=201)

    def patch(self, request, pk):
        plan = get_object_or_404(SubscriptionPlan, pk=pk)
        allowed = ['price', 'name', 'max_products', 'features', 'is_active', 'is_popular', 'is_free', 'duration']
        for field in allowed:
            if field in request.data:
                setattr(plan, field, request.data[field])
        plan.save()
        return Response(SubscriptionPlanSerializer(plan).data)

    def delete(self, request, pk):
        plan = get_object_or_404(SubscriptionPlan, pk=pk)
        if plan.sellersubscription_set.filter(is_active=True).exists():
            return Response({'detail': 'Cannot delete a plan with active subscribers.'}, status=400)
        plan.delete()
        return Response(status=204)


# ── Reports ──────────────────────────────────────────────────────────────────

class AdminReportsAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)

        # Monthly subscription revenue (last 6 months)
        sub_monthly = (
            SellerSubscription.objects
            .filter(created_at__gte=six_months_ago, status__in=['active', 'expired'])
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('amount_paid'), count=Count('id'))
            .order_by('month')
        )

        # Monthly order revenue (last 6 months)
        order_monthly = (
            Order.objects
            .filter(created_at__gte=six_months_ago, payment_status='paid')
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total_amount'), count=Count('id'))
            .order_by('month')
        )

        # Monthly new users
        user_monthly = (
            User.objects
            .filter(date_joined__gte=six_months_ago)
            .exclude(role='admin')
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        # Top sellers by revenue
        top_sellers_qs = (
            OrderItem.objects
            .filter(order__payment_status='paid')
            .values('seller__username', 'seller__id')
            .annotate(revenue=Sum('unit_price'), orders=Count('order', distinct=True))
            .order_by('-revenue')[:10]
        )
        # Avg rating per seller (keyed by seller id)
        seller_ratings = dict(
            Review.objects
            .values('product__seller_id')
            .annotate(avg=Avg('rating'))
            .values_list('product__seller_id', 'avg')
        )
        top_sellers = [
            {**s, 'avg_rating': round(seller_ratings.get(s['seller__id']) or 0, 1)}
            for s in top_sellers_qs
        ]

        # Plan distribution
        plan_dist = (
            SellerSubscription.objects
            .filter(status='active')
            .values('plan__name')
            .annotate(count=Count('id'))
        )

        # Order status breakdown
        order_status = (
            Order.objects
            .values('status')
            .annotate(count=Count('id'))
        )

        return Response({
            'subscription_monthly': [
                {'month': r['month'].strftime('%Y-%m'), 'revenue': str(r['revenue']), 'count': r['count']}
                for r in sub_monthly
            ],
            'order_monthly': [
                {'month': r['month'].strftime('%Y-%m'), 'revenue': str(r['revenue']), 'count': r['count']}
                for r in order_monthly
            ],
            'user_monthly': [
                {'month': r['month'].strftime('%Y-%m'), 'count': r['count']}
                for r in user_monthly
            ],
            'top_sellers': list(top_sellers),
            'plan_distribution': list(plan_dist),
            'order_status_breakdown': list(order_status),
        })


# ── Admin Reviews ─────────────────────────────────────────────────────────────

class AdminReviewsAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = Review.objects.select_related(
            'buyer', 'product', 'product__seller'
        ).order_by('-created_at')

        q = request.query_params.get('q', '')
        rating = request.query_params.get('rating', '')
        if q:
            from django.db.models import Q as Qf
            qs = qs.filter(
                Qf(comment__icontains=q) |
                Qf(buyer__username__icontains=q) |
                Qf(product__title__icontains=q)
            )
        if rating:
            qs = qs.filter(rating=rating)

        return Response([{
            'id': r.id,
            'buyer_name': r.buyer.get_full_name() or r.buyer.username,
            'buyer_username': r.buyer.username,
            'product_title': r.product.title,
            'product_slug': r.product.slug,
            'seller_name': r.product.seller.get_full_name() or r.product.seller.username,
            'rating': r.rating,
            'comment': r.comment,
            'created_at': r.created_at,
        } for r in qs[:300]])

    def delete(self, request, review_id):
        review = get_object_or_404(Review, pk=review_id)
        review.delete()
        return Response(status=204)


# ── Platform Settings ─────────────────────────────────────────────────────────

class AdminPlatformSettingsAPIView(APIView):
    permission_classes = [IsPlatformAdmin]

    FIELDS = ['bank_name', 'account_number', 'account_holder', 'telebirr', 'mobile_money']

    def get(self, request):
        ps = PlatformSettings.get()
        return Response({f: getattr(ps, f) for f in self.FIELDS})

    def patch(self, request):
        ps = PlatformSettings.get()
        for f in self.FIELDS:
            if f in request.data:
                setattr(ps, f, request.data[f])
        ps.save()
        return Response({f: getattr(ps, f) for f in self.FIELDS})
