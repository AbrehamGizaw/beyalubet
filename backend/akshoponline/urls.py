from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.api_views import (
    RegisterAPIView, MeAPIView,
    ForgotPasswordAPIView, ResetPasswordAPIView,
    VerifyEmailAPIView, ResendVerificationAPIView,
)
from accounts.admin_api_views import (
    AdminDashboardAPIView, AdminUsersAPIView,
    AdminSubscriptionsAPIView, AdminSubscriptionActionAPIView,
    AdminSubscriptionPlanAPIView,
    AdminReportsAPIView, AdminReviewsAPIView,
    AdminPlatformSettingsAPIView,
)
from accounts.report_api_views import SellerReportAPIView, BuyerReportAPIView
from products.api_views import (
    CategoryListAPIView, ProductListAPIView,
    ProductDetailAPIView, MyProductsAPIView,
    MyProductDetailAPIView, ProductImageDeleteAPIView,
    ProductReviewsAPIView, ReviewDetailAPIView,
)
from orders.api_views import (
    CartAPIView, AddToCartAPIView, CartItemAPIView,
    CheckoutAPIView, OrderListAPIView, OrderDetailAPIView,
    SellerOrdersAPIView, UpdateOrderStatusAPIView,
    SellerPaymentApprovalAPIView,
)
from subscriptions.api_views import PlansAPIView, PlanDetailAPIView, SubscribeAPIView, MySubscriptionAPIView, UpdateMyTransactionAPIView
from . import views

urlpatterns = [
    # ── Admin ──────────────────────────────────────────────────────────────────
    path('admin/', admin.site.urls),

    # ── Legacy Django template views (kept for admin usability) ────────────────
    path('', views.home, name='home'),
    path('accounts/', include('accounts.urls', namespace='accounts')),
    path('products/', include('products.urls', namespace='products')),
    path('orders/', include('orders.urls', namespace='orders')),
    path('subscriptions/', include('subscriptions.urls', namespace='subscriptions')),

    # ── REST API ───────────────────────────────────────────────────────────────
    # Auth
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterAPIView.as_view(), name='api_register'),
    path('api/auth/me/', MeAPIView.as_view(), name='api_me'),
    path('api/auth/forgot-password/', ForgotPasswordAPIView.as_view(), name='api_forgot_password'),
    path('api/auth/reset-password/', ResetPasswordAPIView.as_view(), name='api_reset_password'),
    path('api/auth/verify-email/', VerifyEmailAPIView.as_view(), name='api_verify_email'),
    path('api/auth/resend-verification/', ResendVerificationAPIView.as_view(), name='api_resend_verification'),

    # Products
    path('api/products/categories/', CategoryListAPIView.as_view(), name='api_categories'),
    path('api/products/my-products/', MyProductsAPIView.as_view(), name='api_my_products'),
    path('api/products/my-products/<slug:slug>/', MyProductDetailAPIView.as_view(), name='api_my_product_detail'),
    path('api/products/my-products/<slug:slug>/images/<int:img_id>/', ProductImageDeleteAPIView.as_view(), name='api_product_image_delete'),
    path('api/products/', ProductListAPIView.as_view(), name='api_products'),
    path('api/products/<slug:slug>/', ProductDetailAPIView.as_view(), name='api_product_detail'),
    path('api/products/<slug:slug>/reviews/', ProductReviewsAPIView.as_view(), name='api_product_reviews'),
    path('api/products/<slug:slug>/reviews/<int:review_id>/', ReviewDetailAPIView.as_view(), name='api_review_detail'),

    # Orders / Cart
    path('api/orders/cart/', CartAPIView.as_view(), name='api_cart'),
    path('api/orders/cart/add/', AddToCartAPIView.as_view(), name='api_cart_add'),
    path('api/orders/cart/<int:pk>/', CartItemAPIView.as_view(), name='api_cart_item'),
    path('api/orders/checkout/', CheckoutAPIView.as_view(), name='api_checkout'),
    path('api/orders/my-orders/', OrderListAPIView.as_view(), name='api_orders'),
    path('api/orders/my-orders/<str:order_number>/', OrderDetailAPIView.as_view(), name='api_order_detail'),
    path('api/orders/seller-orders/', SellerOrdersAPIView.as_view(), name='api_seller_orders'),
    path('api/orders/seller-orders/<int:pk>/', UpdateOrderStatusAPIView.as_view(), name='api_order_status'),
    path('api/orders/seller-orders/<int:pk>/payment/', SellerPaymentApprovalAPIView.as_view(), name='api_approve_payment'),

    # Subscriptions
    path('api/subscriptions/plans/', PlansAPIView.as_view(), name='api_plans'),
    path('api/subscriptions/plans/<int:pk>/', PlanDetailAPIView.as_view(), name='api_plan_detail'),
    path('api/subscriptions/subscribe/', SubscribeAPIView.as_view(), name='api_subscribe'),
    path('api/subscriptions/my/', MySubscriptionAPIView.as_view(), name='api_my_sub'),
    path('api/subscriptions/<int:pk>/transaction/', UpdateMyTransactionAPIView.as_view(), name='api_update_transaction'),

    # Reports (seller/buyer)
    path('api/reports/seller/', SellerReportAPIView.as_view(), name='api_seller_report'),
    path('api/reports/buyer/', BuyerReportAPIView.as_view(), name='api_buyer_report'),

    # Platform Admin
    path('api/admin/dashboard/', AdminDashboardAPIView.as_view(), name='api_admin_dashboard'),
    path('api/admin/users/', AdminUsersAPIView.as_view(), name='api_admin_users'),
    path('api/admin/users/<int:pk>/', AdminUsersAPIView.as_view(), name='api_admin_user_detail'),
    path('api/admin/subscriptions/', AdminSubscriptionsAPIView.as_view(), name='api_admin_subscriptions'),
    path('api/admin/subscriptions/<int:pk>/', AdminSubscriptionActionAPIView.as_view(), name='api_admin_sub_action'),
    path('api/admin/plans/', AdminSubscriptionPlanAPIView.as_view(), name='api_admin_plans'),
    path('api/admin/plans/<int:pk>/', AdminSubscriptionPlanAPIView.as_view(), name='api_admin_plan_detail'),
    path('api/admin/reports/', AdminReportsAPIView.as_view(), name='api_admin_reports'),
    path('api/admin/reviews/', AdminReviewsAPIView.as_view(), name='api_admin_reviews'),
    path('api/admin/reviews/<int:review_id>/', AdminReviewsAPIView.as_view(), name='api_admin_review_detail'),
    path('api/admin/settings/', AdminPlatformSettingsAPIView.as_view(), name='api_admin_settings'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
