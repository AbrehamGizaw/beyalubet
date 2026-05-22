import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

const STATUS_COLOR = { pending: 'warning text-dark', confirmed: 'primary', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger' }

export default function SellerReport() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/seller/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return null

  const { totals, monthly_revenue, top_products, order_status, subscription } = data

  const maxRevenue = Math.max(...(monthly_revenue.map(m => parseFloat(m.revenue)) || [1]), 1)

  const subStatusColor = { active: 'success', pending: 'warning text-dark', none: 'secondary', cancelled: 'danger', expired: 'secondary' }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0"><i className="bi bi-bar-chart me-2 text-success" />{t('mySalesReport')}</h2>
        <Link to="/seller/products" className="btn btn-outline-primary btn-sm ms-auto">
          <i className="bi bi-box-seam me-1" />{t('manageProducts')}
        </Link>
      </div>

      <div className="row g-4 mb-4">
        {[
          { icon: 'currency-dollar', color: 'success', label: t('totalRevenue'), value: `ETB ${parseFloat(totals.revenue).toFixed(2)}` },
          { icon: 'bag-check', color: 'primary', label: t('totalOrders'), value: totals.orders },
          { icon: 'box-seam', color: 'info', label: t('activeProducts'), value: totals.products },
          { icon: 'star-fill', color: 'warning', label: t('avgRating'),
            value: totals.avg_rating > 0 ? `${totals.avg_rating} ★` : t('noReviews'), small: true },
          { icon: 'award', color: subscription.status === 'active' ? 'primary' : 'secondary',
            label: t('subscription'), value: subscription.plan_name || 'None', small: true },
        ].map((s, i) => (
          <div className="col-sm-6 col-lg" key={i}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`bg-${s.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                  style={{ width: 54, height: 54 }}>
                  <i className={`bi bi-${s.icon} fs-4 text-${s.color}`} />
                </div>
                <div>
                  <div className={`fw-bold ${s.small ? 'fs-6' : 'fs-4'}`}>{s.value}</div>
                  <div className="text-muted small">{s.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`alert alert-${subscription.status === 'active' ? 'success' : subscription.status === 'pending' ? 'warning' : 'secondary'} mb-4 py-2`}>
        <i className="bi bi-star me-2" />
        <strong>{t('subscription')}:</strong>{' '}
        <span className={`badge bg-${subStatusColor[subscription.status] || 'secondary'}`}>{subscription.status}</span>
        {subscription.status === 'active' && ` — ${subscription.days_remaining} ${t('daysRemaining')}`}
        {subscription.status === 'pending' && ` — ${t('awaitingAdminApproval')}`}
        {subscription.status === 'none' && <>{' '}<Link to="/subscriptions" className="alert-link">{t('subscribeNow')}</Link></>}
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-graph-up me-2 text-success" />{t('monthlyRevenue')}
            </div>
            <div className="card-body">
              {monthly_revenue.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noPaidOrders')}</div>
              ) : (
                <div className="d-flex align-items-end gap-2" style={{ height: 180 }}>
                  {monthly_revenue.map((m, i) => {
                    const h = Math.max(8, (parseFloat(m.revenue) / maxRevenue) * 160)
                    return (
                      <div key={i} className="flex-grow-1 d-flex flex-column align-items-center">
                        <div className="small fw-bold text-success mb-1">ETB {parseFloat(m.revenue).toFixed(0)}</div>
                        <div className="bg-success rounded-top w-100" style={{ height: h }} title={`ETB ${m.revenue}`} />
                        <div className="small text-muted mt-1" style={{ fontSize: 11 }}>{m.month.slice(5)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-pie-chart me-2 text-primary" />{t('ordersByStatus')}
            </div>
            <div className="card-body">
              {order_status.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noOrdersYet')}.</div>
              ) : (
                order_status.map((s, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-3">
                    <span className={`badge bg-${STATUS_COLOR[s.status] || 'secondary'}`}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                    <div className="flex-grow-1 mx-3">
                      <div className="progress" style={{ height: 8 }}>
                        <div className="progress-bar" style={{
                          width: `${(s.count / totals.orders) * 100}%`,
                          backgroundColor: s.status === 'delivered' ? '#198754' : s.status === 'cancelled' ? '#dc3545' : '#0d6efd'
                        }} />
                      </div>
                    </div>
                    <span className="fw-bold small">{s.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-trophy me-2 text-warning" />{t('topProductsByRevenue')}
            </div>
            {top_products.length === 0 ? (
              <div className="card-body text-center text-muted py-4">{t('noSalesData')}</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr>
                    <th>#</th><th>{t('product')}</th><th>{t('unitsSold')}</th><th>{t('revenue')}</th><th>{t('rating')}</th>
                  </tr></thead>
                  <tbody>
                    {top_products.map((p, i) => (
                      <tr key={i}>
                        <td className="text-muted small">{i + 1}</td>
                        <td className="fw-semibold small">{p.product_title}</td>
                        <td className="small">{p.total_sold}</td>
                        <td className="fw-bold text-success small">ETB {parseFloat(p.revenue).toFixed(2)}</td>
                        <td className="small">
                          {p.avg_rating > 0
                            ? <span className="text-warning fw-semibold">{p.avg_rating} ★</span>
                            : <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
