import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function Products() {
  const { t, lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const category = searchParams.get('category') || ''
  const q = searchParams.get('q') || ''
  const condition = searchParams.get('condition') || ''
  const min_price = searchParams.get('min_price') || ''
  const max_price = searchParams.get('max_price') || ''
  const ordering = searchParams.get('ordering') || '-created_at'

  const [filters, setFilters] = useState({ min_price, max_price })
  const [searchInput, setSearchInput] = useState(q)

  useEffect(() => {
    api.get('/products/categories/').then(r => setCategories(r.data))
  }, [])

  useEffect(() => { setSearchInput(q) }, [q])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (q) params.set('q', q)
    if (condition) params.set('condition', condition)
    if (min_price) params.set('min_price', min_price)
    if (max_price) params.set('max_price', max_price)
    params.set('ordering', ordering)
    params.set('limit', 24)

    api.get(`/products/?${params}`).then(r => {
      setProducts(r.data.results || [])
      setTotal(r.data.count || 0)
    }).finally(() => setLoading(false))
  }, [category, q, condition, min_price, max_price, ordering])

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val); else next.delete(key)
    setSearchParams(next)
  }

  const applyPriceFilter = (e) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (filters.min_price) next.set('min_price', filters.min_price); else next.delete('min_price')
    if (filters.max_price) next.set('max_price', filters.max_price); else next.delete('max_price')
    setSearchParams(next)
  }

  const clearFilters = () => setSearchParams({})

  const activeCategory = categories.find(c => c.slug === category)

  const handleSearch = (e) => {
    e.preventDefault()
    setParam('q', searchInput.trim())
  }

  return (
    <div className="container py-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="d-flex gap-2 mb-4">
        <input
          type="text"
          className="form-control"
          placeholder={t('searchProducts')}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary px-4">
          <i className="bi bi-search me-1" />{t('search')}
        </button>
        {q && (
          <button type="button" className="btn btn-outline-secondary"
            onClick={() => { setSearchInput(''); setParam('q', '') }}>
            <i className="bi bi-x-lg" />
          </button>
        )}
      </form>

      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: 96 }}>
            <div className="card-header bg-primary text-white py-2">
              <h6 className="mb-0 fw-bold"><i className="bi bi-funnel me-1" />{t('filterProducts')}</h6>
            </div>
            <div className="card-body p-3">
              {/* Categories */}
              <h6 className="fw-semibold mb-2 small text-uppercase text-muted">{t('category')}</h6>
              <div className="list-group list-group-flush mb-3">
                <button onClick={() => setParam('category', '')}
                  className={`list-group-item list-group-item-action border-0 py-1 small ${!category ? 'active' : ''}`}>
                  {t('allCategories')}
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setParam('category', cat.slug)}
                    className={`list-group-item list-group-item-action border-0 py-1 small ${category === cat.slug ? 'active' : ''}`}>
                    <i className={`bi ${cat.icon} me-1`} />{lang === 'am' ? (cat.name_am || cat.name) : cat.name}
                  </button>
                ))}
              </div>

              {/* Condition */}
              <h6 className="fw-semibold mb-2 small text-uppercase text-muted">{t('condition')}</h6>
              <select className="form-select form-select-sm mb-3" value={condition}
                onChange={e => setParam('condition', e.target.value)}>
                <option value="">{t('all')}</option>
                <option value="new">{t('brandNew')}</option>
                <option value="used">{t('used')}</option>
                <option value="refurbished">{t('refurbished')}</option>
              </select>

              {/* Price */}
              <h6 className="fw-semibold mb-2 small text-uppercase text-muted">{t('priceRange')}</h6>
              <form onSubmit={applyPriceFilter}>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <input type="number" placeholder="Min $" className="form-control form-control-sm"
                      value={filters.min_price} onChange={e => setFilters(f => ({ ...f, min_price: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <input type="number" placeholder="Max $" className="form-control form-control-sm"
                      value={filters.max_price} onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm w-100">Apply</button>
              </form>

              {(category || condition || min_price || max_price) && (
                <button onClick={clearFilters} className="btn btn-outline-secondary btn-sm w-100 mt-2">
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-0">
                {activeCategory ? <><i className={`bi ${activeCategory.icon} me-2 text-primary`} />{activeCategory.name}</> :
                  q ? `Results for "${q}"` : 'All Products'}
              </h4>
              <small className="text-muted">{total} product(s) found</small>
            </div>
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={ordering}
              onChange={e => setParam('ordering', e.target.value)}>
              <option value="-created_at">Latest</option>
              <option value="price">Price: Low → High</option>
              <option value="-price">Price: High → Low</option>
              <option value="-views">Most Viewed</option>
            </select>
          </div>

          {loading ? <Spinner /> : products.length > 0
            ? <div className="row g-3">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>
            : (
              <div className="text-center py-5">
                <i className="bi bi-search display-1 text-muted" />
                <h4 className="mt-3 text-muted">No products found</h4>
                <button onClick={clearFilters} className="btn btn-primary mt-2">Clear Filters</button>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
