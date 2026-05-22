import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.')
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
                <img src="/logo.png" alt="Beyalubet" style={{ height: 72, width: 'auto', objectFit: 'contain' }} />
                <h3 className="fw-bold mt-2 mb-0">{t('welcomeBack')}</h3>
                <p className="text-muted small">{t('signIn')}</p>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('username')}</label>
                  <input className="form-control" value={form.username}
                    onChange={e => set('username', e.target.value)} required autoFocus />
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold mb-0">{t('password')}</label>
                    <Link to="/auth/forgot-password" className="text-decoration-none small text-primary">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <input type="password" className="form-control" value={form.password}
                    onChange={e => set('password', e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />{t('signingIn')}</> : t('signIn')}
                </button>
              </form>

              <hr className="my-4" />
              <p className="text-center text-muted small mb-0">
                {t('noAccount')}{' '}
                <Link to="/auth/register" className="fw-semibold text-decoration-none">{t('register')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
