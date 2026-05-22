import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const { t, lang } = useLanguage()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/products/categories/'),
      api.get('/products/?featured=true&limit=8'),
      api.get('/products/?limit=12'),
    ]).then(([cats, feat, lat]) => {
      setCategories(cats.data)
      setFeatured(feat.data.results || [])
      setLatest(lat.data.results || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <>
      {/* Hero */}
      <section className="text-white py-5" style={{ background: 'linear-gradient(135deg,#d43200 0%,#c87c00 35%,#5baa00 75%,#2d6600 100%)' }}>
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <h1 className="display-4 fw-bold mb-3">
                {t('heroTitle1')} <span className="text-warning">{t('heroTitle2')}</span><br />{t('heroTitle3')}
              </h1>
              <p className="lead mb-4 text-light">{t('heroSubtitle')}</p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/products" className="btn btn-warning btn-lg px-4">
                  <i className="bi bi-search me-2" />{t('browseProducts')}
                </Link>
                <Link to="/auth/register" className="btn btn-outline-light btn-lg px-4">
                  <i className="bi bi-shop me-2" />{t('startSelling')}
                </Link>
              </div>
            </div>
            <div className="col-lg-5 text-center mt-4 mt-lg-0">
              <div className="row g-2 justify-content-center">
                {[['bi-shop-window', t('statSellers')], ['bi-box-seam', t('statProducts')], ['bi-people', t('statBuyers')]].map(([icon, label]) => (
                  <div key={label} className="col-4">
                    <div className="bg-white bg-opacity-10 rounded-3 p-3">
                      <i className={`bi ${icon} display-4 text-warning`} />
                      <p className="small mt-1 mb-0">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="fw-bold mb-4 text-center">{t('shopByCategory')}</h2>
          <div className="row g-3">
            {categories.map(cat => (
              <div key={cat.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div className="card h-100 border-0 shadow-sm text-center category-card py-3"
                  onClick={() => navigate(`/products?category=${cat.slug}`)}>
                  <div className="card-body p-2">
                    <i className={`bi ${cat.icon || 'bi-grid'} display-5 text-primary mb-2`} />
                    <p className="card-text fw-semibold text-dark small mb-0">{lang === 'am' ? (cat.name_am || cat.name) : cat.name}</p>
                    <p className="text-muted" style={{ fontSize: '0.72rem' }}>{cat.product_count} {t('itemsLabel')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-5">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold mb-0"><i className="bi bi-star-fill text-warning me-2" />{t('featuredProducts')}</h2>
              <Link to="/products" className="btn btn-outline-primary btn-sm">{t('viewAll')}</Link>
            </div>
            <div className="row g-3">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0"><i className="bi bi-clock text-primary me-2" />{t('latestListings')}</h2>
            <Link to="/products" className="btn btn-outline-primary btn-sm">{t('viewAll')}</Link>
          </div>
          {latest.length > 0
            ? <div className="row g-3">{latest.map(p => <ProductCard key={p.id} product={p} />)}</div>
            : (
              <div className="text-center py-5">
                <i className="bi bi-box-seam display-1 text-muted" />
                <h4 className="text-muted mt-3">{t('noProductsYet')}</h4>
                <Link to="/auth/register" className="btn btn-primary mt-2">{t('beFirstSeller')}</Link>
              </div>
            )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-5">
        <div className="container">
          <h2 className="fw-bold text-center mb-5">{t('howItWorks')}</h2>
          <div className="row g-4 text-center">
            {[
              ['bi-person-plus', t('step1Title'), t('step1Desc'), 'bg-success'],
              ['bi-box-seam',    t('step2Title'), t('step2Desc'), 'bg-warning'],
              ['bi-cart-check',  t('step3Title'), t('step3Desc'), 'bg-success'],
              ['bi-credit-card', t('step4Title'), t('step4Desc'), 'bg-info'],
            ].map(([icon, title, desc, bg]) => (
              <div key={title} className="col-md-3">
                <div className={`${bg} bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
                  style={{ width: 70, height: 70 }}>
                  <i className={`bi ${icon} fs-2 ${bg.replace('bg-', 'text-')}`} />
                </div>
                <h5 className="fw-bold">{title}</h5>
                <p className="text-muted small">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="py-5 text-white" style={{ background: 'linear-gradient(135deg,#2d6600 0%,#5baa00 100%)' }}>
        <div className="container text-center py-3">
          <h2 className="fw-bold mb-3">{t('startSellingToday')}</h2>
          <p className="lead mb-4">{t('wantToSell')}</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/subscriptions" className="btn btn-warning btn-lg px-4"><i className="bi bi-tags me-2" />{t('viewPricingPlans')}</Link>
            <Link to="/auth/register" className="btn btn-outline-light btn-lg px-4"><i className="bi bi-person-plus me-2" />{t('registerNow')}</Link>
          </div>
        </div>
      </section>
    </>
  )
}
