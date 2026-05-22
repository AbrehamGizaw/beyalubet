# Beyalubet — Project Architecture

## Overview

**Beyalubet** (AkShop Online) is a bilingual (English / Amharic) multi-role e-commerce platform built for the Ethiopian market. It supports three user roles — **Buyer**, **Seller**, and **Admin** — with a Django REST API backend and a React SPA frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Django 4.2 + Django REST Framework |
| Auth | SimpleJWT (Bearer tokens, 2 h access / 7 d refresh) |
| Database | SQLite (development) |
| Email | Gmail SMTP via App Password (`beyalubet@gmail.com`) |
| Frontend | React 18 + Vite + React Router v6 |
| UI | Bootstrap 5.3 + Bootstrap Icons |
| State | React Context (Auth, Cart, Language) |
| Language | English / Amharic toggle (custom `LanguageContext`) |

---

## Directory Structure

```
akshoponline/
├── backend/
│   ├── akshoponline/          # Django project config
│   │   ├── settings.py
│   │   └── urls.py            # Root URL router
│   ├── accounts/              # Users, auth, email utils
│   ├── products/              # Products, categories, reviews
│   ├── orders/                # Cart, checkout, orders
│   ├── subscriptions/         # Seller subscription plans
│   ├── .env                   # Gmail credentials (not committed)
│   └── manage.py
└── frontend/
    ├── public/
    │   └── logo.png           # Beyalubet11.png brand logo
    └── src/
        ├── api/
        │   └── axios.js       # Axios instance (base URL, JWT interceptor)
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── CartContext.jsx
        │   └── LanguageContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── Footer.jsx
        │   ├── DashboardLayout.jsx
        │   ├── BuyerTopBar.jsx
        │   ├── ProductCard.jsx
        │   ├── ProtectedRoute.jsx
        │   └── Spinner.jsx
        ├── i18n/
        │   └── translations.js  # All EN + AM string keys
        ├── pages/               # See Pages section below
        └── App.jsx              # Route definitions
```

---

## Backend — Django Apps

### `accounts` — Users & Auth

**Models**
- `User` — extends `AbstractUser`; fields: `role` (buyer/seller/admin), `phone`, `address`, `is_email_verified`
- `SellerProfile` — one-to-one with User (seller only); fields: `shop_name`, `bio`, `bank_name`, `account_number`, `telebirr_number`

**API Views** (`api_views.py`, `admin_api_views.py`, `report_api_views.py`)
- `RegisterAPIView` — creates user, sends welcome + verification email
- `LoginAPIView` — returns JWT access + refresh tokens
- `ProfileAPIView` — GET/PATCH current user profile
- `ForgotPasswordAPIView` — sends reset link (always 200, no enumeration)
- `ResetPasswordAPIView` — validates uid+token, sets new password
- `VerifyEmailAPIView` — validates uid+token, sets `is_email_verified=True`
- `ResendVerificationAPIView` — resends verification email (auth required)
- `UserListAPIView` (admin) — list/search all users, toggle active, change role
- `SellerReportAPIView` / `BuyerReportAPIView` — sales and purchase analytics

**Email Utilities** (`email_utils.py`)
All emails use Gmail SMTP with `fail_silently=True`.

| Function | Trigger | Recipients |
|---|---|---|
| `send_welcome_and_verification` | Register | Buyer / Seller |
| `send_verification_email` | Resend request | User |
| `send_password_reset_email` | Forgot password | User |
| `send_order_placed_buyer` | Checkout | Buyer |
| `send_new_order_seller` | Checkout | Seller(s) |
| `send_payment_submitted_seller` | Buyer submits proof | Seller |
| `send_payment_result_buyer` | Seller approves/rejects | Buyer |
| `send_order_status_update_buyer` | Status change | Buyer |
| `send_subscription_submitted` | Seller subscribes | Seller + all Admins |
| `send_subscription_result` | Admin approves/rejects | Seller |

---

### `products` — Catalogue

**Models**
- `Category` — `name`, `name_am` (Amharic), `icon`, `slug`
- `Product` — linked to seller User; fields: `name`, `slug`, `price`, `category`, `condition`, `stock`, `images` (JSON), `is_active`
- `Review` — linked to Product + buyer User; fields: `rating`, `comment`

**API Views** (`api_views.py`)
- `CategoryListAPIView` — public list
- `ProductListAPIView` — public, filterable by category/condition/price/search; paginated (12/page)
- `ProductDetailAPIView` — public, by slug
- `MyProductsAPIView` — seller's own products (auth required)
- `CreateProductAPIView` — seller creates product
- `UpdateDeleteProductAPIView` — seller edits/deletes own product
- `ReviewListCreateAPIView` — list reviews; buyers can post once per product

