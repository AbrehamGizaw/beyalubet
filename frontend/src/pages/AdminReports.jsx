import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function AdminReports() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/reports/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return null

  const { subscription_monthly, order_monthly, user_monthly, top_sellers, plan_distribution, order_status_breakdown } = data

  const maxSubRev = Math.max(...subscription_monthly.map(m => parseFloat(m.revenue)), 1)
  const maxOrderRev = Math.max(...order_monthly.map(m => parseFloat(m.revenue)), 1)
  const maxUsers = Math.max(...user_monthly.map(m => m.count), 1)

  const PLAN_COLORS = ['primary', 'success', 'warning', 'danger', 'info']
  const STATUS_COLORS = { pending: '#ffc107', confirmed: '#0d6efd', processing: '#0dcaf0', shipped: '#0dcaf0', delivered: '#198754', cancelled: '#dc3545' }

  const totalSubRevenue = subscription_monthly.reduce((s, m) => s + parseFloat(m.revenue), 0)
  const totalOrderRevenue = order_monthly.reduce((s, m) => s + parseFloat(m.revenue), 0)
  const totalNewUsers = user_monthly.reduce((s, m) => s + m.count, 0)

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0"><i className="bi bi-bar-chart me-2 text-success" />{t('platformReports')}</h2>
        <span className="text-muted small ms-auto">{t('last6Months')}</span>
      </div>

      <div className="row g-4 mb-4">
        {[
          { icon: 'star', color: 'warning', label: t('subscriptionRevenue'), value: `ETB ${totalSubRevenue.toFixed(2)}` },
          { icon: 'bag-check', color: 'success', label: t('orderRevenue'), value: `ETB ${totalOrderRevenue.toFixed(2)}` },
          { icon: 'person-plus', color: 'primary', label: t('newUsers'), value: totalNewUsers },
          { icon: 'trophy', color: 'info', label: t('activeSellers'), value: top_sellers.length },
        ].map((k, i) => (
          <div className="col-sm-6 col-lg-3" key={i}>
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`bg-${k.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                  style={{ width: 50, height: 50 }}>
                  <i className={`bi bi-${k.icon} fs-4 text-${k.color}`} />
                </div>
                <div>
                  <div className="fw-bold fs-4">{k.value}</div>
                  <div className="text-muted small">{k.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-star me-2 text-warning" />{t('subscriptionRevenue')}
            </div>
            <div className="card-body">
              {subscription_monthly.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noDataYet')}</div>
              ) : (
                <div className="d-flex align-items-end gap-1" style={{ height: 140 }}>
                  {subscription_monthly.map((m, i) => {
                    const h = Math.max(6, (parseFloat(m.revenue) / maxSubRev) * 120)
                    return (
                      <div key={i} className="flex-grow-1 d-flex flex-column align-items-center">
                        <div className="bg-warning rounded-top w-100" style={{ height: h }} title={`ETB ${m.revenue}`} />
                        <div className="text-muted mt-1" style={{ fontSize: 10 }}>{m.month.slice(5)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-bag-check me-2 text-success" />{t('orderRevenue')}
            </div>
            <div className="card-body">
              {order_monthly.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noDataYet')}</div>
              ) : (
                <div className="d-flex align-items-end gap-1" style={{ height: 140 }}>
                  {order_monthly.map((m, i) => {
                    const h = Math.max(6, (parseFloat(m.revenue) / maxOrderRev) * 120)
                    return (
                      <div key={i} className="flex-grow-1 d-flex flex-column align-items-center">
                        <div className="bg-success rounded-top w-100" style={{ height: h }} title={`ETB ${m.revenue}`} />
                        <div className="text-muted mt-1" style={{ fontSize: 10 }}>{m.month.slice(5)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-person-plus me-2 text-primary" />{t('userGrowth')}
            </div>
            <div className="card-body">
              {user_monthly.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noDataYet')}</div>
              ) : (
                <div className="d-flex align-items-end gap-1" style={{ height: 140 }}>
                  {user_monthly.map((m, i) => {
                    const h = Math.max(6, (m.count / maxUsers) * 120)
                    return (
                      <div key={i} className="flex-grow-1 d-flex flex-column align-items-center">
                        <div className="bg-primary rounded-top w-100" style={{ height: h }} title={m.count} />
                        <div className="text-muted mt-1" style={{ fontSize: 10 }}>{m.month.slice(5)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-pie-chart me-2 text-info" />{t('planDistribution')}
            </div>
            <div className="card-body">
              {plan_distribution.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noActiveSubscriptions')}</div>
              ) : (
                plan_distribution.map((p, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-3">
                    <span className={`badge bg-${PLAN_COLORS[i % PLAN_COLORS.length]}`}>{p['plan__name']}</span>
                    <div className="flex-grow-1 mx-3">
                      <div className="progress" style={{ height: 8 }}>
                        <div className={`progress-bar bg-${PLAN_COLORS[i % PLAN_COLORS.length]}`}
                          style={{ width: `${(p.count / plan_distribution.reduce((s, x) => s + x.count, 0)) * 100}%` }} />
                      </div>
                    </div>
                    <span className="fw-bold small">{p.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-bag me-2 text-secondary" />{t('orderStatus')}
            </div>
            <div className="card-body">
              {order_status_breakdown.length === 0 ? (
                <div className="text-center text-muted py-4">{t('noOrdersYet')}.</div>
              ) : (
                order_status_breakdown.map((s, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-capitalize fw-semibold">{s.status}</span>
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded" style={{
                        width: 12, height: 12,
                        backgroundColor: STATUS_COLORS[s.status] || '#6c757d',
                      }} />
                      <span className="fw-bold small">{s.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-trophy me-2 text-warning" />{t('topSellers')}
            </div>
            {top_sellers.length === 0 ? (
              <div className="card-body text-center text-muted py-4">{t('noSalesData')}</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light"><tr><th>#</th><th>{t('seller')}</th><th>{t('revenue')}</th><th>{t('avgRating')}</th></tr></thead>
                  <tbody>
                    {top_sellers.map((s, i) => (
                      <tr key={i}>
                        <td className="text-muted small">{i + 1}</td>
                        <td className="small fw-semibold">{s.seller__username}</td>
                        <td className="small fw-bold text-success">ETB {parseFloat(s.revenue).toFixed(2)}</td>
                        <td className="small">
                          {s.avg_rating > 0
                            ? <span className="text-warning fw-semibold">{s.avg_rating} ★</span>
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
