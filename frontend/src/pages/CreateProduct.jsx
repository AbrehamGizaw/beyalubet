import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useLanguage } from '../context/LanguageContext'

const CONDITIONS = ['new', 'used', 'refurbished']
const CONDITION_LABELS = { new: 'Brand New', used: 'Used', refurbished: 'Refurbished' }

export default function CreateProduct() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])

  const [form, setForm] = useState({
    title: '', description: '', price: '', original_price: '',
    stock: 1, condition: 'new', category: '', location: '', is_active: true,
  })

  useEffect(() => {
    api.get('/products/categories/').then(r => setCategories(r.data))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      images.forEach((img, i) => fd.append(`images[${i}]`, img))

      const { data } = await api.post('/products/my-products/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/seller/products/${data.slug}/edit?created=1`)
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
        setError(msgs)
      } else {
        setError('Failed to create product.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/seller/products" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" />{t('back')}
        </Link>
        <h3 className="fw-bold mb-0">{t('createNewProduct')}</h3>
      </div>

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
                    onChange={e => set('title', e.target.value)} required
                    placeholder="e.g. Samsung Galaxy S24 Ultra" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('descriptionLabel')} *</label>
                  <textarea className="form-control" rows={5} value={form.description}
                    onChange={e => set('description', e.target.value)} required
                    placeholder="Describe your product in detail..." />
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
                      onChange={e => set('original_price', e.target.value)}
                      placeholder="For discount display" />
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
                    <label className="form-label fw-semibold">{t('locationLabel')} <span className="text-muted small">(optional)</span></label>
                    <input className="form-control" value={form.location}
                      onChange={e => set('location', e.target.value)}
                      placeholder="e.g. Addis Ababa, Ethiopia" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-images me-2" />{t('productImages')}
              </div>
              <div className="card-body p-4">
                <input type="file" className="form-control mb-3" multiple accept="image/*"
                  onChange={handleImages} />
                <div className="form-text mb-3">{t('firstImageMain')}</div>
                {previews.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap">
                    {previews.map((src, i) => (
                      <div key={i} className="position-relative">
                        <img src={src} width={80} height={80} className="rounded border object-fit-cover" alt="" />
                        {i === 0 && <span className="position-absolute top-0 start-0 badge bg-primary small">{t('mainLabel')}</span>}
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
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" checked={form.is_active}
                    onChange={e => set('is_active', e.target.checked)} id="activeSwitch" />
                  <label className="form-check-label fw-semibold" htmlFor="activeSwitch">
                    {form.is_active ? t('activeVisible') : t('hidden')}
                  </label>
                </div>
                <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />{t('creating')}</>
                    : <><i className="bi bi-check-circle me-2" />{t('createProduct')}</>}
                </button>
                <Link to="/seller/products" className="btn btn-outline-secondary w-100 mt-2">
                  {t('cancel')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
