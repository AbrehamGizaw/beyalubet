# AkShop Online — Web / Frontend Documentation

## Technology

- **React 18** with Vite (development server and production build)
- **React Router v6** for client-side routing
- **Bootstrap 5** for UI (via CDN or npm)
- **Bootstrap Icons** (`bi-*`) for icons
- **Axios** for all HTTP calls
- **Context API** for global state (auth, language)

---

## Project Structure

```
frontend/src/
├── api/
│   └── axios.js            # Axios instance (base URL, JWT interceptor)
├── context/
│   ├── AuthContext.jsx     # useAuth() hook + AuthProvider
│   └── LanguageContext.jsx # useLanguage() / t() hook + LanguageProvider
├── components/
│   ├── Navbar.jsx          # Top navigation, cart badge, user menu
│   ├── Footer.jsx          # Site footer
│   └── Spinner.jsx         # Full-page loading spinner
└── pages/
    ├── Home.jsx
    ├── Products.jsx
    ├── ProductDetail.jsx
    ├── CreateProduct.jsx
    ├── EditProduct.jsx
    ├── MyProducts.jsx
    ├── Cart.jsx
    ├── Checkout.jsx
    ├── OrderList.jsx
    ├── OrderDetail.jsx
    ├── SellerOrders.jsx
    ├── SellerReport.jsx
    ├── BuyerReport.jsx
    ├── Profile.jsx
    ├── Settings.jsx
    ├── Dashboard.jsx
    ├── Login.jsx
    ├── Register.jsx
    ├── ForgotPassword.jsx
    ├── ResetPassword.jsx
    ├── VerifyEmail.jsx
    ├── SubscriptionPlans.jsx
    ├── Subscribe.jsx
    ├── MySubscription.jsx
    ├── AdminDashboard.jsx
    ├── AdminUsers.jsx
    ├── AdminSubscriptions.jsx
    ├── AdminReports.jsx
    ├── AdminReviews.jsx
    ├── AdminSettings.jsx
    └── NotFound.jsx
```

---

## Routing

Routes are defined in `App.jsx`. Public routes render without login; protected routes redirect to `/login` if unauthenticated.

| Path | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/products` | Products catalogue | Public |
| `/products/:slug` | Product detail | Public |
| `/cart` | Shopping cart | Buyer |
| `/checkout` | Checkout | Buyer |
| `/orders` | My orders list | Buyer |
| `/orders/:orderNumber` | Order detail | Buyer |
| `/reports/buyer` | Buyer spending report | Buyer |
| `/seller/products` | My products list | Seller |
| `/seller/products/create` | Create product | Seller |
| `/seller/products/:slug/edit` | Edit product | Seller |
| `/seller/orders` | Seller order management | Seller |
| `/reports/seller` | Seller revenue report | Seller |
| `/subscriptions` | Subscription plans | Seller / Public |
| `/subscriptions/:planId` | Subscribe to a plan | Seller |
| `/subscriptions/my` | My subscription status | Seller |
| `/dashboard` | Role-based dashboard | Authenticated |
| `/profile` | Edit profile | Authenticated |
| `/settings` | App settings | Authenticated |
| `/admin/dashboard` | Admin overview | Admin |
| `/admin/users` | User management | Admin |
| `/admin/subscriptions` | Subscription management | Admin |
| `/admin/reports` | Platform analytics | Admin |
| `/admin/reviews` | Review moderation | Admin |
| `/admin/settings` | Platform payment settings | Admin |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | Password reset request | Public |
| `/reset-password` | Password reset | Public |
| `/verify-email` | Email verification | Public |

---

## Global State

### AuthContext

```javascript
import { useAuth } from '../context/AuthContext'

const {
  user,           // User object or null
  loading,        // true while checking token on mount
  isAuthenticated,
  isSeller,
  isBuyer,
  isAdmin,
  login,          // async (username, password) → user
  register,       // async (formData) → user
  logout,         // clears tokens, resets theme
  refreshUser,    // re-fetches /api/auth/me/ and updates state
} = useAuth()
```

On mount, `AuthProvider` checks `localStorage.access`. If a token exists but `user` is null (e.g., after page refresh), it fetches `/api/auth/me/` to rehydrate the user.

### LanguageContext

```javascript
import { useLanguage } from '../context/LanguageContext'

