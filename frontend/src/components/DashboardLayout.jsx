import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BuyerTopBar from './BuyerTopBar'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function DashboardLayout() {
  const { isAuthenticated, isBuyer, loading } = useAuth()
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
        <Outlet />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)' }}>
      {isAuthenticated && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#f0f2f5' }}>
        <Outlet />
      </div>
    </div>
  )
}
