import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';
import Sidebar from './Sidebar';
import HeroSection from './HeroSection';
import { Link } from 'react-router-dom';

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

  const isAgentOrAdmin = user && (user.user_type === 'agent' || user.user_type === 'supervisor' || user.is_staff || user.is_superuser);

  return (
    <div
      className={lang === 'ar' ? 'arabic-font' : ''}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Public Sans, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}
    >
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} user={user} />

      {/* Main area offset from fixed sidebar */}
      <div className="md:ml-64">
        {/* Top bar */}
        <div
          className="bg-white border-b border-slate-100 flex justify-end items-center px-6"
          style={{ height: 44 }}
        >
          {/* Language toggle */}
          <div style={{ display: 'flex', background: '#f1f1f1', borderRadius: 999, padding: 3, gap: 2 }}>
            <button
              onClick={() => setLang('fr')}
              style={{
                border: 'none', borderRadius: 999, padding: '3px 14px',
                fontSize: '.7rem', fontWeight: 700, cursor: 'pointer',
                background: lang === 'fr' ? '#045b7e' : 'transparent',
                color: lang === 'fr' ? '#fff' : '#6b7280',
                transition: 'all .2s',
              }}
            >FR</button>
            <button
              onClick={() => setLang('ar')}
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
        </div>

        {/* Hero */}
        {showHero && <HeroSection user={user} />}

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center text-sm text-slate-500" style={{ paddingTop: '12px' }}>
          <i className="fas fa-home me-2" style={{ color: '#ffb785' }}></i>
          <a href="/dashboard" className="no-underline" style={{ color: '#ffb785' }}>{t('home')}</a>
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                <span className="mx-2 text-slate-300">/</span>
                {bc.link ? (
                  <a href={bc.link} className="no-underline" style={{ color: '#ffb785' }}>{bc.label}</a>
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
        <div className="flex">
          <div className="flex-1 min-w-0 px-6 py-6 md:px-8">
            {children}
          </div>
          {rightSidebar && (
            <div
              style={{ width: '320px', minWidth: '320px', padding: '24px 24px 24px 0', flexShrink: 0 }}
            >
              {rightSidebar}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 py-6 px-8 text-center text-xs text-slate-400">
          {t('footer_text')}
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
