import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'
import ProfileCard from '../components/ProfileCard'

// Fix for Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

const KELIBIA_CENTER: [number, number] = [36.8474, 11.0991]

type UserInfo = {
  first_name: string
  last_name: string
  first_name_ar?: string
  last_name_ar?: string
  email: string
  is_verified: boolean
  phone?: string
  user_type?: string
  is_staff?: boolean
  is_superuser?: boolean
}

type ForumNotif = {
  id: number
  is_read: boolean
}

export default function DashboardPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [marriageNotifications, setMarriageNotifications] = useState<any[]>([])
  const [forumUnread, setForumUnread] = useState(0)
  const [reclamations, setReclamations] = useState<any[]>([])
  const [livretNotifications, setLivretNotifications] = useState<any[]>([])
  const [loadingMap, setLoadingMap] = useState(true)


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
        if (res.ok) {
          const data = (await res.json()) as UserInfo
          setUser(data)
          // REDIRECTION GUARD: If user is an agent/admin, send them to the agent dashboard
          if (data.user_type === 'agent' || data.is_staff || data.is_superuser) {
            navigate('/agent-dashboard')
            return
          }
        }

        // Fetch reclamations for map
        const rRes = await fetch('/api/reclamations/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (rRes.ok) {
          const rData = await rRes.json()
          setReclamations(rData)
        }

        // Fetch marriage requests
        const mRes = await fetch('/extrait-mariage/demandes/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (mRes.ok) {
          const mData = await mRes.json()
          const signed = mData.filter((d: any) => d.status === 'signed')
          setMarriageNotifications(signed)
        }

        // Fetch forum unread notifications count
        const nRes = await fetch('/api/forum/notifications/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (nRes.ok) {
          const nData = (await nRes.json()) as ForumNotif[]
          const unread = nData.filter((n) => !n.is_read).length
          setForumUnread(unread)
        }

        // Fetch Livret de famille requests
        const lRes = await fetch('/livret-famille/demandes/', {
          headers: { Authorization: `Bearer ${access}` },
        })

        if (lRes.ok) {
          const lData = await lRes.json()
          const ready = lData.filter((d: any) => d.status === 'ready')
          setLivretNotifications(ready)
        }

      } catch (e) {
        console.error(e)
      } finally {
        setLoadingMap(false)
      }
    })()
  }, [navigate])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  const getMarkerIcon = (_status: string) => {
    return DefaultIcon;
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
                style={{ backgroundColor: 'var(--primary-navy)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <i className="fas fa-list-check me-2"></i>{t('view_my_reclamations')}
          </Link>

          <Link to="/nouvelle-reclamation" 
                className="btn w-100 py-2 fw-bold bg-white border border-primary shadow-sm"
                style={{ color: 'var(--primary-navy)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <i className="fas fa-plus-circle me-2 text-primary"></i>{t('new_signalement')}
          </Link>
        </>
      }
    >
      {user && !user.is_verified && (
        <div className="alert alert-warning shadow-sm border-start border-4 border-warning mb-4">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
            <div>
              <h5 className="alert-heading mb-1">{t('account_waiting_verification')}</h5>
              <p className="mb-0 small">
                {t('unverified_msg')}
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

      {/* LIVRET NOTIFICATION */}
      {livretNotifications.length > 0 && livretNotifications.map(notif => (
        <div key={notif.id} className="alert alert-success shadow-sm border-0 rounded-3 p-3 mb-4 animate__animated animate__bounceIn">
          <div className="d-flex align-items-center">
            <i className="fas fa-book-open fa-lg text-success me-3"></i>
            <div className="flex-grow-1">
              <h6 className="fw-bold mb-1">
                {t('livret_famille_ready')}
              </h6>
              <p className="mb-0 small">
                {t('livret_famille_ready_msg').replace('{guichet}', notif.guichet_recuperation || '..')}
              </p>
            </div>
            <Link to="/mes-demandes" className="btn btn-sm btn-success rounded-pill px-3">
              {t('view_requests')}
            </Link>
          </div>
        </div>
      ))}

      {/* QUICK ACTIONS */}

      <div className="content-card mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header-custom" style={{ backgroundColor: 'var(--primary-navy)', color: 'white' }}>
          <span><i className="fas fa-bolt icon text-warning"></i><span>{t('quick_actions')}</span></span>
        </div>
        <div className="card-body-custom p-0">
          <div className="row g-0 text-center">
            <div className="col-6 col-md-4 border-end border-bottom">
              <Link to="/nouvelle-reclamation" className="quick-action-btn p-4 d-block text-decoration-none text-dark">
                <i className="fas fa-plus-circle fa-2x text-primary mb-2"></i>
                <div className="small fw-bold">{t('new_reclamation')}</div>
              </Link>
            </div>
            <div className="col-6 col-md-4 border-end border-bottom">
              <Link to="/mes-extraits" className="quick-action-btn p-4 d-block text-decoration-none text-dark">
                <i className="fas fa-file-contract fa-2x text-primary mb-2"></i>
                <div className="small fw-bold">{t('extraits_hub_title')}</div>
              </Link>
            </div>
            <div className="col-6 col-md-4 border-bottom">
              <Link to="/mes-reclamations" className="quick-action-btn p-4 d-block text-decoration-none text-dark">
                <i className="fas fa-bullhorn fa-2x text-primary mb-2"></i>
                <div className="small fw-bold">{t('my_reclamations')}</div>
              </Link>
            </div>
            <div className="col-6 col-md-4 border-end">
              <Link to="/mes-demandes" className="quick-action-btn p-4 d-block text-decoration-none text-dark">
                <i className="fas fa-tasks fa-2x text-primary mb-2"></i>
                <div className="small fw-bold">{t('my_requests')}</div>
              </Link>
            </div>
            <div className="col-6 col-md-4 border-end">
              <Link to="/services" className="quick-action-btn p-4 d-block text-decoration-none text-dark">
                <i className="fas fa-file-invoice fa-2x text-primary mb-2"></i>
                <div className="small fw-bold">{t('admin_services')}</div>
              </Link>
            </div>
            <div className="col-6 col-md-4">
              <Link to="/news" className="quick-action-btn p-4 d-block text-decoration-none text-dark">
                <i className="fas fa-newspaper fa-2x text-primary mb-2"></i>
                <div className="small fw-bold">{t('news_title')}</div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MAP CARD */}
      <div className="content-card mb-4" id="mapCard" style={{ minHeight: '450px' }}>
        <div className="card-header-custom d-flex justify-content-between align-items-center">
          <span><i className="fas fa-map-marked-alt icon text-primary"></i><span>{t('map_title_realtime')}</span></span>
          <span className="badge bg-primary rounded-pill font-monospace" style={{ fontSize: '0.7rem' }}>{reclamations.length} {t('map_signalements_count')}</span>
        </div>
        <div className="position-relative" style={{ height: '380px' }}>
          {loadingMap ? (
             <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary" role="status"></div>
             </div>
          ) : (
            <MapContainer center={KELIBIA_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name={t('map_osm')}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name={t('map_satellite')}>
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </LayersControl.BaseLayer>
              </LayersControl>
              
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {reclamations.map((rec : any) => rec.latitude && rec.longitude && (
                <Marker key={rec.id} position={[rec.latitude, rec.longitude]} icon={getMarkerIcon(rec.status)}>
                  <Popup>
                    <div className="p-1">
                      <div className="fw-bold text-primary mb-1">{rec.title}</div>
                      <div className="small text-muted mb-2">{rec.description}</div>
                      <span className={`badge bg-${rec.status === 'resolved' ? 'success' : 'warning'} small`}>{rec.status}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              <div className="leaflet-bottom leaflet-left" style={{ zIndex: 1000, margin: '15px' }}>
                  <div className="card shadow-sm border-0 p-3 bg-white" style={{ borderRadius: '8px', opacity: 0.9 }}>
                    <div className="small fw-bold mb-2 border-bottom pb-1">{t('map_legend')}</div>
                    <div className="d-flex flex-column gap-1">
                       <span className="small d-flex align-items-center"><i className="fas fa-circle text-warning me-2" style={{ fontSize: '0.6rem' }}></i> {t('status_pending')}</span>
                       <span className="small d-flex align-items-center"><i className="fas fa-circle text-primary me-2" style={{ fontSize: '0.6rem' }}></i> {t('status_in_progress')}</span>
                       <span className="small d-flex align-items-center"><i className="fas fa-circle text-success me-2" style={{ fontSize: '0.6rem' }}></i> {t('status_resolved')}</span>
                       <span className="small d-flex align-items-center"><i className="fas fa-circle text-danger me-2" style={{ fontSize: '0.6rem' }}></i> {t('status_rejected')}</span>
                    </div>
                  </div>
              </div>
            </MapContainer>
          )}
        </div>
      </div>

      {/* FORUM CARD */}
      <div className="content-card mb-4" style={{ borderLeft: '5px solid #6f42c1' }}>
        <div className="card-header-custom" style={{ backgroundColor: 'var(--primary-navy)', color: 'white' }}>
          <span>
            <i className="fas fa-comments icon"></i>
            <span>{t('forum')}</span>
            {forumUnread > 0 && (
              <span className="badge bg-danger rounded-pill ms-2" style={{ fontSize: '0.7rem' }}>{forumUnread}</span>
            )}
          </span>
        </div>
        <div className="card-body-custom p-3">
          <p className="text-muted small mb-3">{t('forum_desc')}</p>
          <Link to="/forum" className="btn btn-sm rounded-pill px-4" style={{ borderColor: '#6f42c1', color: '#6f42c1', border: '1px solid #6f42c1' }}>
            <i className="fas fa-arrow-right me-2" />{t('forum')}
          </Link>
        </div>
      </div>

      {/* NEWS MINI CARDS */}
      <div className="content-card">
        <div className="card-header-custom d-flex justify-content-between align-items-center">
          <span><i className="fas fa-newspaper icon"></i><span>{t('news_title')}</span></span>
          <Link to="/evenements" className="btn btn-sm rounded-pill px-3 fw-bold"
            style={{ background: '#6f42c1', color: '#fff', border: 'none', fontSize: '.75rem' }}>
            <i className="fas fa-calendar-star me-1"></i>
            {t('events_public')}
          </Link>
        </div>
        <div className="card-body-custom">
          <div className="news-mini">
            <div className="news-dot"></div>
            <div>
              <div className="news-text">{t('news_item_1')}</div>
              <div className="news-date">{t('news_date_1')}</div>
            </div>
          </div>
          <div className="news-mini">
            <div className="news-dot"></div>
            <div>
              <div className="news-text">{t('news_item_2')}</div>
              <div className="news-date">{t('news_date_2')}</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

