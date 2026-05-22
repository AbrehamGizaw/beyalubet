from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    path('cart/', views.cart, name='cart'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/update/<int:item_id>/', views.update_cart, name='update_cart'),
    path('checkout/', views.checkout, name='checkout'),
    path('my-orders/', views.order_list, name='order_list'),
    path('my-orders/<str:order_number>/', views.order_detail, name='order_detail'),
    path('seller/orders/', views.seller_orders, name='seller_orders'),
    path('seller/orders/<str:order_number>/status/', views.update_order_status, name='update_order_status'),
]
