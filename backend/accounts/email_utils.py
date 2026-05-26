"""
Beyalubet email notification utilities.
All outgoing emails go through here so templates/wording are centralized.
"""
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core import signing


# ── Token generators ──────────────────────────────────────────────────────────

class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return str(user.pk) + str(timestamp) + str(user.is_email_verified)


password_reset_generator = PasswordResetTokenGenerator()
email_verification_generator = EmailVerificationTokenGenerator()


def _make_uid(user):
    return urlsafe_base64_encode(force_bytes(user.pk))


def _frontend(path):
    return f"{settings.FRONTEND_URL.rstrip('/')}{path}"


def _unsubscribe_url(user):
    token = signing.dumps({'uid': user.pk}, salt='email-unsub')
    return _frontend(f"/unsubscribe/{token}")


# ── HTML wrapper ──────────────────────────────────────────────────────────────

def _html(title, body_html, user=None):
    unsub_html = ''
    if user:
        unsub_url = _unsubscribe_url(user)
        unsub_html = (
            f'<br><a href="{unsub_url}" style="color:#bbb;font-size:11px;">'
            f'Unsubscribe from email notifications</a>'
        )
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#d43200,#c87c00,#5baa00,#2d6600);
                     padding:28px 32px;text-align:center;">
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:.5px;">
              🛒 Beyalubet
            </span>
            <div style="color:rgba(255,255,255,.75);font-size:12px;margin-top:4px;">
              Ethiopia's Marketplace
            </div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">{title}</h2>
            {body_html}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f0f0f0;
                     color:#999;font-size:12px;text-align:center;">
            &copy; {__import__('datetime').date.today().year} Beyalubet &mdash; Ethiopia's Marketplace<br>
            This is an automated message, please do not reply.{unsub_html}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _btn(url, label):
    return (f'<p style="text-align:center;margin:24px 0;">'
            f'<a href="{url}" style="background:#5baa00;color:#fff;text-decoration:none;'
            f'padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">'
            f'{label}</a></p>')


def _p(text):
    return f'<p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">{text}</p>'


def _send(to_email, subject, html, text_fallback, user=None, essential=False):
    if not to_email:
        return
    # Respect opt-out for non-essential emails
    if user and not essential and not getattr(user, 'email_notifications', True):
        return
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_fallback,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(html, 'text/html')
        if user:
            unsub_url = _unsubscribe_url(user)
            msg.extra_headers['List-Unsubscribe'] = f'<{unsub_url}>'
            msg.extra_headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
        msg.send(fail_silently=True)
    except Exception:
        pass


# ── 1. Welcome + email verification ──────────────────────────────────────────

def send_welcome_and_verification(user):
    uid = _make_uid(user)
    token = email_verification_generator.make_token(user)
    verify_url = _frontend(f"/auth/verify-email/{uid}/{token}")
    name = user.get_full_name() or user.username

    html = _html(
        "Welcome to Beyalubet!",
        _p(f"Hi <strong>{name}</strong>, welcome aboard! 🎉") +
        _p("You're now part of Ethiopia's growing marketplace. Please verify your email address to unlock all features.") +
        _btn(verify_url, "Verify Email Address") +
        _p("If you didn't create this account, you can safely ignore this email."),
        user=user,
    )
    _send(
        user.email,
        "Welcome to Beyalubet — Please verify your email",
        html,
        f"Welcome to Beyalubet, {name}!\n\nVerify your email: {verify_url}",
        user=user,
        essential=True,
    )


def send_verification_email(user):
    uid = _make_uid(user)
    token = email_verification_generator.make_token(user)
    verify_url = _frontend(f"/auth/verify-email/{uid}/{token}")

    html = _html(
        "Verify your email address",
        _p("Click the button below to verify your email address for your Beyalubet account.") +
        _btn(verify_url, "Verify Email Address") +
        _p("This link expires in 24 hours. If you didn't request this, you can ignore this email."),
        user=user,
    )
    _send(
        user.email,
        "Beyalubet — Verify your email address",
        html,
        f"Verify your Beyalubet email: {verify_url}",
        user=user,
        essential=True,
    )


# ── 2. Password reset ─────────────────────────────────────────────────────────

def send_password_reset_email(user):
    uid = _make_uid(user)
    token = password_reset_generator.make_token(user)
    reset_url = _frontend(f"/auth/reset-password/{uid}/{token}")
    name = user.get_full_name() or user.username

    html = _html(
        "Reset your password",
        _p(f"Hi <strong>{name}</strong>,") +
        _p("We received a request to reset your Beyalubet password. Click below to choose a new one.") +
        _btn(reset_url, "Reset Password") +
        _p("This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email."),
        user=user,
    )
    _send(
        user.email,
        "Beyalubet — Reset your password",
        html,
        f"Reset your password: {reset_url}",
        user=user,
        essential=True,
    )


