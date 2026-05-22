import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function Subscribe() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ref, setRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/subscriptions/my/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const plan = data?.plans?.find(p => p.id === parseInt(planId))
  const platform = data?.platform_info || {}

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ref.trim()) return
    setSubmitting(true)
    try {
      await api.post('/subscriptions/subscribe/', { plan: planId, transaction_id: ref })
      setMsg({ type: 'success', text: 'Subscription activated! You can now list your products.' })
      setTimeout(() => navigate('/subscriptions/my'), 2500)
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to subscribe.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />
  if (!plan) return (
    <div className="container py-5 text-center">
      <h4 className="text-muted">{t('planNotFound')}</h4>
      <Link to="/subscriptions" className="btn btn-primary mt-2">{t('viewSubPlans')}</Link>
    </div>
  )

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/subscriptions" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" />{t('back')}
        </Link>
        <h3 className="fw-bold mb-0">{t('subscribe')} — {plan.name}</h3>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-4`}>{msg.text}</div>}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="mb-0 fw-bold"><i className="bi bi-star me-2" />{plan.name}</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">{t('duration')}</span>
                <strong>{plan.duration_display}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">{t('maxProducts')}</span>
                <strong>{plan.max_products}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">{t('price')}</span>
                <span className="fs-4 fw-bold text-primary">ETB {plan.price}</span>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm border-start border-4 border-success">
            <div className="card-header bg-success text-white py-2">
              <h6 className="mb-0 fw-bold"><i className="bi bi-credit-card me-2" />{t('paymentDetails')}</h6>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">{t('paymentInstructions')}</p>
              <div className="row g-3">
                {platform.telebirr && (
                  <div className="col-12">
                    <div className="bg-light rounded p-3 small">
                      <div className="fw-semibold mb-2"><i className="bi bi-phone me-2 text-warning" />{t('telebirr')}</div>
                      <div>{t('numberLabel')}: <strong>{platform.telebirr}</strong></div>
                    </div>
                  </div>
                )}
                {(platform.cbe_account || platform.bank_name) && (
                  <div className="col-12">
                    <div className="bg-light rounded p-3 small">
                      <div className="fw-semibold mb-2"><i className="bi bi-bank me-2 text-primary" />{t('bankTransfer')}</div>
                      {platform.bank_name && <div>{t('bankName')}: <strong>{platform.bank_name}</strong></div>}
                      <div>{t('accountNumber')}: <strong>{platform.cbe_account || platform.account_number}</strong></div>
                      <div>{t('accountHolder')}: <strong>{platform.cbe_holder || platform.account_holder}</strong></div>
                    </div>
                  </div>
                )}
                {platform.mobile_money && (
                  <div className="col-12">
                    <div className="bg-light rounded p-3 small">
                      <div className="fw-semibold mb-2"><i className="bi bi-phone me-2 text-success" />{t('mobileMoneyLabel')}</div>
                      <div>{t('numberLabel')}: <strong>{platform.mobile_money}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-send-check me-2" />{t('submitPaymentRef')}
            </div>
            <div className="card-body p-4">
              <p className="text-muted small mb-4">{t('afterTransferEnterRef')}</p>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">{t('transactionReference')} *</label>
                  <input type="text" className="form-control form-control-lg" value={ref}
                    onChange={e => setRef(e.target.value)} placeholder="e.g. TXN20241234567" required />
                  <div className="form-text">{t('enterRefNote')}</div>
                </div>
                <button type="submit" className="btn btn-success w-100 btn-lg" disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-border spinner-border-sm me-2" />{t('activating')}</>
                    : <><i className="bi bi-check-circle me-2" />{t('confirmActivate')}</>}
                </button>
              </form>

              <div className="alert alert-info small mt-4 mb-0">
                <i className="bi bi-info-circle me-1" />
                <strong>Demo mode:</strong> Subscription activates immediately upon reference submission.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