**Serializers**
- `CategorySerializer` — includes `name_am`
- `ProductListSerializer` — includes `category_name`, `category_name_am`, `seller_name`, `average_rating`
- `ProductDetailSerializer` — includes full review list

---

### `orders` — Cart & Checkout

**Models**
- `CartItem` — links buyer User + Product; field: `quantity`
- `Order` — fields: `order_number`, `buyer`, `status`, `payment_method`, `payment_status`, `total_amount`, `shipping_address`
- `OrderItem` — links Order + Product; fields: `quantity`, `unit_price`, `seller`

**API Views** (`api_views.py`)
- `CartAPIView` — GET/POST/PATCH/DELETE cart items
- `CheckoutAPIView` — creates Order from cart, fires buyer + seller emails
- `MyOrdersAPIView` — buyer's order history
- `OrderDetailAPIView` — buyer views order; POST submits payment proof
- `SellerOrdersAPIView` — seller sees orders containing their products
- `UpdateOrderStatusAPIView` — seller updates status (pending→processing→shipped→delivered)
- `SellerPaymentApprovalAPIView` — seller approves/rejects payment; fires email to buyer

---

### `subscriptions` — Seller Plans

**Models**
- `SubscriptionPlan` — `name`, `price`, `duration_days`, `max_products`, `features` (JSON)
- `SellerSubscription` — links Seller + Plan; fields: `status` (pending/active/rejected/expired), `start_date`, `end_date`, `payment_proof`
- `PlatformSettings` — singleton (pk=1); stores bank details, mobile money numbers shown to sellers

**API Views** (`api_views.py`, `admin_api_views.py`)
- `SubscriptionPlanListAPIView` — public plan list
- `SubscribeAPIView` — seller creates subscription, uploads payment proof, fires email to seller + admins
- `MySubscriptionAPIView` — seller's current subscription status
- `AdminSubscriptionListAPIView` — admin lists all pending/active subscriptions
- `AdminSubscriptionActionAPIView` — admin approves/rejects; fires email to seller
- `PlatformSettingsAPIView` — admin GET/PATCH platform bank details

---

## API Endpoint Map

```
/api/auth/
  register/                 POST   Create account
  login/                    POST   JWT token pair
  token/refresh/            POST   Refresh access token
  profile/                  GET PATCH  Current user
  forgot-password/          POST   Send reset email
  reset-password/           POST   Set new password
  verify-email/             POST   Confirm email address
  resend-verification/      POST   Resend verification link
  users/                    GET    Admin: list all users
  users/<id>/               PATCH  Admin: edit role/status

/api/products/
  categories/               GET    All categories
  products/                 GET    Public product list
  products/<slug>/          GET    Product detail
  my-products/              GET    Seller's products
  my-products/create/       POST   Create product
  my-products/<slug>/       PATCH DELETE  Edit/delete product
  products/<slug>/reviews/  GET POST  Reviews

/api/orders/
  cart/                     GET POST PATCH DELETE  Cart
  checkout/                 POST   Place order
  my-orders/                GET    Buyer order list
  my-orders/<number>/       GET POST  Order detail + payment proof
  seller-orders/            GET    Seller order list
  seller-orders/<id>/status/ PATCH  Update order status
  seller-orders/<id>/payment/ PATCH Approve/reject payment

/api/subscriptions/
  plans/                    GET    Public plan list
  subscribe/                POST   Create subscription
  my/                       GET    My subscription
  admin/list/               GET    Admin subscription list
  admin/<id>/action/        PATCH  Approve/reject subscription
  admin/platform-settings/  GET PATCH  Platform bank details

/api/reports/
  seller/                   GET    Seller sales analytics
  buyer/                    GET    Buyer purchase analytics
  admin/                    GET    Platform-wide analytics
```

---

## Frontend — Pages by Role

### Public (no login)
| Page | Path |
|---|---|
| Home | `/` |
| Products | `/products` |
| Product Detail | `/products/:slug` |
| Login | `/auth/login` |
| Register | `/auth/register` |
| Forgot Password | `/auth/forgot-password` |
| Reset Password | `/auth/reset-password/:uid/:token` |
| Verify Email | `/auth/verify-email/:uid/:token` |
| Subscription Plans | `/subscriptions` |

### Buyer
| Page | Path |
|---|---|
| Dashboard | `/dashboard` |
| Profile | `/profile` |
| Cart | `/cart` |
| Checkout | `/checkout` |
| Order List | `/orders` |
| Order Detail | `/orders/:orderNumber` |
| Buyer Report | `/reports/buyer` |
| Settings | `/settings` |

