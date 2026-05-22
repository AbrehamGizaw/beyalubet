import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'

export default function Navbar() {
  const { user, isAuthenticated, isBuyer, isAdmin, logout } = useAuth()
  const { cartCount } = useCart()
  const { t, lang, setLanguage } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/auth/login') }

  const toggleTheme = () => {
    const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-bs-theme', next)
    localStorage.setItem('akshop_theme', next)
  }

  const isDark = () => document.documentElement.getAttribute('data-bs-theme') === 'dark'
  const roleBadge = { buyer: 'bg-primary', seller: 'bg-warning text-dark', admin: 'bg-danger' }

  return (
    <nav className="navbar navbar-dark sticky-top shadow" style={{ zIndex: 1030, minHeight: 72, background: '#111d0e' }}>
      <div className="container-fluid px-4 py-2">
        <Link className="navbar-brand me-4 d-flex align-items-center gap-2 lh-1" to={isAuthenticated ? '/dashboard' : '/'}>
          <img src="/logo.png" alt="Beyalubet" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          <div className="d-flex flex-column">
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
              Beya<span style={{ color: '#7ccc00' }}>lubet</span>
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 400, letterSpacing: 0.5 }}>
              {t('ethiopiaMarketplace')}
            </span>
          </div>
        </Link>

        <div className="ms-auto d-flex align-items-center gap-2">
          {isAuthenticated ? (
            <>
              {isBuyer && (
                <Link to="/cart" className="btn btn-outline-light btn-sm position-relative">
                  <i className="bi bi-cart3" />
                  {cartCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark" style={{ fontSize: 10 }}>
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Rich profile dropdown */}
              <div className="dropdown">
                <button className="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2"
                  data-bs-toggle="dropdown" aria-expanded="false">
                  {user?.profile_image
                    ? <img src={user.profile_image} alt="" className="rounded-circle object-fit-cover"
                        style={{ width: 26, height: 26 }} />
                    : <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 26, height: 26 }}>
                        <i className="bi bi-person-fill text-white" style={{ fontSize: 14 }} />
                      </div>
                  }
                  <span className="d-none d-md-inline fw-semibold" style={{ fontSize: 13 }}>
                    {user?.first_name || user?.username}
                  </span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" style={{ minWidth: 270, borderRadius: 12 }}>
                  {/* Profile header */}
                  <li className="px-3 pt-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      {user?.profile_image
                        ? <img src={user.profile_image} alt="" className="rounded-circle object-fit-cover flex-shrink-0"
                            style={{ width: 46, height: 46 }} />
                        : <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 46, height: 46 }}>
                            <i className="bi bi-person-circle fs-4 text-primary" />
                          </div>
                      }
                      <div className="overflow-hidden">
                        <div className="fw-bold text-truncate">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}</div>
                        <div className="text-muted small text-truncate">{user?.email}</div>
                        <span className={`badge ${roleBadge[user?.role] || 'bg-secondary'} mt-1`} style={{ fontSize: 10 }}>
                          {user?.role?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </li>

                  {/* Account */}
                  <li className="px-2 pt-2">
                    <span className="text-muted px-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{t('accountLabel')}</span>
                  </li>
                  <li><Link className="dropdown-item rounded" to="/dashboard"><i className="bi bi-speedometer2 me-2 text-primary" />{t('dashboard')}</Link></li>
                  <li><Link className="dropdown-item rounded" to="/profile"><i className="bi bi-person-gear me-2 text-primary" />{t('editProfile')}</Link></li>
                  <li><Link className="dropdown-item rounded" to="/settings"><i className="bi bi-sliders me-2 text-primary" />{t('settings')}</Link></li>
                  {isAdmin && (
                    <li><Link className="dropdown-item rounded" to="/admin/settings"><i className="bi bi-gear-wide-connected me-2 text-danger" />{t('platformSettings')}</Link></li>
                  )}
                  <li>
                    <button className="dropdown-item rounded d-flex align-items-center justify-content-between" onClick={toggleTheme}>
                      <span><i className="bi bi-circle-half me-2 text-secondary" />{t('darkMode')}</span>
                      <span className={`badge ${isDark() ? 'bg-primary' : 'bg-light text-dark border'}`} style={{ fontSize: 10 }}>
                        {isDark() ? t('on') : t('off')}
                      </span>
                    </button>
                  </li>

                  <li><hr className="dropdown-divider" /></li>
                  <li className="pb-2">
                    <button className="dropdown-item rounded text-danger d-flex align-items-center gap-2" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right" />{t('logout')}
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="btn btn-outline-light btn-sm">{t('login')}</Link>
              <button
                className="btn btn-sm fw-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', minWidth: 64 }}
                onClick={() => setLanguage(lang === 'en' ? 'am' : 'en')}
                title={lang === 'en' ? 'Switch to Amharic' : 'Switch to English'}
              >
                {lang === 'en' ? 'አማ' : 'EN'}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

