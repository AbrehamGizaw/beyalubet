import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

function Stars({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(n => (
        <i key={n} className={`bi bi-star${n <= rating ? '-fill' : ''} text-warning`} style={{ fontSize: 12 }} />
      ))}
    </span>
  )
}

export default function AdminReviews() {
  const { t } = useLanguage()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [rating, setRating] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = (search = q, r = rating) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (r) params.set('rating', r)
    api.get(`/admin/reviews/?${params}`)
      .then(res => setReviews(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => { e.preventDefault(); load() }

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this review?')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/reviews/${id}/`)
      setReviews(prev => prev.filter(r => r.id !== id))
    } catch {
      alert('Failed to delete review.')
    } finally {
      setDeleting(null)
    }
  }

  const ratingFilter = (r) => { setRating(r); load(q, r) }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0"><i className="bi bi-chat-square-text me-2 text-primary" />{t('manageReviews')}</h2>
        <span className="badge bg-secondary ms-auto">{reviews.length} {t('reviews')}</span>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <form className="row g-3 align-items-end" onSubmit={handleSearch}>
            <div className="col-sm-5">
              <label className="form-label small fw-semibold">{t('search')}</label>
              <input className="form-control" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Product, buyer, comment…" />
            </div>
            <div className="col-sm-3">
              <label className="form-label small fw-semibold">{t('rating')}</label>
              <select className="form-select" value={rating} onChange={e => ratingFilter(e.target.value)}>
                <option value="">{t('allRatings')}</option>
                {[5,4,3,2,1].map(n => (
                  <option key={n} value={n}>{n} ★</option>
                ))}
              </select>
            </div>
            <div className="col-sm-2">
              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-search me-1" />{t('search')}
              </button>
            </div>
            <div className="col-sm-2">
              <button type="button" className="btn btn-outline-secondary w-100"
                onClick={() => { setQ(''); setRating(''); load('', '') }}>
                {t('clearFilters')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? <Spinner /> : reviews.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-chat-square-text display-1 d-block mb-3" />
          {t('noReviewsFound')}
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>{t('product')}</th>
                  <th>{t('seller')}</th>
                  <th>{t('buyer')}</th>
                  <th>{t('rating')}</th>
                  <th>{t('comment')}</th>
                  <th>{t('date')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r, i) => (
                  <tr key={r.id}>
                    <td className="text-muted small">{i + 1}</td>
                    <td>
                      <Link to={`/products/${r.product_slug}`} className="fw-semibold small text-decoration-none">
                        {r.product_title}
                      </Link>
                    </td>
                    <td className="small text-muted">{r.seller_name}</td>
                    <td className="small fw-semibold">{r.buyer_name}</td>
                    <td><Stars rating={r.rating} /></td>
                    <td className="small text-muted" style={{ maxWidth: 240 }}>
                      {r.comment
                        ? <span title={r.comment}>{r.comment.length > 80 ? r.comment.slice(0, 80) + '…' : r.comment}</span>
                        : <span className="text-muted fst-italic">{t('noComment')}</span>}
                    </td>
                    <td className="small text-muted text-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={deleting === r.id}
                        onClick={() => handleDelete(r.id)}>
                        {deleting === r.id
                          ? <span className="spinner-border spinner-border-sm" />
                          : <i className="bi bi-trash" />}
                      </button>
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
