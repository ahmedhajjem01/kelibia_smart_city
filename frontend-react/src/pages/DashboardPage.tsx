import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

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
  city?: string
  cin?: string
  user_type?: string
  is_staff?: boolean
  is_superuser?: boolean
}

type ForumNotif = {
  id: number
  is_read: boolean
}

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
    if (!access) {
      navigate('/login')
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/accounts/me/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (res.ok) {
          const data = (await res.json()) as UserInfo
          setUser(data)
          if (data.user_type === 'agent' || data.is_staff || data.is_superuser) {
            navigate('/agent-dashboard')
            return
          }
        }

        const rRes = await fetch('/api/reclamations/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (rRes.ok) {
          const rData = await rRes.json()
          setReclamations(rData)
        }

        const mRes = await fetch('/extrait-mariage/demandes/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (mRes.ok) {
          const mData = await mRes.json()
          const signed = mData.filter((d: any) => d.status === 'signed')
          setMarriageNotifications(signed)
        }

        const nRes = await fetch('/api/forum/notifications/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (nRes.ok) {
          const nData = (await nRes.json()) as ForumNotif[]
          const unread = nData.filter((n) => !n.is_read).length
          setForumUnread(unread)
        }

        const newsRes = await fetch('/api/news/')
        if (newsRes.ok) {
          const newsData = await newsRes.json()
          const list = Array.isArray(newsData) ? newsData : (newsData.results || [])
          setNewsItems(list.slice(0, 3))
        }

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

  const getMarkerIcon = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#f57f17',
      in_progress: '#1565c0',
      resolved: '#2e7d32',
      rejected: '#c62828',
    }
    const color = colorMap[status] || '#1565c0'
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    })
  }

  /* ── Right sidebar: profile card ── */
  const rightSidebarContent = (
    <div className="space-y-4 pt-4">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <div className="h-2 w-full" style={{ background: 'linear-gradient(135deg, #c61f2c, #dc2626)' }}></div>
        <div className="p-6">
          <div className="relative inline-block mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto border-4 border-white shadow-lg"
              style={{ backgroundColor: '#c61f2c' }}
            >
              {user ? (lang === 'ar' && user.first_name_ar ? user.first_name_ar[0] : user.first_name[0]).toUpperCase() : '?'}
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-teal-500 border-4 border-white rounded-full block"></span>
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-1">
            {user ? (lang === 'ar' && user.first_name_ar ? `${user.first_name_ar} ${user.last_name_ar ?? ''}` : `${user.first_name} ${user.last_name}`) : t('loading')}
          </h4>
          <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#c61f2c' }}>
            {user?.is_verified ? t('citoyen_role') : t('account_waiting_verification')}
          </p>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 text-left">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">{t('cin_label') || 'ID'}</p>
              <p className="font-bold text-sm text-slate-700">
                {user?.cin ? `****${user.cin.slice(-4)}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">{t('city_label') || 'Ville'}</p>
              <p className="font-bold text-sm text-slate-700">{user?.city || 'Kélibia'}</p>
            </div>
          </div>
          <Link
            to="/profile"
            className="w-full mt-5 block py-2 rounded-lg text-center text-sm font-bold no-underline transition-colors"
            style={{ border: '1px solid #fecaca', color: '#c61f2c' }}
          >
            {t('edit_profile') || 'Éditer mon profil'}
          </Link>
        </div>
      </div>

      {/* Quick action buttons */}
      <Link
        to="/mes-reclamations"
        className="w-full block py-3 rounded-lg text-center text-sm font-bold text-white no-underline shadow-sm"
        style={{ backgroundColor: '#0d1b2e' }}
      >
        <i className="fas fa-list-check me-2"></i>{t('view_my_reclamations')}
      </Link>
      <Link
        to="/nouvelle-reclamation"
        className="w-full block py-3 rounded-lg text-center text-sm font-bold no-underline bg-white border border-slate-200 hover:bg-red-50 transition-colors"
        style={{ color: '#0d1b2e' }}
      >
        <i className="fas fa-plus-circle me-2" style={{ color: '#c61f2c' }}></i>{t('new_signalement')}
      </Link>
    </div>
  )

  return (
    <MainLayout
      user={user}
      onLogout={logout}
      showHero={true}
      rightSidebar={rightSidebarContent}
    >
      {/* ── ALERTS ── */}
      {user && !user.is_verified && (
        <div className="flex items-start gap-3 p-4 mb-4 rounded-xl border-l-4 border-yellow-400 bg-yellow-50">
          <i className="fas fa-exclamation-triangle text-2xl text-yellow-500 mt-1"></i>
          <div>
            <h5 className="font-bold text-yellow-800 mb-1">{t('account_waiting_verification')}</h5>
            <p className="text-sm text-yellow-700 mb-0">{t('unverified_msg')}</p>
          </div>
        </div>
      )}

      {marriageNotifications.length > 0 && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-blue-50 border border-blue-100">
          <i className="fas fa-ring text-blue-500 text-lg"></i>
          <div className="flex-1">
            <h6 className="font-bold text-blue-800 mb-0">{t('notification_mariage_signed')}</h6>
          </div>
          <Link to="/mes-mariages" className="px-4 py-2 rounded-full text-sm font-bold text-white no-underline" style={{ backgroundColor: '#1565c0' }}>
            {t('view_mariage_cert')}
          </Link>
        </div>
      )}

      {livretNotifications.length > 0 && livretNotifications.map((notif: any) => (
        <div key={notif.id} className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-green-50 border border-green-100">
          <i className="fas fa-book-open text-green-600 text-lg"></i>
          <div className="flex-1">
            <h6 className="font-bold text-green-800 mb-1">{t('livret_famille_ready')}</h6>
            <p className="text-sm text-green-700 mb-0">
              {t('livret_famille_ready_msg').replace('{guichet}', notif.guichet_recuperation || '..')}
            </p>
          </div>
          <Link to="/mes-demandes" className="px-4 py-2 rounded-full text-sm font-bold text-white no-underline" style={{ backgroundColor: '#2e7d32' }}>
            {t('view_requests')}
          </Link>
        </div>
      ))}

      {/* ── QUICK ACTIONS ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{lang === 'ar' ? 'الخدمات الإدارية' : 'Services Administratifs'}</h3>
            <p className="text-slate-500 text-sm mb-0">{t('quick_actions')}</p>
          </div>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#c61f2c' }}>E-Services</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: '/nouvelle-reclamation', icon: 'fas fa-plus-circle', label: t('new_reclamation'), ar: 'بلاغ جديد' },
              { to: '/mes-extraits', icon: 'fas fa-file-contract', label: t('extraits_hub_title'), ar: 'وثائق الحالة المدنية' },
              { to: '/mes-reclamations', icon: 'fas fa-bullhorn', label: t('my_reclamations'), ar: 'بلاغاتي' },
              { to: '/mes-demandes', icon: 'fas fa-tasks', label: t('my_requests'), ar: 'طلباتي' },
              { to: '/services', icon: 'fas fa-file-invoice', label: t('admin_services'), ar: 'الخدمات' },
              { to: '/news', icon: 'fas fa-newspaper', label: t('news_title'), ar: 'الأخبار' },
              { to: '/demande-construction', icon: 'fas fa-hard-hat', label: 'Permis de construire', ar: 'رخصة البناء' },
              { to: '/forum', icon: 'fas fa-comments', label: t('forum') || 'Forum', ar: 'المنتدى' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center p-5 rounded-xl no-underline transition-all duration-300 group border border-transparent hover:border-red-100"
                style={{ backgroundColor: '#f8fafc' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fff7ed')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              >
                <i className={`${item.icon} text-3xl mb-3 group-hover:scale-110 transition-transform`} style={{ color: '#c61f2c' }}></i>
                <span className="font-bold text-sm text-slate-800 text-center">{item.label}</span>
                <span className="text-xs text-slate-400 mt-1 text-center" dir="rtl">{item.ar}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAP CARD ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 overflow-hidden" id="mapCard">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-0">{t('map_title_realtime')}</h3>
            <p className="text-xs text-slate-500 mb-0">{lang === 'ar' ? 'تحديث فوري على البلدية' : 'Mise à jour en temps réel sur la commune'}</p>
          </div>
          <div className="flex gap-4">
            {[
              { color: '#f57f17', label: lang === 'ar' ? 'بانتظار' : 'En attente' },
              { color: '#1565c0', label: lang === 'ar' ? 'قيد التنفيذ' : 'En cours' },
              { color: '#2e7d32', label: lang === 'ar' ? 'محلول' : 'Résolu' },
              { color: '#c62828', label: lang === 'ar' ? 'مرفوض' : 'Rejeté' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: '400px', position: 'relative' }}>
          {loadingMap ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
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
                      <div className="p-1">
                        <div className="fw-bold text-primary mb-1">{rec.title}</div>
                        <div className="small text-muted mb-2">{rec.description}</div>
                        <span className={`badge bg-${rec.status === 'resolved' ? 'success' : rec.status === 'rejected' ? 'danger' : rec.status === 'in_progress' ? 'primary' : 'warning'} small`}>
                          {t('status_' + rec.status)}
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

      {/* ── MES SIGNALEMENTS ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900 mb-0">{lang === 'ar' ? 'بلاغاتي' : 'Mes Signalements'}</h3>
          <Link
            to="/nouvelle-reclamation"
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white no-underline shadow-sm"
            style={{ background: 'linear-gradient(135deg, #c61f2c, #dc2626)' }}
          >
            <i className="fas fa-plus-circle text-xs"></i>
            {lang === 'ar' ? 'بلاغ جديد' : 'Nouveau Signalement'}
          </Link>
        </div>
        <div className="p-4 space-y-3">
          {reclamations.slice(0, 3).length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">{t('no_reclamations') || 'Aucun signalement pour l\'instant'}</p>
          ) : (
            reclamations.slice(0, 3).map((rec: any) => {
              const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                pending: { bg: 'bg-red-100', text: 'text-red-800', label: t('status_pending') },
                in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('status_in_progress') },
                resolved: { bg: 'bg-green-100', text: 'text-green-800', label: t('status_resolved') },
                rejected: { bg: 'bg-red-100', text: 'text-red-800', label: t('status_rejected') },
              }
              const sc = statusColors[rec.status] || statusColors['pending']
              const catIcons: Record<string, string> = {
                lighting: 'fas fa-lightbulb',
                trash: 'fas fa-trash-alt',
                roads: 'fas fa-road',
                noise: 'fas fa-volume-up',
                other: 'fas fa-exclamation-circle',
              }
              return (
                <div key={rec.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-red-200 transition-colors" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-red-700 bg-red-100">
                      <i className={catIcons[rec.category] || 'fas fa-exclamation-circle'}></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 mb-0">{rec.title}</p>
                      <p className="text-xs text-slate-400 mb-0">
                        {new Date(rec.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <span className={`${sc.bg} ${sc.text} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter`}>
                    {sc.label}
                  </span>
                </div>
              )
            })
          )}
          {reclamations.length > 3 && (
            <Link to="/mes-reclamations" className="block text-center text-sm font-bold no-underline py-2 hover:underline" style={{ color: '#c61f2c' }}>
              {t('view_all') || 'Voir tout'} ({reclamations.length})
            </Link>
          )}
        </div>
      </div>

      {/* ── FORUM CARD ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6" style={{ borderLeft: '4px solid #7c3aed' }}>
        <div className="px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <i className="fas fa-comments text-purple-600"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0">
                {t('forum')}
                {forumUnread > 0 && (
                  <span className="ms-2 badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>{forumUnread}</span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mb-0">{t('forum_desc')}</p>
            </div>
          </div>
          <Link
            to="/forum"
            className="px-5 py-2 rounded-lg text-sm font-bold no-underline transition-colors border"
            style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
          >
            <i className="fas fa-arrow-right me-2"></i>{t('forum')}
          </Link>
        </div>
      </div>

      {/* ── NEWS ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900 mb-0">{t('news_title')}</h3>
          <div className="flex gap-2">
            <Link to="/evenements" className="px-4 py-2 rounded-lg text-xs font-bold text-white no-underline" style={{ backgroundColor: '#7c3aed' }}>
              <i className="fas fa-calendar-star me-1"></i>{t('events_public')}
            </Link>
            <Link to="/news" className="px-4 py-2 rounded-lg text-xs font-bold text-white no-underline" style={{ backgroundColor: '#1565c0' }}>
              <i className="fas fa-arrow-right me-1"></i>{t('see_all_news')}
            </Link>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {newsItems.length === 0 ? (
            <>
              {[t('news_item_1'), t('news_item_2')].map((text, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#c61f2c' }}></span>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-0">{text}</p>
                    <p className="text-xs text-slate-400 mt-1 mb-0">{i === 0 ? t('news_date_1') : t('news_date_2')}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            newsItems.map(item => (
              <Link key={item.id} to="/news" className="flex items-start gap-3 py-2 no-underline" style={{ color: 'inherit' }}>
                <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#c61f2c' }}></span>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-0">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1 mb-0">
                    {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
