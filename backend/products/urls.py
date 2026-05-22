from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    path('', views.product_list, name='list'),
    path('create/', views.create_product, name='create'),
    path('my-products/', views.my_products, name='my_products'),
    path('<slug:slug>/', views.product_detail, name='detail'),
    path('<slug:slug>/edit/', views.edit_product, name='edit'),
    path('<slug:slug>/delete/', views.delete_product, name='delete'),
]