const { t, lang, setLanguage } = useLanguage()
```

- `t('key')` — returns the translated string for the current language
- Supported languages: **English** (`en`) and **Amharic** (`am`)
- Language preference is saved to `localStorage.akshop_lang`

---

## Axios Instance

`frontend/src/api/axios.js` creates a pre-configured Axios instance:

```javascript
import api from '../api/axios'

// All requests automatically include Authorization header
const { data } = await api.get('/products/')
await api.post('/subscriptions/subscribe/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

- Base URL is set to `/api` (Vite proxy in dev, Nginx in production)
- The interceptor automatically retries once on 401 after refreshing the token

---

## Key Pages

### Home (`/`)
Featured products, category grid, and call-to-action banners. Fetches from `/api/products/?featured=1` and `/api/products/categories/`.

### Products (`/products`)
Full catalogue with sidebar filters (category, condition, price range) and sort controls. Paginated via the `page` query param. Search via `q` param, updated on input.

### ProductDetail (`/products/:slug`)
Full product info, image gallery, discount badge (if `discount_percentage > 0`), seller info, payment methods, reviews list, and a write-review form for buyers.

### MyProducts (`/seller/products`)
Table of the seller's own products (including hidden). Each row has:
- Inline toggle switch for hide/show (`is_active`)
- Edit button → `EditProduct.jsx`
- Delete button (with confirmation)

### CreateProduct / EditProduct
Forms with two columns: product info (left) and options sidebar (right). The sidebar includes the hide/show switch, view count, and save/cancel buttons.

- **original_price** must be higher than **price** if provided (enforced client and server side)
- Multiple images upload supported; first image becomes the main image

### Subscribe (`/subscriptions/:planId`)
Two-column layout:
- Left: Plan summary card + platform payment details (Telebirr, bank transfer, mobile money)
- Right: Submission form
  - **Free plan**: one-click activate button, no payment fields
  - **Paid plan**: sender name (required), transaction ID (required, unique), screenshot (optional)

### AdminSubscriptions (`/admin/subscriptions`)
Three tabs:
1. **Subscriptions** — Table of all subs with approve/reject/edit-transaction actions
2. **Plans** — Cards for each plan with edit, hide/show, and delete buttons. Includes an "Add Plan" form.
3. **Settings** — Platform payment info (bank, Telebirr, mobile money)

---

## Dark Mode

Dark mode uses Bootstrap 5's `data-bs-theme="dark"` on `<html>`. It is **only available to authenticated users**.

- Theme is toggled by the user and saved to `localStorage.akshop_theme`
- On login: saved theme is restored
- On logout: theme resets to `light`
- On page load: theme is applied only if a valid access token exists

---

## File Uploads

All file uploads use `FormData` with `multipart/form-data`:

```javascript
const fd = new FormData()
fd.append('title', form.title)
images.forEach((img, i) => fd.append(`images[${i}]`, img))

await api.post('/products/my-products/', fd, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

Image previews use `URL.createObjectURL()` on the selected `File` objects.

---

## Error Handling Pattern

API errors are displayed via Bootstrap alert components:

```javascript
try {
  await api.post(...)
  setMsg({ type: 'success', text: 'Done!' })
} catch (err) {
  const d = err.response?.data
  if (d && typeof d === 'object') {
    const msgs = Object.entries(d)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n')
    setError(msgs)
  } else {
    setError('Something went wrong.')
  }
}
```

```jsx
{error && <div className="alert alert-danger" style={{ whiteSpace: 'pre-line' }}>{error}</div>}
```

---

## Build & Development

```bash
# Development
cd frontend
npm install
npm run dev        # Vite dev server on :5173 (proxies /api to :8000)

# Production
npm run build      # Outputs to frontend/dist/
```

Vite proxies all `/api` requests to `http://localhost:8000` in development (configured in `vite.config.js`).

In production, Nginx serves `frontend/dist/` as static files and proxies `/api` to Gunicorn.
