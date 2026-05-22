import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import { useLanguage } from '../context/LanguageContext'

export default function AdminSettings() {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    telebirr: '',
    mobile_money: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/admin/settings/').then(r => setForm(r.data)).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/admin/settings/', form)
      setMsg({ type: 'success', text: t('settingsSaved') })
    } catch {
      setMsg({ type: 'danger', text: 'Failed to save settings.' })
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h2 className="fw-bold mb-0">
          <i className="bi bi-gear me-2 text-primary" />{t('platformSettings')}
        </h2>
      </div>

      {msg && <div className={`alert alert-${msg.type} py-2 mb-4`}>{msg.text}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Bank Transfer */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-primary bg-opacity-10 fw-bold py-3">
                <i className="bi bi-bank me-2 text-primary" />{t('bankSection')}
              </div>
              <div className="card-body p-4">
                <p className="text-muted small mb-4">{t('paymentAccountsDesc')}</p>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('bankName')}</label>
                  <input className="form-control" value={form.bank_name}
                    onChange={e => set('bank_name', e.target.value)}
                    placeholder="e.g. Commercial Bank of Ethiopia" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('accountNumber')}</label>
                  <input className="form-control" value={form.account_number}
                    onChange={e => set('account_number', e.target.value)}
                    placeholder="e.g. 1000123456789" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('accountHolder')}</label>
                  <input className="form-control" value={form.account_holder}
                    onChange={e => set('account_holder', e.target.value)}
                    placeholder="e.g. Beyalubet PLC" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Payments */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-success bg-opacity-10 fw-bold py-3">
                <i className="bi bi-phone me-2 text-success" />{t('mobileSection')}
              </div>
              <div className="card-body p-4">
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-phone me-2 text-warning" />{t('telebirrNumber')}
                  </label>
                  <input className="form-control" value={form.telebirr}
                    onChange={e => set('telebirr', e.target.value)}
                    placeholder="e.g. 0911234567" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-phone me-2 text-success" />{t('mobileMoneyNumber')}
                  </label>
                  <input className="form-control" value={form.mobile_money}
                    onChange={e => set('mobile_money', e.target.value)}
                    placeholder="e.g. 0911234567" />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-bold py-3">
                <i className="bi bi-eye me-2 text-secondary" />{t('previewLabel')}
              </div>
              <div className="card-body p-4">
                {!form.bank_name && !form.telebirr && !form.mobile_money ? (
                  <p className="text-muted mb-0"><i className="bi bi-info-circle me-2" />{t('noPaymentAccounts')}</p>
                ) : (
                  <div className="row g-3">
                    {form.telebirr && (
                      <div className="col-md-4">
                        <div className="bg-light rounded p-3 small">
                          <div className="fw-semibold mb-2"><i className="bi bi-phone me-2 text-warning" />Telebirr</div>
                          <div>{t('numberLabel')}: <strong>{form.telebirr}</strong></div>
                        </div>
                      </div>
                    )}
                    {form.bank_name && (
                      <div className="col-md-4">
                        <div className="bg-light rounded p-3 small">
                          <div className="fw-semibold mb-2"><i className="bi bi-bank me-2 text-primary" />{t('bankSection')}</div>
                          <div>{t('bankName')}: <strong>{form.bank_name}</strong></div>
                          <div>{t('accountNumber')}: <strong>{form.account_number || '—'}</strong></div>
                          <div>{t('accountHolder')}: <strong>{form.account_holder || '—'}</strong></div>
                        </div>
                      </div>
                    )}
                    {form.mobile_money && (
                      <div className="col-md-4">
                        <div className="bg-light rounded p-3 small">
                          <div className="fw-semibold mb-2"><i className="bi bi-phone me-2 text-success" />{t('mobileMoneyLabel')}</div>
                          <div>{t('numberLabel')}: <strong>{form.mobile_money}</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary btn-lg px-5" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />{t('savingSettings')}</>
                : <><i className="bi bi-check-circle me-2" />{t('saveSettings')}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