# ── 3. Order notifications ────────────────────────────────────────────────────

def send_order_placed_buyer(order):
    name = order.buyer.get_full_name() or order.buyer.username
    items_html = "".join(
        f'<tr><td style="padding:6px 0;color:#444;font-size:14px;">{i.product_title}</td>'
        f'<td style="padding:6px 0;color:#444;font-size:14px;text-align:right;">'
        f'ETB {i.unit_price} × {i.quantity}</td></tr>'
        for i in order.items.all()
    )
    order_url = _frontend(f"/orders/{order.order_number}")

    html = _html(
        f"Order #{order.order_number} placed!",
        _p(f"Hi <strong>{name}</strong>, your order has been placed successfully.") +
        f'<table width="100%" style="border-collapse:collapse;margin:12px 0;">'
        f'<tr><th style="text-align:left;padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;">Item</th>'
        f'<th style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;">Price</th></tr>'
        f'{items_html}'
        f'<tr><td style="padding:8px 0;font-weight:700;">Total</td>'
        f'<td style="padding:8px 0;font-weight:700;text-align:right;">ETB {order.total_amount}</td></tr>'
        f'</table>' +
        _p("Please pay the seller directly using their payment details on the order page.") +
        _btn(order_url, "View Order"),
        user=order.buyer,
    )
    _send(
        order.buyer.email,
        f"Beyalubet — Order #{order.order_number} placed",
        html,
        f"Your order #{order.order_number} has been placed. Total: ETB {order.total_amount}. View: {order_url}",
        user=order.buyer,
    )


def send_new_order_seller(order, seller):
    seller_items = order.items.filter(seller=seller)
    items_text = ", ".join(f"{i.product_title} x{i.quantity}" for i in seller_items)
    buyer_name = order.buyer.get_full_name() or order.buyer.username
    orders_url = _frontend("/seller/orders")

    items_html = "".join(
        f'<tr><td style="padding:6px 0;color:#444;font-size:14px;">{i.product_title}</td>'
        f'<td style="padding:6px 0;color:#444;font-size:14px;text-align:right;">× {i.quantity}</td></tr>'
        for i in seller_items
    )

    html = _html(
        "You have a new order!",
        _p(f"<strong>{buyer_name}</strong> placed an order for:") +
        f'<table width="100%" style="border-collapse:collapse;margin:12px 0;">{items_html}</table>' +
        _p(f"Shipping to: {order.shipping_city}, {order.shipping_country}") +
        _p("Review and confirm the order in your dashboard.") +
        _btn(orders_url, "View Orders"),
        user=seller,
    )
    _send(
        seller.email,
        f"Beyalubet — New order from {buyer_name}",
        html,
        f"New order from {buyer_name}: {items_text}. View: {orders_url}",
        user=seller,
    )


def send_payment_submitted_seller(order):
    sellers = set(item.seller for item in order.items.select_related('seller').all())
    buyer_name = order.buyer.get_full_name() or order.buyer.username
    orders_url = _frontend("/seller/orders")

    for seller in sellers:
        html = _html(
            "Payment submitted — action required",
            _p(f"<strong>{buyer_name}</strong> has submitted payment for order "
               f"<strong>#{order.order_number}</strong>.") +
            _p(f"Reference: <strong>{order.payment_reference}</strong>") +
            _p("Please verify the payment in your bank/mobile money app, then approve or reject it in your dashboard.") +
            _btn(orders_url, "Review Payment"),
            user=seller,
        )
        _send(
            seller.email,
            f"Beyalubet — Payment submitted for order #{order.order_number}",
            html,
            f"Payment submitted for order #{order.order_number}. Ref: {order.payment_reference}. Review: {orders_url}",
            user=seller,
        )


def send_payment_result_buyer(order, approved):
    name = order.buyer.get_full_name() or order.buyer.username
    order_url = _frontend(f"/orders/{order.order_number}")

    if approved:
        html = _html(
            "Payment confirmed ✅",
            _p(f"Hi <strong>{name}</strong>,") +
            _p(f"Your payment for order <strong>#{order.order_number}</strong> has been confirmed by the seller.") +
            _p("Your order is now being processed.") +
            _btn(order_url, "View Order"),
            user=order.buyer,
        )
        _send(
            order.buyer.email,
            f"Beyalubet — Payment confirmed for order #{order.order_number}",
            html,
            f"Payment confirmed for order #{order.order_number}. View: {order_url}",
            user=order.buyer,
        )
    else:
        html = _html(
            "Payment not verified",
            _p(f"Hi <strong>{name}</strong>,") +
            _p(f"The seller could not verify your payment for order <strong>#{order.order_number}</strong>.") +
            _p("Please check your transaction reference and resubmit, or contact the seller.") +
            _btn(order_url, "Resubmit Payment"),
            user=order.buyer,
        )
        _send(
            order.buyer.email,
            f"Beyalubet — Payment not verified for order #{order.order_number}",
            html,
            f"Payment not verified for order #{order.order_number}. Resubmit: {order_url}",
            user=order.buyer,
        )


