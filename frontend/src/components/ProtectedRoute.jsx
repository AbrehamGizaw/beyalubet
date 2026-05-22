import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}
