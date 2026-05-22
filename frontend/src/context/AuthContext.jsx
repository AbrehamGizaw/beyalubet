import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (token && !user) {
      api.get('/auth/me/').then(r => {
        setUser(r.data)
        localStorage.setItem('user', JSON.stringify(r.data))
      }).catch(() => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        localStorage.removeItem('user')
        setUser(null)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const { data } = await api.post('/auth/token/', { username, password })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    const me = await api.get('/auth/me/')
    localStorage.setItem('user', JSON.stringify(me.data))
    setUser(me.data)
    return me.data
  }

  const register = async (formData) => {
    const { data } = await api.post('/auth/register/', formData)
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me/')
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      isSeller: user?.role === 'seller',
      isBuyer: user?.role === 'buyer',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
