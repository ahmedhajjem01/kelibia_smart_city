import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

type UserInfo = {
  first_name: string
  last_name: string
  email: string
  is_verified: boolean
}

export default function DashboardPage() {
  const { t, setLang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [marriageNotifications, setMarriageNotifications] = useState<any[]>([])

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }
    ;(async () => {
      try {
        // Fetch user info
        const res = await fetch('/api/accounts/me/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (!res.ok) throw new Error('Failed to fetch user info')
        const data = (await res.json()) as UserInfo
        setUser(data)

        // Fetch marriage requests for notifications
        const mRes = await fetch('/extrait-mariage/demandes/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (mRes.ok) {
          const mData = await mRes.json()
          const signed = mData.filter((d: any) => d.status === 'signed')
          setMarriageNotifications(signed)
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [navigate])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <a className="navbar-brand" href="#" data-i18n="home">
            Kelibia Smart City
          </a>

          <div className="d-flex align-items-center">
            <div className="btn-group me-3" role="group" aria-label="Language">
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('fr')}
                title="Français"
              >
                <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('ar')}
                title="العربية"
              >
                <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
              </button>
            </div>

            <button
              className="btn btn-outline-light btn-sm"
              onClick={logout}
              type="button"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row">
          <div className="col-md-8">
            {user && !user.is_verified && (
              <div className="alert alert-warning shadow-sm border-start border-4 border-warning">
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
                  <div>
                    <h5 className="alert-heading mb-1">Compte en attente de vérification</h5>
                    <p className="mb-0 small text-dark">
                      Votre identité est en cours de validation par un agent municipal. 
                      Certaines fonctionnalités peuvent être limitées temporairement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="alert alert-success">
              <h4>{t('welcome')}</h4>
              <p>{t('welcome_msg')}</p>
            </div>

            {marriageNotifications.length > 0 && (
              <div className="alert alert-info shadow-lg border-0 rounded-4 p-4 mb-4 animate__animated animate__bounceIn">
                <div className="d-flex align-items-center">
                  <div className="bg-white rounded-circle p-3 me-4 shadow-sm">
                    <i className="fas fa-ring fa-2x text-primary animate__animated animate__pulse animate__infinite"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="fw-bold text-dark mb-1">{t('notification_mariage_signed')}</h5>
                    <p className="text-muted small mb-0">Kelibia Smart City - Service de l'État Civil</p>
                  </div>
                  <Link to="/mes-mariages" className="btn btn-primary rounded-pill px-4 shadow-sm">
                    {t('view_mariage_cert')}
                  </Link>
                </div>
              </div>
            )}

            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fas fa-file-invoice me-2" />
                  {t('admin_services')}
                </h5>
                <p className="card-text text-muted">{t('services_desc')}</p>
                <Link to="/services" className="btn btn-primary">
                  {t('view_services')}
                </Link>
              </div>
            </div>

            <div className="card shadow-sm mb-4 border-0 rounded-4 overflow-hidden border-start border-4 border-info">
              <div className="card-body">
                <h5 className="card-title text-info fw-bold">
                  <i className="fas fa-tasks me-2" />
                  {t('my_requests')}
                </h5>
                <p className="card-text text-muted small">{t('my_requests_desc')}</p>
                <div className="d-flex gap-2">
                    <Link to="/services" className="btn btn-info text-white rounded-pill px-4 shadow-sm">
                        <i className="fas fa-plus me-2"></i> {t('new_request')}
                    </Link>
                    <Link to="/mes-demandes" className="btn btn-outline-info rounded-pill px-4">
                        <i className="fas fa-history me-2"></i> {t('view_requests')}
                    </Link>
                </div>
              </div>
            </div>

            {user && user.is_verified && (
              <div className="card shadow-lg mb-4 border-0 rounded-4 overflow-hidden">
                <div className="card-header bg-gradient bg-primary text-white py-3">
                  <h5 className="mb-0">
                    <i className="fas fa-id-card-alt me-2" />
                    {t('civil_documents_hub')}
                  </h5>
                </div>
                <div className="card-body bg-light">
                  <p className="text-muted small mb-4">{t('civil_docs_desc')}</p>
                  <div className="row g-3">
                    <div className="col-md-3 col-6 text-center">
                      <Link to="/mes-extraits" className="text-decoration-none">
                        <div className="p-3 bg-white rounded-3 shadow-sm hover-lift border-bottom border-4 border-success h-100 d-flex flex-column align-items-center justify-content-center">
                          <i className="fas fa-baby fa-2x text-success mb-2"></i>
                          <span className="fw-bold small">{t('birth_cert')}</span>
                        </div>
                      </Link>
                    </div>
                    <div className="col-md-3 col-6 text-center">
                      <Link to="/mes-mariages" className="text-decoration-none">
                        <div className="p-3 bg-white rounded-3 shadow-sm hover-lift border-bottom border-4 border-primary h-100 d-flex flex-column align-items-center justify-content-center">
                          <i className="fas fa-ring fa-2x text-primary mb-2"></i>
                          <span className="fw-bold small">{t('mariage_cert')}</span>
                        </div>
                      </Link>
                    </div>
                    <div className="col-md-3 col-6 text-center">
                      <Link to="/mes-deces" className="text-decoration-none">
                        <div className="p-3 bg-white rounded-3 shadow-sm hover-lift border-bottom border-4 border-dark h-100 d-flex flex-column align-items-center justify-content-center">
                          <i className="fas fa-dove fa-2x text-dark mb-2"></i>
                          <span className="fw-bold small">{t('deces_cert')}</span>
                        </div>
                      </Link>
                    </div>
                    <div className="col-md-3 col-6 text-center">
                      <Link to="/mes-residences" className="text-decoration-none">
                        <div className="p-3 bg-white rounded-3 shadow-sm hover-lift border-bottom border-4 border-warning h-100 d-flex flex-column align-items-center justify-content-center">
                          <i className="fas fa-home fa-2x text-warning mb-2"></i>
                          <span className="fw-bold small">{t('residence_cert')}</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card shadow-sm mb-4 border-0 rounded-4 overflow-hidden">
              <div className="card-body">
                <h5 className="card-title text-danger fw-bold">
                  <i className="fas fa-bullhorn me-2" />
                  {t('my_reclamations')}
                </h5>
                <p className="card-text text-muted small">{t('reclamations_desc')}</p>
                <div className="d-flex gap-2">
                    <Link to="/nouvelle-reclamation" className="btn btn-danger rounded-pill px-4 shadow-sm">
                        <i className="fas fa-plus me-2"></i> {t('new_reclamation')}
                    </Link>
                    <Link to="/mes-reclamations" className="btn btn-outline-danger rounded-pill px-4">
                        <i className="fas fa-list me-2"></i> {t('view_reclamations')}
                    </Link>
                </div>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title text-warning">
                  <i className="fas fa-newspaper me-2" />
                  {t('news_title')}
                </h5>
                <p className="card-text text-muted">{t('news_desc')}</p>
                <a href="#" className="btn btn-warning">
                  Lire les articles
                </a>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">{t('profile')}</h6>
              </div>
              <div className="card-body text-center">
                <img
                  src="https://ui-avatars.com/api/?name=User&background=0D6EFD&color=fff"
                  className="rounded-circle mb-3"
                  width="80"
                  alt="User avatar"
                />
                <h6>{user ? `${user.first_name} ${user.last_name}` : 'Chargement...'}</h6>
                <p className="text-muted small">{user ? user.email : '...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

