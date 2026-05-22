import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

const STATUS_COLOR = { pending: 'warning text-dark', confirmed: 'primary', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger' }

export default function BuyerReport() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/buyer/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return null

  const { totals, monthly_spending, order_status, top_categories, recent_orders } = data
  const maxSpend = Math.max(...(monthly_spending.map(m => parseFloat(m.spent)) || [1]), 1)

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0"><i className="bi bi-bar-chart me-2 text-primary" />{t('myPurchaseReport')}</h2>
        <Link to="/orders" className="btn btn-outline-primary btn-sm ms-auto">
          <i className="bi bi-bag me-1" />{t('allOrders')}
        </Link>
      </div>

      <div className="row g-4 mb-4">
        {[
          { icon: 'currency-dollar', color: 'primary', label: t('totalSpent'), value: `ETB ${parseFloat(totals.spent).toFixed(2)}` },
          { icon: 'bag', color: 'success', label: t('totalOrders'), value: totals.orders },
          { icon: 'check-circle', color: 'info', label: t('delivered'), value: order_status.find(s => s.status === 'delivered')?.count || 0 },
          { icon: 'clock', color: 'warning', label: t('pendingActive'), value: order_status.filter(s => ['pending','confirmed','processing','shipped'].includes(s.status)).reduce((a,s) => a + s.count, 0) },
        ].map((s, i) => (
          <div className="col-sm-6 col-lg-3" key={i}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`bg-${s.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                  style={{ width: 54, height: 54 }}>
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

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-graph-up me-2 text-primary" />{t('monthlySpending')}
            </div>
            <div className="card-body">
              {monthly_spending.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noPurchasesYet')}</div>
              ) : (
                <div className="d-flex align-items-end gap-2" style={{ height: 180 }}>
                  {monthly_spending.map((m, i) => {
                    const h = Math.max(8, (parseFloat(m.spent) / maxSpend) * 160)
                    return (
                      <div key={i} className="flex-grow-1 d-flex flex-column align-items-center">
                        <div className="small fw-bold text-primary mb-1">ETB {parseFloat(m.spent).toFixed(0)}</div>
                        <div className="bg-primary rounded-top w-100" style={{ height: h }} />
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

        {top_categories.length > 0 && (
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-tags me-2 text-info" />{t('topCategories')}
              </div>
              <div className="card-body">
                {top_categories.map((c, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-3">
                    <span className="small fw-semibold">{c['product__category__name'] || 'Unknown'}</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-dark border small">{c.count} items</span>
                      <span className="fw-bold text-primary small">ETB {parseFloat(c.spent).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {recent_orders.length > 0 && (
          <div className={`col-lg-${top_categories.length > 0 ? '7' : '12'}`}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-clock-history me-2 text-secondary" />{t('recentOrders')}
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr>
                    <th>{t('orderNumber')}</th><th>{t('date')}</th><th>{t('total')}</th><th>{t('status')}</th>
                  </tr></thead>
                  <tbody>
                    {recent_orders.map(o => (
                      <tr key={o.order_number}>
                        <td className="small fw-semibold">
                          <Link to={`/orders/${o.order_number}`} className="text-decoration-none">
                            {o.order_number.slice(0, 13)}…
                          </Link>
                        </td>
                        <td className="small text-muted">{o.date}</td>
                        <td className="fw-bold text-primary small">ETB {o.total}</td>
                        <td><span className="badge bg-secondary">{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
