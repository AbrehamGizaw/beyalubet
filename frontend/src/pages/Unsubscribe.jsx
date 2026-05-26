import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'

export default function Unsubscribe() {
  const { token } = useParams()
  const [state, setState] = useState('loading') // loading | success | error
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get(`/unsubscribe/${token}/`)
      .then(r => {
        setEmail(r.data.email || '')
        setState('success')
      })
      .catch(err => {
        setMessage(err.response?.data?.error || 'Something went wrong.')
        setState('error')
      })
  }, [token])

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card border-0 shadow-sm text-center p-5" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ fontSize: 48, lineHeight: 1 }}>🛒</div>
        <h5 className="fw-bold mt-3 mb-1">Beyalubet</h5>
        <div className="text-muted small mb-4">Ethiopia's Marketplace</div>

        {state === 'loading' && (
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Processing…</span>
          </div>
        )}

        {state === 'success' && (
          <>
            <div style={{ fontSize: 48 }}>✅</div>
            <h5 className="fw-bold mt-3">You've been unsubscribed</h5>
            <p className="text-muted mt-2">
              {email && <><strong>{email}</strong><br /></>}
              You will no longer receive notification emails from Beyalubet.
            </p>
            <p className="text-muted small">
              Note: account security emails (password reset, email verification) will still be sent.
            </p>
            <Link to="/" className="btn btn-outline-primary mt-2">Back to Beyalubet</Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontSize: 48 }}>❌</div>
            <h5 className="fw-bold mt-3">Unsubscribe failed</h5>
            <p className="text-muted mt-2">{message}</p>
            <Link to="/" className="btn btn-outline-secondary mt-2">Back to Home</Link>
          </>
        )}
      </div>
    </div>
  )
}
