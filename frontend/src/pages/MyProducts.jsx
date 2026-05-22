import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function MyProducts() {
  const { t, lang } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = () => api.get('/products/my-products/').then(r => {
    setProducts(r.data.results || r.data)
  }).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const toggleActive = async (product) => {
    try {
      const { data } = await api.patch(`/products/my-products/${product.slug}/`, { is_active: !product.is_active })
      setProducts(prev => prev.map(p => p.slug === product.slug ? { ...p, is_active: data.is_active } : p))
    } catch {
      alert('Failed to update product status.')
    }
  }

  const deleteProduct = async (slug) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(slug)
    try {
      await api.delete(`/products/my-products/${slug}/`)
      setProducts(prev => prev.filter(p => p.slug !== slug))
    } catch {
      alert('Failed to delete product.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="fw-bold mb-0"><i className="bi bi-box-seam me-2 text-primary" />{t('myProducts')}</h2>
        <Link to="/seller/products/create" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2" />{t('addProduct')}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-box-seam display-1 text-muted" />
          <h4 className="mt-3 text-muted">{t('noProductsYet')}</h4>
          <Link to="/seller/products/create" className="btn btn-primary mt-2">
            <i className="bi bi-plus-circle me-2" />{t('createFirstProduct')}
          </Link>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr>
                <th style={{ width: 60 }}></th>
                <th>{t('product')}</th><th>{t('price')}</th><th>{t('stock')}</th>
                <th>{t('category')}</th><th>{t('status')}</th><th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.slug}>
                    <td>
                      {p.main_image
                        ? <img src={p.main_image} width={50} height={50} className="rounded border object-fit-cover" alt="" />
                        : <div className="bg-light rounded border d-flex align-items-center justify-content-center"
                            style={{ width: 50, height: 50 }}><i className="bi bi-image text-muted" /></div>}
                    </td>
                    <td>
                      <Link to={`/products/${p.slug}`} className="fw-semibold text-dark text-decoration-none small d-block">
                        {p.title}
                      </Link>
                      <span className="badge bg-light text-dark border small">{p.condition}</span>
                    </td>
                    <td className="fw-bold text-primary small">ETB {p.price}</td>
                    <td className="small">
                      <span className={`badge bg-${p.stock > 0 ? 'success' : 'danger'}`}>{p.stock}</span>
                    </td>
                    <td className="small text-muted">{lang === 'am' ? (p.category_name_am || p.category_name) : p.category_name}</td>
                    <td>
                      <div className="form-check form-switch mb-0">
                        <input className="form-check-input" type="checkbox" checked={p.is_active}
                          onChange={() => toggleActive(p)} />
                        <label className="form-check-label small">{p.is_active ? t('active') : t('hidden')}</label>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Link to={`/seller/products/${p.slug}/edit`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-pencil" />
                        </Link>
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteProduct(p.slug)} disabled={deleting === p.slug}>
                          {deleting === p.slug
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="bi bi-trash" />}
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
    </div>
  )
}
