import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'

export default function BuyerTopBar() {
  const { cartCount } = useCart()
  const location = useLocation()
  const { t } = useLanguage()

  const TABS = [
    { to: '/dashboard', icon: 'speedometer2', label: t('home') },
    { to: '/products', icon: 'grid', label: t('products') },
    { to: '/cart', icon: 'cart3', label: t('cart'), badge: true },
    { to: '/orders', icon: 'bag', label: t('myOrders') },
    { to: '/reports/buyer', icon: 'bar-chart-line', label: t('reports') },
  ]

  const isActive = (to) =>
    to === '/dashboard'
      ? location.pathname === to
      : location.pathname.startsWith(to)

  return (
    <div className="bg-white border-bottom shadow-sm sticky-top" style={{ top: 72, zIndex: 1020 }}>
      <div className="container-fluid px-3">
        <div className="d-flex justify-content-center overflow-auto" style={{ gap: 0, scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <Link key={tab.to} to={tab.to}
              className="d-flex align-items-center gap-1 text-decoration-none px-3 py-2 flex-shrink-0"
              style={{
                borderBottom: isActive(tab.to) ? '3px solid #0d6efd' : '3px solid transparent',
                color: isActive(tab.to) ? '#0d6efd' : '#495057',
                fontWeight: isActive(tab.to) ? 600 : 400,
                fontSize: 14,
                position: 'relative',
                transition: 'color 0.15s',
              }}>
              <i className={`bi bi-${tab.icon}`} />
              <span className="d-none d-sm-inline">{tab.label}</span>
              {tab.badge && cartCount > 0 && (
                <span className="badge bg-warning text-dark" style={{ fontSize: 9, padding: '2px 5px' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
