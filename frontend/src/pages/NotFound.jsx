import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function NotFound() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <div className="container py-5 text-center">
      <div className="py-5">
        <div className="display-1 fw-bold text-primary">404</div>
        <i className="bi bi-compass display-3 text-muted" />
        <h2 className="fw-bold mt-3">{t('pageNotFound')}</h2>
        <p className="text-muted lead mb-4">{t('pageNotFoundDesc')}</p>
        <div className="d-flex gap-3 justify-content-center">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2" />{t('goBack')}
          </button>
          <Link to="/" className="btn btn-primary">
            <i className="bi bi-house me-2" />{t('homeLabel')}
          </Link>
          <Link to="/products" className="btn btn-outline-primary">
            <i className="bi bi-search me-2" />{t('browseProducts')}
          </Link>
        </div>
      </div>
    </div>
  )
}
