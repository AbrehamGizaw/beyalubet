import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  const ROLE_LINKS = {
    buyer: [
      { to: '/dashboard', icon: 'speedometer2', label: t('dashboard') },
      { to: '/products', icon: 'grid', label: t('browseProducts') },
      { to: '/cart', icon: 'cart3', label: t('myCart') },
      { to: '/orders', icon: 'bag', label: t('myOrders') },
      { to: '/reports/buyer', icon: 'bar-chart-line', label: t('reports') },
    ],
    seller: [
      { to: '/dashboard', icon: 'speedometer2', label: t('dashboard') },
      { to: '/seller/products', icon: 'box-seam', label: t('myProducts') },
      { to: '/seller/orders', icon: 'bag-check', label: t('customerOrders') },
      { to: '/subscriptions/my', icon: 'star', label: t('subscription') },
      { to: '/reports/seller', icon: 'bar-chart-line', label: t('reports') },
    ],
    admin: [
      { to: '/admin/dashboard', icon: 'speedometer2', label: t('dashboard') },
      { to: '/admin/users', icon: 'people', label: t('users') },
      { to: '/admin/subscriptions', icon: 'check-circle', label: t('subscriptions') },
      { to: '/admin/reviews', icon: 'chat-square-text', label: t('reviews') },
      { to: '/admin/reports', icon: 'bar-chart-line', label: t('reports') },
    ],
  }

  const PUBLIC_LINKS = [
    { to: '/products', label: t('allProducts') },
    { to: '/auth/login', label: t('login') },
    { to: '/auth/register', label: t('createAccount') },
    { to: '/subscriptions', label: t('pricingPlans') },
  ]

  const quickLinks = isAuthenticated ? (ROLE_LINKS[user?.role] || []) : PUBLIC_LINKS

  return (
    <footer style={{ background: '#0f1623', color: '#c8d3e0', marginTop: 'auto' }}>
      {/* Main footer body */}
      <div className="container py-5">
        <div className="row g-5">

          {/* Brand & About */}
          <div className="col-lg-3 col-md-6">
            <h5 className="fw-bold mb-3" style={{ color: '#fff' }}>
              <img src="/logo.png" alt="Beyalubet" style={{ height: 32, width: 'auto', objectFit: 'contain', marginRight: 8 }} />
              Beya<span style={{ color: '#7ccc00' }}>lubet</span>
            </h5>
            <p className="small mb-3" style={{ color: '#8899aa', lineHeight: 1.7 }}>
              {t('brandAbout')}
            </p>
            <div className="d-flex gap-2">
              {[
                { icon: 'facebook', color: '#1877f2' },
                { icon: 'telegram', color: '#229ed9' },
                { icon: 'instagram', color: '#e4405f' },
                { icon: 'twitter-x', color: '#fff' },
              ].map(s => (
                <div key={s.icon}
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                  <i className={`bi bi-${s.icon}`} style={{ color: s.color, fontSize: 15 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold mb-3 text-white text-uppercase" style={{ letterSpacing: 1, fontSize: 12 }}>
              {t('quickLinks')}
            </h6>
            <ul className="list-unstyled mb-0">
              {quickLinks.map(l => (
                <li key={l.to} className="mb-2">
                  <Link to={l.to} className="text-decoration-none d-flex align-items-center gap-2"
                    style={{ color: '#8899aa', fontSize: 14, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4d9fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
                    {l.icon && <i className={`bi bi-${l.icon}`} style={{ fontSize: 13 }} />}
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold mb-3 text-white text-uppercase" style={{ letterSpacing: 1, fontSize: 12 }}>
              {t('contactUs')}
            </h6>
            <ul className="list-unstyled mb-0">
              <li className="d-flex align-items-start gap-2 mb-3">
                <i className="bi bi-geo-alt-fill text-warning mt-1" style={{ fontSize: 15, flexShrink: 0 }} />
                <span style={{ color: '#8899aa', fontSize: 14, lineHeight: 1.6 }}>
                  {t('footerAddress')}
                </span>
              </li>
              <li className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-envelope-fill text-warning" style={{ fontSize: 15, flexShrink: 0 }} />
                <a href="mailto:akonlineshop@gmail.com"
                  className="text-decoration-none"
                  style={{ color: '#8899aa', fontSize: 14 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4d9fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
                  akonlineshop@gmail.com
                </a>
              </li>
              <li className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-telephone-fill text-warning" style={{ fontSize: 15, flexShrink: 0 }} />
                <a href="tel:+251911275176"
                  className="text-decoration-none"
                  style={{ color: '#8899aa', fontSize: 14 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4d9fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
                  0911 275 176
                </a>
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-fill text-warning" style={{ fontSize: 15, flexShrink: 0 }} />
                <span style={{ color: '#8899aa', fontSize: 14 }}>{t('monSat')}</span>
              </li>
            </ul>
          </div>

          {/* Provider */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold mb-3 text-white text-uppercase" style={{ letterSpacing: 1, fontSize: 12 }}>
              {t('systemProvider')}
            </h6>
            <div className="p-3 rounded-3 mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-cpu text-warning fs-5" />
                <span className="fw-bold text-white" style={{ fontSize: 15 }}>BrightFuture Technologies</span>
              </div>
              <p className="mb-2" style={{ color: '#8899aa', fontSize: 13, lineHeight: 1.6 }}>
                {t('providerDesc')}
              </p>
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-patch-check-fill text-warning" style={{ fontSize: 13 }} />
                <span style={{ color: '#8899aa', fontSize: 12 }}>{t('verifiedPartner')}</span>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {[t('securePayments'), t('fastSupport'), t('localTag')].map(tag => (
                <span key={tag} className="badge" style={{ background: 'rgba(255,193,7,0.15)', color: '#ffc107', fontSize: 11, padding: '4px 8px' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container py-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <p className="mb-0" style={{ color: '#5a6a7a', fontSize: 13 }}>
              &copy; {new Date().getFullYear()} Beyalubet. {t('allRightsReserved')}
            </p>
            <p className="mb-0" style={{ color: '#5a6a7a', fontSize: 13 }}>
              {t('poweredBy')} <span className="text-warning fw-semibold">BrightFuture Technologies</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
