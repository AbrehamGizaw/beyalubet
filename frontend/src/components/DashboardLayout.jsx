import { useState, useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import BuyerTopBar from './BuyerTopBar'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'
import api from '../api/axios'

function EmailVerificationBanner({ user }) {
  const [state, setState] = useState(null) // null | 'sending' | 'sent' | 'error'

  const resend = async () => {
    setState('sending')
    try {
      await api.post('/auth/resend-verification/')
      setState('sent')
    } catch {
      setState('error')
    }
  }

  if (!user || user.is_email_verified) return null

  return (
    <div style={{
      background: '#fff3cd', borderBottom: '1px solid #ffc107',
      padding: '8px 20px', fontSize: 13, textAlign: 'center',
    }}>
      <i className="bi bi-envelope-exclamation me-2 text-warning" />
      <strong>Email not verified.</strong> Check your inbox for the verification link.{' '}
      {state === 'sent' && <span className="text-success ms-1"><i className="bi bi-check-circle me-1" />Email sent!</span>}
      {state === 'error' && <span className="text-danger ms-1">Failed to send. Try again later.</span>}
      {(state === null || state === 'sending') && (
        <button className="btn btn-link btn-sm p-0 ms-1 fw-semibold"
          style={{ fontSize: 13, color: '#856404', textDecoration: 'underline' }}
          onClick={resend} disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Resend email'}
        </button>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const { user, isAuthenticated, isBuyer, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(window.innerWidth < 900)

  useEffect(() => {
    const handler = () => setCollapsed(window.innerWidth < 900)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (loading) return <Spinner />

  // Buyers get a top-tab bar instead of the sidebar
  if (isBuyer) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f0f2f5' }}>
        <BuyerTopBar />
        <EmailVerificationBanner user={user} />
        <Outlet />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)' }}>
      {isAuthenticated && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#f0f2f5' }}>
        <EmailVerificationBanner user={user} />
        <Outlet />
      </div>
    </div>
  )
}
