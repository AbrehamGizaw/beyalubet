import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

const STATUS_CHOICES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const statusColor = { pending: 'warning text-dark', confirmed: 'primary', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger' }
const payColor = { pending: 'secondary', submitted: 'warning text-dark', paid: 'success', failed: 'danger' }

export default function SellerOrders() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [approving, setApproving] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/orders/seller-orders/').then(r => setOrders(r.data)).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId)
    try {
      const { data } = await api.patch(`/orders/seller-orders/${orderId}/`, { status })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: data.status, status_display: data.status_display } : o))
    } finally {
      setUpdating(null)
    }
  }

  const handlePaymentAction = async (orderId, action) => {
    setApproving(orderId + action)
    try {
      const { data } = await api.patch(`/orders/seller-orders/${orderId}/payment/`, { action })
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o
        if (action === 'approve') {
          return { ...o, payment_status: 'paid', payment_status_display: 'Paid', status: 'confirmed', status_display: 'Confirmed' }
        } else {
          return { ...o, payment_status: 'pending', payment_status_display: 'Pending Payment', payment_reference: '' }
        }
      }))
    } catch (err) {
      console.error('Payment action failed:', err)
    } finally {
      setApproving(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-bag-check me-2 text-primary" />{t('customerOrders')}</h2>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-bag display-1 text-muted" />
          <h4 className="mt-3 text-muted">{t('noOrdersYet')}</h4>
          <p className="text-muted">{t('buyerOrdersInfo')}</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr>
                <th>{t('orderNumber')}</th><th>{t('buyer')}</th><th>{t('date')}</th><th>{t('amount')}</th>
                <th>{t('payment')}</th><th>{t('status')}</th><th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {orders.map(order => (
                  <>
                    <tr key={order.id}>
                      <td className="fw-semibold small">
                        <button className="btn btn-link btn-sm p-0 text-primary fw-semibold text-decoration-none"
                          onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                          <i className={`bi bi-chevron-${expanded === order.id ? 'down' : 'right'} me-1`} />
                          {order.order_number}
                        </button>
                      </td>
                      <td className="small">{order.buyer_name}</td>
                      <td className="small text-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="fw-bold text-primary small">ETB {order.total_amount}</td>
                      <td>
                        <span className={`badge bg-${payColor[order.payment_status] || 'secondary'}`}>
                          {order.payment_status === 'submitted' ? t('paymentSubmitted') : order.payment_status_display}
                        </span>
                        {order.payment_reference && (
                          <div className="small text-muted mt-1">Ref: {order.payment_reference}</div>
                        )}
                        {order.payment_method && (
                          <div className="small text-muted">via {order.payment_method}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${statusColor[order.status] || 'secondary'}`}>
                          {order.status_display}
                        </span>
                      </td>
                      <td>
                        {order.payment_status === 'submitted' ? (
                          <div className="d-flex gap-1 flex-wrap">
                            <button
                              className="btn btn-success btn-sm"
                              disabled={approving === order.id + 'approve'}
                              onClick={() => handlePaymentAction(order.id, 'approve')}
                            >
                              {approving === order.id + 'approve'
                                ? <span className="spinner-border spinner-border-sm" />
                                : <><i className="bi bi-check-circle me-1" />{t('approve')}</>}
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              disabled={approving === order.id + 'reject'}
                              onClick={() => handlePaymentAction(order.id, 'reject')}
                            >
                              {approving === order.id + 'reject'
                                ? <span className="spinner-border spinner-border-sm" />
                                : <><i className="bi bi-x-circle me-1" />{t('reject')}</>}
                            </button>
                          </div>
                        ) : (
                          <select className="form-select form-select-sm" style={{ minWidth: 140 }}
                            value={order.status} disabled={updating === order.id}
                            onChange={e => updateStatus(order.id, e.target.value)}>
                            {STATUS_CHOICES.map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                    {expanded === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={7} className="bg-light">
                          <div className="p-3">
                            <div className="row g-3">
                              <div className="col-md-7">
                                <h6 className="fw-bold mb-2"><i className="bi bi-bag me-1" />{t('orderItems')}</h6>
                                {(order.items || []).map(item => (
                                  <div key={item.id} className="d-flex align-items-center gap-2 mb-2 bg-white rounded p-2">
                                    {item.product_image
                                      ? <img src={item.product_image} width={45} height={45} className="rounded border object-fit-cover" alt="" />
                                      : <div className="bg-light rounded border d-flex align-items-center justify-content-center"
                                          style={{ width: 45, height: 45 }}><i className="bi bi-image text-muted" /></div>}
                                    <div className="flex-grow-1">
                                      <div className="fw-semibold small">{item.product_title}</div>
                                      <div className="text-muted small">{item.quantity} × ETB {item.unit_price}</div>
                                    </div>
                                    <div className="fw-bold text-primary small">ETB {item.subtotal}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="col-md-5">
                                <h6 className="fw-bold mb-2"><i className="bi bi-geo-alt me-1" />{t('shipping')}</h6>
                                <div className="bg-white rounded p-2 small">
                                  <div className="fw-semibold">{order.shipping_name}</div>
                                  <div className="text-muted">{order.shipping_address}</div>
                                  <div className="text-muted">{order.shipping_city}, {order.shipping_country}</div>
                                  <div className="text-muted"><i className="bi bi-phone me-1" />{order.shipping_phone}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
