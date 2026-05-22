import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function OrderDetail() {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ref, setRef] = useState('')
  const [payMethod, setPayMethod] = useState('telebirr')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => api.get(`/orders/my-orders/${orderNumber}/`).then(r => setOrder(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [orderNumber])

  const submitPayment = async (e) => {
    e.preventDefault()
    if (!ref.trim()) return
    setSubmitting(true)
    try {
      const { data } = await api.post(`/orders/my-orders/${orderNumber}/`, {
        payment_reference: ref,
        payment_method: payMethod,
      })
      setOrder(data)
      setMsg({ type: 'success', text: 'Payment submitted! Awaiting seller approval.' })
      setRef('')
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to submit.' })
    } finally {
      setSubmitting(false)
    }
  }

  const cancelOrder = async () => {
    if (!confirm(t('cancelConfirm'))) return
    setCancelling(true)
    try {
      const { data } = await api.delete(`/orders/my-orders/${orderNumber}/`)
      setOrder(data)
      setMsg({ type: 'success', text: 'Order cancelled successfully.' })
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to cancel order.' })
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Spinner />
  if (!order) return <div className="container py-5 text-center"><h4 className="text-muted">{t('notFound')}</h4></div>

  const canCancel = order.status === 'pending' && order.payment_status === 'pending'
  const statusColor = { pending: 'warning text-dark', confirmed: 'primary', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger' }
  const payColor = { pending: 'secondary', submitted: 'warning text-dark', paid: 'success', failed: 'danger' }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <Link to="/orders" className="btn btn-outline-secondary btn-sm"><i className="bi bi-arrow-left me-1" />{t('back')}</Link>
        <div className="flex-grow-1">
          <h3 className="fw-bold mb-0">Order {order.order_number}</h3>
          <small className="text-muted">Placed {new Date(order.created_at).toLocaleString()}</small>
        </div>
        {canCancel && (
          <button className="btn btn-outline-danger btn-sm" onClick={cancelOrder} disabled={cancelling}>
            {cancelling
              ? <><span className="spinner-border spinner-border-sm me-1" />{t('changing')}</>
              : <><i className="bi bi-x-circle me-1" />{t('cancelOrder')}</>}
          </button>
        )}
      </div>

      {msg && <div className={`alert alert-${msg.type} py-2 mb-4`}>{msg.text}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          {/* Status banner */}
          <div className={`alert alert-${order.payment_status === 'paid' ? 'success' : order.payment_status === 'submitted' ? 'warning' : 'secondary'} d-flex align-items-center mb-4`}>
            <i className={`bi bi-${order.payment_status === 'paid' ? 'check-circle-fill' : order.payment_status === 'submitted' ? 'clock-history' : 'exclamation-triangle-fill'} me-3 fs-4`} />
            <div>
              <strong>{t('payment')}: </strong><span className={`badge bg-${payColor[order.payment_status] || 'secondary'}`}>{order.payment_status_display}</span>
              &nbsp;&nbsp;<strong>{t('status')}: </strong><span className={`badge bg-${statusColor[order.status]}`}>{order.status_display}</span>
            </div>
          </div>

          {/* Awaiting approval banner */}
          {order.payment_status === 'submitted' && (
            <div className="alert alert-warning d-flex align-items-center mb-4">
              <i className="bi bi-hourglass-split me-3 fs-4" />
              <div>
                <strong>{t('awaitingApproval')}</strong>
                <div className="small">Your payment reference <strong>{order.payment_reference}</strong> has been submitted. The seller will approve or reject it shortly.</div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent fw-bold py-3"><i className="bi bi-bag me-2" />{t('itemsOrdered')}</div>
            <div className="card-body p-0">
              {order.items.map(item => (
                <div key={item.id} className="d-flex align-items-center gap-3 p-3 border-bottom">
                  {item.product_image
                    ? <img src={item.product_image} width={65} height={65} className="rounded border object-fit-cover flex-shrink-0" alt="" />
                    : <div className="bg-light rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 65, height: 65 }}><i className="bi bi-image text-muted" /></div>}
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{item.product_title}</div>
                    <div className="small text-muted">{item.quantity} × ETB {item.unit_price}</div>
                    <div className="small text-muted">Seller: <strong>{item.seller_name}</strong></div>
                  </div>
                  <div className="fw-bold text-primary">ETB {item.subtotal}</div>
                </div>
              ))}
              <div className="d-flex justify-content-between fw-bold fs-5 p-3">
                <span>{t('total')}</span><span className="text-primary">ETB {order.total_amount}</span>
              </div>
            </div>
          </div>

          {/* Payment section — only when pending */}
          {order.payment_status === 'pending' && (
            <div className="card border-0 shadow-sm border-start border-4 border-success">
              <div className="card-header bg-success text-white py-2">
                <h6 className="mb-0 fw-bold"><i className="bi bi-credit-card me-2" />{t('sellerPaymentDetails')}</h6>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">Transfer the total amount to the seller(s) using the details below, then submit your reference.</p>
                {order.items.map(item => item.seller_payment && (item.seller_payment.bank_name || item.seller_payment.mobile_money || item.seller_payment.telebirr_number) && (
                  <div key={item.id} className="card bg-light border-0 mb-3 p-3">
                    <h6 className="fw-bold text-primary mb-2"><i className="bi bi-shop me-1" />{item.seller_payment.business_name || item.seller_name}</h6>
                    <div className="row g-2">
                      {item.seller_payment.telebirr_number && (
                        <div className="col-md-6">
                          <div className="bg-white rounded p-2 border small">
                            <div className="fw-semibold mb-1"><i className="bi bi-phone me-1 text-warning" />Telebirr</div>
                            <div>Number: <strong>{item.seller_payment.telebirr_number}</strong></div>
                          </div>
                        </div>
                      )}
                      {item.seller_payment.bank_name && (
                        <div className="col-md-6">
                          <div className="bg-white rounded p-2 border small">
                            <div className="fw-semibold mb-1"><i className="bi bi-bank me-1 text-primary" />Bank Transfer</div>
                            <div>Bank: <strong>{item.seller_payment.bank_name}</strong></div>
                            <div>Account #: <strong>{item.seller_payment.account_number}</strong></div>
                            <div>Name: <strong>{item.seller_payment.account_holder}</strong></div>
                          </div>
                        </div>
                      )}
                      {item.seller_payment.mobile_money && (
                        <div className="col-md-6">
                          <div className="bg-white rounded p-2 border small">
                            <div className="fw-semibold mb-1"><i className="bi bi-phone me-1 text-success" />Mobile Money</div>
                            <div>Number: <strong>{item.seller_payment.mobile_money}</strong></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <form onSubmit={submitPayment} className="bg-primary bg-opacity-10 rounded p-3 mt-3">
                  <h6 className="fw-bold mb-3"><i className="bi bi-send-check me-1" />Submit Payment Reference</h6>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">{t('paymentMethod')}</label>
                    <div className="d-flex gap-3 flex-wrap">
                      {[
                        { value: 'telebirr', label: 'Telebirr', icon: 'phone' },
                        { value: 'cbe', label: 'CBE Bank Transfer', icon: 'bank' },
                        { value: 'other', label: 'Other Bank', icon: 'cash' },
                      ].map(opt => (
                        <div key={opt.value} className="form-check">
                          <input className="form-check-input" type="radio" name="payMethod" id={`pm-${opt.value}`}
                            value={opt.value} checked={payMethod === opt.value}
                            onChange={() => setPayMethod(opt.value)} />
                          <label className="form-check-label small" htmlFor={`pm-${opt.value}`}>
                            <i className={`bi bi-${opt.icon} me-1`} />{opt.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="row g-2 align-items-end">
                    <div className="col-sm-8">
                      <label className="form-label fw-semibold small">{t('transactionReference')}</label>
                      <input type="text" className="form-control" value={ref} onChange={e => setRef(e.target.value)}
                        placeholder="e.g. TXN20241234567" required />
                    </div>
                    <div className="col-sm-4">
                      <button type="submit" className="btn btn-success w-100" disabled={submitting}>
                        {submitting ? t('submitting') : <><i className="bi bi-check-circle me-1" />{t('submitPayment')}</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {order.payment_status === 'paid' && (
            <div className="alert alert-success"><i className="bi bi-check-circle-fill me-2" />
              {t('paymentConfirmed')} <strong>{order.payment_reference}</strong>
              {order.payment_method && <span className="ms-2 badge bg-success">{order.payment_method}</span>}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold py-3"><i className="bi bi-geo-alt me-2" />{t('shippingAddress')}</div>
            <div className="card-body">
              <p className="fw-semibold mb-1">{order.shipping_name}</p>
              <p className="text-muted small mb-1">{order.shipping_address}</p>
              <p className="text-muted small mb-1">{order.shipping_city}, {order.shipping_country}</p>
              <p className="text-muted small mb-0"><i className="bi bi-phone me-1" />{order.shipping_phone}</p>
              {order.notes && <><hr className="my-2" /><p className="text-muted small mb-0"><i className="bi bi-chat-left me-1" />{order.notes}</p></>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
