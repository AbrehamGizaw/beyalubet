import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

const ROLE_COLOR = { seller: 'warning text-dark', buyer: 'primary' }
const SUB_COLOR = { active: 'success', pending: 'warning text-dark', cancelled: 'danger', null: 'secondary' }

export default function AdminUsers() {
  const { t } = useLanguage()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [q, setQ] = useState('')
  const [toggling, setToggling] = useState(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter) params.set('role', filter)
    if (q) params.set('q', q)
    api.get(`/admin/users/?${params}`).then(r => setUsers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleSearch = (e) => { e.preventDefault(); load() }

  const toggleActive = async (user) => {
    setToggling(user.id)
    try {
      await api.patch(`/admin/users/${user.id}/`, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0"><i className="bi bi-people me-2 text-primary" />{t('manageUsers')}</h2>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <form className="row g-3 align-items-end" onSubmit={handleSearch}>
            <div className="col-sm-4">
              <label className="form-label small fw-semibold">{t('search')}</label>
              <input className="form-control" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Username, email, name…" />
            </div>
            <div className="col-sm-3">
              <label className="form-label small fw-semibold">{t('role')}</label>
              <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">{t('all')}</option>
                <option value="buyer">{t('buyers')}</option>
                <option value="seller">{t('sellers')}</option>
              </select>
            </div>
            <div className="col-sm-2">
              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-search me-1" />{t('search')}
              </button>
            </div>
            <div className="col-sm-2">
              <div className="text-muted small pt-2">{users.length} {t('usersFound')}</div>
            </div>
          </form>
        </div>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-people display-1 text-muted" />
          <h4 className="mt-3 text-muted">{t('noUsersFound')}</h4>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr>
                <th>{t('userLabel')}</th><th>{t('role')}</th><th>{t('contact')}</th><th>{t('joined')}</th>
                <th>{t('activity')}</th><th>{t('subscription')}</th><th>{t('status')}</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
                    <td>
                      <div className="fw-semibold small">{u.full_name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>@{u.username}</div>
                    </td>
                    <td>
                      <span className={`badge bg-${ROLE_COLOR[u.role] || 'secondary'}`}>{u.role}</span>
                    </td>
                    <td>
                      <div className="small d-flex align-items-center gap-1 flex-wrap">
                        <span className="text-muted">{u.email || '—'}</span>
                        {u.is_email_verified
                          ? <span className="badge bg-success" style={{ fontSize: 10 }}>Verified</span>
                          : <span className="badge bg-danger" style={{ fontSize: 10 }}>Unverified</span>
                        }
                      </div>
                      <div className="small text-muted">{u.phone || '—'}</div>
                    </td>
                    <td className="small text-muted">{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td className="small">
                      {u.role === 'buyer' && u.order_count != null && (
                        <span><i className="bi bi-bag me-1 text-primary" />{u.order_count} orders</span>
                      )}
                      {u.role === 'seller' && u.product_count != null && (
                        <span><i className="bi bi-box-seam me-1 text-warning" />{u.product_count} products</span>
                      )}
                    </td>
                    <td>
                      {u.role === 'seller' ? (
                        <span className={`badge bg-${SUB_COLOR[u.subscription_status] || 'secondary'}`}>
                          {u.subscription_status || 'none'}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="form-check form-switch mb-0">
                        <input className="form-check-input" type="checkbox"
                          checked={u.is_active} disabled={toggling === u.id}
                          onChange={() => toggleActive(u)} />
                        <label className="form-check-label small">
                          {u.is_active ? t('active') : t('disabled')}
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
