import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function Cart() {
  const { cartItems, cartTotal, cartLoading, removeFromCart, updateQty } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()

  if (cartLoading) return <Spinner />

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-cart3 me-2 text-primary" />{t('myCartTitle')}</h2>

      {cartItems.length > 0 ? (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              {cartItems.map(item => (
                <div key={item.id} className="d-flex align-items-center gap-3 p-3 border-bottom">
                  {item.product.main_image
                    ? <img src={item.product.main_image} width={80} height={80} className="rounded border object-fit-cover flex-shrink-0" alt="" />
                    : <div className="bg-light rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 80, height: 80 }}><i className="bi bi-image text-muted fs-4" /></div>}

                  <div className="flex-grow-1">
                    <Link to={`/products/${item.product.slug}`} className="fw-semibold text-dark text-decoration-none">
                      {item.product.title}
                    </Link>
                    <div className="text-primary fw-bold">ETB {item.product.price}</div>
                  </div>

                  <div className="input-group input-group-sm" style={{ width: 110 }}>
                    <button className="btn btn-outline-secondary" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                    <input type="number" className="form-control text-center" value={item.quantity}
                      min={1} max={item.product.stock}
                      onChange={e => updateQty(item.id, parseInt(e.target.value) || 1)} />
                    <button className="btn btn-outline-secondary" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>

                  <div className="text-end" style={{ minWidth: 80 }}>
                    <div className="fw-bold">ETB {item.subtotal}</div>
                    <button className="btn btn-link btn-sm text-danger p-0" onClick={() => removeFromCart(item.id)}>
                      <i className="bi bi-trash" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-bold py-3">{t('orderSummary')}</div>
              <div className="card-body">
                {cartItems.map(item => (
                  <div key={item.id} className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">{item.product.title.slice(0, 22)}… × {item.quantity}</span>
                    <span>ETB {item.subtotal}</span>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                  <span>{t('total')}</span><span className="text-primary">ETB {cartTotal}</span>
                </div>
                <button className="btn btn-primary w-100 btn-lg" onClick={() => navigate('/checkout')}>
                  <i className="bi bi-bag-check me-2" />{t('proceedToCheckout')}
                </button>
                <Link to="/products" className="btn btn-outline-secondary w-100 mt-2">
                  <i className="bi bi-arrow-left me-1" />{t('continueShopping')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-cart-x display-1 text-muted" />
          <h4 className="mt-3 text-muted">{t('cartEmpty')}</h4>
          <Link to="/products" className="btn btn-primary mt-2"><i className="bi bi-search me-1" />{t('browseProducts')}</Link>
        </div>
      )}
    </div>
  )
}
