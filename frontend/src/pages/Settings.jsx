import { useState } from 'react'
import api from '../api/axios'
import { useLanguage } from '../context/LanguageContext'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic (አማርኛ)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'ar', label: 'Arabic (العربية)' },
]

export default function Settings() {
  const { lang, setLanguage, t } = useLanguage()
  const [tab, setTab] = useState('language')
  const [selectedLang, setSelectedLang] = useState(lang)
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)
  const [langSaved, setLangSaved] = useState(false)

  const saveLang = () => {
    setLanguage(selectedLang)
    setLangSaved(true)
    setTimeout(() => setLangSaved(false), 2500)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: 'danger', text: t('passwordMismatch') })
      return
    }
    if (pwForm.new_password.length < 8) {
      setPwMsg({ type: 'danger', text: t('passwordTooShort') })
      return
    }
    setPwLoading(true)
    setPwMsg(null)
    try {
      const res = await api.patch('/auth/me/', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      setPwMsg({ type: 'success', text: res.data.detail || 'Password changed successfully!' })
      setPwForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPwMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to change password.' })
    } finally {
      setPwLoading(false)
    }
  }

  const tabs = [
    { id: 'language', icon: 'globe', label: t('language') },
    { id: 'password', icon: 'lock', label: t('password') },
  ]

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-gear me-2 text-primary" />Settings</h2>

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="list-group list-group-flush rounded-3">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${tab === t.id ? 'active' : ''}`}>
                  <i className={`bi bi-${t.icon}`} />{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className={`bi bi-${tabs.find(t => t.id === tab)?.icon} me-2`} />
              {tabs.find(t => t.id === tab)?.label}
            </div>
            <div className="card-body p-4">

              {tab === 'language' && (
                <div>
                  <h6 className="fw-semibold mb-3">{t('selectLanguage')}</h6>
                  <select className="form-select mb-4" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  {langSaved && <div className="alert alert-success py-2 mb-3">{t('languageSaved')}</div>}
                  <button className="btn btn-primary" onClick={saveLang}>
                    <i className="bi bi-check-circle me-2" />{t('saveLanguage')}
                  </button>
                </div>
              )}

              {tab === 'password' && (
                <form onSubmit={handlePassword}>
                  {pwMsg && <div className={`alert alert-${pwMsg.type} py-2 mb-4`}>{pwMsg.text}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('currentPassword')}</label>
                    <input type="password" className="form-control" value={pwForm.old_password}
                      onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('newPassword')}</label>
                    <input type="password" className="form-control" value={pwForm.new_password}
                      onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required
                      minLength={8} />
                    <small className="text-muted">{t('minChars')}</small>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('confirmNewPassword')}</label>
                    <input type="password" className="form-control" value={pwForm.confirm_password}
                      onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                    {pwLoading
                      ? <><span className="spinner-border spinner-border-sm me-2" />{t('changing')}</>
                      : <><i className="bi bi-lock me-2" />{t('changePassword')}</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
