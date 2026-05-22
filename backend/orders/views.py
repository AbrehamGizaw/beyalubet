from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from .models import Cart, CartItem, Order, OrderItem
from products.models import Product


@login_required
def cart(request):
    if not request.user.is_buyer():
        messages.info(request, 'Sellers cannot add items to cart. Please create a buyer account.')
        return redirect('home')
    cart_obj, _ = Cart.objects.get_or_create(user=request.user)
    items = cart_obj.items.select_related('product', 'product__seller', 'product__category').all()
    return render(request, 'orders/cart.html', {'cart': cart_obj, 'items': items})


@login_required
def add_to_cart(request, product_id):
    if not request.user.is_buyer():
        messages.error(request, 'Only buyers can add items to cart.')
        return redirect('products:list')

    product = get_object_or_404(Product, pk=product_id, is_active=True)
    if product.seller == request.user:
        messages.error(request, 'You cannot buy your own product.')
        return redirect('products:detail', slug=product.slug)
    if not product.in_stock():
        messages.error(request, 'This product is out of stock.')
        return redirect('products:detail', slug=product.slug)

    cart_obj, _ = Cart.objects.get_or_create(user=request.user)
    item, created = CartItem.objects.get_or_create(cart=cart_obj, product=product)
    if not created:
        if item.quantity < product.stock:
            item.quantity += 1
            item.save()
            messages.success(request, f'Updated quantity for "{product.title}".')
        else:
            messages.warning(request, f'Only {product.stock} available in stock.')
    else:
        messages.success(request, f'"{product.title}" added to cart.')

    return redirect(request.META.get('HTTP_REFERER', 'orders:cart'))


@login_required
def remove_from_cart(request, item_id):
    item = get_object_or_404(CartItem, pk=item_id, cart__user=request.user)
    item.delete()
    messages.success(request, 'Item removed from cart.')
    return redirect('orders:cart')


@login_required
def update_cart(request, item_id):
    item = get_object_or_404(CartItem, pk=item_id, cart__user=request.user)
    qty = int(request.POST.get('quantity', 1))
    if qty < 1:
        item.delete()
        messages.success(request, 'Item removed.')
    elif qty > item.product.stock:
        messages.warning(request, f'Only {item.product.stock} available.')
    else:
        item.quantity = qty
        item.save()
    return redirect('orders:cart')


@login_required
def checkout(request):
    if not request.user.is_buyer():
        return redirect('home')

    cart_obj, _ = Cart.objects.get_or_create(user=request.user)
    items = cart_obj.items.select_related('product', 'product__seller').all()
    if not items.exists():
        messages.warning(request, 'Your cart is empty.')
        return redirect('orders:cart')

    # Pre-fill from buyer profile
    initial = {}
    try:
        bp = request.user.buyer_profile
        initial = {
            'shipping_address': bp.shipping_address,
            'shipping_city': bp.city,
            'shipping_country': bp.country,
        }
    except Exception:
        pass

    if request.method == 'POST':
        name = request.POST.get('shipping_name', '').strip()
        address = request.POST.get('shipping_address', '').strip()
        city = request.POST.get('shipping_city', '').strip()
        country = request.POST.get('shipping_country', '').strip()
        phone = request.POST.get('shipping_phone', '').strip()
        notes = request.POST.get('notes', '').strip()

        if not all([name, address, city, country, phone]):
            messages.error(request, 'Please fill in all required shipping fields.')
            return render(request, 'orders/checkout.html', {
                'cart': cart_obj, 'items': items, 'initial': initial
            })

        order = Order.objects.create(
            buyer=request.user,
            shipping_name=name,
            shipping_address=address,
            shipping_city=city,
            shipping_country=country,
            shipping_phone=phone,
            notes=notes,
            total_amount=cart_obj.total,
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
            # Reduce stock
            item.product.stock -= item.quantity
            item.product.save(update_fields=['stock'])

        cart_obj.items.all().delete()
        messages.success(request, f'Order {order.order_number} placed successfully!')
        return redirect('orders:order_detail', order_number=order.order_number)

    return render(request, 'orders/checkout.html', {
        'cart': cart_obj, 'items': items, 'initial': initial
    })


@login_required
def order_list(request):
    orders = Order.objects.filter(buyer=request.user).prefetch_related('items').order_by('-created_at')
    return render(request, 'orders/order_list.html', {'orders': orders})


@login_required
def order_detail(request, order_number):
    order = get_object_or_404(Order, order_number=order_number, buyer=request.user)
    items = order.items.select_related('product', 'seller', 'seller__seller_profile').all()

    if request.method == 'POST':
        if order.payment_status in ('submitted', 'paid'):
            messages.warning(request, 'Payment already submitted. Wait for the seller to confirm.')
            return redirect('orders:order_detail', order_number=order.order_number)

        ref = request.POST.get('payment_reference', '').strip()
        if not ref:
            messages.error(request, 'Transaction reference is required.')
            return render(request, 'orders/order_detail.html', {'order': order, 'items': items})

        if Order.objects.filter(payment_reference=ref).exclude(pk=order.pk).exists():
            messages.error(request, 'This transaction reference has already been used. Please check your reference number.')
            return render(request, 'orders/order_detail.html', {'order': order, 'items': items})

        order.payment_reference = ref
        order.payment_status = 'submitted'
        order.save(update_fields=['payment_reference', 'payment_status'])
        messages.success(request, 'Payment reference submitted! The seller will review and confirm shortly.')
        return redirect('orders:order_detail', order_number=order.order_number)

    return render(request, 'orders/order_detail.html', {'order': order, 'items': items})


@login_required
def seller_orders(request):
    if not request.user.is_seller():
        return redirect('home')
    order_items = OrderItem.objects.filter(
        seller=request.user
    ).select_related('order', 'order__buyer', 'product').order_by('-order__created_at')
    return render(request, 'orders/seller_orders.html', {'order_items': order_items})


@login_required
def update_order_status(request, order_number):
    if not request.user.is_seller():
        return redirect('home')
    order_item = get_object_or_404(
        OrderItem,
        order__order_number=order_number,
        seller=request.user
    )
    new_status = request.POST.get('status', '')
    if new_status in dict(Order.STATUS_CHOICES):
        order_item.order.status = new_status
        order_item.order.save(update_fields=['status'])
        messages.success(request, 'Order status updated.')
    return redirect('orders:seller_orders')
