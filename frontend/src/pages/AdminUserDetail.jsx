import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const ROLE_COLOR = { seller: 'warning text-dark', buyer: 'primary', admin: 'danger' }
const SUB_COLOR = { active: 'success', pending: 'warning text-dark', cancelled: 'danger', expired: 'secondary' }
const ORDER_COLOR = {
  pending: 'warning text-dark', confirmed: 'info', processing: 'primary',
  shipped: 'info text-dark', delivered: 'success', cancelled: 'danger',
}

function StatCard({ icon, label, value, color = 'primary' }) {
  return (
    <div className="col">
      <div className="card border-0 shadow-sm text-center p-3 h-100">
        <i className={`bi bi-${icon} fs-2 text-${color}`} />
        <div className="fw-bold fs-5 mt-1">{value}</div>
        <div className="text-muted small">{label}</div>
      </div>
    </div>
  )
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    api.get(`/admin/users/${id}/`)
      .then(r => setUser(r.data))
      .finally(() => setLoading(false))
  }, [id])

  const toggleActive = async () => {
    setToggling(true)
    try {
      await api.patch(`/admin/users/${id}/`, { is_active: !user.is_active })
      setUser(prev => ({ ...prev, is_active: !prev.is_active }))
    } finally {
      setToggling(false)
    }
  }

  if (loading) return <div className="container py-5"><Spinner /></div>
  if (!user) return (
    <div className="container py-5 text-center">
      <h4 className="text-muted">User not found</h4>
      <button className="btn btn-primary mt-3" onClick={() => navigate('/admin/users')}>Back to Users</button>
    </div>
  )

  const isBuyer = user.role === 'buyer'
  const isSeller = user.role === 'seller'

  return (
    <div className="container py-5">

      {/* Back */}
      <button className="btn btn-link text-decoration-none ps-0 mb-3 text-secondary"
        onClick={() => navigate('/admin/users')}>
        <i className="bi bi-arrow-left me-1" />Back to Users
      </button>

      {/* Header */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            {user.profile_image
              ? <img src={user.profile_image} alt="" className="rounded-circle border"
                  style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }} />
              : (
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
                  style={{ width: 72, height: 72, fontSize: 28, flexShrink: 0 }}>
                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                </div>
              )
            }
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h4 className="fw-bold mb-0">{user.full_name}</h4>
                <span className={`badge bg-${ROLE_COLOR[user.role]}`}>{user.role}</span>
                {!user.is_active && <span className="badge bg-secondary">Disabled</span>}
              </div>
              <div className="text-muted small">@{user.username}</div>
            </div>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <span className="small text-muted">{user.is_active ? 'Active' : 'Disabled'}</span>
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" role="switch"
                  checked={user.is_active} disabled={toggling} onChange={toggleActive} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">

        {/* Left: profile + business info */}
        <div className="col-lg-4">

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent fw-semibold py-3">
              <i className="bi bi-person me-2 text-primary" />Profile Info
            </div>
            <div className="card-body">
              <dl className="row mb-0" style={{ fontSize: 14 }}>
                <dt className="col-5 text-muted">Email</dt>
                <dd className="col-7 mb-3">
                  <div>{user.email}</div>
                  {user.is_email_verified
                    ? <span className="badge bg-success mt-1" style={{ fontSize: 10 }}>Verified</span>
                    : <span className="badge bg-danger mt-1" style={{ fontSize: 10 }}>Unverified</span>
                  }
                </dd>
                <dt className="col-5 text-muted">Phone</dt>
                <dd className="col-7 mb-3">{user.phone || '—'}</dd>
                <dt className="col-5 text-muted">Role</dt>
                <dd className="col-7 mb-3 text-capitalize">{user.role}</dd>
                <dt className="col-5 text-muted">Joined</dt>
                <dd className="col-7 mb-0">{new Date(user.date_joined).toLocaleDateString()}</dd>
              </dl>
            </div>
          </div>

          {isSeller && user.seller_profile && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold py-3">
                <i className="bi bi-shop me-2 text-warning" />Business Info
              </div>
              <div className="card-body">
                <dl className="row mb-0" style={{ fontSize: 14 }}>
                  <dt className="col-5 text-muted">Business</dt>
                  <dd className="col-7 mb-3">{user.seller_profile.business_name || '—'}</dd>
                  <dt className="col-5 text-muted">Verified</dt>
                  <dd className="col-7 mb-3">
                    {user.seller_profile.is_verified
                      ? <span className="badge bg-success">Yes</span>
                      : <span className="badge bg-secondary">No</span>
                    }
                  </dd>
                  <dt className="col-5 text-muted">Bank</dt>
                  <dd className="col-7 mb-3">{user.seller_profile.bank_name || '—'}</dd>
                  <dt className="col-5 text-muted">Account #</dt>
                  <dd className="col-7 mb-3">{user.seller_profile.account_number || '—'}</dd>
                  <dt className="col-5 text-muted">Holder</dt>
                  <dd className="col-7 mb-3">{user.seller_profile.account_holder || '—'}</dd>
                  <dt className="col-5 text-muted">Telebirr</dt>
                  <dd className="col-7 mb-3">{user.seller_profile.telebirr_number || '—'}</dd>
                  <dt className="col-5 text-muted">Mobile</dt>
                  <dd className="col-7 mb-0">{user.seller_profile.mobile_money || '—'}</dd>
                </dl>
              </div>
            </div>
          )}

        </div>

        {/* Right: stats + history */}
        <div className="col-lg-8">

          {/* Stats */}
          {user.stats && (
            <div className="row row-cols-2 row-cols-sm-3 g-3 mb-4">
              {isBuyer && <>
                <StatCard icon="bag" label="Total Orders" value={user.stats.total_orders} />
                <StatCard icon="cash-coin" label="Total Spent"
                  value={`ETB ${Number(user.stats.total_spent).toLocaleString()}`} color="success" />
              </>}
              {isSeller && <>
                <StatCard icon="box-seam" label="All Products" value={user.stats.total_products} />
                <StatCard icon="box-seam-fill" label="Active" value={user.stats.active_products} color="success" />
                <StatCard icon="cash-coin" label="Revenue"
                  value={`ETB ${Number(user.stats.total_revenue).toLocaleString()}`} color="success" />
                <StatCard icon="cart-check" label="Orders Received" value={user.stats.total_orders} color="info" />
                <StatCard icon="star-fill" label="Avg Rating"
                  value={user.stats.avg_rating > 0 ? `${user.stats.avg_rating} ★` : '—'} color="warning" />
              </>}
            </div>
          )}

          {/* Buyer: orders */}
          {isBuyer && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold py-3">
                <i className="bi bi-bag me-2 text-primary" />
                Order History {user.orders?.length > 0 && `(${user.orders.length})`}
              </div>
              {user.orders?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead className="table-light">
                      <tr>
                        <th>Order #</th><th>Items</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.orders.map(o => (
                        <tr key={o.order_number}>
                          <td className="fw-semibold text-primary">{o.order_number}</td>
                          <td className="text-muted">
                            {o.items.map((it, i) => (
                              <div key={i}>{it.product_title} ×{it.quantity}</div>
                            ))}
                          </td>
                          <td>
                            <span className={`badge bg-${ORDER_COLOR[o.status] || 'secondary'}`}>{o.status}</span>
                          </td>
                          <td>
                            <span className={`badge bg-${o.payment_status === 'paid' ? 'success' : o.payment_status === 'pending' ? 'warning text-dark' : 'secondary'}`}>
                              {o.payment_status}
                            </span>
                          </td>
                          <td className="fw-semibold">ETB {Number(o.total_amount).toLocaleString()}</td>
                          <td className="text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-body text-center text-muted py-4">No orders yet</div>
              )}
            </div>
          )}

          {/* Buyer: reviews */}
          {isBuyer && user.reviews?.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold py-3">
                <i className="bi bi-star me-2 text-warning" />Reviews Written ({user.reviews.length})
              </div>
              <ul className="list-group list-group-flush">
                {user.reviews.map((r, i) => (
                  <li key={i} className="list-group-item px-4 py-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold small">{r.product_title}</div>
                        <div className="text-muted small mt-1">{r.comment || '—'}</div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div className="text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                        <div className="text-muted small">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seller: products */}
          {isSeller && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold py-3">
                <i className="bi bi-box-seam me-2 text-warning" />
                Products {user.products?.length > 0 && `(${user.products.length})`}
              </div>
              {user.products?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead className="table-light">
                      <tr><th>Title</th><th>Price</th><th>Stock</th><th>Views</th><th>Rating</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {user.products.map(p => (
                        <tr key={p.slug}>
                          <td className="fw-semibold">{p.title}</td>
                          <td>ETB {Number(p.price).toLocaleString()}</td>
                          <td>{p.stock}</td>
                          <td>{p.views}</td>
                          <td>{p.avg_rating ? `${Number(p.avg_rating).toFixed(1)} ★` : '—'}</td>
                          <td>
                            <span className={`badge bg-${p.is_active ? 'success' : 'secondary'}`}>
                              {p.is_active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-body text-center text-muted py-4">No products yet</div>
              )}
            </div>
          )}

          {/* Seller: subscriptions */}
          {isSeller && user.subscriptions?.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-semibold py-3">
                <i className="bi bi-credit-card me-2 text-success" />Subscription History ({user.subscriptions.length})
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                  <thead className="table-light">
                    <tr><th>Plan</th><th>Status</th><th>Start</th><th>End</th><th>Amount Paid</th></tr>
                  </thead>
                  <tbody>
                    {user.subscriptions.map((s, i) => (
                      <tr key={i}>
                        <td className="fw-semibold">{s.plan_name}</td>
                        <td>
                          <span className={`badge bg-${SUB_COLOR[s.status] || 'secondary'}`}>{s.status}</span>
                        </td>
                        <td className="text-muted">{s.start_date ? new Date(s.start_date).toLocaleDateString() : '—'}</td>
                        <td className="text-muted">{s.end_date ? new Date(s.end_date).toLocaleDateString() : '—'}</td>
                        <td>{s.amount_paid ? `ETB ${Number(s.amount_paid).toLocaleString()}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
