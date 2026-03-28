import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'
import ProfileCard from '../components/ProfileCard'

type UserInfo = {
  first_name: string
  last_name: string
  email: string
  is_verified: boolean
}

export default function DashboardPage() {
  const { t } = useI18n()
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
    <MainLayout 
      user={user} 
      onLogout={logout} 
      showHero={true}
      rightSidebar={
        <>
          <ProfileCard user={user} />
          
          <Link to="/mes-reclamations" 
                className="btn w-100 mb-2 py-2 fw-bold text-white shadow-sm"
                style={{ backgroundColor: 'var(--green-mid)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <i className="fas fa-list-check me-2"></i>Voir mes réclamations
          </Link>

          <Link to="/nouvelle-reclamation" 
                className="btn w-100 py-2 fw-bold bg-white border shadow-sm"
                style={{ color: 'var(--green-dark)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <i className="fas fa-plus-circle me-2 text-primary"></i>Nouveau signalement
          </Link>
        </>
      }
    >
      {/* VERIFICATION ALERT */}
      {user && !user.is_verified && (
        <div className="alert alert-warning shadow-sm border-start border-4 border-warning mb-4">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
            <div>
              <h5 className="alert-heading mb-1">Compte en attente de vérification</h5>
              <p className="mb-0 small">
                Votre identité est en cours de validation par un agent municipal. 
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MARRIAGE NOTIFICATION */}
      {marriageNotifications.length > 0 && (
        <div className="alert alert-info shadow-sm border-0 rounded-3 p-3 mb-4 animate__animated animate__fadeIn">
          <div className="d-flex align-items-center">
            <i className="fas fa-ring fa-lg text-primary me-3"></i>
            <div className="flex-grow-1">
              <h6 className="fw-bold mb-0">{t('notification_mariage_signed')}</h6>
            </div>
            <Link to="/mes-mariages" className="btn btn-sm btn-primary rounded-pill px-3">
              {t('view_mariage_cert')}
            </Link>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="content-card mb-4">
        <div className="card-header-custom">
          <span><i className="fas fa-bolt icon"></i><span>{t('quick_actions')}</span></span>
        </div>
        <div className="card-body-custom">
          <div className="row g-3 text-center">
            <div className="col-6 col-md-3">
              <Link to="/nouvelle-reclamation" className="quick-action-btn">
                <i className="fas fa-plus-circle qa-icon"></i>
                <span>{t('new_reclamation')}</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/mes-reclamations" className="quick-action-btn">
                <i className="fas fa-list-check qa-icon"></i>
                <span>{t('my_reclamations')}</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/services" className="quick-action-btn">
                <i className="fas fa-file-invoice qa-icon"></i>
                <span>{t('admin_services')}</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/news" className="quick-action-btn">
                <i className="fas fa-newspaper qa-icon"></i>
                <span>{t('news_title')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MAP CARD */}
      <div className="content-card mb-4" id="mapCard">
        <div className="card-header-custom">
          <span><i className="fas fa-map-marked-alt icon"></i><span>Carte de Kélibia — Signalements</span></span>
        </div>
        <div id="citizenMap" style={{ height: '320px', background: '#dde3ea' }} className="d-flex align-items-center justify-content-center text-muted">
          <div>
            <i className="fas fa-map fa-3x mb-2 opacity-50"></i><br/>
            Chargement de la carte...
          </div>
        </div>
      </div>

      {/* NEWS MINI CARDS */}
      <div className="content-card">
        <div className="card-header-custom">
          <span><i className="fas fa-newspaper icon"></i><span>{t('news_title')}</span></span>
        </div>
        <div className="card-body-custom">
          <div className="news-mini">
            <div className="news-dot"></div>
            <div>
              <div className="news-text">Ramassage des ordures — Programme de mai 2025</div>
              <div className="news-date">12 mai 2025</div>
            </div>
          </div>
          <div className="news-mini">
            <div className="news-dot"></div>
            <div>
              <div className="news-text">Travaux d'entretien des routes côtières</div>
              <div className="news-date">8 mai 2025</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

