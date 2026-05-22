import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/axios'

export default function Checkout() {
  const { user } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const bp = user?.buyer_profile || {}

  const [step, setStep] = useState('shipping')
  const [order, setOrder] = useState(null)
  const [snapshot, setSnapshot] = useState({ items: cartItems, total: cartTotal })
  const [payMethod, setPayMethod] = useState('telebirr')
  const [ref, setRef] = useState('')
  const [form, setForm] = useState({
    shipping_name: user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.username || '',
    shipping_address: bp.shipping_address || '',
    shipping_city: bp.city || '',
    shipping_country: bp.country || 'Ethiopia',
    shipping_phone: user?.phone || '',
    notes: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const parseError = (err) => {
    if (!err.response) return 'Network error — make sure the server is running.'
    const d = err.response.data
    if (typeof d === 'string') return d.length < 200 ? d : 'Server error. Check the backend logs.'
    if (d?.detail) return d.detail
    const msgs = Object.entries(d || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    return msgs.length ? msgs.join(' | ') : `Error ${err.response.status}`
  }

  const handleShipping = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      setSnapshot({ items: cartItems, total: cartTotal })
      const { data } = await api.post('/orders/checkout/', form)
      // Set order + step BEFORE clearing cart to avoid race condition
      // where cartItems becomes empty while step is still 'shipping'
      setOrder(data)
      setStep('payment')
      clearCart()
    } catch (err) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!ref.trim()) return
    setError(null)
    setLoading(true)
    try {
      await api.post(`/orders/my-orders/${order.order_number}/`, {
        payment_reference: ref,
        payment_method: payMethod,
      })
      clearCart()
      navigate(`/orders/${order.order_number}`)
    } catch (err) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  // Only block checkout if cart is empty AND no order has been placed yet
  if (cartItems.length === 0 && step === 'shipping' && !order) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x display-1 text-muted" />
        <h4 className="mt-3 text-muted">{t('nothingToCheckout')}</h4>
        <Link to="/products" className="btn btn-primary mt-2">{t('browseProducts')}</Link>
      </div>
    )
  }

  return (
    <div className="container py-5">
      {/* Step indicator */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
          style={{ width: 32, height: 32, background: step === 'shipping' ? '#0d6efd' : '#198754', color: '#fff', fontSize: 14, flexShrink: 0 }}>
          {step === 'payment' ? <i className="bi bi-check" /> : '1'}
        </div>
        <span className={`fw-bold me-3 ${step === 'shipping' ? 'text-primary' : 'text-success'}`}>{t('shipping')}</span>
        <div className="border-top flex-grow-1" style={{ maxWidth: 50 }} />
        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold ms-3"
          style={{ width: 32, height: 32, background: step === 'payment' ? '#0d6efd' : '#dee2e6', color: step === 'payment' ? '#fff' : '#6c757d', fontSize: 14, flexShrink: 0 }}>
          2
        </div>
        <span className={`fw-bold ${step === 'payment' ? 'text-primary' : 'text-muted'}`}>{t('payment')}</span>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-4">
          <i className="bi bi-exclamation-triangle me-2" />{error}
        </div>
      )}

      {/* ── Step 1: Shipping ── */}
      {step === 'shipping' && (
        <form onSubmit={handleShipping}>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white py-3 fw-bold">
                  <i className="bi bi-geo-alt me-2" />{t('deliveryAddress')}
                </div>
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('fullName')} *</label>
                    <input className="form-control form-control-lg" value={form.shipping_name}
                      onChange={e => set('shipping_name', e.target.value)} required
                      placeholder="Your full name" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('streetAddress')} *</label>
                    <textarea className="form-control" rows={2} value={form.shipping_address}
                      onChange={e => set('shipping_address', e.target.value)} required
                      placeholder="House number, street, area" />
                  </div>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('city')} *</label>
                      <input className="form-control" value={form.shipping_city}
                        onChange={e => set('shipping_city', e.target.value)} required />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('country')} *</label>
                      <input className="form-control" value={form.shipping_country}
                        onChange={e => set('shipping_country', e.target.value)} required />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('phone')} *</label>
                      <input className="form-control" value={form.shipping_phone}
                        onChange={e => set('shipping_phone', e.target.value)} required placeholder="+251 91 234 5678" />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">{t('notes')} <span className="text-muted small">(optional)</span></label>
                      <input className="form-control" value={form.notes}
                        onChange={e => set('notes', e.target.value)} placeholder="Delivery instructions..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-header bg-transparent fw-bold py-3"><i className="bi bi-receipt me-2" />{t('orderSummary')}</div>
                <div className="card-body p-3">
                  {snapshot.items.map(item => (
                    <div key={item.id} className="d-flex gap-2 mb-3 align-items-center">
                      {item.product.main_image
                        ? <img src={item.product.main_image} width={50} height={50} className="rounded border object-fit-cover flex-shrink-0" alt="" />
                        : <div className="bg-light rounded border flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}><i className="bi bi-image text-muted" /></div>}
                      <div className="flex-grow-1 small">
                        <div className="fw-semibold">{item.product.title}</div>
                        <div className="text-muted">{item.quantity} × ETB {item.product.price}</div>
                      </div>
                      <div className="fw-bold">ETB {item.subtotal}</div>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>{t('total')}</span><span className="text-primary">ETB {snapshot.total}</span>
                  </div>
                </div>
              </div>

              <div className="alert alert-info small py-2 mb-3">
                <i className="bi bi-info-circle me-1" />You'll enter payment details in the next step.
              </div>

              {/* Button is INSIDE the form via this col */}
              <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />{t('placeOrder')}</>
                  : <><i className="bi bi-arrow-right-circle me-2" />{t('continueToPayment')}</>}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Step 2: Payment ── */}
      {step === 'payment' && order && (
        <div className="row g-4">
          <div className="col-lg-7">
            {/* Seller payment details */}
            {order.items?.some(item =>
              item.seller_payment && (item.seller_payment.bank_name || item.seller_payment.mobile_money || item.seller_payment.telebirr_number)
            ) && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-success text-white py-2 fw-bold">
                  <i className="bi bi-info-circle me-2" />{t('sellerPaymentDetails')}
                </div>
                <div className="card-body">
                  <p className="text-muted small mb-3">Transfer <strong>ETB {order.total_amount}</strong> to the seller using one of the options below, then submit your reference number.</p>
                  {order.items.map(item => {
                    const sp = item.seller_payment
                    if (!sp || (!sp.bank_name && !sp.mobile_money && !sp.telebirr_number)) return null
                    return (
                      <div key={item.id} className="mb-3">
                        <div className="fw-semibold small text-primary mb-2">
                          <i className="bi bi-shop me-1" />{sp.business_name || item.seller_name}
                        </div>
                        <div className="row g-2">
                          {sp.telebirr_number && (
                            <div className="col-md-6">
                              <div className="bg-light rounded p-2 border small">
                                <div className="fw-semibold mb-1"><i className="bi bi-phone me-1 text-warning" />Telebirr</div>
                                <div>Number: <strong>{sp.telebirr_number}</strong></div>
                              </div>
                            </div>
                          )}
                          {sp.bank_name && (
                            <div className="col-md-6">
                              <div className="bg-light rounded p-2 border small">
                                <div className="fw-semibold mb-1"><i className="bi bi-bank me-1 text-primary" />Bank Transfer</div>
                                <div>Bank: <strong>{sp.bank_name}</strong></div>
                                <div>Account #: <strong>{sp.account_number}</strong></div>
                                <div>Name: <strong>{sp.account_holder}</strong></div>
                              </div>
                            </div>
                          )}
                          {sp.mobile_money && (
                            <div className="col-md-6">
                              <div className="bg-light rounded p-2 border small">
                                <div className="fw-semibold mb-1"><i className="bi bi-phone me-1 text-success" />Mobile Money</div>
                                <div>Number: <strong>{sp.mobile_money}</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Payment form */}
            <form onSubmit={handlePayment}>
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white py-2 fw-bold">
                  <i className="bi bi-send-check me-2" />Submit Your Payment Reference
                </div>
                <div className="card-body p-4">
                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('paymentMethod')} *</label>
                    <div className="row g-2">
                      {[
                        { value: 'telebirr', label: 'Telebirr', icon: 'phone', color: 'warning' },
                        { value: 'cbe', label: 'CBE Bank Transfer', icon: 'bank', color: 'primary' },
                        { value: 'other', label: 'Other Bank', icon: 'cash', color: 'secondary' },
                      ].map(opt => (
                        <div className="col-4" key={opt.value}>
                          <div
                            onClick={() => setPayMethod(opt.value)}
                            className={`rounded p-3 text-center ${payMethod === opt.value ? `border border-${opt.color} bg-${opt.color} bg-opacity-10` : 'border'}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <i className={`bi bi-${opt.icon} fs-4 text-${opt.color} d-block mb-1`} />
                            <div className="small fw-semibold">{opt.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('transactionReference')} *</label>
                    <input type="text" className="form-control form-control-lg" value={ref}
                      onChange={e => setRef(e.target.value)}
                      placeholder="e.g. TXN20241234567" required />
                    <div className="form-text">Enter the reference from your Telebirr, bank, or mobile money receipt.</div>
                  </div>

                  <button type="submit" className="btn btn-success w-100 btn-lg" disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" />{t('submitting')}</>
                      : <><i className="bi bi-check-circle me-2" />{t('confirmPayment')}</>}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-transparent fw-bold py-3"><i className="bi bi-bag-check me-2" />{t('orderPlaced')}</div>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-muted">Order #</span><strong>{order.order_number}</strong>
                </div>
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-muted">Ship to</span><strong>{order.shipping_name}</strong>
                </div>
                <div className="text-muted small mb-3">{order.shipping_city}, {order.shipping_country}</div>
                <hr />
                {order.items?.map(item => (
                  <div key={item.id} className="d-flex justify-content-between small mb-1">
                    <span>{item.product_title} ×{item.quantity}</span>
                    <strong>ETB {item.subtotal}</strong>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>{t('total')}</span><span className="text-primary fs-5">ETB {order.total_amount}</span>
                </div>
              </div>
            </div>

            <div className="alert alert-info small mb-3">
              <i className="bi bi-clock me-1" />After submitting your reference, the seller will verify and confirm your payment.
            </div>

            <button type="button" className="btn btn-outline-secondary w-100 btn-sm"
              onClick={() => navigate(`/orders/${order.order_number}`)}>
              {t('payLater')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
