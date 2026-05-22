import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useLanguage } from '../context/LanguageContext'

export default function ResetPassword() {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      setError(t('passwordMismatch'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/reset-password/', { uid, token, ...form })
      setDone(true)
      setTimeout(() => navigate('/auth/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || t('invalidResetLink'))
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
                <h3 className="fw-bold mt-3 mb-1">{t('resetPassword')}</h3>
                <p className="text-muted small">{t('resetPasswordDesc')}</p>
              </div>

              {done ? (
                <div className="alert alert-success py-2 small text-center">
                  <i className="bi bi-check-circle me-2" />{t('passwordResetSuccess')}
                  <div className="mt-2">
                    <Link to="/auth/login" className="btn btn-primary btn-sm">{t('login')}</Link>
                  </div>
                </div>
              ) : (
                <>
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">{t('newPassword')}</label>
                      <input
                        type="password"
                        className="form-control"
                        value={form.new_password}
                        onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                        placeholder={t('minChars')}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">{t('confirmNewPassword')}</label>
                      <input
                        type="password"
                        className="form-control"
                        value={form.confirm_password}
                        onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                        required
                        minLength={8}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                      {loading
                        ? <><span className="spinner-border spinner-border-sm me-2" />{t('changing')}</>
                        : t('resetPassword')}
                    </button>
                  </form>
                </>
              )}

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
