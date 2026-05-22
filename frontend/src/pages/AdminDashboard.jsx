import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return null

  const { users, orders, subscriptions, products, pending_subscriptions } = data

  const kpis = [
    { icon: 'people', color: 'primary', label: t('totalUsers'), value: users.total, sub: `+${users.new_30d} ${t('thisMonth')}` },
    { icon: 'shop', color: 'warning', label: t('activeSellers'), value: users.sellers, sub: `${users.buyers} ${t('buyers')}` },
    { icon: 'bag-check', color: 'success', label: t('totalOrders'), value: orders.total, sub: `ETB ${parseFloat(orders.revenue).toFixed(2)} ${t('revenue')}` },
    { icon: 'star', color: 'info', label: t('activeSubscriptions'), value: subscriptions.active, sub: `ETB ${parseFloat(subscriptions.revenue).toFixed(2)} ${t('earned')}` },
    { icon: 'clock', color: 'danger', label: t('pendingApprovals'), value: subscriptions.pending, sub: t('needReview'), link: '/admin/subscriptions' },
    { icon: 'box-seam', color: 'secondary', label: t('listedProducts'), value: products.total, sub: t('activeListings') },
  ]

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-0"><i className="bi bi-speedometer2 me-2 text-danger" />{t('adminDashboard')}</h2>
          <p className="text-muted mb-0">{t('platformOverview')}</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/subscriptions" className="btn btn-warning btn-sm">
            <i className="bi bi-check-circle me-1" />{t('pending')} ({subscriptions.pending})
          </Link>
          <Link to="/admin/reports" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-bar-chart me-1" />{t('reports')}
          </Link>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {kpis.map((k, i) => (
          <div className="col-sm-6 col-lg-4" key={i}>
            {k.link ? (
              <Link to={k.link} className="text-decoration-none">
                <div className={`card border-0 shadow-sm h-100 ${k.value > 0 && k.color === 'danger' ? 'border-danger border-2 border' : ''}`}>
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className={`bg-${k.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                      style={{ width: 54, height: 54 }}>
                      <i className={`bi bi-${k.icon} fs-4 text-${k.color}`} />
                    </div>
                    <div>
                      <div className="fw-bold fs-3">{k.value}</div>
                      <div className="fw-semibold small">{k.label}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{k.sub}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className={`bg-${k.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                    style={{ width: 54, height: 54 }}>
                    <i className={`bi bi-${k.icon} fs-4 text-${k.color}`} />
                  </div>
                  <div>
                    <div className="fw-bold fs-3">{k.value}</div>
                    <div className="fw-semibold small">{k.label}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{k.sub}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <Link to="/admin/subscriptions" className="btn btn-warning w-100 py-3">
            <i className="bi bi-check-circle me-2 fs-5" />{t('approveSubscriptions')}
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/users" className="btn btn-primary w-100 py-3">
            <i className="bi bi-people me-2 fs-5" />{t('manageUsers')}
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/reports" className="btn btn-success w-100 py-3">
            <i className="bi bi-bar-chart me-2 fs-5" />{t('viewReports')}
          </Link>
        </div>
        <div className="col-md-3">
          <a href="/admin/" target="_blank" className="btn btn-outline-secondary w-100 py-3">
            <i className="bi bi-gear me-2 fs-5" />Django Admin
          </a>
        </div>
      </div>

      {pending_subscriptions.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-warning bg-opacity-10 fw-bold py-3 d-flex align-items-center justify-content-between">
            <span><i className="bi bi-clock me-2 text-warning" />{t('pendingSubApprovals')}</span>
            <Link to="/admin/subscriptions" className="btn btn-sm btn-warning">{t('viewAll')}</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr>
                <th>{t('seller')}</th><th>{t('plan')}</th><th>{t('amount')}</th><th>{t('reference')}</th><th>{t('date')}</th><th></th>
              </tr></thead>
              <tbody>
                {pending_subscriptions.map(s => (
                  <tr key={s.id}>
                    <td className="fw-semibold small">{s.seller_username || s.seller}</td>
                    <td className="small">{s.plan?.name || s.plan_name}</td>
                    <td className="fw-bold text-primary small">ETB {s.amount_paid}</td>
                    <td className="small text-muted">{s.payment_reference}</td>
                    <td className="small text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to="/admin/subscriptions" className="btn btn-sm btn-outline-warning">{t('reviewAction')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
