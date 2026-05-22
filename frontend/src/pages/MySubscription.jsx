import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function MySubscription() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // inline transaction edit: { id, value }
  const [txnEdit, setTxnEdit] = useState(null)
  const [txnSaving, setTxnSaving] = useState(false)
  const [txnMsg, setTxnMsg] = useState(null)

  useEffect(() => {
    api.get('/subscriptions/my/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const sub = data?.active_subscription
  const history = data?.subscription_history || []
  const pendingSubs = history.filter(s => s.status === 'pending')
  const daysPercent = sub ? Math.max(0, Math.min(100, (sub.days_remaining / (sub.duration_days || 30)) * 100)) : 0

  const saveTxn = async () => {
    if (!txnEdit) return
    setTxnSaving(true)
    setTxnMsg(null)
    try {
      const res = await api.patch(`/subscriptions/${txnEdit.id}/transaction/`, { transaction_id: txnEdit.value })
      setData(prev => ({
        ...prev,
        subscription_history: prev.subscription_history.map(s => s.id === txnEdit.id ? res.data : s),
      }))
      setTxnEdit(null)
      setTxnMsg({ type: 'success', text: t('transactionIdUpdated') })
    } catch (err) {
      setTxnMsg({ type: 'danger', text: err.response?.data?.detail || t('transactionIdTaken') })
    } finally {
      setTxnSaving(false)
    }
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-star me-2 text-primary" />{t('mySubscription')}</h2>

      {txnMsg && (
        <div className={`alert alert-${txnMsg.type} py-2 mb-4`}>{txnMsg.text}</div>
      )}

      {/* ── Pending subscriptions ──────────────────────────────── */}
      {pendingSubs.length > 0 && (
        <div className="card border-0 shadow-sm border-start border-4 border-warning mb-4">
          <div className="card-header bg-warning bg-opacity-10 py-3 fw-bold">
            <i className="bi bi-hourglass-split me-2 text-warning" />{t('pendingSubscriptions')}
          </div>
          <div className="card-body">
            <p className="text-muted small mb-3">{t('editWhilePending')}</p>
            {pendingSubs.map(s => (
              <div key={s.id} className="border rounded p-3 mb-2">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <div>
                    <span className="fw-semibold">{s.plan_name}</span>
                    <span className="badge bg-warning text-dark ms-2">{t('pending')}</span>
                  </div>
                  <div className="text-muted small">{new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="text-muted small">{t('transactionId')}:</span>
                  {txnEdit?.id === s.id ? (
                    <>
                      <input
                        className="form-control form-control-sm"
                        style={{ maxWidth: 240 }}
                        value={txnEdit.value}
                        onChange={e => setTxnEdit(prev => ({ ...prev, value: e.target.value }))}
                        autoFocus
                      />
                      <button className="btn btn-sm btn-success" onClick={saveTxn} disabled={txnSaving}>
                        {txnSaving ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-check-lg me-1" />{t('save')}</>}
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setTxnEdit(null)}>
                        {t('cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <code className="small">{s.transaction_id || '—'}</code>
                      <button
                        className="btn btn-sm btn-outline-primary py-0 px-2"
                        onClick={() => setTxnEdit({ id: s.id, value: s.transaction_id || '' })}
                      >
                        <i className="bi bi-pencil me-1" style={{ fontSize: 11 }} />{t('editTransactionId')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active subscription ────────────────────────────────── */}
      {sub ? (
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm border-start border-4 border-success">
              <div className="card-body p-4">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div>
                    <h4 className="fw-bold mb-1">{sub.plan_name}</h4>
                    <span className="badge bg-success">{t('active')}</span>
                  </div>
                  <div className="text-end">
                    <div className="display-6 fw-bold text-primary">{sub.days_remaining}</div>
                    <div className="text-muted small">{t('daysRemaining')}</div>
                  </div>
                </div>

                <div className="progress mb-3" style={{ height: 8 }}>
                  <div className="progress-bar bg-success" style={{ width: `${daysPercent}%` }} />
                </div>

                <div className="row g-3 small">
                  <div className="col-sm-4">
                    <div className="text-muted">{t('startDate')}</div>
                    <div className="fw-semibold">{new Date(sub.start_date).toLocaleDateString()}</div>
                  </div>
                  <div className="col-sm-4">
                    <div className="text-muted">{t('endDate')}</div>
                    <div className="fw-semibold">{new Date(sub.end_date).toLocaleDateString()}</div>
                  </div>
                  <div className="col-sm-4">
                    <div className="text-muted">{t('transactionId')}</div>
                    <div className="fw-semibold text-truncate"><code>{sub.transaction_id || '—'}</code></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex flex-column justify-content-center p-4 text-center">
                <i className="bi bi-arrow-repeat fs-1 text-primary mb-3" />
                <p className="text-muted mb-3">{t('renewUpgrade')}</p>
                <Link to="/subscriptions" className="btn btn-primary w-100">
                  <i className="bi bi-star me-2" />{t('viewPlans')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : pendingSubs.length === 0 ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body text-center py-5">
            <i className="bi bi-star display-1 text-muted" />
            <h4 className="mt-3 text-muted">{t('noActiveSubscription')}</h4>
            <p className="text-muted">{t('subscribeTo')}</p>
            <Link to="/subscriptions" className="btn btn-primary btn-lg px-5">
              <i className="bi bi-star me-2" />{t('viewSubPlans')}
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── History ───────────────────────────────────────────── */}
      {history.filter(s => s.status !== 'pending').length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent fw-bold py-3">
            <i className="bi bi-clock-history me-2" />{t('subHistory')}
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr>
                <th>{t('plan')}</th><th>{t('start')}</th><th>{t('end')}</th>
                <th>{t('transactionId')}</th><th>{t('status')}</th>
              </tr></thead>
              <tbody>
                {history.filter(s => s.status !== 'pending').map(s => (
                  <tr key={s.id}>
                    <td className="fw-semibold small">{s.plan_name}</td>
                    <td className="small text-muted">{s.start_date ? new Date(s.start_date).toLocaleDateString() : '—'}</td>
                    <td className="small text-muted">{s.end_date ? new Date(s.end_date).toLocaleDateString() : '—'}</td>
                    <td className="small"><code>{s.transaction_id || '—'}</code></td>
                    <td>
                      <span className={`badge bg-${s.is_active ? 'success' : 'secondary'}`}>
                        {s.is_active ? t('active') : t('expired')}
                      </span>
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
