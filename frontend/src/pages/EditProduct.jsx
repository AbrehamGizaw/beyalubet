import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

function Stars({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(n => (
        <i key={n} className={`bi bi-star${n <= rating ? '-fill' : ''} text-warning`} />
      ))}
    </span>
  )
}

const CONDITIONS = ['new', 'used', 'refurbished']
const CONDITION_LABELS = { new: 'Brand New', used: 'Used', refurbished: 'Refurbished' }

export default function EditProduct() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [searchParams] = useSearchParams()
  const justCreated = searchParams.get('created') === '1'

  const [categories, setCategories] = useState([])
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(justCreated ? t('productCreated') : null)
  const [newImages, setNewImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [reviews, setReviews] = useState([])
  const [deletingReview, setDeletingReview] = useState(null)

  const [form, setForm] = useState({
    title: '', description: '', price: '', original_price: '',
    stock: 1, condition: 'new', category: '', location: '', is_active: true,
  })

  useEffect(() => {
    Promise.all([
      api.get('/products/categories/'),
      api.get(`/products/my-products/${slug}/`),
      api.get(`/products/${slug}/reviews/`),
    ]).then(([cats, prod, revs]) => {
      setCategories(cats.data)
      const p = prod.data
      setProduct(p)
      setForm({
        title: p.title || '',
        description: p.description || '',
        price: p.price || '',
        original_price: p.original_price || '',
        stock: p.stock || 0,
        condition: p.condition || 'new',
        category: p.category || '',
        location: p.location || '',
        is_active: p.is_active !== undefined ? p.is_active : true,
      })
      setReviews(revs.data)
    }).finally(() => setLoading(false))
  }, [slug])

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Remove this review from your product?')) return
    setDeletingReview(reviewId)
    try {
      await api.delete(`/products/${slug}/reviews/${reviewId}/`)
      setReviews(r => r.filter(x => x.id !== reviewId))
    } catch {
      alert('Failed to delete review.')
    } finally {
      setDeletingReview(null)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      newImages.forEach((img, i) => fd.append(`images[${i}]`, img))

      await api.patch(`/products/my-products/${slug}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(t('productUpdated'))
      setNewImages([])
      setPreviews([])
      window.scrollTo(0, 0)
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
        setError(msgs)
      } else {
        setError('Failed to update product.')
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteImage = async (imgId) => {
    if (!confirm('Remove this image?')) return
    try {
      await api.delete(`/products/my-products/${slug}/images/${imgId}/`)
      setProduct(p => ({ ...p, images: p.images.filter(i => i.id !== imgId) }))
    } catch {
      alert('Failed to remove image.')
    }
  }

  if (loading) return <Spinner />
  if (!product) return <div className="container py-5 text-center"><h4 className="text-muted">Product not found</h4></div>

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/seller/products" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" />{t('back')}
        </Link>
        <div>
          <h3 className="fw-bold mb-0">{t('editProductTitle')}</h3>
          <small className="text-muted">{product.title}</small>
        </div>
      </div>

      {success && <div className="alert alert-success py-2 mb-4">{success}</div>}
      {error && <div className="alert alert-danger py-2 mb-4" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-info-circle me-2" />{t('productInfo')}
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('titleLabel')} *</label>
                  <input className="form-control" value={form.title}
                    onChange={e => set('title', e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('descriptionLabel')} *</label>
                  <textarea className="form-control" rows={5} value={form.description}
                    onChange={e => set('description', e.target.value)} required />
                </div>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('priceLabel')} *</label>
                    <input type="number" className="form-control" value={form.price} min="0" step="0.01"
                      onChange={e => set('price', e.target.value)} required />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-semibold">{t('originalPriceLabel')} <span className="text-muted small">(optional)</span></label>
                    <input type="number" className="form-control" value={form.original_price} min="0" step="0.01"
                      onChange={e => set('original_price', e.target.value)} />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold">{t('stockLabel')} *</label>
                    <input type="number" className="form-control" value={form.stock} min="0"
                      onChange={e => set('stock', e.target.value)} required />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold">{t('conditionLabel')} *</label>
                    <select className="form-select" value={form.condition} onChange={e => set('condition', e.target.value)}>
                      {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
                    </select>
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label fw-semibold">{t('category')} *</label>
                    <select className="form-select" value={form.category}
                      onChange={e => set('category', e.target.value)} required>
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{lang === 'am' ? (c.name_am || c.name) : c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-sm-8">
                    <label className="form-label fw-semibold">{t('locationLabel')}</label>
                    <input className="form-control" value={form.location}
                      onChange={e => set('location', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {product.images?.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent fw-bold py-3">
                  <i className="bi bi-images me-2" />{t('currentImages')}
                </div>
                <div className="card-body p-4">
                  <div className="d-flex gap-3 flex-wrap">
                    {product.images.map(img => (
                      <div key={img.id} className="position-relative">
                        <img src={img.image} width={90} height={90} className="rounded border object-fit-cover" alt="" />
                        {img.is_main && <span className="position-absolute top-0 start-0 badge bg-primary small">{t('mainLabel')}</span>}
                        <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                          style={{ width: 20, height: 20, fontSize: 10 }} onClick={() => deleteImage(img.id)}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-plus-circle me-2" />{t('addMoreImages')}
              </div>
              <div className="card-body p-4">
                <input type="file" className="form-control mb-3" multiple accept="image/*"
                  onChange={handleImages} />
                {previews.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap">
                    {previews.map((src, i) => (
                      <img key={i} src={src} width={70} height={70} className="rounded border object-fit-cover" alt="" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                <span className="fw-bold"><i className="bi bi-chat-square-text me-2" />{t('customerReviews')}</span>
                <span className="badge bg-secondary">{reviews.length}</span>
              </div>
              <div className="card-body p-3">
                {reviews.length === 0 ? (
                  <p className="text-muted small mb-0">{t('noReviewsYet').split('!')[0]}.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {reviews.map(r => (
                      <div key={r.id} className="d-flex justify-content-between align-items-start p-2 rounded border bg-light">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-semibold small">{r.buyer_name}</span>
                            <Stars rating={r.rating} />
                          </div>
                          {r.comment && <p className="mb-0 small text-muted">{r.comment}</p>}
                          <small className="text-muted">{new Date(r.created_at).toLocaleDateString()}</small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm ms-2 flex-shrink-0"
                          disabled={deletingReview === r.id}
                          onClick={() => handleDeleteReview(r.id)}
                        >
                          {deletingReview === r.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="bi bi-trash" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-gear me-2" />{t('options')}
              </div>
              <div className="card-body p-4">
                <div className="form-check form-switch mb-4">
                  <input className="form-check-input" type="checkbox" checked={form.is_active}
                    onChange={e => set('is_active', e.target.checked)} id="activeSwitch" />
                  <label className="form-check-label fw-semibold" htmlFor="activeSwitch">
                    {form.is_active ? t('activeVisible') : t('hidden')}
                  </label>
                </div>

                <div className="small text-muted mb-3">
                  <div><i className="bi bi-eye me-1" />{product.views} views</div>
                  <div><i className="bi bi-calendar me-1" />{t('listingDate')} {new Date(product.created_at).toLocaleDateString()}</div>
                </div>

                <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />{t('saving')}</>
                    : <><i className="bi bi-check-circle me-2" />{t('saveChanges')}</>}
                </button>
                <Link to={`/products/${slug}`} target="_blank" className="btn btn-outline-secondary w-100 mt-2">
                  <i className="bi bi-eye me-1" />{t('viewListing')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
