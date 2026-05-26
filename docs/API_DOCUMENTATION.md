# AkShop Online — API Documentation

All API endpoints are prefixed with `/api/`. The base URL in production is `https://yourdomain.com/api/`.

Requests that require authentication must include:
```
Authorization: Bearer <access_token>
```

All request/response bodies are JSON unless the endpoint accepts file uploads (multipart/form-data).

---

## Authentication Endpoints

### POST /api/auth/register/
Register a new user account.

**Permission:** Public

**Request body:**
```json
{
  "username": "abebe123",
  "email": "abebe@example.com",
  "password": "securepass123",
  "first_name": "Abebe",
  "last_name": "Kebede",
  "role": "seller",
  "phone": "0912345678"
}
```
- `role`: `"buyer"` or `"seller"` (required)
- `phone`: optional, must be unique if provided
- `email`: must be unique

**Response 201:**
```json
{
  "user": { "id": 5, "username": "abebe123", "role": "seller", ... },
  "access": "<JWT access token>",
  "refresh": "<JWT refresh token>"
}
```

**Errors:** `400` if username/email/phone already taken, or validation fails.

---

### POST /api/auth/token/
Obtain JWT tokens (login).

**Permission:** Public

**Request body:**
```json
{ "username": "abebe123", "password": "securepass123" }
```

**Response 200:**
```json
{ "access": "<token>", "refresh": "<token>" }
```

---

### POST /api/auth/token/refresh/
Refresh an expired access token.

**Permission:** Public

**Request body:**
```json
{ "refresh": "<refresh_token>" }
```

**Response 200:**
```json
{ "access": "<new_access_token>" }
```

---

### GET /api/auth/me/
Get the authenticated user's profile.

**Permission:** Authenticated

**Response 200:**
```json
{
  "id": 5, "username": "abebe123", "email": "abebe@example.com",
  "role": "seller", "first_name": "Abebe", "last_name": "Kebede",
  "phone": "0912345678", "is_email_verified": true,
  "profile_image": "http://example.com/media/profiles/img.jpg",
  "seller_profile": { "business_name": "Abebe's Store", ... }
}
```

---

### PATCH /api/auth/me/
Update profile info or change password.

**Permission:** Authenticated

**To change password:**
```json
{ "old_password": "currentpass", "new_password": "newpass123" }
```

**To update profile:**
```json
{ "first_name": "Abebe", "last_name": "Girma", "phone": "0911111111" }
```
Multipart form-data accepted when uploading `profile_image`.

---

### POST /api/auth/forgot-password/
Send a password reset email.

**Permission:** Public

```json
{ "email": "abebe@example.com" }
```

Always returns 200 (does not reveal whether the email exists).

---

### POST /api/auth/reset-password/
Reset password using the emailed token.

**Permission:** Public

```json
{
  "uid": "<base64 user pk>",
  "token": "<reset token>",
  "new_password": "newpass123",
  "confirm_password": "newpass123"
}
```

---

### POST /api/auth/verify-email/
Verify email address using the link sent on registration.

**Permission:** Public

```json
{ "uid": "<base64 user pk>", "token": "<verification token>" }
```

---

### POST /api/auth/resend-verification/
Resend email verification link.

**Permission:** Authenticated

No body required.

---

## Product Endpoints

### GET /api/products/
List all active products (public catalogue).

**Permission:** Public

**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `q` | string | Search by title or description |
| `category` | string | Filter by category slug |
| `condition` | string | `new`, `used`, or `refurbished` |
| `min_price` | number | Minimum price filter |
| `max_price` | number | Maximum price filter |
| `featured` | any | Only featured products |
| `ordering` | string | `-created_at` (default), `price`, `-price`, `-views` |
| `limit` | int | Page size (default 12) |
| `page` | int | Page number |

**Response 200:** Paginated list
```json
{
  "count": 45,
  "next": "http://example.com/api/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 12, "title": "Samsung S24", "slug": "samsung-s24-abc123",
      "price": "45000.00", "original_price": "52000.00",
      "discount_percentage": 13,
      "stock": 3, "condition": "new", "is_active": true,
      "category": 2, "category_name": "Electronics",
      "seller": 5, "seller_name": "Abebe Kebede",
      "main_image": "http://example.com/media/products/img.jpg",
      "avg_rating": 4.5, "review_count": 8
    }
  ]
}
```

---

### GET /api/products/{slug}/
Product detail (increments view count).

**Permission:** Public. Only returns `is_active=True` products.

**Response 200:** Full product object including `images[]`, `description`, `seller_payment`, `review_stats`.

---

### GET /api/products/categories/
List all categories with product count.

**Permission:** Public

```json
[
  { "id": 1, "name": "Electronics", "name_am": "ኤሌክትሮኒክስ",
    "slug": "electronics", "icon": "bi-phone", "product_count": 23 }
]
```

---

### GET /api/products/my-products/
List the authenticated seller's own products (including hidden ones).

**Permission:** Authenticated seller

---

