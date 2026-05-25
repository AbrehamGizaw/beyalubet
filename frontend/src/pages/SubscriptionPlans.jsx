import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function SubscriptionPlans() {
  const { isAuthenticated, isSeller } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSub, setActiveSub] = useState(null)

  useEffect(() => {
    api.get('/subscriptions/plans/').then(r => setPlans(r.data)).finally(() => setLoading(false))
    if (isAuthenticated && isSeller) {
      api.get('/subscriptions/my/').then(r => setActiveSub(r.data?.active_subscription)).catch(() => {})
    }
  }, [isAuthenticated, isSeller])

  const handleSelect = (plan) => {
    if (!isAuthenticated) return navigate('/auth/login')
    if (!isSeller) return
    navigate(`/subscriptions/subscribe/${plan.id}`)
  }

  const durationIcon = { monthly: 'calendar', quarterly: 'calendar2-week', biannual: 'calendar3', yearly: 'calendar-check' }
  const planColor = ['primary', 'success', 'warning', 'danger']

  if (loading) return <Spinner />

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold">{t('sellerSubPlans')}</h2>
        <p className="text-muted lead">{t('choosePlan')}</p>

        {/* Free trial notice */}
        <div className="alert alert-success d-inline-flex align-items-center gap-2 px-4 py-2 mb-3">
          <i className="bi bi-gift-fill fs-5" />
          <span><strong>New sellers:</strong> Start with a free 1-month trial — no payment required!</span>
        </div>

        {activeSub && (
          <div className="alert alert-success d-inline-block px-4 py-2">
            <i className="bi bi-check-circle-fill me-2" />
            {t('active')}: <strong>{activeSub.plan_name}</strong> — {activeSub.days_remaining} {t('daysRemaining')}.{' '}
            <Link to="/subscriptions/my" className="alert-link">{t('manage')}</Link>
          </div>
        )}
      </div>

      <div className="row g-4 justify-content-center">
        {plans.map((plan, i) => {
          const isActive = activeSub?.plan === plan.id
          const color = planColor[i % planColor.length]
          return (
            <div className="col-md-6 col-lg-3" key={plan.id}>
              <div className={`card border-0 shadow h-100 ${isActive ? `border border-${color} border-2` : ''}`}>
                {isActive && (
                  <div className={`card-header bg-${color} text-white text-center py-1 small fw-bold`}>
                    {t('currentPlan')}
                  </div>
                )}
                <div className="card-body d-flex flex-column">
                  <div className="text-center mb-4">
                    <div className={`bg-${color} bg-opacity-10 rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3`}
                      style={{ width: 64, height: 64 }}>
                      <i className={`bi bi-${durationIcon[plan.duration] || 'calendar'} fs-3 text-${color}`} />
                    </div>
                    <h5 className="fw-bold">{plan.name}</h5>
                    {plan.is_free
                      ? <div className="display-5 fw-bold text-success">FREE</div>
                      : <div className={`display-5 fw-bold text-${color}`}>ETB {plan.price}</div>}
                    <div className="text-muted small">{plan.duration_display}</div>
                    {plan.is_free && <span className="badge bg-success mt-1">New sellers only</span>}
                  </div>

                  <div className="mb-4 flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-box-seam text-muted" />
                      <span className="small">Up to <strong>{plan.max_products}</strong> products</span>
                    </div>
                    {plan.features_list && plan.features_list.map((f, fi) => (
                      <div key={fi} className="d-flex align-items-center gap-2 mb-1">
                        <i className={`bi bi-check-circle-fill text-${color} small`} />
                        <span className="small">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`btn btn-${isActive ? 'outline-' + color : color} w-100`}
                    onClick={() => handleSelect(plan)}
                    disabled={isActive}>
                    {isActive ? t('currentPlan') : isAuthenticated && isSeller ? t('subscribe') : t('getStarted')}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!isAuthenticated && (
        <div className="text-center mt-5">
          <p className="text-muted">{t('wantToSell')}</p>
          <Link to="/auth/register" className="btn btn-primary btn-lg px-5">
            <i className="bi bi-shop me-2" />{t('registerAsSeller')}
          </Link>
        </div>
      )}
    </div>
  )
}
