import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/axios'

export default function Profile() {
  const { user, refreshUser, isSeller, isBuyer } = useAuth()
  const { t } = useLanguage()
  const bp = user?.buyer_profile || {}
  const sp = user?.seller_profile || {}

  const [tab, setTab] = useState('general')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const fileRef = useRef()

  const [general, setGeneral] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  const [buyer, setBuyer] = useState({
    shipping_address: bp.shipping_address || '',
    city: bp.city || '',
    country: bp.country || 'Ethiopia',
    postal_code: bp.postal_code || '',
  })

  const [seller, setSeller] = useState({
    business_name: sp.business_name || '',
    bank_name: sp.bank_name || '',
    account_number: sp.account_number || '',
    account_holder: sp.account_holder || '',
    mobile_money: sp.mobile_money || '',
    telebirr_number: sp.telebirr_number || '',
  })

  const uploadImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImgLoading(true)
    const fd = new FormData()
    fd.append('profile_image', file)
    try {
      await api.patch('/auth/me/', fd)
      await refreshUser()
      show('success', 'Profile image updated!')
    } catch {
      show('danger', 'Failed to upload image.')
    } finally {
      setImgLoading(false)
    }
  }

  const show = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const saveGeneral = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch('/auth/me/', general)
      await refreshUser()
      show('success', 'Profile updated successfully!')
    } catch {
      show('danger', 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const saveBuyer = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch('/auth/me/', { buyer_profile: buyer })
      await refreshUser()
      show('success', 'Shipping info updated!')
    } catch {
      show('danger', 'Failed to update shipping info.')
    } finally {
      setLoading(false)
    }
  }

  const saveSeller = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch('/auth/me/', { seller_profile: seller })
      await refreshUser()
      show('success', 'Payment info updated!')
    } catch {
      show('danger', 'Failed to update payment info.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: t('general'), icon: 'person' },
    ...(isBuyer ? [{ id: 'shipping', label: t('shippingInfo'), icon: 'geo-alt' }] : []),
    ...(isSeller ? [{ id: 'payment', label: t('paymentInfo'), icon: 'credit-card' }] : []),
  ]

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-person-gear me-2 text-primary" />{t('myProfile')}</h2>

      {msg && <div className={`alert alert-${msg.type} py-2 mb-4`}>{msg.text}</div>}

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-4">
              <div className="position-relative d-inline-block mb-3">
                {user?.profile_image
                  ? <img src={user.profile_image} alt="Profile"
                      className="rounded-circle object-fit-cover border border-3 border-primary"
                      style={{ width: 90, height: 90 }} />
                  : <div className="bg-primary bg-opacity-10 rounded-circle mx-auto d-flex align-items-center justify-content-center border border-3 border-primary"
                      style={{ width: 90, height: 90 }}>
                      <i className="bi bi-person-circle fs-1 text-primary" />
                    </div>
                }
                <button
                  className="btn btn-sm btn-primary rounded-circle position-absolute d-flex align-items-center justify-content-center p-0"
                  style={{ width: 28, height: 28, bottom: 0, right: 0 }}
                  onClick={() => fileRef.current.click()}
                  disabled={imgLoading}
                  title="Change photo">
                  {imgLoading
                    ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                    : <i className="bi bi-camera-fill" style={{ fontSize: 12 }} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={uploadImage} />
              </div>
              <h5 className="fw-bold mb-0">{user?.first_name || user?.username}</h5>
              <p className="text-muted small mb-2">@{user?.username}</p>
              <span className={`badge bg-${isSeller ? 'warning text-dark' : 'primary'}`}>
                {isSeller ? 'Seller' : 'Buyer'}
              </span>
            </div>
            <div className="list-group list-group-flush">
              {tabs.map(tabItem => (
                <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${tab === tabItem.id ? 'active' : ''}`}>
                  <i className={`bi bi-${tabItem.icon}`} />{tabItem.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold py-3">
              <i className={`bi bi-${tabs.find(ti => ti.id === tab)?.icon} me-2`} />
              {tabs.find(ti => ti.id === tab)?.label}
            </div>
            <div className="card-body p-4">
              {tab === 'general' && (
                <form onSubmit={saveGeneral}>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('firstName')}</label>
                      <input className="form-control" value={general.first_name}
                        onChange={e => setGeneral(g => ({ ...g, first_name: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('lastName')}</label>
                      <input className="form-control" value={general.last_name}
                        onChange={e => setGeneral(g => ({ ...g, last_name: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('email')}</label>
                      <input type="email" className="form-control" value={general.email}
                        onChange={e => setGeneral(g => ({ ...g, email: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('phone')}</label>
                      <input className="form-control" value={general.phone}
                        onChange={e => setGeneral(g => ({ ...g, phone: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold text-muted">{t('usernameReadOnly')}</label>
                      <input className="form-control bg-light" value={user?.username} readOnly />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
                    {loading ? t('saving') : t('saveChanges')}
                  </button>
                </form>
              )}

              {tab === 'shipping' && (
                <form onSubmit={saveBuyer}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">{t('streetAddress')}</label>
                      <textarea className="form-control" rows={2} value={buyer.shipping_address}
                        onChange={e => setBuyer(b => ({ ...b, shipping_address: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('city')}</label>
                      <input className="form-control" value={buyer.city}
                        onChange={e => setBuyer(b => ({ ...b, city: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('country')}</label>
                      <input className="form-control" value={buyer.country}
                        onChange={e => setBuyer(b => ({ ...b, country: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('postalCode')}</label>
                      <input className="form-control" value={buyer.postal_code}
                        onChange={e => setBuyer(b => ({ ...b, postal_code: e.target.value }))} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
                    {loading ? t('saving') : t('shippingInfo')}
                  </button>
                </form>
              )}

              {tab === 'payment' && (
                <form onSubmit={saveSeller}>
                  <div className="alert alert-info small py-2 mb-4">
                    <i className="bi bi-info-circle me-1" />
                    Buyers will see these details to pay you after placing an order.
                  </div>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">{t('businessName')}</label>
                      <input className="form-control" value={seller.business_name}
                        onChange={e => setSeller(s => ({ ...s, business_name: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('bankName')}</label>
                      <input className="form-control" value={seller.bank_name}
                        onChange={e => setSeller(s => ({ ...s, bank_name: e.target.value }))}
                        placeholder="e.g. Commercial Bank of Ethiopia" />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('accountNumber')}</label>
                      <input className="form-control" value={seller.account_number}
                        onChange={e => setSeller(s => ({ ...s, account_number: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('accountHolder')}</label>
                      <input className="form-control" value={seller.account_holder}
                        onChange={e => setSeller(s => ({ ...s, account_holder: e.target.value }))} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('mobileMoney')}</label>
                      <input className="form-control" value={seller.mobile_money}
                        onChange={e => setSeller(s => ({ ...s, mobile_money: e.target.value }))}
                        placeholder="+251 91 234 5678" />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">{t('telebirr')}</label>
                      <input className="form-control" value={seller.telebirr_number}
                        onChange={e => setSeller(s => ({ ...s, telebirr_number: e.target.value }))}
                        placeholder="+251 91 234 5678" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
                    {loading ? t('saving') : t('paymentInfo')}
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
