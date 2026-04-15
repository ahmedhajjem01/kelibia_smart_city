import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';
import Sidebar from './Sidebar';
import HeroSection from './HeroSection';

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
  const { t, lang } = useI18n();

  const isAgentOrAdmin = user && (user.user_type === 'agent' || user.user_type === 'supervisor' || user.is_staff || user.is_superuser);

  return (
    <div
      className={lang === 'ar' ? 'arabic-font' : ''}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Public Sans, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}
    >
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} user={user} />

      {/* Main area offset from fixed sidebar */}
      <div className="md:ml-60">
        {/* Hero */}
        {showHero && <HeroSection user={user} />}

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center text-sm text-slate-500" style={{ paddingTop: '12px' }}>
          <i className="fas fa-home me-2" style={{ color: '#c61f2c' }}></i>
          <a href="/dashboard" className="no-underline" style={{ color: '#c61f2c' }}>{t('home')}</a>
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                <span className="mx-2 text-slate-300">/</span>
                {bc.link ? (
                  <a href={bc.link} className="no-underline" style={{ color: '#c61f2c' }}>{bc.label}</a>
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
              className="d-none d-lg-block"
              style={{ width: '280px', minWidth: '280px', padding: '24px 16px 24px 0', flexShrink: 0 }}
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
