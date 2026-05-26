import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderList from './pages/OrderList'
import OrderDetail from './pages/OrderDetail'
import SellerOrders from './pages/SellerOrders'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import SubscriptionPlans from './pages/SubscriptionPlans'
import Subscribe from './pages/Subscribe'
import MySubscription from './pages/MySubscription'
import MyProducts from './pages/MyProducts'
import CreateProduct from './pages/CreateProduct'
import EditProduct from './pages/EditProduct'
import NotFound from './pages/NotFound'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import SellerReport from './pages/SellerReport'
import BuyerReport from './pages/BuyerReport'
import AdminDashboard from './pages/AdminDashboard'
import AdminSubscriptions from './pages/AdminSubscriptions'
import AdminUsers from './pages/AdminUsers'
import AdminUserDetail from './pages/AdminUserDetail'
import AdminReports from './pages/AdminReports'
import AdminReviews from './pages/AdminReviews'
import AdminSettings from './pages/AdminSettings'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Routes>
        {/* ── Public pages (no sidebar) ─────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/auth/verify-email/:uid/:token" element={<VerifyEmail />} />
        <Route path="/subscriptions" element={<SubscriptionPlans />} />

        {/* ── Dashboard pages (with sidebar / buyer topbar) ─────────── */}
        <Route element={<DashboardLayout />}>
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Buyer */}
          <Route path="/cart" element={<ProtectedRoute role="buyer"><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute role="buyer"><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute role="buyer"><OrderList /></ProtectedRoute>} />
          <Route path="/orders/:orderNumber" element={<ProtectedRoute role="buyer"><OrderDetail /></ProtectedRoute>} />
          <Route path="/reports/buyer" element={<ProtectedRoute role="buyer"><BuyerReport /></ProtectedRoute>} />

          {/* Seller */}
          <Route path="/seller/products" element={<ProtectedRoute role="seller"><MyProducts /></ProtectedRoute>} />
          <Route path="/seller/products/create" element={<ProtectedRoute role="seller"><CreateProduct /></ProtectedRoute>} />
          <Route path="/seller/products/:slug/edit" element={<ProtectedRoute role="seller"><EditProduct /></ProtectedRoute>} />
          <Route path="/seller/orders" element={<ProtectedRoute role="seller"><SellerOrders /></ProtectedRoute>} />
          <Route path="/subscriptions/subscribe/:planId" element={<ProtectedRoute role="seller"><Subscribe /></ProtectedRoute>} />
          <Route path="/subscriptions/my" element={<ProtectedRoute role="seller"><MySubscription /></ProtectedRoute>} />
          <Route path="/reports/seller" element={<ProtectedRoute role="seller"><SellerReport /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute role="admin"><AdminSubscriptions /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute role="admin"><AdminUserDetail /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute role="admin"><AdminReviews /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />

          {/* Settings — all roles */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  )
}
