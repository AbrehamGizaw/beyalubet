import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'

export default function ProductCard({ product }) {
  const { isAuthenticated, isBuyer } = useAuth()
  const { addToCart } = useCart()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return navigate('/auth/login')
    if (!isBuyer) return
    try { await addToCart(product.id) } catch { /* stock error handled by API */ }
  }

  return (
    <div className="col-6 col-sm-4 col-md-3">
      <div className="card h-100 border-0 shadow-sm product-card">
        <Link to={`/products/${product.slug}`} className="text-decoration-none d-flex flex-column h-100">
          {/* Image — always same size */}
          <div className="position-relative overflow-hidden" style={{ height: 200, background: '#f0f0f0', flexShrink: 0 }}>
            {product.main_image
              ? <img src={product.main_image} alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div className="d-flex align-items-center justify-content-center h-100">
                  <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }} />
                </div>
            }
            {product.discount_percentage > 0 && (
              <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                -{product.discount_percentage}%
              </span>
            )}
            {product.condition !== 'new' && (
              <span className={`badge position-absolute top-0 start-0 m-2 ${product.condition === 'used' ? 'bg-secondary' : 'bg-warning text-dark'}`}>
                {product.condition === 'used' ? t('used') : t('refurbished')}
              </span>
            )}
            {product.stock === 0 && (
              <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-50 text-white text-center small py-1">
                {t('outOfStock')}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="card-body p-3 d-flex flex-column flex-grow-1">
            <p className="card-text text-muted small mb-1">
              <i className={`bi ${product.category_icon || 'bi-grid'} me-1`} />{lang === 'am' ? (product.category_name_am || product.category_name) : product.category_name}
            </p>
            <h6 className="card-title fw-semibold mb-1 product-title text-dark">{product.title}</h6>

            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="fw-bold text-primary">ETB {product.price}</span>
              {product.original_price && (
                <small className="text-muted text-decoration-line-through">ETB {product.original_price}</small>
              )}
            </div>

            {product.avg_rating > 0 && (
              <div className="d-flex align-items-center gap-1 mb-1">
                {[1,2,3,4,5].map(n => (
                  <i key={n} className={`bi bi-star${n <= Math.round(product.avg_rating) ? '-fill' : ''} text-warning`} style={{ fontSize: 11 }} />
                ))}
                <span className="text-muted" style={{ fontSize: 11 }}>{product.avg_rating} ({product.review_count})</span>
              </div>
            )}

            <div className="mt-auto pt-1">
              {product.location && (
                <p className="mb-0 text-muted" style={{ fontSize: '0.78rem' }}>
                  <i className="bi bi-geo-alt me-1" />{product.location}
                </p>
              )}
              {product.seller_phone && (
                <p className="mb-0 text-muted" style={{ fontSize: '0.78rem' }}>
                  <i className="bi bi-telephone me-1" />{product.seller_phone}
                </p>
              )}
              <p className="mb-0 text-muted" style={{ fontSize: '0.78rem' }}>
                <i className="bi bi-shop me-1" />{product.seller_business || product.seller_name}
              </p>
            </div>
          </div>
        </Link>

        {/* Footer actions — outside the Link to prevent nested links */}
        <div className="card-footer bg-transparent border-0 p-3 pt-0 d-flex gap-2">
          <Link to={`/products/${product.slug}`} className="btn btn-outline-primary btn-sm flex-fill">
            <i className="bi bi-eye me-1" />{t('viewDetails')}
          </Link>
          {isBuyer && (
            <button className="btn btn-primary btn-sm flex-fill" onClick={handleAddToCart}
              disabled={product.stock === 0}>
              <i className="bi bi-cart-plus me-1" />{product.stock === 0 ? t('outOfStock') : t('addToCart')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
