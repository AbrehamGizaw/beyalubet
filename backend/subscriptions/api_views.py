from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from .models import SubscriptionPlan, SellerSubscription, PlatformSettings
from .serializers import SubscriptionPlanSerializer, SellerSubscriptionSerializer
from accounts.email_utils import send_subscription_submitted


def _platform_info():
    ps = PlatformSettings.get()
    return {
        'bank_name': ps.bank_name,
        'account_number': ps.account_number,
        'account_holder': ps.account_holder,
        'mobile_money': ps.mobile_money,
        'telebirr': ps.telebirr,
        'cbe_account': ps.account_number,
        'cbe_holder': ps.account_holder,
    }


class PlansAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Admins see all plans (including inactive); everyone else sees active only
        is_admin = request.user.is_authenticated and request.user.role == 'admin'
        qs = SubscriptionPlan.objects.all() if is_admin else SubscriptionPlan.objects.filter(is_active=True)
        return Response(SubscriptionPlanSerializer(qs.order_by('price'), many=True).data)


class PlanDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=403)
        plan = get_object_or_404(SubscriptionPlan, pk=pk)
        for field in ['price', 'name', 'max_products', 'features', 'is_active', 'is_popular']:
            if field in request.data:
                setattr(plan, field, request.data[field])
        plan.save()
        return Response(SubscriptionPlanSerializer(plan).data)


class SubscribeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_seller():
            return Response({'detail': 'Only sellers can subscribe.'}, status=403)

        if SellerSubscription.objects.filter(seller=request.user, is_active=True).exists():
            return Response({'detail': 'You already have an active subscription. Wait for it to expire before subscribing again.'}, status=400)
        if SellerSubscription.objects.filter(seller=request.user, status='pending').exists():
            return Response({'detail': 'You already have a pending subscription awaiting admin approval.'}, status=400)

        plan_id = request.data.get('plan') or request.data.get('plan_id')
        txn_id = (request.data.get('transaction_id') or '').strip() or None
        sender_name = (request.data.get('sender_name') or '').strip()
        screenshot = request.FILES.get('payment_screenshot')
        if not plan_id:
            return Response({'detail': 'plan is required.'}, status=400)
        if not txn_id:
            return Response({'detail': 'transaction_id is required.'}, status=400)
        if not sender_name:
            return Response({'detail': 'sender_name is required.'}, status=400)
        if not screenshot:
            return Response({'detail': 'payment_screenshot is required.'}, status=400)
        if SellerSubscription.objects.filter(transaction_id=txn_id).exists():
            return Response({'detail': 'This transaction ID is already in use.'}, status=400)

        plan = get_object_or_404(SubscriptionPlan, pk=plan_id, is_active=True)
        sub = SellerSubscription.objects.create(
            seller=request.user,
            plan=plan,
            amount_paid=plan.price,
            transaction_id=txn_id,
            sender_name=sender_name,
            payment_screenshot=screenshot,
            status='pending',
            is_active=False,
        )
        send_subscription_submitted(sub)
        return Response(SellerSubscriptionSerializer(sub).data, status=201)


class UpdateMyTransactionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        sub = get_object_or_404(SellerSubscription, pk=pk, seller=request.user)
        if sub.status != 'pending':
            return Response({'detail': 'Transaction ID can only be edited while the subscription is pending.'}, status=400)
        txn_id = (request.data.get('transaction_id') or '').strip() or None
        if not txn_id:
            return Response({'detail': 'transaction_id is required.'}, status=400)
        if SellerSubscription.objects.filter(transaction_id=txn_id).exclude(pk=pk).exists():
            return Response({'detail': 'This transaction ID is already in use.'}, status=400)
        sub.transaction_id = txn_id
        sub.save(update_fields=['transaction_id'])
        return Response(SellerSubscriptionSerializer(sub).data)


class MySubscriptionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_seller():
            return Response({'detail': 'Sellers only.'}, status=403)
        subs = SellerSubscription.objects.filter(
            seller=request.user
        ).select_related('plan').order_by('-created_at')
        active = subs.filter(is_active=True).first()
        return Response({
            'active_subscription': SellerSubscriptionSerializer(active).data if active else None,
            'subscription_history': SellerSubscriptionSerializer(subs, many=True).data,
            'plans': SubscriptionPlanSerializer(SubscriptionPlan.objects.filter(is_active=True), many=True).data,
            'platform_info': _platform_info()
        })