### POST /api/products/my-products/
Create a new product.

**Permission:** Authenticated seller with active subscription

**Content-Type:** `multipart/form-data`

**Fields:**
| Field | Required | Description |
|---|---|---|
| `title` | Yes | Product title |
| `description` | Yes | Full description |
| `price` | Yes | Selling price (ETB) |
| `original_price` | No | Must be higher than `price` if provided |
| `stock` | Yes | Available quantity |
| `condition` | Yes | `new`, `used`, or `refurbished` |
| `category` | Yes | Category ID |
| `location` | No | e.g. "Addis Ababa" |
| `is_active` | No | `true` (default) or `false` |
| `images[0]`, `images[1]`... | No | Image files; first becomes main image |

**Errors:**
- `403` if no active subscription
- `403` if plan product limit reached

---

### GET /api/products/my-products/{slug}/
Get a seller's own product (including hidden). Returns full detail.

**Permission:** Authenticated seller (must own the product)

---

### PATCH /api/products/my-products/{slug}/
Update a product.

**Permission:** Authenticated seller (must own the product)

**Content-Type:** `multipart/form-data` (partial update supported)

All fields from POST are accepted. New `images[n]` are appended.

---

### DELETE /api/products/my-products/{slug}/
Delete a product permanently.

**Permission:** Authenticated seller (must own the product)

---

### DELETE /api/products/my-products/{slug}/images/{img_id}/
Remove a single image from a product.

**Permission:** Authenticated seller (must own the product)

---

### GET /api/products/{slug}/reviews/
List reviews for a product.

**Permission:** Public

---

### POST /api/products/{slug}/reviews/
Write a review.

**Permission:** Authenticated buyer (cannot review own product)

```json
{ "rating": 5, "comment": "Great product!" }
```

---

### PATCH /api/products/{slug}/reviews/{review_id}/
Edit a review.

**Permission:** Authenticated (review owner only)

---

### DELETE /api/products/{slug}/reviews/{review_id}/
Delete a review.

