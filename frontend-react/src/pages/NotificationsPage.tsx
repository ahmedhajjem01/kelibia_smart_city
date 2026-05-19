import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken, clearTokens } from '../lib/authStorage'
import { resolveBackendUrl } from '../lib/backendUrl'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

type UserInfo = {
  first_name: string
  last_name: string
  email: string
  is_verified: boolean
  user_type?: string
  is_staff?: boolean
  is_superuser?: boolean
}

type Notif = {
  id: number | string
  title: string
  message: string
  is_read: boolean
  notification_type: string
  link?: string
  created_at: string
  _forum?: boolean
}

export default function NotificationsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const access = getAccessToken()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data) })
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [sysRes, forumRes] = await Promise.all([
        fetch(resolveBackendUrl('/api/notifications/'), { headers: { Authorization: `Bearer ${access}` } }),
        fetch(resolveBackendUrl('/api/forum/notifications/'), { headers: { Authorization: `Bearer ${access}` } }),
      ])

      const sysData = sysRes.ok ? await sysRes.json() : []
      const forumData = forumRes.ok ? await forumRes.json() : []

      const forumList = Array.isArray(forumData) ? forumData : (forumData.results || [])
      const forumNormalized: Notif[] = forumList.map((n: any) => ({
        id: `forum-${n.id}`,
        title: n.topic_title || 'Forum',
        message: 'Nouvelle réponse à votre sujet',
        is_read: n.is_read,
        notification_type: 'info',
        link: n.topic ? `/forum/${n.topic}` : '/forum',
        created_at: n.created_at,
        _forum: true,
      }))

      const combined = [...sysData, ...forumNormalized].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setNotifications(combined)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: number | string) {
    try {
      if (typeof id === 'string' && id.startsWith('forum-')) {
        await fetch(resolveBackendUrl('/api/forum/notifications/read/'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${access}` },
        })
      } else {
        await fetch(resolveBackendUrl(`/api/notifications/${id}/mark_as_read/`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${access}` },
        })
      }
      fetchAll()
    } catch (e) {
      console.error('Failed to mark as read', e)
    }
  }

  async function markAllRead() {
    try {
      await Promise.all([
        fetch(resolveBackendUrl('/api/forum/notifications/read/'), {
          method: 'POST', headers: { Authorization: `Bearer ${access}` },
        }),
        ...notifications
          .filter(n => !n.is_read && !n._forum)
          .map(n => fetch(resolveBackendUrl(`/api/notifications/${n.id}/mark_as_read/`), {
            method: 'POST', headers: { Authorization: `Bearer ${access}` },
          }))
      ])
      fetchAll()
    } catch (e) {
      console.error('Failed to mark all as read', e)
    }
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <MainLayout
      user={user}
      onLogout={() => { clearTokens(); navigate('/login') }}
      breadcrumbs={[{ label: t('notifications') || 'Notifications' }]}
      showHero={false}
    >
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-0">
              <i className="fas fa-bell me-2" style={{ color: '#d4aa8d' }}></i>
              {t('notifications') || 'Notifications'}
            </h2>
            {unread > 0 && (
              <span className="text-xs text-slate-500">{unread} non lue{unread > 1 ? 's' : ''}</span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer"
              style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
            >
              <i className="fas fa-check-double me-1"></i>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="spinner-border text-primary mb-3"></div>
            <p className="text-sm">Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <i className="fas fa-bell-slash text-5xl opacity-30 block mb-3"></i>
            <p>{t('no_notifications') || 'Aucune notification'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 flex gap-4 items-start transition-all ${!n.is_read ? 'border-blue-100 bg-blue-50/20' : 'border-slate-100'}`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n._forum ? 'bg-purple-100 text-purple-600' : n.notification_type === 'success' ? 'bg-green-100 text-green-600' : n.notification_type === 'warning' ? 'bg-amber-100 text-amber-600' : n.notification_type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <i className={`fas ${n._forum ? 'fa-comments' : n.notification_type === 'success' ? 'fa-check' : n.notification_type === 'warning' ? 'fa-exclamation-triangle' : n.notification_type === 'error' ? 'fa-times' : 'fa-info'} text-sm`}></i>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 mb-0.5">{n.title}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{n.message}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] text-slate-400">
                      <i className="far fa-clock me-1"></i>
                      {new Date(n.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n._forum && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>Forum</span>
                    )}
                    <div className="flex gap-2 ms-auto">
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] font-bold text-blue-600 border-0 bg-transparent cursor-pointer hover:underline"
                        >
                          Marquer lu
                        </button>
                      )}
                      {n.link && (
                        <Link
                          to={n.link}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg no-underline"
                          style={{ backgroundColor: '#f1f5f9', color: '#475569', textDecoration: 'none' }}
                        >
                          <i className="fas fa-arrow-right me-1"></i>Voir
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
