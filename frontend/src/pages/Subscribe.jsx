import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function Subscribe() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [plan, setPlan] = useState(null)
  const [platform, setPlatform] = useState({})
  const [activeSub, setActiveSub] = useState(null)
  const [pendingSub, setPendingSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ref, setRef] = useState('')
  const [senderName, setSenderName] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    const id = parseInt(planId)
    Promise.all([
      api.get('/subscriptions/plans/').catch(() => ({ data: [] })),
      api.get('/subscriptions/my/').catch(() => ({ data: null })),
    ]).then(([plansRes, myRes]) => {
      const found = plansRes.data?.find ? plansRes.data.find(p => p.id === id) : null
      setPlan(found || null)
      setPlatform(myRes.data?.platform_info || {})
      setActiveSub(myRes.data?.active_subscription || null)
      const pending = myRes.data?.subscription_history?.find(s => s.status === 'pending') || null
      setPendingSub(pending)
    }).finally(() => setLoading(false))
  }, [planId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ref.trim() || !senderName.trim()) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('plan', planId)
      formData.append('transaction_id', ref)
      formData.append('sender_name', senderName)
      formData.append('payment_screenshot', screenshot)
      await api.post('/subscriptions/subscribe/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMsg({ type: 'success', text: 'Subscription activated! You can now list your products.' })
      setTimeout(() => navigate('/subscriptions/my'), 2500)
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to subscribe.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />

  if (activeSub) return (
    <div className="container py-5 text-center">
      <i className="bi bi-check-circle-fill display-1 text-success" />
      <h4 className="mt-3 fw-bold">You already have an active subscription</h4>
      <p className="text-muted">Your <strong>{activeSub.plan_name}</strong> plan is active for {activeSub.days_remaining} more days.</p>
      <Link to="/subscriptions/my" className="btn btn-primary px-4">{t('mySubscription')}</Link>
    </div>
  )

  if (pendingSub) return (
    <div className="container py-5 text-center">
      <i className="bi bi-hourglass-split display-1 text-warning" />
      <h4 className="mt-3 fw-bold">Subscription pending approval</h4>
      <p className="text-muted">Your <strong>{pendingSub.plan_name}</strong> subscription is awaiting admin approval. Please wait.</p>
      <Link to="/subscriptions/my" className="btn btn-warning px-4">{t('mySubscription')}</Link>
    </div>
  )

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
              <i className="bi bi-send-check me-2" />
              {plan.is_free ? 'Activate Free Trial' : t('submitPaymentRef')}
            </div>
            <div className="card-body p-4">
              {plan.is_free ? (
                <>
                  <div className="text-center py-3 mb-4">
                    <i className="bi bi-gift display-4 text-success" />
                    <h5 className="mt-3 fw-bold">1 Month Free — No Payment Needed</h5>
                    <p className="text-muted">Your account will be activated instantly. You can list up to 30 products for 30 days.</p>
                  </div>
                  {msg && <div className={`alert alert-${msg.type} mb-3`}>{msg.text}</div>}
                  <button className="btn btn-success w-100 btn-lg" onClick={handleSubmit} disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Activating…</>
                      : <><i className="bi bi-check-circle me-2" />Activate Free Trial</>}
                  </button>
                  <p className="text-muted small text-center mt-3 mb-0">One-time offer — each seller gets one free trial only.</p>
                </>
              ) : (
                <>
                  <p className="text-muted small mb-4">{t('afterTransferEnterRef')}</p>
                  {msg && <div className={`alert alert-${msg.type} mb-3`}>{msg.text}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Sender Full Name *</label>
                      <input type="text" className="form-control form-control-lg" value={senderName}
                        onChange={e => setSenderName(e.target.value)} placeholder="e.g. Abebe Kebede" required />
                      <div className="form-text">Full name of the account that sent the payment</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">{t('transactionReference')} *</label>
                      <input type="text" className="form-control form-control-lg" value={ref}
                        onChange={e => setRef(e.target.value)} placeholder="e.g. TXN20241234567" required />
                      <div className="form-text">{t('enterRefNote')}</div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Payment Screenshot <span className="text-muted fw-normal">(optional)</span></label>
                      <input type="file" className="form-control form-control-lg" accept="image/*"
                        onChange={e => setScreenshot(e.target.files[0])} />
                      <div className="form-text">Upload a screenshot of your payment confirmation</div>
                      {screenshot && (
                        <img src={URL.createObjectURL(screenshot)} alt="preview"
                          className="mt-2 rounded border" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }} />
                      )}
                    </div>
                    <button type="submit" className="btn btn-success w-100 btn-lg" disabled={submitting}>
                      {submitting
                        ? <><span className="spinner-border spinner-border-sm me-2" />{t('activating')}</>
                        : <><i className="bi bi-check-circle me-2" />{t('confirmActivate')}</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
