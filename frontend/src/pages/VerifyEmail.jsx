import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function VerifyEmail() {
  const { uid, token } = useParams()
  const { t } = useLanguage()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.post('/auth/verify-email/', { uid, token })
      .then(r => { setStatus('success'); setMessage(r.data.detail) })
      .catch(e => { setStatus('error'); setMessage(e.response?.data?.detail || t('invalidResetLink')) })
  }, [uid, token])

  if (status === 'loading') return <Spinner />

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body p-5">
              <img src="/logo.png" alt="Beyalubet" style={{ height: 72, objectFit: 'contain' }} />
              <div className={`mt-4 mb-3 display-5 ${status === 'success' ? 'text-success' : 'text-danger'}`}>
                <i className={`bi bi-${status === 'success' ? 'patch-check-fill' : 'x-circle-fill'}`} />
              </div>
              <h4 className="fw-bold mb-2">
                {status === 'success' ? t('emailVerifiedSuccess') : t('verifyEmailTitle')}
              </h4>
              <p className="text-muted small mb-4">{message}</p>
              <Link to={status === 'success' ? '/dashboard' : '/auth/login'} className="btn btn-primary px-4">
                {status === 'success' ? t('dashboard') : t('backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
