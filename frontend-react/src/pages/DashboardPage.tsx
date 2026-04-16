import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
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
  city?: string
  cin?: string
  user_type?: string
  is_staff?: boolean
  is_superuser?: boolean
}

type ForumNotif = { id: number; is_read: boolean }

/* ── Styling ── */
const CSS = `
.db-section-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.db-section-title {
  font-size:1rem; font-weight:800; color:#1a1c1c;
  display:flex; align-items:center; gap:10px;
  font-family:'Public Sans',sans-serif;
}
.db-section-title::before {
  content:''; display:inline-block; width:5px; height:28px;
  background:linear-gradient(135deg, #954a00 0%, #f18221 100%); border-radius:3px; flex-shrink:0;
}
.db-action-card {
  display:flex; flex-direction:column; align-items:center; text-align:center;
  padding:14px 8px; background:#fff; border:1px solid transparent;
  transition:all .2s; cursor:pointer; text-decoration:none; color:inherit;
}
.db-action-card:hover {
  background:#fff; border-color:rgba(228,190,186,.4);
  box-shadow:0 12px 32px -4px rgba(26,28,28,.07);
}
.db-action-icon {
  width:38px; height:38px; border-radius:50%;
  background:rgba(255,183,133,.08); display:flex; align-items:center;
  justify-content:center; margin-bottom:8px; transition:transform .2s;
  color:#ffb785; font-size:1rem;
}
.db-action-card:hover .db-action-icon { transform:scale(1.1); }
.db-action-label { font-size:.65rem; font-weight:700; color:#1a1c1c; text-transform:uppercase; letter-spacing:.4px; line-height:1.3; }

/* Right sidebar */
.db-profile-card { background:#fff; padding:28px; box-shadow:0 12px 32px -4px rgba(26,28,28,.06); }
.db-profile-avatar {
  width:58px; height:58px; border-radius:50%; background:#e8e8e8;
  overflow:hidden; border:2px solid rgba(255,183,133,.18);
}
.db-profile-avatar-inner {
  width:100%; height:100%; display:flex; align-items:center; justify-content:center;
  font-size:1.4rem; font-weight:800; color:#ffb785; background:#fef2f2;
}
.db-stat-row {
  display:flex; justify-content:space-between; align-items:center;
  font-size:.85rem; padding:8px 0;
  border-bottom:1px solid #e8e8e8;
}
.db-stat-badge {
  background:rgba(255,183,133,.1); color:#ffb785;
  font-weight:800; padding:2px 8px; border-radius:3px; font-size:.78rem;
}
.db-signalement-btn {
  width:100%; padding:16px; background:linear-gradient(135deg, #954a00 0%, #f18221 100%); color:#fff;
  font-weight:700; font-size:.82rem; letter-spacing:1.5px; text-transform:uppercase;
  border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
  gap:10px; transition:opacity .2s; font-family:'Public Sans',sans-serif;
  text-decoration:none;
}
.db-signalement-btn:hover { opacity:.9; color:#fff; }
.db-news-item { cursor:pointer; }
.db-news-item:hover .db-news-headline { color:#ffb785; }
.db-news-time { font-size:.68rem; font-weight:700; color:#ffb785; display:block; margin-bottom:3px; }
.db-news-headline { font-size:.82rem; font-weight:700; color:#1a1c1c; line-height:1.35; transition:color .15s; }
.db-news-ar { font-size:.68rem; color:#5b403d; margin-top:2px; }
.db-urgence { background:linear-gradient(135deg, #954a00 0%, #f18221 100%); padding:28px; color:#fff; }
.db-urgence-title { font-size:1rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px; margin-bottom:16px; font-family:'Public Sans',sans-serif; }
.db-urgence-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.db-urgence-label { font-size:.75rem; font-weight:500; opacity:.9; }
.db-urgence-number { font-size:1.4rem; font-weight:800; letter-spacing:-.5px; }

/* Reclamation rows */
.db-rec-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px; border:1px solid #eeeeee;
  background:#f9f9f9; transition:border-color .15s;
}
.db-rec-row:hover { border-color:#e4beba; }
.db-rec-icon { width:44px; height:44px; border-radius:50%; background:rgba(255,183,133,.08); display:flex; align-items:center; justify-content:center; color:#ffb785; flex-shrink:0; }
.db-status-badge { font-size:.65rem; font-weight:800; padding:4px 10px; text-transform:uppercase; letter-spacing:.5px; border-radius:2px; }

/* Footer */
.db-footer { background:#e8e8e8; padding:40px 48px; margin-top:0; border-top:1px solid transparent; }
.db-footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:32px; }
.db-footer-brand { font-size:1.05rem; font-weight:900; color:#ffb785; text-transform:uppercase; letter-spacing:-.3px; font-family:'Public Sans',sans-serif; }
.db-footer-copy { font-size:.72rem; color:#5b403d; margin-top:4px; }
.db-footer-heading { font-size:.75rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px; margin-bottom:14px; color:#1a1c1c; }
.db-footer-link { display:block; font-size:.75rem; color:#5b403d; text-decoration:none; margin-bottom:6px; }
.db-footer-link:hover { color:#ffb785; }
.db-footer-social { display:flex; gap:10px; margin-top:4px; }
.db-footer-social-btn {
  width:32px; height:32px; border-radius:50%; background:#dadada;
  display:flex; align-items:center; justify-content:center;
  font-size:.8rem; color:#1a1c1c; transition:all .2s; text-decoration:none;
}
.db-footer-social-btn:hover { background:linear-gradient(135deg, #954a00 0%, #f18221 100%); color:#fff; }
.db-footer-bottom { margin-top:32px; padding-top:20px; border-top:1px solid rgba(26,28,28,.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
.db-footer-legal { font-size:.65rem; color:#5b403d; font-weight:500; text-transform:uppercase; letter-spacing:1px; }
.db-footer-legal a { color:#5b403d; text-decoration:none; margin-left:20px; }
.db-footer-legal a:hover { color:#ffb785; }

@media (max-width:900px) {
  .db-footer-grid { grid-template-columns:1fr; }
}
`

