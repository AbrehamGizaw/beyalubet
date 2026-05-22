import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/axios'
import Spinner from '../components/Spinner'

export default function Dashboard() {
  const { user, isSeller, isBuyer } = useAuth()
  const { t } = useLanguage()
  const [resendStatus, setResendStatus] = useState(null)

  const handleResendVerification = async () => {
    try {
      await api.post('/auth/resend-verification/')
      setResendStatus('sent')
    } catch {
      setResendStatus('error')
    }
  }
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isSeller) {
          const [ordersRes, productsRes, subRes] = await Promise.all([
            api.get('/orders/seller-orders/'),
            api.get('/products/my-products/'),
            api.get('/subscriptions/my/'),
          ])
          setStats({
            orders: ordersRes.data,
            products: productsRes.data,
            subscription: subRes.data,
          })
        } else {
          const ordersRes = await api.get('/orders/my-orders/')
          setStats({ orders: ordersRes.data })
        }
      } catch {
        setStats({})
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [isSeller])

  if (loading) return <Spinner />

  const orders = stats?.orders || []
  const products = stats?.products?.results || stats?.products || []
  const sub = stats?.subscription?.active_subscription

  return (
    <div className="container py-5">
      {/* Email verification banner */}
      {user && !user.is_email_verified && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between gap-3 mb-4 py-2">
          <span><i className="bi bi-envelope-exclamation me-2" />{t('verifyEmailBanner')}</span>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {resendStatus === 'sent' && <span className="small text-success">{t('verificationSent')}</span>}
            {resendStatus !== 'sent' && (
              <button className="btn btn-warning btn-sm" onClick={handleResendVerification}>
                {t('resendVerification')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 56, height: 56 }}>
          <i className="bi bi-person-circle fs-3 text-primary" />
        </div>
        <div>
          <h3 className="fw-bold mb-0">
            {t('welcome')}, {user?.first_name || user?.username}!
          </h3>
          <span className={`badge bg-${isSeller ? 'warning text-dark' : 'primary'}`}>
            <i className={`bi bi-${isSeller ? 'shop' : 'bag'} me-1`} />
            {isSeller ? t('sellerAccount') : t('buyerAccount')}
          </span>
        </div>
      </div>

      {isSeller ? (
        <>
          {/* Seller subscription alert */}
          {!sub && (
            <div className="alert alert-warning d-flex align-items-center mb-4">
              <i className="bi bi-exclamation-triangle-fill me-3 fs-5" />
              <div>
                <strong>{t('noActiveSubscription')}</strong> {t('subscribeTo')}{' '}
                <Link to="/subscriptions" className="alert-link">{t('viewPlans')}</Link>
              </div>
            </div>
          )}
          {sub && (
            <div className="alert alert-success d-flex align-items-center mb-4">
              <i className="bi bi-check-circle-fill me-3 fs-5" />
              <div>
                <strong>{sub.plan_name}</strong> — {sub.days_remaining} {t('daysRemaining')}.{' '}
                <Link to="/subscriptions/my" className="alert-link">{t('manage')}</Link>
              </div>
            </div>
          )}

          {/* Seller stats */}
          <div className="row g-4 mb-4">
            {[
              { icon: 'box-seam', color: 'primary', label: t('myProducts'), value: products.length || 0, link: '/seller/products' },
              { icon: 'bag-check', color: 'success', label: t('totalOrders'), value: orders.length || 0, link: '/seller/orders' },
              { icon: 'clock', color: 'warning', label: t('pendingOrders'), value: orders.filter(o => o.status === 'pending').length, link: '/seller/orders' },
              { icon: 'star', color: 'info', label: t('subscription'), value: sub ? sub.plan_name : 'None', link: '/subscriptions/my', small: true },
            ].map((s, i) => (
              <div className="col-sm-6 col-lg-3" key={i}>
                <Link to={s.link} className="text-decoration-none">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex align-items-center gap-3">
                      <div className={`bg-${s.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                        style={{ width: 50, height: 50 }}>
                        <i className={`bi bi-${s.icon} fs-4 text-${s.color}`} />
                      </div>
                      <div>
                        <div className={`fw-bold ${s.small ? 'fs-6' : 'fs-4'}`}>{s.value}</div>
                        <div className="text-muted small">{s.label}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <Link to="/seller/products/create" className="btn btn-primary w-100 py-3">
                <i className="bi bi-plus-circle me-2 fs-5" />{t('addNewProduct')}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/seller/orders" className="btn btn-outline-primary w-100 py-3">
                <i className="bi bi-bag me-2 fs-5" />{t('viewOrders')}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/subscriptions" className="btn btn-outline-success w-100 py-3">
                <i className="bi bi-star me-2 fs-5" />{t('subscriptionPlans')}
              </Link>
            </div>
          </div>

          {/* Recent orders */}
          {orders.length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-clock-history me-2" />{t('recentOrders')}
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr>
                    <th>{t('orderNumber')}</th><th>{t('buyer')}</th><th>{t('date')}</th><th>{t('amount')}</th><th>{t('status')}</th>
                  </tr></thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td className="small fw-semibold">{o.order_number}</td>
                        <td className="small">{o.buyer_name}</td>
                        <td className="small text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="fw-bold text-primary small">ETB {o.total_amount}</td>
                        <td><span className="badge bg-secondary">{o.status_display}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Buyer stats */}
          <div className="row g-4 mb-4">
            {[
              { icon: 'bag', color: 'primary', label: t('totalOrders'), value: orders.length },
              { icon: 'clock', color: 'warning', label: t('pending'), value: orders.filter(o => o.status === 'pending').length },
              { icon: 'check-circle', color: 'success', label: t('delivered'), value: orders.filter(o => o.status === 'delivered').length },
              { icon: 'currency-dollar', color: 'info', label: t('totalSpent'), value: `ETB ${orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toFixed(2)}` },
            ].map((s, i) => (
              <div className="col-sm-6 col-lg-3" key={i}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className={`bg-${s.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                      style={{ width: 50, height: 50 }}>
                      <i className={`bi bi-${s.icon} fs-4 text-${s.color}`} />
                    </div>
                    <div>
                      <div className="fw-bold fs-4">{s.value}</div>
                      <div className="text-muted small">{s.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <Link to="/products" className="btn btn-primary w-100 py-3">
                <i className="bi bi-search me-2 fs-5" />{t('browseProducts')}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/cart" className="btn btn-outline-primary w-100 py-3">
                <i className="bi bi-cart3 me-2 fs-5" />{t('myCart')}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/orders" className="btn btn-outline-secondary w-100 py-3">
                <i className="bi bi-bag me-2 fs-5" />{t('myOrders')}
              </Link>
            </div>
          </div>

          {orders.length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-clock-history me-2" />{t('recentOrders')}
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr>
                    <th>{t('orderNumber')}</th><th>{t('date')}</th><th>{t('items')}</th><th>{t('total')}</th><th>{t('status')}</th><th></th>
                  </tr></thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td className="small fw-semibold">{o.order_number}</td>
                        <td className="small text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="small">{o.item_count} item(s)</td>
                        <td className="fw-bold text-primary small">ETB {o.total_amount}</td>
                        <td><span className="badge bg-secondary">{o.status_display}</span></td>
                        <td><Link to={`/orders/${o.order_number}`} className="btn btn-sm btn-outline-primary">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
