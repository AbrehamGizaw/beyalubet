import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// On 401: try to refresh; on failure, clear and redirect
api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      const refresh = localStorage.getItem('refresh')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
          localStorage.setItem('access', data.access)
          orig.headers.Authorization = `Bearer ${data.access}`
          return api(orig)
        } catch {
          localStorage.removeItem('access')
          localStorage.removeItem('refresh')
          localStorage.removeItem('user')
          window.location.href = '/auth/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
