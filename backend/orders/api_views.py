from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, Order, OrderItem
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer, OrderListSerializer
from products.models import Product
from accounts.email_utils import (
    send_order_placed_buyer,
    send_new_order_seller,
    send_payment_submitted_seller,
    send_payment_result_buyer,
    send_order_status_update_buyer,
)


class CartAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)


class AddToCartAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_buyer():
            return Response({'detail': 'Only buyers can add to cart.'}, status=403)
        product_id = request.data.get('product_id')
        qty = int(request.data.get('quantity', 1))
        product = get_object_or_404(Product, pk=product_id, is_active=True)

        if product.seller == request.user:
            return Response({'detail': 'You cannot buy your own product.'}, status=400)
        if not product.in_stock():
            return Response({'detail': 'Product is out of stock.'}, status=400)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity = min(item.quantity + qty, product.stock)
            item.save()
        else:
            item.quantity = min(qty, product.stock)
            item.save()

        return Response(CartSerializer(cart, context={'request': request}).data)


class CartItemAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        item = get_object_or_404(CartItem, pk=pk, cart__user=request.user)
        qty = int(request.data.get('quantity', item.quantity))
        if qty < 1:
            item.delete()
        elif qty > item.product.stock:
            return Response({'detail': f'Only {item.product.stock} available.'}, status=400)
        else:
            item.quantity = qty
            item.save()
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, pk):
        item = get_object_or_404(CartItem, pk=pk, cart__user=request.user)
        item.delete()
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)


class CheckoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_buyer():
            return Response({'detail': 'Only buyers can checkout.'}, status=403)

        try:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            items = cart.items.select_related('product', 'product__seller').all()
            if not items.exists():
                return Response({'detail': 'Your cart is empty.'}, status=400)

            d = request.data
            required = ['shipping_name', 'shipping_address', 'shipping_city', 'shipping_country', 'shipping_phone']
            for f in required:
                val = d.get(f) or ''
                if not str(val).strip():
                    return Response({'detail': f'{f} is required.'}, status=400)

            order = Order.objects.create(
                buyer=request.user,
                shipping_name=d['shipping_name'],
                shipping_address=d['shipping_address'],
                shipping_city=d['shipping_city'],
                shipping_country=d['shipping_country'],
                shipping_phone=d['shipping_phone'],
                notes=d.get('notes') or '',
                total_amount=cart.total,
                payment_method='',
                payment_reference='',
            )
            for item in items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    seller=item.product.seller,
                    product_title=item.product.title,
                    quantity=item.quantity,
                    unit_price=item.product.price,
                )
                item.product.stock = max(0, item.product.stock - item.quantity)
                item.product.save(update_fields=['stock'])

            cart.items.all().delete()

            # Notifications
            send_order_placed_buyer(order)
            sellers = set(item.seller for item in order.items.select_related('seller').all())
            for seller in sellers:
                send_new_order_seller(order, seller)

            return Response(OrderSerializer(order, context={'request': request}).data, status=201)

        except Exception as exc:
            import traceback, logging
            logging.getLogger(__name__).error('Checkout error: %s\n%s', exc, traceback.format_exc())
            return Response({'detail': f'Checkout failed: {exc}'}, status=500)


class OrderListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(buyer=request.user).order_by('-created_at')
        return Response(OrderListSerializer(orders, many=True).data)


class OrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number, buyer=request.user)
        return Response(OrderSerializer(order, context={'request': request}).data)

    def delete(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number, buyer=request.user)
        if order.status != 'pending' or order.payment_status != 'pending':
            return Response({'detail': 'Only unconfirmed pending orders can be cancelled.'}, status=400)
        for item in order.items.select_related('product').all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])
        order.status = 'cancelled'
        order.save(update_fields=['status'])
        return Response(OrderSerializer(order, context={'request': request}).data)

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number, buyer=request.user)

        if order.payment_status in ('submitted', 'paid'):
            return Response(
                {'detail': 'Payment already submitted. Wait for the seller to confirm.'},
                status=400,
            )

        ref = (request.data.get('payment_reference') or '').strip()
        if not ref:
            return Response({'detail': 'Payment reference is required.'}, status=400)

        # Ensure the transaction ID has not been used on any other order
        if Order.objects.filter(payment_reference=ref).exclude(pk=order.pk).exists():
            return Response(
                {'detail': 'This transaction reference has already been used. Please check your reference number.'},
                status=400,
            )

        order.payment_reference = ref
        order.payment_method = (request.data.get('payment_method') or '').strip()
        order.payment_status = 'submitted'
        order.save(update_fields=['payment_reference', 'payment_method', 'payment_status'])
        send_payment_submitted_seller(order)
        return Response(OrderSerializer(order, context={'request': request}).data)


class SellerOrdersAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_seller():
            return Response({'detail': 'Sellers only.'}, status=403)
        order_ids = OrderItem.objects.filter(
            seller=request.user
        ).values_list('order_id', flat=True).distinct()
        orders = Order.objects.filter(id__in=order_ids).prefetch_related(
            'items', 'items__product', 'items__product__images',
            'items__seller', 'items__seller__seller_profile'
        ).order_by('-created_at')
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)


class UpdateOrderStatusAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_seller():
            return Response({'detail': 'Sellers only.'}, status=403)
        order = get_object_or_404(Order, pk=pk)
        if not order.items.filter(seller=request.user).exists():
            return Response({'detail': 'Not authorized.'}, status=403)
        new_status = request.data.get('status', '')
        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'detail': 'Invalid status.'}, status=400)
        order.status = new_status
        order.save(update_fields=['status'])
        send_order_status_update_buyer(order)
        return Response({'status': new_status, 'status_display': order.get_status_display()})


class SellerPaymentApprovalAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_seller():
            return Response({'detail': 'Sellers only.'}, status=403)
        order = get_object_or_404(Order, pk=pk)
        if not order.items.filter(seller=request.user).exists():
            return Response({'detail': 'Not authorized.'}, status=403)
        action = request.data.get('action')
        if action == 'approve':
            order.payment_status = 'paid'
            order.status = 'confirmed'
            order.save(update_fields=['payment_status', 'status'])
            send_payment_result_buyer(order, approved=True)
            return Response({'status': 'approved', 'payment_status': 'paid'})
        elif action == 'reject':
            order.payment_status = 'pending'
            order.payment_reference = ''
            order.payment_method = ''
            order.save(update_fields=['payment_status', 'payment_reference', 'payment_method'])
            send_payment_result_buyer(order, approved=False)
            return Response({'status': 'rejected', 'payment_status': 'pending'})
        return Response({'detail': 'action must be approve or reject.'}, status=400)
