import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'

export default function Sidebar({ collapsed, onToggle }) {
  const { user, isSeller, isBuyer, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const location = useLocation()
  const { t } = useLanguage()

  const buyerNav = [
    { to: '/dashboard', icon: 'speedometer2', label: t('dashboard') },
    { to: '/products', icon: 'grid', label: t('browse') },
    { to: '/cart', icon: 'cart3', label: t('myCart'), badge: true },
    { to: '/orders', icon: 'bag', label: t('myOrders') },
    { to: '/reports/buyer', icon: 'bar-chart-line', label: t('reports') },
  ]
  const sellerNav = [
    { to: '/dashboard', icon: 'speedometer2', label: t('dashboard') },
    { to: '/seller/products', icon: 'box-seam', label: t('myProducts') },
    { to: '/seller/orders', icon: 'bag-check', label: t('customerOrders') },
    { to: '/subscriptions/my', icon: 'star', label: t('subscription') },
    { to: '/reports/seller', icon: 'bar-chart-line', label: t('reports') },
  ]
  const adminNav = [
    { to: '/admin/dashboard', icon: 'speedometer2', label: t('dashboard') },
    { to: '/admin/subscriptions', icon: 'check-circle', label: t('subscriptions'), pending: true },
    { to: '/admin/users', icon: 'people', label: t('users') },
    { to: '/admin/archived-users', icon: 'archive', label: t('archivedUsers') },
    { to: '/admin/reviews', icon: 'chat-square-text', label: t('reviews') },
    { to: '/admin/reports', icon: 'bar-chart-line', label: t('reports') },
  ]

  const nav = isAdmin ? adminNav : isSeller ? sellerNav : buyerNav
  const isActive = (to) => location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
  const roleColor = { buyer: '#0d6efd', seller: '#ffc107', admin: '#dc3545' }

  const sidebarWidth = collapsed ? 60 : 240

  return (
    <div style={{
      width: sidebarWidth, minWidth: sidebarWidth, minHeight: '100%',
      background: '#1a2035', color: '#c8d3e0',
      transition: 'width 0.25s ease', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Toggle button */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2d3a52', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="Beyalubet" style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                Beya<span style={{ color: '#7ccc00' }}>lubet</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{t('ethiopiaMarketplace')}</div>
            </div>
          </div>
        )}
        {collapsed && <img src="/logo.png" alt="Beyalubet" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />}
        <button onClick={onToggle} style={{ background: 'none', border: 'none', color: '#8899aa', cursor: 'pointer', fontSize: 18, marginLeft: collapsed ? 0 : 8 }}>
          <i className={`bi bi-${collapsed ? 'layout-sidebar' : 'layout-sidebar-reverse'}`} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {nav.map((item) => {
          const active = isActive(item.to)
          return (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', alignItems: 'center',
              padding: collapsed ? '10px 0' : '10px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10, textDecoration: 'none', marginBottom: 2,
              background: active ? 'rgba(124,204,0,0.15)' : 'transparent',
              borderLeft: active ? '3px solid #7ccc00' : '3px solid transparent',
              color: active ? '#7ccc00' : '#8899aa',
              transition: 'all 0.15s',
            }}
            title={collapsed ? item.label : ''}
            >
              <i className={`bi bi-${item.icon}`} style={{ fontSize: 18, flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 14 }}>{item.label}</span>}
              {!collapsed && item.badge && cartCount > 0 && (
                <span className="badge bg-warning text-dark ms-auto" style={{ fontSize: 10 }}>{cartCount}</span>
              )}
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
