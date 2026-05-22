from django.urls import path
from . import views

app_name = 'subscriptions'

urlpatterns = [
    path('', views.plans, name='plans'),
    path('subscribe/<int:plan_id>/', views.subscribe, name='subscribe'),
    path('my-subscription/', views.my_subscription, name='my_subscription'),
]
