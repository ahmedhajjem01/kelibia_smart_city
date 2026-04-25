import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';
import Sidebar from './Sidebar';
import HeroSection from './HeroSection';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAccessToken } from '../lib/authStorage';
import { resolveBackendUrl } from '../lib/backendUrl';

interface MainLayoutProps {
  children: React.ReactNode;
  user: { first_name: string; last_name: string; email: string; is_verified: boolean; user_type?: string; is_staff?: boolean; is_superuser?: boolean } | null;
  onLogout: () => void;
  breadcrumbs?: { label: string; link?: string }[];
  showHero?: boolean;
  rightSidebar?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  onLogout,
  breadcrumbs = [],
  showHero = false,
  rightSidebar
}) => {
  const { t, lang, setLang } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    const access = getAccessToken();
    if (!access) return;
    try {
      const res = await fetch(resolveBackendUrl('/api/notifications/'), {
        headers: { Authorization: `Bearer ${access}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  // Save language preference to backend so notifications come in correct language
  const saveLang = async (newLang: string) => {
    setLang(newLang as any);
    const access = getAccessToken();
    if (!access) return;
    try {
      await fetch(resolveBackendUrl('/api/accounts/me/'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: newLang })
      });
    } catch (e) {
      console.error('Failed to save language preference', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    const access = getAccessToken();
    try {
      await fetch(resolveBackendUrl(`/api/notifications/${id}/mark_as_read/`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` }
      });
      fetchNotifications();
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const isAgentOrAdmin = user && (user.user_type === 'agent' || user.user_type === 'supervisor' || user.is_staff || user.is_superuser);

  return (
    <div
      className={lang === 'ar' ? 'arabic-font' : ''}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Public Sans, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}
    >
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main area offset from fixed sidebar */}
      <div className="md:ml-64">
        {/* Top bar */}
        <div
          className="bg-white border-b border-slate-100 flex justify-between items-center px-6"
          style={{ height: 44 }}
        >
          {/* Mobile menu toggle */}
          <button 
            className="md:hidden text-slate-600"
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}
          >
            <i className="fas fa-bars"></i>
          </button>

          <div className="flex items-center">
          {/* Language toggle */}
          <div style={{ display: 'flex', background: '#f1f1f1', borderRadius: 999, padding: 3, gap: 2 }}>
            <button
              onClick={() => saveLang('fr')}
              style={{
                border: 'none', borderRadius: 999, padding: '3px 14px',
                fontSize: '.7rem', fontWeight: 700, cursor: 'pointer',
                background: lang === 'fr' ? '#045b7e' : 'transparent',
                color: lang === 'fr' ? '#fff' : '#6b7280',
                transition: 'all .2s',
              }}
            >FR</button>
            <button
              onClick={() => saveLang('ar')}
              style={{
                border: 'none', borderRadius: 999, padding: '3px 14px',
                fontSize: '.7rem', fontWeight: 700, cursor: 'pointer',
                background: lang === 'ar' ? '#045b7e' : 'transparent',
                color: lang === 'ar' ? '#fff' : '#6b7280',
                transition: 'all .2s',
              }}
            >عربي</button>
          </div>
          {/* Profile quick-link */}
          <Link to="/profile" style={{ marginLeft: 16, color: '#6b7280', fontSize: '.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="fas fa-user-circle" style={{ fontSize: '1rem' }}></i>
            {user?.first_name || t('profile')}
          </Link>
          
          {/* Notifications Dropdown */}
          <div style={{ position: 'relative', marginLeft: 16 }}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              style={{ 
                background: 'none', border: 'none', padding: 0,
                color: unreadCount > 0 ? '#1a73e8' : '#6b7280', 
                fontSize: '1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', position: 'relative' 
              }}
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <span style={{ 
                  position: 'absolute', top: -5, right: -5, 
                  background: '#ef4444', color: 'white', 
                  borderRadius: '50%', width: 14, height: 14, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '9px', fontWeight: 700 
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotifOpen(false)}
                />
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-50 border border-slate-100 overflow-hidden"
                  style={{ top: '100%', right: lang === 'ar' ? 'auto' : 0, left: lang === 'ar' ? 0 : 'auto' }}
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="font-bold text-slate-700 text-sm">{t('notifications') || 'Notifications'}</span>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {unreadCount} {t('unread') || 'non lues'}
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-400 text-xs">
                        <i className="fas fa-bell-slash mb-2 block text-lg"></i>
                        {t('no_notifications') || 'Aucune notification'}
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n: any) => (
                        <div 
                          key={n.id} 
                          className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.notification_type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                              <i className={`fas ${n.notification_type === 'success' ? 'fa-check' : 'fa-info'} text-[10px]`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 mb-0.5 truncate">{n.title}</p>
                              <p className="text-[10px] text-slate-500 leading-tight mb-1">{n.message}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[9px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                <div className="flex gap-2">
                                  {!n.is_read && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                      className="text-[9px] text-blue-600 font-bold hover:underline"
                                    >
                                      {t('mark_read') || 'Lu'}
                                    </button>
                                  )}
                                  {n.link && (
                                    <Link 
                                      to={n.link} 
                                      onClick={() => setIsNotifOpen(false)}
                                      className="text-[9px] text-slate-600 font-bold hover:underline"
                                    >
                                      {t('view') || 'Voir'}
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <Link 
                      to="/dashboard" 
                      onClick={() => setIsNotifOpen(false)}
                      className="block py-2 text-center text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border-t border-slate-100"
                    >
                      {t('see_all') || 'Tout voir'}
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>

          </div>
        </div>

        {/* Hero */}
        {showHero && <HeroSection user={user} />}

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center text-sm text-slate-500" style={{ paddingTop: '12px' }}>
          <i className="fas fa-home me-2" style={{ color: '#d4aa8d' }}></i>
          <a href="/dashboard" className="no-underline" style={{ color: '#d4aa8d' }}>{t('home')}</a>
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                <span className="mx-2 text-slate-300">/</span>
                {bc.link ? (
                  <a href={bc.link} className="no-underline" style={{ color: '#d4aa8d' }}>{bc.label}</a>
                ) : (
                  <span className="text-slate-600">{bc.label}</span>
                )}
              </React.Fragment>
            ))
          ) : (
            <>
              <span className="mx-2 text-slate-300">/</span>
              <span className="text-slate-600">
                {isAgentOrAdmin ? 'Espace Agent' : t('portal_citoyen')}
              </span>
            </>
          )}
        </div>

        {/* Page body: main + optional right sidebar */}
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 min-w-0 px-4 py-6 md:px-8">
            {children}
          </div>
          {rightSidebar && (
            <div
              className="hidden lg:block"
              style={{ width: '320px', minWidth: '320px', padding: '24px 24px 24px 0', flexShrink: 0 }}
            >
              {rightSidebar}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 py-6 px-4 md:px-8 text-center text-xs text-slate-400">
          {t('footer_text')}
        </footer>

        <style>{`
          /* ══ Global citizen-side mobile fixes ══ */

          @media (max-width: 768px) {
            /* Typography */
            h1 { font-size: 1.4rem !important; }
            h2 { font-size: 1.2rem !important; }
            .section-title { font-size: 1.1rem !important; }

            /* Spacing */
            .px-6 { padding-left: 1rem !important; padding-right: 1rem !important; }
            .px-8 { padding-left: 1rem !important; padding-right: 1rem !important; }
            .py-6 { padding-top: 1rem !important; padding-bottom: 1rem !important; }

            /* Cards */
            .card { border-radius: 12px !important; }

            /* Tables: always scroll horizontally */
            .table-responsive {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch;
              display: block;
              width: 100%;
            }
            table { min-width: 520px; }

            /* Forms: stack inputs */
            form .grid { grid-template-columns: 1fr !important; }
            input, select, textarea {
              width: 100% !important;
              font-size: 16px !important; /* prevent iOS zoom */
            }

            /* Breadcrumb: shorter */
            .breadcrumb { font-size: .75rem; }

            /* Buttons full-width on mobile */
            .btn-full-mobile { width: 100% !important; }

            /* Image uploads */
            .upload-preview { max-width: 100% !important; }

            /* Service cards grid: 1 column on very small, 2 on small tablets */
            .services-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          }

          @media (max-width: 480px) {
            h1 { font-size: 1.2rem !important; }
            .services-grid { grid-template-columns: 1fr !important; }
            .card-body { padding: .75rem !important; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MainLayout;
