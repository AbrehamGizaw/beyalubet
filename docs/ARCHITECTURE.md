# AkShop Online — System Architecture

## Overview

AkShop (Beyalubet) is a multi-vendor e-commerce marketplace targeting the Ethiopian market. Sellers list products, buyers purchase them, and the platform charges sellers a subscription fee for listing privileges. All payments (subscriptions and orders) are made via manual bank transfer or Telebirr and confirmed by an admin or seller.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend framework | Django 4.2 + Django REST Framework |
| Authentication | SimpleJWT (access + refresh tokens) |
| Database | PostgreSQL |
| File storage | Django local media (`MEDIA_ROOT`) |
| Frontend framework | React 18 + Vite |
| Routing | React Router v6 |
| UI components | Bootstrap 5 (dark mode via `data-bs-theme`) |
| HTTP client | Axios (with JWT interceptor) |
| Email | Django SMTP (`fail_silently=True`) |
| Server (production) | Gunicorn (TCP :8000) + Nginx reverse proxy |
| Process manager | systemd |
| Hosting | Contabo VPS (Ubuntu) |

---

## Project Layout

```
akshoponline/
├── backend/
│   ├── akshoponline/          # Project settings and root URL config
│   │   ├── settings.py
│   │   └── urls.py            # Single file wires all API routes
│   ├── accounts/              # Users, auth, admin API views, email utils
│   │   ├── models.py          # User, SellerProfile, BuyerProfile
│   │   ├── api_views.py       # Register, Me, Password reset, Email verify
│   │   ├── admin_api_views.py # All /api/admin/* endpoints
│   │   ├── serializers.py
│   │   └── email_utils.py     # All transactional email helpers
│   ├── products/              # Product catalogue
│   │   ├── models.py          # Product, Category, ProductImage, Review
│   │   ├── api_views.py       # Public list, seller CRUD, reviews
│   │   └── serializers.py
│   ├── orders/                # Cart, checkout, orders
│   │   ├── models.py          # Cart, CartItem, Order, OrderItem
│   │   └── api_views.py
│   └── subscriptions/         # Seller subscription system
│       ├── models.py          # SubscriptionPlan, SellerSubscription, PlatformSettings
│       ├── api_views.py
│       └── serializers.py
└── frontend/
    └── src/
        ├── api/axios.js        # Axios instance + JWT interceptor
        ├── context/
        │   ├── AuthContext.jsx # Global auth state
        │   └── LanguageContext.jsx
        ├── components/         # Navbar, Footer, Spinner, etc.
        └── pages/              # One file per route/page
```

---

## Data Model

### Users & Profiles

```
User (AbstractUser)
  ├── role: buyer | seller | admin
  ├── email (unique)
  ├── phone (unique, nullable)
  ├── is_email_verified
  ├── SellerProfile (1:1)  ← created on seller registration
  └── BuyerProfile (1:1)   ← created on buyer registration
```

### Products

```
Category
  └── Product (many per category)
        ├── seller (FK → User)
        ├── price / original_price  (original > price to show discount)
        ├── is_active  (seller can hide/show)
        └── ProductImage (many per product, one is_main)

Review
  ├── product (FK → Product)
  └── buyer (FK → User)
```

### Orders

```
Order
  ├── buyer (FK → User)
  ├── status: pending → confirmed → processing → shipped → delivered
  ├── payment_status: pending → submitted → paid
  └── OrderItem (many)
        ├── product (FK → Product, SET_NULL on delete)
        └── seller (FK → User)

Cart (1:1 per buyer)
  └── CartItem (many)
```

### Subscriptions

```
SubscriptionPlan
  ├── duration: monthly | quarterly | biannual | yearly
  ├── price, max_products
  ├── is_free   ← auto-activates, one-time per seller
  ├── is_active ← admin can hide
  └── is_popular

SellerSubscription
  ├── seller (FK → User)
  ├── plan (FK → SubscriptionPlan, PROTECT)
  ├── status: pending → active → expired | cancelled
  ├── transaction_id (unique, nullable)
  ├── sender_name, payment_screenshot
  └── amount_paid

PlatformSettings (singleton pk=1)
  └── bank_name, account_number, account_holder, telebirr, mobile_money
```

---

## Request Flow

### Authentication Flow

```
Client → POST /api/auth/token/  → { access, refresh }
         access token added to Authorization: Bearer <token>
         Axios interceptor attaches token to every request
         On 401 → interceptor uses refresh token to get new access token
```

### Product Purchase Flow

```
Buyer adds to cart  → POST /api/orders/cart/add/
Buyer checkouts     → POST /api/orders/checkout/      → Order created (payment_status=pending)
Buyer pays offline  → POST /api/orders/my-orders/{n}/ → payment_status=submitted
Seller approves     → PATCH /api/orders/seller-orders/{id}/payment/ action=approve
                    → payment_status=paid, status=confirmed
```

### Subscription Flow

```
Seller views plans  → GET /api/subscriptions/plans/
Free plan selected  → POST /api/subscriptions/subscribe/ → auto-activated instantly
Paid plan selected  → POST /api/subscriptions/subscribe/ → status=pending
Admin reviews       → PATCH /api/admin/subscriptions/{id}/ action=approve
                    → sub.activate() called → status=active, start/end dates set
                    → other active subs for this seller cancelled
```

---

## Role Permissions Matrix

| Action | Buyer | Seller | Admin |
|---|---|---|---|
| Browse products | Yes | Yes | Yes |
| Add to cart / checkout | Yes | No | No |
| List products | No | Yes (subscription req.) | No |
| Hide/show own product | No | Yes | No |
| View own orders | Yes | No | No |
| View orders containing their items | No | Yes | No |
| Approve order payment | No | Yes | No |
| Subscribe to a plan | No | Yes | No |
| Approve/reject subscription | No | No | Yes |
| Manage plans (add/edit/delete/hide) | No | No | Yes |
| Manage platform settings | No | No | Yes |
| Delete any review | No | No | Yes |
| Activate/deactivate any user | No | No | Yes |

---

## Product Listing Rules

- A seller must have an **active, non-expired subscription** to create products.
- Active product count must not exceed `plan.max_products`.
- Hidden products (`is_active=False`) do not count toward the limit.
- `original_price`, if set, must be **greater than** `price` to display a discount badge.

---

## Email Notifications

All emails are sent via `accounts/email_utils.py` with `fail_silently=True`.

| Trigger | Recipient |
|---|---|
| Registration | Buyer/Seller (welcome + verification link) |
| Email verification resend | The requesting user |
| Password reset request | The requesting user |
| Subscription submitted | Admin (notification) |
| Subscription approved/rejected | Seller |
| Order placed | Buyer |
| New order received | Each seller in the order |
| Payment submitted by buyer | Seller |
| Payment approved/rejected | Buyer |
| Order status updated | Buyer |

---

## Production Deployment

```
Nginx (port 80/443)
  └── proxy_pass → Gunicorn (127.0.0.1:8000)
        └── Django WSGI app

Static files:  /var/www/beyalubet/frontend/dist/  → served by Nginx
Media files:   /var/www/beyalubet/backend/media/  → served by Nginx
Gunicorn:      managed by systemd (beyalubet.service)
```

Environment variables are loaded from `backend/.env` via python-dotenv.
