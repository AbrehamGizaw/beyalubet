import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import ProductCard from '../components/ProductCard'
import { useLanguage } from '../context/LanguageContext'

function Stars({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(n => (
        <i key={n} className={`bi bi-star${n <= Math.round(rating) ? '-fill' : ''} text-warning`} style={{ fontSize: 13 }} />
      ))}
    </span>
  )
}

export default function SellerPage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { lang } = useLanguage()

  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [ordering, setOrdering] = useState('-created_at')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (ordering) params.set('ordering', ordering)
    api.get(`/sellers/${username}/?${params}`)
      .then(r => setSeller(r.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [username, category, ordering])

  if (loading) return <div className="container py-5"><Spinner /></div>
  if (!seller) return null

  const filtered = seller.products || []

  return (
    <div className="container py-5">

      {/* Back */}
      <button className="btn btn-link text-decoration-none ps-0 text-secondary mb-3"
        onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-1" />Back
      </button>

      {/* Seller header */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 80, height: 80 }}>
              <i className="bi bi-shop fs-2 text-primary" />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h4 className="fw-bold mb-0">{seller.business_name}</h4>
                {seller.is_email_verified && (
                  <i className="bi bi-patch-check-fill" style={{ color: '#1d9bf0', fontSize: 20 }}
                    title="Email Verified" />
                )}
                {seller.is_verified && (
                  <span className="badge bg-success">
                    <i className="bi bi-shield-check me-1" />Verified Seller
                  </span>
                )}
              </div>
              <div className="text-muted small mb-2">@{seller.username}</div>
              {seller.business_description && (
                <p className="text-muted small mb-0" style={{ maxWidth: 520 }}>
                  {seller.business_description}
                </p>
              )}
            </div>
            <div className="d-flex gap-4 flex-shrink-0 text-center">
              <div>
                <div className="fw-bold fs-5">{seller.total_products}</div>
                <div className="text-muted small">Products</div>
              </div>
              {seller.avg_rating > 0 && (
                <div>
                  <div className="fw-bold fs-5 d-flex align-items-center gap-1">
                    {seller.avg_rating} <Stars rating={seller.avg_rating} />
                  </div>
                  <div className="text-muted small">Avg Rating</div>
                </div>
              )}
              <div>
                <div className="fw-bold fs-5">{new Date(seller.date_joined).getFullYear()}</div>
                <div className="text-muted small">Member since</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3 d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-grow-1 flex-wrap">
            <span className="small fw-semibold text-muted">Category:</span>
            <button className={`btn btn-sm ${category === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setCategory('')}>All</button>
            {seller.categories.map(cat => (
              <button key={cat.id}
                className={`btn btn-sm ${category === cat.slug ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setCategory(cat.slug)}>
                <i className={`bi ${cat.icon || 'bi-grid'} me-1`} />
                {lang === 'am' ? (cat.name_am || cat.name) : cat.name}
              </button>
            ))}
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-semibold text-muted">Sort:</span>
            <select className="form-select form-select-sm" style={{ width: 'auto' }}
              value={ordering} onChange={e => setOrdering(e.target.value)}>
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="price">Price: low → high</option>
              <option value="-price">Price: high → low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-box-seam display-1 text-muted" />
          <h4 className="mt-3 text-muted">No products found</h4>
          {category && (
            <button className="btn btn-outline-primary mt-2" onClick={() => setCategory('')}>
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="text-muted small">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="row g-3">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  )
}
