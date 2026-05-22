import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import Spinner from '../components/Spinner'
import ProductCard from '../components/ProductCard'

function Stars({ rating, size = 'fs-6' }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(n => (
        <i key={n} className={`bi bi-star${n <= rating ? '-fill' : ''} text-warning ${size}`} />
      ))}
    </span>
  )
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="d-flex gap-1 mb-2">
      {[1, 2, 3, 4, 5].map(n => (
        <i key={n}
          className={`bi bi-star${n <= (hover || value) ? '-fill' : ''} text-warning fs-3`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        />
      ))}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const { isAuthenticated, isBuyer, isSeller, user } = useAuth()
  const { addToCart } = useCart()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState(null)

  // reviews state
  const [reviews, setReviews] = useState([])
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' })
  const [inlineEdit, setInlineEdit] = useState(null) // { id, rating, comment }
  const [submitLoading, setSubmitLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [reviewMsg, setReviewMsg] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/products/${slug}/`)
        if (cancelled) return
        setProduct(data)
        setActiveImg(0)
        if (data.category_slug) {
          api.get(`/products/?category=${data.category_slug}&limit=4`).then(rel =>
            !cancelled && setRelated((rel.data.results || []).filter(p => p.slug !== slug))
          ).catch(() => {})
        }
      } catch {
        if (!cancelled) navigate('/products')
      } finally {
        if (!cancelled) setLoading(false)
      }
      // fetch reviews independently — a failure here must not affect the product page
      try {
        const { data } = await api.get(`/products/${slug}/reviews/`)
        if (!cancelled) setReviews(data)
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/products/${slug}/reviews/`)
      setReviews(data)
    } catch {}
  }

  const refreshStats = async () => {
    try {
      const { data } = await api.get(`/products/${slug}/`)
      setProduct(data)
    } catch {}
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!newReview.rating) {
      setReviewMsg({ type: 'danger', text: t('selectStarRating') })
      return
    }
    setSubmitLoading(true)
    setReviewMsg(null)
    try {
      const { data } = await api.post(`/products/${slug}/reviews/`, newReview)
      setReviews(prev => [data, ...prev])
      setNewReview({ rating: 0, comment: '' })
      setReviewMsg({ type: 'success', text: t('reviewSubmitted') })
      await refreshStats()
    } catch (err) {
      const d = err.response?.data
      const text = (typeof d === 'string' ? d : null)
        || d?.detail
        || (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : null)
        || err.message
        || t('failedSubmitReview')
      setReviewMsg({ type: 'danger', text })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReviewUpdate = async () => {
    if (!inlineEdit?.rating) return
    setEditLoading(true)
    try {
      const { data } = await api.patch(`/products/${slug}/reviews/${inlineEdit.id}/`, {
        rating: inlineEdit.rating, comment: inlineEdit.comment,
      })
      setReviews(prev => prev.map(r => r.id === inlineEdit.id ? data : r))
      setInlineEdit(null)
      await refreshStats()
    } catch {
      alert('Failed to update review.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Delete your review?')) return
    try {
      await api.delete(`/products/${slug}/reviews/${reviewId}/`)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      if (inlineEdit?.id === reviewId) setInlineEdit(null)
      setReviewMsg({ type: 'success', text: t('reviewDeleted') })
      await refreshStats()
    } catch {
      setReviewMsg({ type: 'danger', text: t('failedDeleteReview') })
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) return navigate('/auth/login')
    if (!isBuyer) return
    setAdding(true)
    try {
      await addToCart(product.id)
      setMsg({ type: 'success', text: t('addedToCart') })
    } catch (e) {
      setMsg({ type: 'danger', text: e.response?.data?.detail || t('couldNotAddToCart') })
    } finally {
      setAdding(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  if (loading) return <Spinner />
  if (!product) return null

  const imgs = product.images || []
  const currentImg = imgs[activeImg]?.image || product.main_image

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav className="mb-3"><ol className="breadcrumb small">
        <li className="breadcrumb-item"><Link to="/">{t('homeLabel')}</Link></li>
        <li className="breadcrumb-item"><Link to="/products">{t('products')}</Link></li>
        {product.category_name && (
          <li className="breadcrumb-item"><Link to={`/products?category=${product.category_slug}`}>{lang === 'am' ? (product.category_name_am || product.category_name) : product.category_name}</Link></li>
        )}
        <li className="breadcrumb-item active">{product.title.slice(0, 30)}</li>
      </ol></nav>

      {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}

      <div className="row g-4">
        {/* Gallery */}
        <div className="col-md-5">
          <div className="border rounded-3 overflow-hidden bg-light d-flex align-items-center justify-content-center mb-2"
            style={{ height: 380 }}>
            {currentImg
              ? <img src={currentImg} className="img-fluid" style={{ maxHeight: 380, objectFit: 'contain' }} alt={product.title} />
              : <i className="bi bi-image display-1 text-muted" />}
          </div>
          {imgs.length > 1 && (
            <div className="d-flex gap-2 overflow-auto">
              {imgs.map((img, i) => (
                <img key={img.id} src={img.image} onClick={() => setActiveImg(i)}
                  className={`rounded border cursor-pointer ${i === activeImg ? 'border-primary border-2' : ''}`}
                  style={{ width: 60, height: 60, objectFit: 'cover', cursor: 'pointer' }} alt="" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="col-md-7">
          {product.category_name && (
            <Link to={`/products?category=${product.category_slug}`}
              className="badge bg-primary text-decoration-none mb-2">
              <i className={`bi ${product.category_icon} me-1`} />{lang === 'am' ? (product.category_name_am || product.category_name) : product.category_name}
            </Link>
          )}
          <h2 className="fw-bold mb-2">{product.title}</h2>

          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="fs-2 fw-bold text-primary">ETB {product.price}</span>
            {product.original_price && <>
              <span className="fs-5 text-muted text-decoration-line-through">ETB {product.original_price}</span>
              <span className="badge bg-danger fs-6">-{product.discount_percentage}% OFF</span>
            </>}
          </div>

          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="badge bg-light text-dark border"><i className="bi bi-tag me-1" />{product.condition}</span>
            {product.location && <span className="badge bg-light text-dark border"><i className="bi bi-geo-alt me-1" />{product.location}</span>}
            <span className={`badge bg-${product.stock > 0 ? 'success' : 'danger'}`}>
              {product.stock > 0 ? `${product.stock} ${t('inStock')}` : t('outOfStock')}
            </span>
            <span className="badge bg-light text-dark border"><i className="bi bi-eye me-1" />{product.views} views</span>
          </div>

          <h6 className="fw-bold text-muted text-uppercase small mb-2">{t('description')}</h6>
          <p className="text-muted mb-4" style={{ whiteSpace: 'pre-line' }}>{product.description}</p>

          {/* Seller */}
          <div className="card bg-light border-0 p-3 mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 50, height: 50 }}>
                <i className="bi bi-shop fs-4 text-primary" />
              </div>
              <div>
                <h6 className="mb-0 fw-bold">{product.seller_business || product.seller_name}</h6>
                <small className="text-muted">{t('verifiedSeller')}</small>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isAuthenticated ? (
            isBuyer ? (
              <div className="d-flex gap-3">
                <button className="btn btn-primary btn-lg px-4" onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}>
                  <i className="bi bi-cart-plus me-2" />{adding ? t('adding') : product.stock === 0 ? t('outOfStock') : t('addToCart')}
                </button>
                <Link to="/cart" className="btn btn-outline-primary btn-lg px-4">
                  <i className="bi bi-cart3 me-2" />{t('viewCart')}
                </Link>
              </div>
            ) : isSeller && user?.id === product.seller ? (
              <div className="d-flex gap-2">
                <Link to={`/seller/products/${product.slug}/edit`} className="btn btn-warning px-4">
                  <i className="bi bi-pencil me-2" />{t('editProduct')}
                </Link>
              </div>
            ) : null
          ) : (
            <div className="alert alert-info">
              <Link to="/auth/login">{t('login')}</Link>{' '}{t('or')}{' '}
              <Link to="/auth/register">{t('register')}</Link>{' '}{t('asBuyerToPurchase')}
            </div>
          )}
        </div>
      </div>

      {/* Seller Payment Info */}
      {isBuyer && product.seller_payment && (product.seller_payment.bank_name || product.seller_payment.mobile_money) && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-header bg-success text-white py-2">
            <h6 className="mb-0"><i className="bi bi-credit-card me-2" />{t('sellerPaymentInfo')}</h6>
          </div>
          <div className="card-body">
            <p className="text-muted small mb-3">{t('payDirectlyToSeller')}</p>
            <div className="row g-3">
              {product.seller_payment.bank_name && (
                <div className="col-md-6">
                  <div className="bg-light rounded p-3">
                    <h6 className="fw-bold mb-2"><i className="bi bi-bank me-2 text-primary" />{t('bankTransfer')}</h6>
                    <table className="table table-sm table-borderless mb-0 small">
                      <tbody>
                        <tr><td className="text-muted">{t('bankName')}:</td><td className="fw-semibold">{product.seller_payment.bank_name}</td></tr>
                        <tr><td className="text-muted">{t('accountNumber')}:</td><td className="fw-semibold">{product.seller_payment.account_number}</td></tr>
                        <tr><td className="text-muted">{t('accountHolder')}:</td><td className="fw-semibold">{product.seller_payment.account_holder}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {product.seller_payment.mobile_money && (
                <div className="col-md-6">
                  <div className="bg-light rounded p-3">
                    <h6 className="fw-bold mb-2"><i className="bi bi-phone me-2 text-success" />{t('mobileMoneyLabel')}</h6>
                    <p className="fw-semibold mb-0">{product.seller_payment.mobile_money}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      <div className="mt-5">
        <div className="d-flex align-items-center gap-3 mb-4">
          <h4 className="fw-bold mb-0">{t('customerReviews')}</h4>
          {product.review_stats?.count > 0 && (
            <div className="d-flex align-items-center gap-2">
              <Stars rating={Math.round(product.review_stats.average)} />
              <span className="fw-bold fs-5">{product.review_stats.average}</span>
              <span className="text-muted small">({product.review_stats.count} review{product.review_stats.count !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        {/* Write new review — buyers only, not their own product */}
        {isBuyer && product.seller !== user?.id && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className="bi bi-pencil-square me-2" />{t('writeReview')}
            </div>
            <div className="card-body p-4">
              {reviewMsg && (
                <div className={`alert alert-${reviewMsg.type} py-2 mb-3`}>{reviewMsg.text}</div>
              )}
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('yourRating')} *</label>
                  <StarPicker value={newReview.rating}
                    onChange={v => setNewReview(f => ({ ...f, rating: v }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('comment')} <span className="text-muted small">(optional)</span></label>
                  <textarea className="form-control" rows={3}
                    value={newReview.comment}
                    onChange={e => setNewReview(f => ({ ...f, comment: e.target.value }))}
                    placeholder={t('reviewPlaceholder')} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading
                    ? <><span className="spinner-border spinner-border-sm me-2" />{t('submitting')}</>
                    : <><i className="bi bi-check-circle me-2" />{t('submitReview')}</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <div className="text-center text-muted py-4">
            <i className="bi bi-chat-square-text display-4 d-block mb-2" />
            {t('noReviewsYet')}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {reviews.map(r => (
              <div key={r.id} className={`card border-0 shadow-sm ${r.is_mine ? 'border-start border-primary border-3' : ''}`}>
                <div className="card-body p-3">
                  {inlineEdit?.id === r.id ? (
                    <div>
                      <StarPicker value={inlineEdit.rating}
                        onChange={v => setInlineEdit(ie => ({ ...ie, rating: v }))} />
                      <textarea className="form-control mb-2" rows={2} value={inlineEdit.comment}
                        onChange={e => setInlineEdit(ie => ({ ...ie, comment: e.target.value }))} />
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-primary" onClick={handleReviewUpdate} disabled={editLoading}>
                          {editLoading ? <span className="spinner-border spinner-border-sm" /> : t('save')}
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setInlineEdit(null)}>{t('cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 34, height: 34 }}>
                            <i className="bi bi-person-fill text-primary small" />
                          </div>
                          <div>
                            <span className="fw-semibold">{r.buyer_name}</span>
                            {r.is_mine && <span className="badge bg-primary ms-2 small">{t('you')}</span>}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <small className="text-muted">{new Date(r.created_at).toLocaleDateString()}</small>
                          {r.is_mine && <>
                            <button className="btn btn-outline-secondary btn-sm py-0 px-1"
                              onClick={() => setInlineEdit({ id: r.id, rating: r.rating, comment: r.comment })}>
                              <i className="bi bi-pencil" style={{ fontSize: 12 }} />
                            </button>
                            <button className="btn btn-outline-danger btn-sm py-0 px-1"
                              onClick={() => handleDeleteReview(r.id)}>
                              <i className="bi bi-trash" style={{ fontSize: 12 }} />
                            </button>
                          </>}
                        </div>
                      </div>
                      <Stars rating={r.rating} size="fs-6" />
                      {r.comment && <p className="mb-0 mt-2 text-muted">{r.comment}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-5">
          <h4 className="fw-bold mb-3">{t('relatedProducts')}</h4>
          <div className="row g-3">{related.map(p => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      )}
    </div>
  )
}