### Seller
| Page | Path |
|---|---|
| Dashboard | `/dashboard` |
| My Products | `/seller/products` |
| Create Product | `/seller/products/create` |
| Edit Product | `/seller/products/:slug/edit` |
| Seller Orders | `/seller/orders` |
| Subscribe | `/subscriptions/subscribe/:planId` |
| My Subscription | `/subscriptions/my` |
| Seller Report | `/reports/seller` |
| Settings | `/settings` |

### Admin
| Page | Path |
|---|---|
| Admin Dashboard | `/admin/dashboard` |
| Manage Subscriptions | `/admin/subscriptions` |
| Manage Users | `/admin/users` |
| Admin Reports | `/admin/reports` |
| Manage Reviews | `/admin/reviews` |
| Platform Settings | `/admin/settings` |

---

## Frontend — Shared Infrastructure

### Contexts
- **`AuthContext`** — JWT storage, `login()`, `logout()`, `user`, `isSeller`, `isBuyer`, `isAdmin`
- **`CartContext`** — cart item count, synced with backend
- **`LanguageContext`** — `lang` (en/am), `setLanguage()`, `t(key)` translation lookup

### Key Components
- **`DashboardLayout`** — wraps all dashboard routes; renders `Sidebar` (sellers/admin) or `BuyerTopBar` (buyers)
- **`ProtectedRoute`** — redirects to login if unauthenticated; checks `role` prop if provided
- **`Navbar`** — brand logo + language toggle; profile dropdown with personal settings + platform settings (admin only)
- **`Sidebar`** — role-aware nav links; brand logo; green active highlight (`#7ccc00`)

### `api/axios.js`
- Base URL: `http://localhost:8000/api`
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: on 401 with refresh token, auto-refreshes and retries

---

## Key Data Flows

### Order Placement
1. Buyer adds items → `POST /api/orders/cart/`
2. Buyer checks out → `POST /api/orders/checkout/` → Order created, cart cleared
3. Email: buyer receives confirmation; each seller receives new-order alert
4. Buyer submits payment proof → `POST /api/orders/my-orders/<number>/`
5. Email: seller notified of payment proof
6. Seller approves/rejects → `PATCH /api/orders/seller-orders/<id>/payment/`
7. Email: buyer notified of result
8. Seller updates shipping status → `PATCH /api/orders/seller-orders/<id>/status/`
9. Email: buyer notified of each status change

### Seller Subscription
1. Seller views plans → `GET /api/subscriptions/plans/`
2. Seller subscribes → `POST /api/subscriptions/subscribe/` (uploads payment proof image)
3. Email: seller gets confirmation; all admins notified
4. Admin approves/rejects → `PATCH /api/subscriptions/admin/<id>/action/`
5. Email: seller notified of result
6. On approval: subscription set active, `start_date` and `end_date` calculated from plan duration

### Password Reset
1. User submits email → `POST /api/auth/forgot-password/` (always returns 200)
2. Email sent with link: `{FRONTEND_URL}/auth/reset-password/{uid}/{token}`
3. User clicks link → `ResetPassword.jsx` reads `uid` + `token` from URL params
4. User submits new password → `POST /api/auth/reset-password/`
5. Backend validates token, sets new password, invalidates token

### Email Verification
1. On register: `send_welcome_and_verification(user)` sends link
2. Link: `{FRONTEND_URL}/auth/verify-email/{uid}/{token}`
3. `VerifyEmail.jsx` auto-POSTs `{uid, token}` to `/api/auth/verify-email/` on mount
4. If unverified, Dashboard shows banner with "Resend" button
5. Resend: `POST /api/auth/resend-verification/` (auth required)

---

## Brand & Design

| Token | Value | Usage |
|---|---|---|
| `--brand` | `#5baa00` | Primary green |
| `--brand-dark` | `#3d7a00` | Hover states |
| `--brand-light` | `#7ccc00` | Active sidebar, badges |
| `--brand-red` | `#d43200` | Hero gradient start |
| Nav background | `#111d0e` | Dark green navbar |
| Logo | `public/logo.png` | Navbar, Sidebar, Login, Register, Footer, auth pages |

Hero gradient: `linear-gradient(135deg, #d43200 0%, #c87c00 35%, #5baa00 75%, #2d6600 100%)`

---

## Environment Variables (`.env` in `backend/`)

```
EMAIL_HOST_USER=beyalubet@gmail.com
EMAIL_HOST_PASSWORD=<gmail-app-password-no-spaces>
FRONTEND_URL=http://localhost:5173
```

> Gmail App Password requires 2FA enabled on the Gmail account. Remove spaces from the 16-character password before saving.
