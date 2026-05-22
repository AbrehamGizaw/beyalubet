import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useLanguage } from '../context/LanguageContext'

export default function ForgotPassword() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      await api.post('/auth/forgot-password/', { email })
      setMsg({ type: 'success', text: t('resetLinkSent') })
    } catch {
      setMsg({ type: 'danger', text: t('invalidResetLink') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <img src="/logo.png" alt="Beyalubet" style={{ height: 64, objectFit: 'contain' }} />
                <h3 className="fw-bold mt-3 mb-1">{t('forgotPassword')}</h3>
                <p className="text-muted small">{t('forgotPasswordDesc')}</p>
              </div>

              {msg && <div className={`alert alert-${msg.type} py-2 small`}>{msg.text}</div>}

              {!msg?.type === 'success' || !msg ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" />{t('submitting')}</>
                      : t('sendResetLink')}
                  </button>
                </form>
              ) : null}

              <div className="text-center mt-3">
                <Link to="/auth/login" className="text-decoration-none small">
                  <i className="bi bi-arrow-left me-1" />{t('backToLogin')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
