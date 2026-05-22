from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum, Avg
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from orders.models import Order, OrderItem
from products.models import Product, Category, Review


class SellerReportAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_seller():
            return Response({'detail': 'Sellers only.'}, status=403)

        seller = request.user
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)

        # All-time totals
        paid_items = OrderItem.objects.filter(seller=seller, order__payment_status='paid')
        total_revenue = paid_items.aggregate(total=Sum('unit_price'))['total'] or 0
        total_orders = OrderItem.objects.filter(seller=seller).values('order').distinct().count()

        # Monthly revenue (last 6 months)
        monthly = (
            OrderItem.objects
            .filter(seller=seller, order__payment_status='paid', order__created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('order__created_at'))
            .values('month')
            .annotate(revenue=Sum('unit_price'), orders=Count('order', distinct=True))
            .order_by('month')
        )

        # Top products by sales
        top_products = (
            OrderItem.objects
            .filter(seller=seller, order__payment_status='paid')
            .values('product_title')
            .annotate(total_sold=Sum('quantity'), revenue=Sum('unit_price'))
            .order_by('-revenue')[:10]
        )

        # Orders by status
        order_ids = OrderItem.objects.filter(seller=seller).values_list('order_id', flat=True).distinct()
        status_breakdown = (
            Order.objects
            .filter(id__in=order_ids)
            .values('status')
            .annotate(count=Count('id'))
        )

        # Active product count
        product_count = Product.objects.filter(seller=seller, is_active=True).count()

        # Overall avg rating across all seller's products
        avg_rating = round(
            Review.objects.filter(product__seller=seller).aggregate(avg=Avg('rating'))['avg'] or 0, 1
        )

        # Per-product rating lookup (keyed by product title)
        product_ratings = dict(
            Review.objects.filter(product__seller=seller)
            .values('product__title')
            .annotate(avg=Avg('rating'))
            .values_list('product__title', 'avg')
        )
        top_products_list = [
            {**p, 'avg_rating': round(product_ratings.get(p['product_title']) or 0, 1)}
            for p in top_products
        ]

        # Subscription
        sub = seller.subscriptions.filter(is_active=True).select_related('plan').first()
        pending_sub = seller.subscriptions.filter(status='pending').select_related('plan').first()

        return Response({
            'totals': {
                'revenue': str(total_revenue),
                'orders': total_orders,
                'products': product_count,
                'avg_rating': avg_rating,
            },
            'monthly_revenue': [
                {'month': r['month'].strftime('%Y-%m'), 'revenue': str(r['revenue']), 'orders': r['orders']}
                for r in monthly
            ],
            'top_products': top_products_list,
            'order_status': list(status_breakdown),
            'subscription': {
                'status': sub.status if sub else (pending_sub.status if pending_sub else 'none'),
                'plan_name': sub.plan.name if sub else (pending_sub.plan.name if pending_sub else None),
                'days_remaining': sub.days_remaining if sub else 0,
                'end_date': sub.end_date if sub else None,
            },
        })


class BuyerReportAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_buyer():
            return Response({'detail': 'Buyers only.'}, status=403)

        buyer = request.user
        now = timezone.now()
        six_months_ago = now - timedelta(days=180)

        # All-time totals
        total_spent = Order.objects.filter(
            buyer=buyer, payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders = Order.objects.filter(buyer=buyer).count()

        # Monthly spending (last 6 months)
        monthly = (
            Order.objects
            .filter(buyer=buyer, payment_status='paid', created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(spent=Sum('total_amount'), count=Count('id'))
            .order_by('month')
        )

        # Order status breakdown
        status_breakdown = (
            Order.objects
            .filter(buyer=buyer)
            .values('status')
            .annotate(count=Count('id'))
        )

        # Top categories purchased
        top_categories = (
            OrderItem.objects
            .filter(order__buyer=buyer, order__payment_status='paid')
            .values('product__category__name')
            .annotate(count=Count('id'), spent=Sum('unit_price'))
            .order_by('-spent')[:5]
        )

        # Recent orders
        recent = Order.objects.filter(buyer=buyer).order_by('-created_at')[:5]
        recent_data = [
            {
                'order_number': o.order_number,
                'total': str(o.total_amount),
                'status': o.get_status_display(),
                'date': o.created_at.strftime('%Y-%m-%d'),
            }
            for o in recent
        ]

        return Response({
            'totals': {
                'spent': str(total_spent),
                'orders': total_orders,
            },
            'monthly_spending': [
                {'month': r['month'].strftime('%Y-%m'), 'spent': str(r['spent']), 'count': r['count']}
                for r in monthly
            ],
            'order_status': list(status_breakdown),
            'top_categories': list(top_categories),
            'recent_orders': recent_data,
        })
