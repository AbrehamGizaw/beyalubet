import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

const STATUS_COLOR = { pending: 'warning text-dark', active: 'success', expired: 'secondary', cancelled: 'danger' }

export default function AdminSubscriptions() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('subs')          // 'subs' | 'plans'
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [acting, setActing] = useState(null)
  const [msg, setMsg] = useState(null)

  // inline transaction edit state: { id, value }
  const [txnEdit, setTxnEdit] = useState(null)
  const [txnSaving, setTxnSaving] = useState(false)

  // inline plan edit state: { id, price, name, max_products, features, duration, is_free }
  const [planEdit, setPlanEdit] = useState(null)
  const [planSaving, setPlanSaving] = useState(false)
  const [planDeleting, setPlanDeleting] = useState(null)

  // new plan form
  const BLANK_PLAN = { name: '', duration: 'monthly', price: '', max_products: 50, features: '', is_free: false, is_popular: false }
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlan, setNewPlan] = useState(BLANK_PLAN)
  const [addSaving, setAddSaving] = useState(false)

  const flash = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  const loadSubs = (status) => {
    setLoading(true)
    api.get(`/admin/subscriptions/${status ? `?status=${status}` : ''}`)
      .then(r => setSubs(r.data))
      .finally(() => setLoading(false))
  }

  const loadPlans = () => {
    setPlansLoading(true)
    api.get('/admin/plans/')
      .then(r => setPlans(r.data))
      .catch(err => flash('danger', err.response?.data?.detail || 'Failed to load plans.'))
      .finally(() => setPlansLoading(false))
  }

  useEffect(() => { loadSubs(filter) }, [filter])
  useEffect(() => { if (tab === 'plans') loadPlans() }, [tab])

  const act = async (id, action) => {
    setActing(id)
    try {
      await api.patch(`/admin/subscriptions/${id}/`, { action })
      flash('success', `Subscription ${action === 'approve' ? 'approved and activated' : 'rejected'}.`)
      setSubs(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      flash('danger', err.response?.data?.detail || 'Action failed.')
    } finally {
      setActing(null)
    }
  }

  const saveTxn = async () => {
    if (!txnEdit) return
    setTxnSaving(true)
    try {
      const res = await api.patch(`/admin/subscriptions/${txnEdit.id}/`, { transaction_id: txnEdit.value })
      setSubs(prev => prev.map(s => s.id === txnEdit.id ? { ...s, ...res.data } : s))
      flash('success', t('transactionIdUpdated'))
      setTxnEdit(null)
    } catch (err) {
      flash('danger', err.response?.data?.detail || t('transactionIdTaken'))
    } finally {
      setTxnSaving(false)
    }
  }

  const savePlan = async () => {
    if (!planEdit) return
    setPlanSaving(true)
    try {
      const res = await api.patch(`/admin/plans/${planEdit.id}/`, {
        price: planEdit.price, name: planEdit.name,
        max_products: planEdit.max_products, features: planEdit.features,
        duration: planEdit.duration, is_free: planEdit.is_free, is_popular: planEdit.is_popular,
      })
      setPlans(prev => prev.map(p => p.id === planEdit.id ? res.data : p))
      flash('success', t('planUpdated'))
      setPlanEdit(null)
    } catch (err) {
      flash('danger', err.response?.data?.detail || 'Failed to save plan.')
    } finally {
      setPlanSaving(false)
    }
  }

  const togglePlanActive = async (plan) => {
    try {
      const res = await api.patch(`/admin/plans/${plan.id}/`, { is_active: !plan.is_active })
      setPlans(prev => prev.map(p => p.id === plan.id ? res.data : p))
      flash('success', res.data.is_active ? 'Plan is now visible.' : 'Plan hidden from sellers.')
    } catch (err) {
      flash('danger', err.response?.data?.detail || 'Failed to update plan.')
    }
  }

  const deletePlan = async (plan) => {
    if (!window.confirm(`Delete "${plan.name}"? This cannot be undone.`)) return
    setPlanDeleting(plan.id)
    try {
      await api.delete(`/admin/plans/${plan.id}/`)
      setPlans(prev => prev.filter(p => p.id !== plan.id))
      flash('success', 'Plan deleted.')
    } catch (err) {
      flash('danger', err.response?.data?.detail || 'Failed to delete plan.')
    } finally {
      setPlanDeleting(null)
    }
  }

  const addPlan = async () => {
    setAddSaving(true)
    try {
      const res = await api.post('/admin/plans/', newPlan)
      setPlans(prev => [...prev, res.data])
      flash('success', 'Plan created.')
      setShowAddForm(false)
      setNewPlan(BLANK_PLAN)
    } catch (err) {
      flash('danger', err.response?.data?.detail || 'Failed to create plan.')
    } finally {
      setAddSaving(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0">
          <i className="bi bi-check-circle me-2 text-warning" />{t('subApprovals')}
        </h2>
      </div>

      {msg && <div className={`alert alert-${msg.type} py-2 mb-4`}>{msg.text}</div>}

      {/* Top-level tabs: Subscriptions / Plans */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'subs' ? 'active' : ''}`} onClick={() => setTab('subs')}>
            <i className="bi bi-list-check me-1" />{t('subApprovals')}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'plans' ? 'active' : ''}`} onClick={() => setTab('plans')}>
            <i className="bi bi-currency-dollar me-1" />{t('managePlans')}
          </button>
        </li>
      </ul>

      {/* ── Subscriptions tab ─────────────────────────────── */}
      {tab === 'subs' && (
        <>
          <ul className="nav nav-pills mb-4 gap-1">
            {['pending', 'active', 'expired', 'cancelled', ''].map((s, i) => (
              <li className="nav-item" key={i}>
                <button className={`nav-link py-1 px-3 ${filter === s ? 'active' : 'text-body'}`}
                  onClick={() => setFilter(s)}>
                  {s === '' ? t('all') : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              </li>
            ))}
          </ul>

          {loading ? <Spinner /> : subs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-check-all display-1 text-muted" />
              <h4 className="mt-3 text-muted">No {filter || ''} subscriptions</h4>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr>
                    <th>{t('seller')}</th>
                    <th>{t('plan')}</th>
                    <th>Sender Name</th>
                    <th>Screenshot</th>
                    <th>{t('amount')}</th>
                    <th>{t('transactionId')}</th>
                    <th>{t('submitted')}</th>
                    <th>{t('status')}</th>
                    <th>{t('actions')}</th>
                  </tr></thead>
                  <tbody>
                    {subs.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="fw-semibold small">{s.seller_name}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>@{s.seller_username}</div>
                        </td>
                        <td>
                          <div className="fw-semibold small">{s.plan?.name || s.plan_name}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{s.plan?.duration_display}</div>
                        </td>
                        <td className="small">{s.sender_name || <span className="text-muted">—</span>}</td>
                        <td>
                          {s.payment_screenshot
                            ? <a href={s.payment_screenshot} target="_blank" rel="noreferrer">
                                <img src={s.payment_screenshot} alt="screenshot"
                                  style={{ height: 48, width: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6', cursor: 'pointer' }} />
                              </a>
                            : <span className="text-muted small">—</span>}
                        </td>
                        <td className="fw-bold text-primary">ETB {s.amount_paid}</td>
                        <td style={{ minWidth: 200 }}>
                          {txnEdit?.id === s.id ? (
                            <div className="d-flex gap-1 align-items-center">
                              <input
                                className="form-control form-control-sm"
                                value={txnEdit.value}
                                onChange={e => setTxnEdit(prev => ({ ...prev, value: e.target.value }))}
                                style={{ minWidth: 130 }}
                                autoFocus
                              />
                              <button className="btn btn-sm btn-success" onClick={saveTxn} disabled={txnSaving}>
                                {txnSaving ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg" />}
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setTxnEdit(null)}>
                                <i className="bi bi-x-lg" />
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex align-items-center gap-2">
                              <code className="small">{s.transaction_id || '—'}</code>
                              <button
                                className="btn btn-sm btn-outline-secondary py-0 px-1"
                                title={t('editTransactionId')}
                                onClick={() => setTxnEdit({ id: s.id, value: s.transaction_id || '' })}
                              >
                                <i className="bi bi-pencil" style={{ fontSize: 11 }} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="small text-muted">{new Date(s.created_at).toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${STATUS_COLOR[s.status] || 'secondary'}`}>{s.status}</span>
                          {s.status === 'active' && s.days_remaining != null && (
                            <div className="text-muted" style={{ fontSize: 11 }}>{s.days_remaining}{t('daysLeft')}</div>
                          )}
                        </td>
                        <td>
                          {s.status === 'pending' ? (
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-success" disabled={acting === s.id}
                                onClick={() => act(s.id, 'approve')}>
                                {acting === s.id
                                  ? <span className="spinner-border spinner-border-sm" />
                                  : <><i className="bi bi-check-lg me-1" />{t('approve')}</>}
                              </button>
                              <button className="btn btn-sm btn-outline-danger" disabled={acting === s.id}
                                onClick={() => act(s.id, 'reject')}>
                                <i className="bi bi-x-lg me-1" />{t('reject')}
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Plans tab ─────────────────────────────────────── */}
      {tab === 'plans' && (
        <>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <p className="text-muted mb-0">Manage subscription plans — add, edit, hide or delete.</p>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAddForm(v => !v); setPlanEdit(null) }}>
              <i className={`bi bi-${showAddForm ? 'x-lg' : 'plus-lg'} me-1`} />
              {showAddForm ? 'Cancel' : 'Add Plan'}
            </button>
          </div>

          {/* ── Add new plan form ── */}
          {showAddForm && (
            <div className="card border-0 shadow-sm mb-4 border-start border-4 border-primary">
              <div className="card-header bg-primary bg-opacity-10 fw-bold py-3">
                <i className="bi bi-plus-circle me-2 text-primary" />New Subscription Plan
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Plan Name *</label>
                    <input className="form-control form-control-sm" value={newPlan.name}
                      onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Gold" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Duration *</label>
                    <select className="form-select form-select-sm" value={newPlan.duration}
                      onChange={e => setNewPlan(p => ({ ...p, duration: e.target.value }))}>
                      <option value="monthly">Monthly (1 Month)</option>
                      <option value="quarterly">Quarterly (3 Months)</option>
                      <option value="biannual">Biannual (6 Months)</option>
                      <option value="yearly">Yearly (12 Months)</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold small">Price (ETB) *</label>
                    <input type="number" min="0" step="0.01" className="form-control form-control-sm" value={newPlan.price}
                      onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))} placeholder="0" />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold small">Max Products *</label>
                    <input type="number" min="1" className="form-control form-control-sm" value={newPlan.max_products}
                      onChange={e => setNewPlan(p => ({ ...p, max_products: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Features (one per line)</label>
                    <textarea className="form-control form-control-sm" rows={3} value={newPlan.features}
                      onChange={e => setNewPlan(p => ({ ...p, features: e.target.value }))} placeholder="Feature 1&#10;Feature 2" />
                  </div>
                  <div className="col-12 d-flex gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="newIsFree" checked={newPlan.is_free}
                        onChange={e => setNewPlan(p => ({ ...p, is_free: e.target.checked, price: e.target.checked ? 0 : p.price }))} />
                      <label className="form-check-label small" htmlFor="newIsFree">Free plan (auto-activates)</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="newIsPopular" checked={newPlan.is_popular}
                        onChange={e => setNewPlan(p => ({ ...p, is_popular: e.target.checked }))} />
                      <label className="form-check-label small" htmlFor="newIsPopular">Mark as Popular</label>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <button className="btn btn-primary btn-sm" onClick={addPlan} disabled={addSaving}>
                    {addSaving ? <><span className="spinner-border spinner-border-sm me-1" />Creating…</> : <><i className="bi bi-check-lg me-1" />Create Plan</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {plansLoading ? <Spinner /> : plans.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-star display-1" />
              <p className="mt-3">No plans found.</p>
              <button className="btn btn-outline-primary btn-sm" onClick={loadPlans}>Retry</button>
            </div>
          ) : (
            <div className="row g-4">
              {plans.map(plan => (
                <div className="col-md-6" key={plan.id}>
                  <div className={`card border-0 shadow-sm h-100 ${!plan.is_active ? 'opacity-50' : ''}`}>
                    <div className="card-header bg-transparent d-flex align-items-center justify-content-between py-3 flex-wrap gap-2">
                      <span className="fw-bold">
                        {plan.name}
                        <span className="badge bg-secondary ms-2 fw-normal small">{plan.duration_display}</span>
                        {plan.is_popular && <span className="badge bg-warning text-dark ms-1 fw-normal small">Popular</span>}
                        {plan.is_free && <span className="badge bg-success ms-1 fw-normal small">Free</span>}
                        {!plan.is_active && <span className="badge bg-danger ms-1 fw-normal small">Hidden</span>}
                      </span>
                      {planEdit?.id !== plan.id && (
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" title="Edit"
                            onClick={() => { setPlanEdit({ id: plan.id, price: plan.price, name: plan.name, max_products: plan.max_products, features: plan.features, duration: plan.duration, is_free: plan.is_free, is_popular: plan.is_popular }); setShowAddForm(false) }}>
                            <i className="bi bi-pencil" />
                          </button>
                          <button className={`btn btn-sm ${plan.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                            title={plan.is_active ? 'Hide plan' : 'Show plan'}
                            onClick={() => togglePlanActive(plan)}>
                            <i className={`bi bi-eye${plan.is_active ? '-slash' : ''}`} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" title="Delete plan"
                            disabled={planDeleting === plan.id}
                            onClick={() => deletePlan(plan)}>
                            {planDeleting === plan.id
                              ? <span className="spinner-border spinner-border-sm" />
                              : <i className="bi bi-trash" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      {planEdit?.id === plan.id ? (
                        <div>
                          <div className="row g-2 mb-2">
                            <div className="col-8">
                              <label className="form-label fw-semibold small">Name</label>
                              <input className="form-control form-control-sm" value={planEdit.name}
                                onChange={e => setPlanEdit(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="col-4">
                              <label className="form-label fw-semibold small">Duration</label>
                              <select className="form-select form-select-sm" value={planEdit.duration}
                                onChange={e => setPlanEdit(p => ({ ...p, duration: e.target.value }))}>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="biannual">Biannual</option>
                                <option value="yearly">Yearly</option>
                              </select>
                            </div>
                          </div>
                          <div className="row g-2 mb-2">
                            <div className="col-6">
                              <label className="form-label fw-semibold small">{t('price')} (ETB)</label>
                              <input type="number" step="0.01" min="0" className="form-control form-control-sm"
                                value={planEdit.price} onChange={e => setPlanEdit(p => ({ ...p, price: e.target.value }))} />
                            </div>
                            <div className="col-6">
                              <label className="form-label fw-semibold small">{t('maxProducts')}</label>
                              <input type="number" min="1" className="form-control form-control-sm"
                                value={planEdit.max_products} onChange={e => setPlanEdit(p => ({ ...p, max_products: e.target.value }))} />
                            </div>
                          </div>
                          <div className="mb-2">
                            <label className="form-label fw-semibold small">Features (one per line)</label>
                            <textarea className="form-control form-control-sm" rows={4}
                              value={planEdit.features} onChange={e => setPlanEdit(p => ({ ...p, features: e.target.value }))} />
                          </div>
                          <div className="d-flex gap-3 mb-3">
                            <div className="form-check">
                              <input className="form-check-input" type="checkbox" id={`isFree${plan.id}`} checked={planEdit.is_free}
                                onChange={e => setPlanEdit(p => ({ ...p, is_free: e.target.checked }))} />
                              <label className="form-check-label small" htmlFor={`isFree${plan.id}`}>Free plan</label>
                            </div>
                            <div className="form-check">
                              <input className="form-check-input" type="checkbox" id={`isPop${plan.id}`} checked={planEdit.is_popular}
                                onChange={e => setPlanEdit(p => ({ ...p, is_popular: e.target.checked }))} />
                              <label className="form-check-label small" htmlFor={`isPop${plan.id}`}>Popular</label>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-success btn-sm" onClick={savePlan} disabled={planSaving}>
                              {planSaving ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : <><i className="bi bi-check-lg me-1" />{t('saveChanges')}</>}
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setPlanEdit(null)}>{t('cancel')}</button>
                          </div>
                        </div>
                      ) : (
                        <div className="small">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">{t('price')}</span>
                            <strong className={`fs-5 ${plan.is_free ? 'text-success' : 'text-primary'}`}>
                              {plan.is_free ? 'FREE' : `ETB ${plan.price}`}
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">{t('maxProducts')}</span>
                            <strong>{plan.max_products}</strong>
                          </div>
                          <hr className="my-2" />
                          <ul className="mb-0 ps-3">
                            {plan.features_list?.map((f, i) => <li key={i} className="text-muted">{f}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
