import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

const statusColor = { pending: 'warning text-dark', confirmed: 'primary', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger' }
const payColor = { pending: 'secondary', submitted: 'warning text-dark', paid: 'success', failed: 'danger', refunded: 'warning text-dark' }

export default function OrderList() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    api.get('/orders/my-orders/').then(r => setOrders(r.data)).finally(() => setLoading(false))
  }, [])

  const cancelOrder = async (orderNumber) => {
    if (!confirm(t('cancelConfirm'))) return
    setCancelling(orderNumber)
    try {
      const { data } = await api.delete(`/orders/my-orders/${orderNumber}/`)
      setOrders(prev => prev.map(o => o.order_number === orderNumber ? data : o))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel order.')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-bag me-2 text-primary" />{t('myOrdersTitle')}</h2>
      {orders.length > 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr>
                <th>{t('orderNumber')}</th><th>{t('date')}</th><th>{t('items')}</th><th>{t('total')}</th><th>{t('status')}</th><th>{t('payment')}</th><th></th>
              </tr></thead>
              <tbody>
                {orders.map(order => {
                  const canCancel = order.status === 'pending' && order.payment_status === 'pending'
                  return (
                  <tr key={order.id}>
                    <td className="fw-semibold small">{order.order_number}</td>
                    <td className="small text-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="small text-muted">{order.item_count} item(s)</td>
                    <td className="fw-bold text-primary">ETB {order.total_amount}</td>
                    <td><span className={`badge bg-${statusColor[order.status] || 'secondary'}`}>{order.status_display}</span></td>
                    <td><span className={`badge bg-${payColor[order.payment_status] || 'secondary'}`}>{order.payment_status_display}</span></td>
                    <td className="d-flex gap-1">
                      <Link to={`/orders/${order.order_number}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-eye me-1" />View</Link>
                      {canCancel && (
                        <button className="btn btn-sm btn-outline-danger" disabled={cancelling === order.order_number}
                          onClick={() => cancelOrder(order.order_number)}>
                          {cancelling === order.order_number
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="bi bi-x-circle" />}
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-bag display-1 text-muted" />
          <h4 className="mt-3 text-muted">{t('noOrdersYet')}</h4>
          <Link to="/products" className="btn btn-primary mt-2">{t('startShopping')}</Link>
        </div>
      )}
    </div>
  )
}
