# AkShop Online — User Guide

AkShop (Beyalubet) is an Ethiopian online marketplace. This guide covers how to use the platform as a **Buyer**, **Seller**, or **Admin**.

---

## Getting Started

### Creating an Account

1. Go to the **Register** page.
2. Choose your account type: **Buyer** or **Seller**.
3. Fill in your name, email, username, and password.
4. Phone number is optional but must be unique if provided.
5. You will receive a **verification email** — click the link to verify your email address.

> You can use the platform immediately without verifying your email, but a reminder banner will appear until you do.

### Logging In

Enter your username and password on the **Login** page. Your session is kept active in the browser. Logging out clears all session data.

### Changing Your Password

Go to **Settings → Password** tab. Enter your current password and your new password (minimum 8 characters) twice.

### Forgot Password

On the Login page, click **Forgot password?**. Enter your registered email address. If an account exists, a reset link will be sent. The link expires after 3 days.

### Language

Go to **Settings → Language**. Choose between **English** and **Amharic (አማርኛ)**. The preference is saved in your browser.

---

## Buyer Guide

Buyers browse products, add them to a cart, and pay offline via bank transfer or Telebirr.

### Browsing Products

- Use the **Products** page to browse the full catalogue.
- Filter by **category**, **condition** (new, used, refurbished), or **price range**.
- Sort by newest, price (low to high, high to low), or most viewed.
- Use the **search bar** to find specific products by keyword.

### Product Detail

Click any product to see:
- Full description, images, condition, location, and stock.
- Seller info and their accepted payment methods.
- Customer reviews and average rating.
- Discount badge if the seller set an original price higher than the selling price.

### Shopping Cart

Click **Add to Cart** on any product detail page (buyers only; sellers cannot add their own products).

In the **Cart** page:
- Adjust quantities using the `+`/`-` controls.
- Remove individual items with the trash icon.
- See the running total before proceeding.

### Placing an Order (Checkout)

1. Go to **Cart** and click **Proceed to Checkout**.
2. Fill in your shipping details:
   - Full name, address, city, country, phone number
   - Optional delivery notes
3. Click **Place Order**. Your order is created with `payment_status = pending`.
4. **Make the payment offline** — transfer the exact total amount to the platform's bank account or Telebirr number shown on the checkout confirmation page.
5. Come back to your **order detail** page and click **Submit Payment Reference**.
6. Enter the transaction reference number from your bank/Telebirr receipt and select the payment method.
7. The seller receives a notification and will approve your payment.
8. Once approved, your order status changes to **Confirmed**.

### Tracking Orders

Go to **My Orders** to see all your orders and their current status:

| Status | Meaning |
|---|---|
| Pending | Order placed, payment not yet submitted |
| Confirmed | Payment approved by seller |
| Processing | Seller is preparing the order |
| Shipped | Order is on the way |
| Delivered | Order has arrived |
| Cancelled | Order was cancelled |

### Cancelling an Order

You can cancel an order on the order detail page **only if** it is still `pending` and payment has not been submitted. Once cancelled, stock is returned.

### Writing a Review

After receiving a product, go to the product page and click **Write a Review**. Choose a star rating (1–5) and write a comment. You can edit your review later.

---

## Seller Guide

Sellers list products for buyers to purchase. An active **subscription plan** is required to list products.

### Subscription Plans

Before listing products, you must subscribe to a plan:

1. Go to **Subscription Plans** from the navigation menu.
2. **New sellers get 1 month free** — select the Free Trial plan and click **Activate Free Trial**. Your account is activated instantly with no payment needed.
3. For paid plans, select a plan and follow the payment instructions:
   - Transfer the listed amount to the platform's bank account or Telebirr.
   - Enter your full name, transaction ID from the receipt, and optionally upload a screenshot.
   - Your subscription request will be reviewed by an admin (usually within 24 hours).
   - You will receive an email when approved or rejected.

> Each seller may only have one active or one pending subscription at a time. The free trial can only be used once per seller.

### Plan Comparison

| Plan | Duration | Max Products | Price |
|---|---|---|---|
| Free Trial | 1 Month | 30 | Free (one-time) |
| Basic | 1 Month | Varies | See plans page |
| Standard | 3 Months | Varies | See plans page |
| Premium | 6 Months | Varies | See plans page |
| Enterprise | 12 Months | Varies | See plans page |

