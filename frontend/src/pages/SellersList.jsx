import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function SellersList() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [activeCat, setActiveCat] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    api.get(`/sellers/${params}`)
      .then(r => setSellers(r.data))
      .catch(() => setError('Failed to load sellers. Please try again.'))
      .finally(() => setLoading(false))
  }, [q])

  // collect all unique categories across all sellers
  const allCats = Object.values(
    sellers.flatMap(s => s.categories || []).reduce((acc, c) => {
      acc[c.slug] = c
      return acc
    }, {})
  )

  const visible = activeCat
    ? sellers.filter(s => s.categories?.some(c => c.slug === activeCat))
    : sellers

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button className="btn btn-link text-decoration-none ps-0 text-secondary"
          onClick={() => navigate('/dashboard')}>
          <i className="bi bi-arrow-left me-1" />Dashboard
        </button>
        <h3 className="fw-bold mb-0">
          <i className="bi bi-shop me-2 text-primary" />Browse Sellers
        </h3>
        {!loading && (
          <span className="badge bg-secondary">{visible.length} seller{visible.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Search + filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-start">
            <div className="col-md-4">
              <input className="form-control" placeholder="Search by name or username…"
                value={q} onChange={e => setQ(e.target.value)} />
            </div>
            {allCats.length > 0 && (
              <div className="col-md-8">
                <div className="d-flex flex-wrap gap-2">
                  <button className={`btn btn-sm ${activeCat === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveCat('')}>
                    <i className="bi bi-grid me-1" />All
                  </button>
                  {allCats.map(cat => (
                    <button key={cat.slug}
                      className={`btn btn-sm ${activeCat === cat.slug ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setActiveCat(cat.slug)}>
                      <i className={`bi ${cat.icon || 'bi-grid'} me-1`} />
                      {lang === 'am' ? (cat.name_am || cat.name) : cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-shop display-1 text-muted" />
          <h4 className="mt-3 text-muted">No sellers found</h4>
          {(q || activeCat) && (
            <button className="btn btn-outline-primary mt-2"
              onClick={() => { setQ(''); setActiveCat('') }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {visible.map(seller => (
            <div key={seller.id} className="col-sm-6 col-md-4 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4 d-flex flex-column">

                  {/* Avatar + name */}
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 52, height: 52 }}>
                      <i className="bi bi-shop text-primary fs-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="d-flex align-items-center gap-1 flex-wrap">
                        <span className="fw-bold text-truncate">{seller.business_name}</span>
                        {seller.is_email_verified && (
                          <i className="bi bi-patch-check-fill flex-shrink-0"
                            style={{ color: '#1d9bf0', fontSize: 14 }} title="Verified" />
                        )}
                      </div>
                      <div className="text-muted small">@{seller.username}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="d-flex gap-3 mb-3 small text-muted">
                    <span><i className="bi bi-box-seam me-1" />{seller.product_count} products</span>
                    {seller.avg_rating > 0 && (
                      <span><i className="bi bi-star-fill text-warning me-1" />{seller.avg_rating}</span>
                    )}
                  </div>

                  {/* Category badges */}
                  {seller.categories?.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {seller.categories.slice(0, 3).map((c, i) => (
                        <span key={i} className="badge bg-light text-dark border" style={{ fontSize: 10 }}>
                          <i className={`bi ${c.icon || 'bi-grid'} me-1`} />
                          {lang === 'am' ? (c.name_am || c.name) : c.name}
                        </span>
                      ))}
                      {seller.categories.length > 3 && (
                        <span className="badge bg-light text-muted border" style={{ fontSize: 10 }}>
                          +{seller.categories.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <Link to={`/sellers/${seller.username}`}
                    className="btn btn-outline-primary btn-sm mt-auto">
                    <i className="bi bi-grid me-1" />View Products
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
