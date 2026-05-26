import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const ROLE_COLOR = { seller: 'warning text-dark', buyer: 'primary' }

export default function AdminArchivedUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [actionId, setActionId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // user obj to permanently delete

  const load = (search = q) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    api.get(`/admin/archived-users/?${params}`)
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = e => { e.preventDefault(); load() }

  const restore = async (user) => {
    setActionId(user.id)
    try {
      await api.patch(`/admin/archived-users/${user.id}/`, { action: 'restore' })
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } finally {
      setActionId(null)
    }
  }

  const permanentDelete = async () => {
    if (!confirmDelete) return
    setActionId(confirmDelete.id)
    try {
      await api.delete(`/admin/archived-users/${confirmDelete.id}/`)
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.id))
      setConfirmDelete(null)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-link text-decoration-none ps-0 text-secondary"
          onClick={() => navigate('/admin/users')}>
          <i className="bi bi-arrow-left me-1" />Users
        </button>
        <h2 className="fw-bold mb-0">
          <i className="bi bi-archive me-2 text-danger" />Archived Users
        </h2>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <form className="row g-3 align-items-end" onSubmit={handleSearch}>
            <div className="col-sm-5">
              <label className="form-label small fw-semibold">Search</label>
              <input className="form-control" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Username, email, name…" />
            </div>
            <div className="col-sm-2">
              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-search me-1" />Search
              </button>
            </div>
            <div className="col-sm-3">
              <div className="text-muted small pt-2">{users.length} archived user{users.length !== 1 ? 's' : ''}</div>
            </div>
          </form>
        </div>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-archive display-1 text-muted" />
          <h4 className="mt-3 text-muted">No archived users</h4>
          <p className="text-muted">Archived users will appear here.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Archived On</th>
                  <th>Archived By</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="opacity-75">
                    <td>
                      <div className="fw-semibold small">{u.full_name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>@{u.username}</div>
                    </td>
                    <td>
                      <span className={`badge bg-${ROLE_COLOR[u.role] || 'secondary'}`}>{u.role}</span>
                    </td>
                    <td>
                      <div className="small text-muted">{u.email || '—'}</div>
                      <div className="small text-muted">{u.phone || '—'}</div>
                    </td>
                    <td className="small text-muted">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                    <td className="small text-muted">
                      {u.deleted_at ? new Date(u.deleted_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="small text-muted">
                      {u.deleted_by ? `@${u.deleted_by}` : '—'}
                    </td>
                    <td className="small text-muted" style={{ maxWidth: 180 }}>
                      <span title={u.deletion_reason}>
                        {u.deletion_reason
                          ? u.deletion_reason.length > 50
                            ? u.deletion_reason.slice(0, 50) + '…'
                            : u.deletion_reason
                          : <span className="text-muted fst-italic">No reason</span>
                        }
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-success"
                          disabled={actionId === u.id}
                          onClick={() => restore(u)}>
                          {actionId === u.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <><i className="bi bi-arrow-counterclockwise me-1" />Restore</>
                          }
                        </button>
                        <button className="btn btn-sm btn-outline-danger"
                          disabled={actionId === u.id}
                          onClick={() => setConfirmDelete(u)}>
                          <i className="bi bi-trash me-1" />Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permanent delete confirmation modal */}
      {confirmDelete && (
        <div className="modal show d-block" tabIndex="-1"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2" />Permanently Delete
                </h5>
                <button className="btn-close" onClick={() => setConfirmDelete(null)} />
              </div>
              <div className="modal-body pt-2">
                <p>
                  This will <strong>permanently delete</strong> <strong>@{confirmDelete.username}</strong> and
                  all their data. This action <strong>cannot be undone</strong>.
                </p>
                <div className="alert alert-danger py-2 small mb-0">
                  <i className="bi bi-exclamation-circle me-1" />
                  All orders, products, reviews, and subscriptions linked to this user will also be removed.
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={permanentDelete}
                  disabled={actionId === confirmDelete.id}>
                  {actionId === confirmDelete.id
                    ? <><span className="spinner-border spinner-border-sm me-1" />Deleting…</>
                    : <><i className="bi bi-trash me-1" />Delete Permanently</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