**Permission:** Authenticated (review owner or product's seller)

---

## Cart & Order Endpoints

### GET /api/orders/cart/
Get the current user's cart.

**Permission:** Authenticated

---

### POST /api/orders/cart/add/
Add a product to the cart.

**Permission:** Authenticated buyer

```json
{ "product_id": 12, "quantity": 2 }
```

---

### PATCH /api/orders/cart/{item_id}/
Update cart item quantity. Quantity `< 1` removes the item.

**Permission:** Authenticated

```json
{ "quantity": 3 }
```

---

### DELETE /api/orders/cart/{item_id}/
Remove an item from the cart.

**Permission:** Authenticated

---

### POST /api/orders/checkout/
Place an order from the current cart.

**Permission:** Authenticated buyer

```json
{
  "shipping_name": "Abebe Kebede",
  "shipping_address": "Bole, House 12",
  "shipping_city": "Addis Ababa",
  "shipping_country": "Ethiopia",
  "shipping_phone": "0912345678",
  "notes": "Call before delivery"
}
```

Stock is decremented immediately. Cart is cleared. Emails sent to buyer and each seller.

**Response 201:** Full Order object.

---

### GET /api/orders/my-orders/
List the authenticated buyer's orders.

**Permission:** Authenticated

---

### GET /api/orders/my-orders/{order_number}/
Get order detail.

**Permission:** Authenticated (buyer who placed the order)

---

### POST /api/orders/my-orders/{order_number}/
Submit payment reference for an order.

**Permission:** Authenticated buyer

```json
{
  "payment_reference": "TXN20241234567",
  "payment_method": "telebirr"
}
```

Sets `payment_status` to `submitted`. Notifies the seller.

---

### DELETE /api/orders/my-orders/{order_number}/
Cancel a pending order (before payment submitted).

**Permission:** Authenticated buyer. Only works when `status=pending` and `payment_status=pending`.

---

### GET /api/orders/seller-orders/
List orders containing the seller's products.

**Permission:** Authenticated seller

---

### PATCH /api/orders/seller-orders/{order_id}/
Update order status (shipping progress).

**Permission:** Authenticated seller (must have items in this order)

```json
{ "status": "shipped" }
```

Valid statuses: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

---

### PATCH /api/orders/seller-orders/{order_id}/payment/
Approve or reject buyer's payment.

**Permission:** Authenticated seller (must have items in this order)

```json
{ "action": "approve" }
```

- `approve`: sets `payment_status=paid`, `status=confirmed`
- `reject`: resets `payment_status=pending`, clears payment reference

---

## Subscription Endpoints

### GET /api/subscriptions/plans/
List subscription plans.

**Permission:** Public (admins see hidden plans too)

```json
[
  {
    "id": 1, "name": "Free Trial", "duration": "monthly",
    "duration_display": "Monthly (1 Month)",
    "price": "0.00", "max_products": 30,
    "features": ["List up to 30 products", "1 month free"],
    "is_active": true, "is_popular": false, "is_free": true
  }
]
```

---

### POST /api/subscriptions/subscribe/
Subscribe to a plan.

**Permission:** Authenticated seller

**Content-Type:** `multipart/form-data`

**For free plan:**
```
plan=1
```

**For paid plan:**
```
plan=2
transaction_id=TXN20241234567
sender_name=Abebe Kebede
payment_screenshot=<file>   (optional)
```

**Business rules:**
- A seller can only have one active or one pending subscription at a time.
- Free trial: auto-activated instantly, one-time per seller.
- Paid: creates a `pending` subscription awaiting admin approval.

---

### GET /api/subscriptions/my/
Get the seller's subscription status and history.

**Permission:** Authenticated seller

```json
{
  "active_subscription": { "id": 3, "plan_name": "Basic", "days_remaining": 22, ... },
  "subscription_history": [...],
  "plans": [...],
  "platform_info": {
    "bank_name": "CBE", "account_number": "1000123456789",
    "account_holder": "AkShop Plc", "telebirr": "0912345678"
  }
}
```

---

### PATCH /api/subscriptions/{id}/transaction/
Update transaction ID on a pending subscription.

**Permission:** Authenticated seller (must own the subscription)

```json
{ "transaction_id": "NEWTXN12345" }
```

Only works while `status=pending`.

---

## Admin Endpoints

All `/api/admin/*` endpoints require `role=admin`.

---

### GET /api/admin/dashboard/
Platform overview statistics.

**Response:**
```json
{
  "users": { "total": 120, "sellers": 40, "buyers": 80, "new_30d": 12 },
  "orders": { "total": 340, "last_30d": 55, "revenue": "234000.00" },
  "subscriptions": { "pending": 3, "active": 28, "revenue": "45600.00" },
  "products": { "total": 210 },
  "pending_subscriptions": [...]
}
```

---

### GET /api/admin/users/
List all non-admin users.

**Query params:** `role=seller|buyer`, `q=<search term>`

---

### PATCH /api/admin/users/{user_id}/
Activate or deactivate a user account.

```json
{ "is_active": false }
```

---

### GET /api/admin/subscriptions/
List all seller subscriptions.

**Query param:** `status=pending|active|expired|cancelled` (empty = all)

---

### PATCH /api/admin/subscriptions/{id}/
Approve, reject, or update a subscription.

```json
{ "action": "approve" }
```
or
```json
{ "action": "reject" }
```
or
```json
{ "transaction_id": "CORRECTED_TXN_ID" }
```

---

### GET /api/admin/plans/
List all subscription plans (including inactive).

---

### POST /api/admin/plans/
Create a new subscription plan.

```json
{
  "name": "Enterprise",
  "duration": "yearly",
  "price": "9999.00",
  "max_products": 500,
  "features": "Unlimited listings\nPriority support",
  "is_active": true,
  "is_popular": false,
  "is_free": false
}
```

`duration` must be one of: `monthly`, `quarterly`, `biannual`, `yearly`

---

### PATCH /api/admin/plans/{id}/
Update a plan. Accepts: `name`, `duration`, `price`, `max_products`, `features`, `is_active`, `is_popular`, `is_free`.

---

### DELETE /api/admin/plans/{id}/
Delete a plan. Blocked if any active subscribers exist on the plan.

---

### GET /api/admin/reports/
Aggregated platform analytics.

```json
{
  "subscription_monthly": [{ "month": "2025-12", "revenue": "4500.00", "count": 8 }],
  "order_monthly": [...],
  "user_monthly": [...],
  "top_sellers": [{ "seller__username": "abebe", "revenue": "12000.00", "orders": 34, "avg_rating": 4.3 }],
  "plan_distribution": [{ "plan__name": "Basic", "count": 12 }],
  "order_status_breakdown": [{ "status": "delivered", "count": 120 }]
}
```

---

### GET /api/admin/reviews/
List all reviews.

**Query params:** `q=<search>`, `rating=1..5`

---

### DELETE /api/admin/reviews/{review_id}/
Delete any review.

---

### GET /api/admin/settings/
Get platform payment settings.

```json
{
  "bank_name": "CBE", "account_number": "1000123456789",
  "account_holder": "AkShop Plc", "telebirr": "0912345678",
  "mobile_money": "0911111111"
}
```

---

### PATCH /api/admin/settings/
Update platform payment settings.

```json
{ "telebirr": "0922334455" }
```

---

## Reports Endpoints

### GET /api/reports/seller/
Seller's own revenue analytics, top products, and order history.

**Permission:** Authenticated seller

---

### GET /api/reports/buyer/
Buyer's order summary and spending history.

**Permission:** Authenticated buyer

---

## Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `204` | Deleted / No content |
| `400` | Bad request / Validation error |
| `401` | Not authenticated |
| `403` | Forbidden (wrong role or ownership) |
| `404` | Resource not found |
| `500` | Server error |

Error responses always return:
```json
{ "detail": "Human-readable error message." }
```
or field-level errors:
```json
{ "email": ["This field is required."], "phone": ["Already in use."] }
```