export default function DashboardPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [marriageNotifications, setMarriageNotifications] = useState<any[]>([])
  const [forumUnread, setForumUnread] = useState(0)
  const [reclamations, setReclamations] = useState<any[]>([])
  const [livretNotifications, setLivretNotifications] = useState<any[]>([])
  const [loadingMap, setLoadingMap] = useState(true)
  const [newsItems, setNewsItems] = useState<{ id: number; title: string; created_at: string }[]>([])

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    ;(async () => {
      try {
        const res = await fetch('/api/accounts/me/', { headers: { Authorization: `Bearer ${access}` } })
        if (res.ok) {
          const data = (await res.json()) as UserInfo
          setUser(data)
          if (data.user_type === 'agent' || data.is_staff || data.is_superuser) { navigate('/agent-dashboard'); return }
        }
        const rRes = await fetch('/api/reclamations/', { headers: { Authorization: `Bearer ${access}` } })
        if (rRes.ok) setReclamations(await rRes.json())

        const mRes = await fetch('/extrait-mariage/demandes/', { headers: { Authorization: `Bearer ${access}` } })
        if (mRes.ok) { const d = await mRes.json(); setMarriageNotifications(d.filter((x: any) => x.status === 'signed')) }

        const nRes = await fetch('/api/forum/notifications/', { headers: { Authorization: `Bearer ${access}` } })
        if (nRes.ok) { const d = (await nRes.json()) as ForumNotif[]; setForumUnread(d.filter(n => !n.is_read).length) }

        const newsRes = await fetch('/api/news/')
        if (newsRes.ok) {
          const d = await newsRes.json()
          setNewsItems((Array.isArray(d) ? d : (d.results || [])).slice(0, 3))
        }

        const lRes = await fetch('/livret-famille/demandes/', { headers: { Authorization: `Bearer ${access}` } })
        if (lRes.ok) { const d = await lRes.json(); setLivretNotifications(d.filter((x: any) => x.status === 'ready')) }
      } catch (e) { console.error(e) }
      finally { setLoadingMap(false) }
    })()
  }, [navigate])

  function logout() { clearTokens(); navigate('/login') }

  const getMarkerIcon = (status: string) => {
    const colors: Record<string, string> = { pending: '#f57f17', in_progress: '#1565c0', resolved: '#2e7d32', rejected: '#c62828' }
    const color = colors[status] || '#1565c0'
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background:${color};width:13px;height:13px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 5px rgba(0,0,0,.3)"></div>`,
      iconSize: [13, 13], iconAnchor: [6, 6],
    })
  }

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    pending:     { bg: '#fef2f2', color: '#ffb785', label: t('status_pending') },
    in_progress: { bg: '#eff6ff', color: '#1565c0', label: t('status_in_progress') },
    resolved:    { bg: '#f0fdf4', color: '#166534', label: t('status_resolved') },
    rejected:    { bg: '#fef2f2', color: '#ffb785', label: t('status_rejected') },
  }

  const catIcons: Record<string, string> = {
    lighting: 'fas fa-lightbulb', trash: 'fas fa-trash-alt',
    roads: 'fas fa-road', noise: 'fas fa-volume-up', other: 'fas fa-exclamation-circle',
  }

  const userName = user
    ? (lang === 'ar' && user.first_name_ar ? `${user.first_name_ar} ${user.last_name_ar ?? ''}` : `${user.first_name} ${user.last_name}`)
    : t('loading')

  const userInitial = user
    ? (lang === 'ar' && user.first_name_ar ? user.first_name_ar[0] : user.first_name[0]).toUpperCase()
    : '?'

  /* ── Right sidebar ── */
  const rightSidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
      <style>{CSS}</style>

      {/* Profile card */}
      <div className="db-profile-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div className="db-profile-avatar">
            <div className="db-profile-avatar-inner">{userInitial}</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1a1c1c', fontFamily: 'Public Sans,sans-serif' }}>{userName}</div>
            <div style={{ fontSize: '.7rem', color: '#5b403d', marginTop: 2 }}>
              {user?.is_verified ? t('citoyen_role') : t('account_waiting_verification')}
            </div>
          </div>
        </div>
        <div>
          <div className="db-stat-row">
            <span style={{ color: '#5b403d' }}>Mes Dossiers</span>
            <span className="db-stat-badge">{String(reclamations.length).padStart(2, '0')}</span>
          </div>
          <div className="db-stat-row" style={{ borderBottom: 'none' }}>
            <span style={{ color: '#5b403d' }}>Points Fidélité</span>
            <span style={{ fontWeight: 800, color: '#1a1c1c' }}>1 240 pts</span>
          </div>
        </div>
        <Link
          to="/profile"
          style={{ display: 'block', width: '100%', marginTop: 18, padding: '10px', textAlign: 'center', background: '#e8e8e8', color: '#1a1c1c', fontWeight: 800, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none', transition: 'background .2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#dadada')}
          onMouseLeave={e => (e.currentTarget.style.background = '#e8e8e8')}
        >
          Mon Compte
        </Link>
      </div>

      {/* Big red CTA */}
      <Link to="/nouvelle-reclamation" className="db-signalement-btn">
        <i className="fas fa-plus-circle"></i>
        NOUVEAU SIGNALEMENT
      </Link>

      {/* Recent news list */}
      <div style={{ background: '#fff', padding: '24px' }}>
        <div style={{ fontWeight: 800, fontSize: '.82rem', color: '#1a1c1c', textTransform: 'uppercase', letterSpacing: '.5px', paddingBottom: 6, borderBottom: '2px solid #ffb785', display: 'inline-block', marginBottom: 16, fontFamily: 'Public Sans,sans-serif' }}>
          {t('news_title')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {newsItems.length > 0 ? newsItems.map(item => (
            <Link key={item.id} to="/news" className="db-news-item" style={{ textDecoration: 'none' }}>
              <span className="db-news-time">
                {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
              </span>
              <div className="db-news-headline">{item.title}</div>
            </Link>
          )) : (
            <>
              <div className="db-news-item">
                <span className="db-news-time">{t('news_date_1')}</span>
                <div className="db-news-headline">{t('news_item_1')}</div>
              </div>
              <div className="db-news-item">
                <span className="db-news-time">{t('news_date_2')}</span>
                <div className="db-news-headline">{t('news_item_2')}</div>
              </div>
            </>
          )}
        </div>
        <Link
          to="/news"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: '.72rem', fontWeight: 800, color: '#ffb785', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,183,133,.2)', paddingBottom: 2 }}
        >
          Voir tout le flux <i className="fas fa-arrow-right" style={{ fontSize: '.7rem' }}></i>
        </Link>
      </div>

      {/* Urgence panel */}
      <div className="db-urgence">
        <div className="db-urgence-title">{lang === 'ar' ? 'طوارئ' : 'Urgence'}</div>
        <div className="db-urgence-row">
          <span className="db-urgence-label">{lang === 'ar' ? 'الحماية المدنية' : 'Protection Civile'}</span>
          <span className="db-urgence-number">198</span>
        </div>
        <div className="db-urgence-row" style={{ marginBottom: 0 }}>
          <span className="db-urgence-label">{lang === 'ar' ? 'طوارئ البلدية' : 'S.O.S Municipalité'}</span>
          <span className="db-urgence-number">72 295 034</span>
        </div>
      </div>
    </div>
  )

  return (
    <MainLayout user={user} onLogout={logout} showHero={true} rightSidebar={rightSidebar}>
      <style>{CSS}</style>

      {/* ── Alerts ── */}
      {user && !user.is_verified && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', marginBottom: 18, borderLeft: '4px solid #f59e0b', background: '#fffbeb', borderRadius: 2 }}>
          <i className="fas fa-exclamation-triangle" style={{ color: '#d97706', marginTop: 2 }}></i>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 2 }}>{t('account_waiting_verification')}</div>
            <div style={{ fontSize: '.82rem', color: '#b45309' }}>{t('unverified_msg')}</div>
          </div>
        </div>
      )}

      {marriageNotifications.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16, background: '#eff6ff', borderLeft: '4px solid #2563eb', borderRadius: 2 }}>
          <i className="fas fa-ring" style={{ color: '#2563eb' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#1e40af' }}>{t('notification_mariage_signed')}</div>
          </div>
          <Link to="/mes-mariages" style={{ padding: '6px 16px', background: '#1565c0', color: '#fff', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', borderRadius: 999 }}>
            {t('view_mariage_cert')}
          </Link>
        </div>
      )}

      {livretNotifications.map((notif: any) => (
        <div key={notif.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16, background: '#f0fdf4', borderLeft: '4px solid #22c55e', borderRadius: 2 }}>
          <i className="fas fa-book-open" style={{ color: '#16a34a' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#166534' }}>{t('livret_famille_ready')}</div>
            <div style={{ fontSize: '.78rem', color: '#15803d' }}>{t('livret_famille_ready_msg').replace('{guichet}', notif.guichet_recuperation || '..')}</div>
          </div>
          <Link to="/mes-demandes" style={{ padding: '6px 16px', background: '#166534', color: '#fff', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', borderRadius: 999 }}>
            {t('view_requests')}
          </Link>
        </div>
      ))}

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 28 }}>
        <div className="db-section-bar">
          <h3 className="db-section-title">{t('quick_actions')}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { to: '/nouvelle-reclamation', icon: 'fas fa-plus-circle',   labelKey: 'new_reclamation' },
            { to: '/mes-extraits',         icon: 'fas fa-file-contract', labelKey: 'extraits_hub_title' },
            { to: '/services',             icon: 'fas fa-receipt',       labelKey: 'admin_services' },
            { to: '/mes-demandes',         icon: 'fas fa-calendar-alt',  labelKey: 'my_requests' },
            { to: '/demande-construction', icon: 'fas fa-hard-hat',      labelKey: 'permis_construire' },
            { to: '/news',                 icon: 'fas fa-leaf',          labelKey: 'news_title' },
            { to: '/nouvelle-reclamation', icon: 'fas fa-traffic-light', labelKey: 'new_signalement' },
            { to: '/forum',                icon: 'fas fa-comments',      labelKey: 'forum' },
          ].map(item => (
            <Link key={item.to + item.labelKey} to={item.to} className="db-action-card">
              <div className="db-action-icon"><i className={item.icon}></i></div>
              <span className="db-action-label">{t(item.labelKey)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ background: '#fff', marginBottom: 28, border: '1px solid #eeeeee' }} id="mapCard">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #eeeeee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1a1c1c', fontFamily: 'Public Sans,sans-serif' }}>{t('map_title_realtime')}</div>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { color: '#f57f17', label: lang === 'ar' ? 'بانتظار' : 'En attente' },
              { color: '#1565c0', label: lang === 'ar' ? 'قيد التنفيذ' : 'En cours' },
              { color: '#2e7d32', label: lang === 'ar' ? 'محلول' : 'Résolu' },
              { color: '#c62828', label: lang === 'ar' ? 'مرفوض' : 'Rejeté' },
            ].map(i => (
              <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', color: '#5b403d' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: i.color, display: 'inline-block' }}></span>
                {i.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 360, position: 'relative' }}>
          {loadingMap ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
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
              {reclamations.map((rec: any) =>
                rec.latitude && rec.longitude && (
                  <Marker key={rec.id} position={[rec.latitude, rec.longitude]} icon={getMarkerIcon(rec.status)}>
                    <Popup>
                      <div style={{ padding: 4 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{rec.title}</div>
                        <div style={{ fontSize: '.78rem', color: '#5b403d', marginBottom: 6 }}>{rec.description}</div>
                        <span style={{ ...statusConfig[rec.status], padding: '2px 8px', fontSize: '.65rem', fontWeight: 800, borderRadius: 2 }}>
                          {statusConfig[rec.status]?.label}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )
              )}
            </MapContainer>
          )}
        </div>
      </div>

      {/* ── Mes signalements ── */}
      <div style={{ background: '#fff', border: '1px solid #eeeeee', marginBottom: 28 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #eeeeee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800, fontSize: '.88rem', margin: 0, fontFamily: 'Public Sans,sans-serif', color: '#1a1c1c' }}>
            {t('my_reclamations')}
          </h3>
          <Link
            to="/nouvelle-reclamation"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'linear-gradient(135deg, #954a00 0%, #f18221 100%)', color: '#fff', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '.5px' }}
          >
            <i className="fas fa-plus-circle"></i>
            {t('new_signalement')}
          </Link>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reclamations.slice(0, 3).length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: '.85rem' }}>
              {t('no_reclamations') || "Aucun signalement pour l'instant"}
            </p>
          ) : (
            reclamations.slice(0, 3).map((rec: any) => {
              const sc = statusConfig[rec.status] || statusConfig['pending']
              return (
                <div key={rec.id} className="db-rec-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="db-rec-icon">
                      <i className={catIcons[rec.category] || 'fas fa-exclamation-circle'}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#1a1c1c' }}>{rec.title}</div>
                      <div style={{ fontSize: '.7rem', color: '#5b403d', marginTop: 2 }}>
                        {new Date(rec.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                      </div>
                    </div>
                  </div>
                  <span className="db-status-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
              )
            })
          )}
          {reclamations.length > 3 && (
            <Link to="/mes-reclamations" style={{ textAlign: 'center', display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#ffb785', textDecoration: 'none', padding: '10px 0' }}>
              {t('view_all') || 'Voir tout'} ({reclamations.length})
            </Link>
          )}
        </div>
      </div>

      {/* ── Forum card ── */}
      <div style={{ background: '#fff', border: '1px solid #eeeeee', borderLeft: '4px solid #7c3aed', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(124,58,237,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontSize: '1rem' }}>
            <i className="fas fa-comments"></i>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#1a1c1c', fontFamily: 'Public Sans,sans-serif' }}>
              {t('forum')}
              {forumUnread > 0 && (
                <span style={{ marginLeft: 8, background: '#ffb785', color: '#fff', fontSize: '.62rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999 }}>{forumUnread}</span>
              )}
            </div>
            <div style={{ fontSize: '.75rem', color: '#5b403d', marginTop: 2 }}>{t('forum_desc')}</div>
          </div>
        </div>
        <Link
          to="/forum"
          style={{ padding: '8px 18px', border: '1.5px solid #7c3aed', color: '#7c3aed', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <i className="fas fa-arrow-right"></i> {t('forum')}
        </Link>
      </div>

      {/* ── Footer ── */}
      <div className="db-footer" style={{ marginLeft: -32, marginRight: -32, marginBottom: -24 }}>
        <div className="db-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <i className="fas fa-landmark" style={{ color: '#ffb785', fontSize: '1.1rem' }}></i>
              <span className="db-footer-brand">{lang === 'ar' ? 'بلدية قليبية' : 'VILLE DE KÉLIBIA'}</span>
            </div>
            <p style={{ fontSize: '.75rem', color: '#5b403d', lineHeight: 1.65, maxWidth: 340, margin: 0 }}>
              {t('footer_text')}
            </p>
          </div>
          <div>
            <div className="db-footer-heading">Liens Utiles</div>
            <a href="#" className="db-footer-link">Mairie &amp; Conseil</a>
            <a href="#" className="db-footer-link">Culture &amp; Patrimoine</a>
            <a href="#" className="db-footer-link">Tourisme</a>
            <a href="#" className="db-footer-link">Plan de ville</a>
          </div>
          <div>
            <div className="db-footer-heading">Suivez-nous</div>
            <div className="db-footer-social">
              <a href="#" className="db-footer-social-btn"><i className="fas fa-globe"></i></a>
              <a href="#" className="db-footer-social-btn"><i className="fas fa-share-alt"></i></a>
              <a href="#" className="db-footer-social-btn"><i className="fas fa-envelope"></i></a>
            </div>
          </div>
        </div>
        <div className="db-footer-bottom">
          <span className="db-footer-legal">© 2024 Commune de Kélibia — Tous droits réservés</span>
          <div>
            <a href="#" className="db-footer-legal" style={{ marginLeft: 0 }}>Mentions Légales</a>
            <a href="#" className="db-footer-legal">Confidentialité</a>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