def send_order_status_update_buyer(order):
    name = order.buyer.get_full_name() or order.buyer.username
    order_url = _frontend(f"/orders/{order.order_number}")
    status_display = order.get_status_display()

    html = _html(
        f"Order status updated: {status_display}",
        _p(f"Hi <strong>{name}</strong>,") +
        _p(f"Your order <strong>#{order.order_number}</strong> status has been updated to "
           f"<strong>{status_display}</strong>.") +
        _btn(order_url, "View Order"),
        user=order.buyer,
    )
    _send(
        order.buyer.email,
        f"Beyalubet — Order #{order.order_number} is now {status_display}",
        html,
        f"Order #{order.order_number} is now {status_display}. View: {order_url}",
        user=order.buyer,
    )


# ── 4. Subscription notifications ────────────────────────────────────────────

def send_subscription_submitted(subscription):
    seller = subscription.seller
    name = seller.get_full_name() or seller.username
    sub_url = _frontend("/subscriptions/my")

    html = _html(
        "Subscription request received",
        _p(f"Hi <strong>{name}</strong>,") +
        _p(f"We've received your subscription request for the "
           f"<strong>{subscription.plan.name}</strong> plan (ETB {subscription.amount_paid}).") +
        _p(f"Transaction ID: <strong>{subscription.transaction_id}</strong>") +
        _p("Our team will review and activate your subscription shortly. You'll receive a confirmation email once approved.") +
        _btn(sub_url, "View Subscription"),
        user=seller,
    )
    _send(
        seller.email,
        "Beyalubet — Subscription request received",
        html,
        f"Subscription request received for {subscription.plan.name}. Ref: {subscription.transaction_id}",
        user=seller,
    )

    # Notify all admins (essential — admins must act on this)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for admin in User.objects.filter(role='admin', email__isnull=False).exclude(email=''):
        admin_html = _html(
            "New subscription request",
            _p(f"<strong>{name}</strong> ({seller.email}) has submitted a subscription request.") +
            _p(f"Plan: <strong>{subscription.plan.name}</strong> — ETB {subscription.amount_paid}") +
            _p(f"Transaction ID: <strong>{subscription.transaction_id}</strong>") +
            _btn(_frontend("/admin/subscriptions"), "Review in Admin Panel"),
            user=admin,
        )
        _send(
            admin.email,
            f"Beyalubet — New subscription from {name}",
            admin_html,
            f"New subscription from {name}. Plan: {subscription.plan.name}. Ref: {subscription.transaction_id}",
            user=admin,
            essential=True,
        )


def send_subscription_result(subscription, approved):
    seller = subscription.seller
    name = seller.get_full_name() or seller.username
    sub_url = _frontend("/subscriptions/my")

    if approved:
        html = _html(
            "Subscription activated! 🎉",
            _p(f"Hi <strong>{name}</strong>,") +
            _p(f"Great news! Your <strong>{subscription.plan.name}</strong> subscription has been "
               f"approved and activated.") +
            _p(f"Your subscription is valid until <strong>{subscription.end_date.strftime('%B %d, %Y') if subscription.end_date else 'N/A'}</strong>.") +
            _p("You can now list your products on Beyalubet.") +
            _btn(_frontend("/seller/products/create"), "Start Listing Products"),
            user=seller,
        )
        _send(
            seller.email,
            "Beyalubet — Your subscription is now active!",
            html,
            f"Your {subscription.plan.name} subscription has been approved. Start listing: {_frontend('/seller/products/create')}",
            user=seller,
        )
    else:
        html = _html(
            "Subscription request not approved",
            _p(f"Hi <strong>{name}</strong>,") +
            _p(f"Unfortunately, your subscription request for the "
               f"<strong>{subscription.plan.name}</strong> plan could not be approved.") +
            _p("This may be because the payment reference could not be verified. "
               "Please try subscribing again with a valid payment reference, or contact support.") +
            _btn(sub_url, "Try Again"),
            user=seller,
        )
        _send(
            seller.email,
            "Beyalubet — Subscription request not approved",
            html,
            f"Your {subscription.plan.name} subscription was not approved. Try again: {sub_url}",
            user=seller,
        )
