# AkShop Online — Authentication & Authorization

## Overview

AkShop uses **JWT (JSON Web Tokens)** for stateless authentication, provided by `djangorestframework-simplejwt`. Tokens are stored in the browser's `localStorage` and attached to every API request automatically.

---

## Token Lifecycle

### Obtaining Tokens

Tokens are issued at two points:
1. **Registration** — `POST /api/auth/register/` returns `{ access, refresh }` immediately.
2. **Login** — `POST /api/auth/token/` returns `{ access, refresh }`.

### Token Types

| Token | Lifetime | Purpose |
|---|---|---|
| Access token | Short (minutes/hours) | Sent in every API request header |
| Refresh token | Long (days) | Used to silently get a new access token |

### Storage

Both tokens are stored in `localStorage`:
- `localStorage.access` — current access token
- `localStorage.refresh` — refresh token
- `localStorage.user` — serialized user object (cached for instant UI)

### Automatic Refresh (Axios Interceptor)

`frontend/src/api/axios.js` contains an Axios request/response interceptor:

1. Every outgoing request has `Authorization: Bearer <access>` injected.
2. If a response returns `401`, the interceptor:
   - Calls `POST /api/auth/token/refresh/` with the stored refresh token.
   - Replaces the stored access token with the new one.
   - Retries the original failed request.
   - If refresh also fails (token expired), the user is logged out automatically.

---

## Role System

Every `User` has a `role` field with one of three values:

| Role | Description |
|---|---|
| `buyer` | Can browse, cart, checkout, and review products |
| `seller` | Can list products, manage orders, subscribe to plans |
| `admin` | Full platform management access |

Role is set at registration and cannot be changed by the user afterward.

### Role Checks (Backend)

```python
user.is_seller()          # role == 'seller'
user.is_buyer()           # role == 'buyer'
user.is_platform_admin()  # role == 'admin'
```

Custom DRF permission class for admin-only endpoints:
```python
class IsPlatformAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
```

### Role Checks (Frontend)

From `AuthContext`:
```javascript
const { isAdmin, isSeller, isBuyer } = useAuth()
```

Protected routes in `App.jsx` use these to redirect unauthorized users.

---

## Email Verification

After registration, a verification email is sent automatically. The link contains a `uid` (base64-encoded user PK) and a `token` (Django's `PasswordResetTokenGenerator`).

- Sellers and buyers can use the platform without verifying email, but a **banner** appears in the UI until they do.
- Verification is one-time; once verified, `is_email_verified = True` permanently.
- The token expires after Django's default `PASSWORD_RESET_TIMEOUT` (3 days by default).

**Resend verification:** `POST /api/auth/resend-verification/` (authenticated, requires the user to not already be verified)

---

## Password Reset

The reset flow is two-step:

1. **Request** — `POST /api/auth/forgot-password/` with `{ email }`. Always returns 200 to prevent user enumeration. If the email exists, a link is emailed.

2. **Reset** — `POST /api/auth/reset-password/` with `{ uid, token, new_password, confirm_password }`. The link from the email provides `uid` and `token`. Passwords must match and be at least 8 characters.

Token validation uses Django's `PasswordResetTokenGenerator` which invalidates the token once the password is changed.

---

## Subscription Authorization (Seller-specific)

Before a seller can create products, the backend checks:

```python
user.has_active_subscription()
# → self.subscriptions.filter(is_active=True, end_date__gte=timezone.now()).exists()
```

If this returns `False`, product creation returns `403`.

Additionally, the product count against the plan limit is checked:
```python
count = Product.objects.filter(seller=request.user, is_active=True).count()
if count >= active_sub.plan.max_products:
    return 403
```

---

## Ownership Authorization

Endpoint-level ownership is enforced with `get_object_or_404` filters:

```python
# Seller can only edit their own products
product = get_object_or_404(Product, slug=slug, seller=request.user)

# Buyer can only see their own orders
order = get_object_or_404(Order, order_number=order_number, buyer=request.user)

# Seller can only update orders containing their items
if not order.items.filter(seller=request.user).exists():
    return Response({'detail': 'Not authorized.'}, status=403)
```

---

## Dark Mode & Session

Dark mode is tied to the authenticated session:

- On **login**: the previously saved theme (`localStorage.akshop_theme`) is restored.
- On **logout**: theme is reset to `light` and forced on the `<html>` element.
- On **page load**: theme is only applied if there is a valid access token; unauthenticated visits always load in light mode.

---

## Security Considerations

| Topic | Implementation |
|---|---|
| Password storage | Django `AbstractUser` — bcrypt by default |
| Token secrets | `SECRET_KEY` in `settings.py` (loaded from `.env`) |
| Email enumeration | `forgot-password` always returns 200 |
| Token uniqueness | `transaction_id` on subscriptions and `payment_reference` on orders are enforced unique at DB and API level |
| CORS | Configured in `settings.py` via `django-cors-headers` |
| SQL injection | Django ORM — parameterized queries by default |
| XSS | React escapes all output; no `dangerouslySetInnerHTML` used |
| File uploads | Limited to images via `accept="image/*"` and Django `ImageField` (requires Pillow) |
| Admin access | Separate `IsPlatformAdmin` permission class on every admin view — not reliant on Django's built-in `is_staff` |
