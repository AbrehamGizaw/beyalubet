import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Register() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password2: '', role: 'buyer', phone: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.password2) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
        setError(msgs)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <img src="/logo.png" alt="Beyalubet" style={{ height: 72, width: 'auto', objectFit: 'contain' }} />
                <h3 className="fw-bold mt-2 mb-0">{t('createAccount')}</h3>
                <p className="text-muted small">{t('joinToday')}</p>
              </div>

              {error && <div className="alert alert-danger py-2 small" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

              {/* Role selection */}
              <div className="row g-3 mb-4">
                {['buyer', 'seller'].map(r => (
                  <div className="col-6" key={r}>
                    <div className={`card border-2 cursor-pointer ${form.role === r ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                      style={{ cursor: 'pointer' }} onClick={() => set('role', r)}>
                      <div className="card-body py-3 text-center">
                        <i className={`bi bi-${r === 'buyer' ? 'bag' : 'shop'} fs-3 ${form.role === r ? 'text-primary' : 'text-muted'}`} />
                        <div className={`fw-semibold mt-1 ${form.role === r ? 'text-primary' : ''}`}>
                          {r === 'buyer' ? t('iWantToBuy') : t('iWantToSell')}
                        </div>
                        <small className="text-muted">{r === 'buyer' ? t('browseAndOrder') : t('listAndSell')}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('firstName')}</label>
                    <input className="form-control" value={form.first_name}
                      onChange={e => set('first_name', e.target.value)} required />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('lastName')}</label>
                    <input className="form-control" value={form.last_name}
                      onChange={e => set('last_name', e.target.value)} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('username')} *</label>
                    <input className="form-control" value={form.username}
                      onChange={e => set('username', e.target.value)} required />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('phone')}</label>
                    <input className="form-control" value={form.phone}
                      onChange={e => set('phone', e.target.value)} placeholder="+251 91 234 5678" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">{t('email')}</label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={e => set('email', e.target.value)} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('password')} *</label>
                    <input type="password" className="form-control" value={form.password}
                      onChange={e => set('password', e.target.value)} required minLength={8} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('confirmPassword')} *</label>
                    <input type="password" className="form-control" value={form.password2}
                      onChange={e => set('password2', e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 btn-lg mt-4" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />{t('creatingAccount')}</> : t('createAccount')}
                </button>
              </form>

              <hr className="my-4" />
              <p className="text-center text-muted small mb-0">
                {t('alreadyHaveAccount')}{' '}
                <Link to="/auth/login" className="fw-semibold text-decoration-none">{t('signIn')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