### Listing a Product

1. Go to **My Products** → **Add Product**.
2. Fill in:
   - **Title** — clear, descriptive product name
   - **Description** — full details about the product
   - **Price** — the selling price in ETB
   - **Original Price** (optional) — the pre-discount price; must be higher than the selling price to show a discount badge
   - **Stock** — available quantity
   - **Condition** — Brand New, Used, or Refurbished
   - **Category** — choose the most relevant category
   - **Location** — your city or area (optional)
   - **Images** — upload one or more photos; the first becomes the main image
3. The **Visible/Hidden** toggle in the sidebar controls whether the product appears publicly.
4. Click **Create Product**.

> You are limited to the number of active products allowed by your current plan. Hidden products do not count toward this limit.

### Editing a Product

From **My Products**, click the pencil icon next to any product to open the edit page. You can update any field, add more images, remove existing images, and toggle visibility. Customer reviews for the product are also shown here, and you can remove individual reviews.

### Hiding a Product

On the **My Products** list page, each row has a toggle switch. Flip it to hide or show a product instantly without going to the edit page.

### Managing Orders

Go to **Seller Orders** to see all orders containing your products.

**Approving payment:**
When a buyer submits a payment reference, you receive an email notification. In Seller Orders, find the order and click **Approve Payment** after confirming the funds arrived in your account. If the reference is wrong, click **Reject** and ask the buyer to resubmit.

**Updating order status:**
After approving payment, update the order status as you process it:
1. Confirmed → Processing → Shipped → Delivered

The buyer receives an email notification at each stage.

### Seller Reports

Go to **Reports** (visible to sellers) to see:
- Monthly revenue chart
- Top products by revenue
- Order status breakdown

---

## Admin Guide

The admin has full control over the platform.

### Accessing the Admin Panel

Log in with an account that has `role = admin`. The navigation will show admin links.

### Dashboard

The admin dashboard shows:
- Total users, sellers, buyers, and new registrations (last 30 days)
- Total orders, recent orders, and total order revenue
- Pending subscriptions, active subscriptions, and subscription revenue
- Total active products
- Quick list of the 5 most recent pending subscription requests

### Managing Users

Go to **Admin → Users** to see all buyers and sellers.
- Filter by role or search by name/email/username.
- **Activate or deactivate** any user account using the toggle switch.
- Deactivated users cannot log in.

### Managing Subscriptions

Go to **Admin → Subscriptions** for the subscriptions tab:

**Reviewing a pending subscription:**
1. Find the subscription in the `Pending` filter.
2. Verify the transaction ID and amount with your bank records.
3. Click **Approve** to activate the seller's subscription (sends them an email).
4. Click **Reject** if the payment is invalid (sends them an email).
5. You can also correct the transaction ID if the seller entered it wrong.

**Subscription Statuses:**
| Status | Meaning |
|---|---|
| Pending | Awaiting admin review |
| Active | Approved and currently valid |
| Expired | Was active but end date has passed |
| Cancelled | Rejected or replaced by a newer subscription |

### Managing Subscription Plans

In **Admin → Subscriptions → Plans** tab:

- **Add Plan** — fill in name, duration, price, max products, features (one per line), and flags.
- **Edit** (pencil icon) — update any plan field including price and max products.
- **Hide/Show** (eye icon) — toggles `is_active`. Hidden plans don't appear to sellers on the subscription page.
- **Delete** (trash icon) — permanently removes the plan. Blocked if any seller currently has an active subscription on it.

### Platform Payment Settings

In **Admin → Subscriptions → Settings** tab, update the bank account details and Telebirr/mobile money numbers that sellers see when subscribing. These are also shown to buyers during checkout.

### Managing Reviews

Go to **Admin → Reviews** to see all customer reviews across the platform. You can:
- Search by product, buyer, or comment text
- Filter by star rating
- Delete any inappropriate review

### Platform Reports

Go to **Admin → Reports** for analytics covering the last 6 months:
- Monthly subscription revenue
- Monthly order revenue
- Monthly new user signups
- Top 10 sellers by revenue (with average rating)
- Subscription plan distribution
- Order status breakdown

---

## Support

For technical issues or feedback, contact the platform administrator at the email address shown in the site footer.
