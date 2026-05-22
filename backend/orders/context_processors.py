from .models import Cart


def cart_context(request):
    cart_count = 0
    if request.user.is_authenticated and request.user.is_buyer():
        try:
            cart = request.user.cart
            cart_count = cart.item_count
        except Cart.DoesNotExist:
            pass

    from products.models import Category
    nav_categories = Category.objects.all()

    return {'cart_count': cart_count, 'nav_categories': nav_categories}
