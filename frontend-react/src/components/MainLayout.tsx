import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import HeroSection from './HeroSection';

interface MainLayoutProps {
  children: React.ReactNode;
  user: { first_name: string; last_name: string; email: string; is_verified: boolean } | null;
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

  return (
    <div className={lang === 'ar' ? 'arabic-font' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <TopNav user={user} onLogout={onLogout} />
      
      {showHero && <HeroSection user={user} />}

      <div className="breadcrumb-bar">
        <i className="fas fa-home me-2 text-primary"></i>
        <a href="/dashboard"><span>{t('home')}</span></a>
        {breadcrumbs.length > 0 ? (
          breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              <span className="mx-2 text-muted">/</span>
              {bc.link ? <a href={bc.link}>{bc.label}</a> : <span>{bc.label}</span>}
            </React.Fragment>
          ))
        ) : (
          <>
            <span className="mx-2 text-muted">/</span>
            <span>{t('portal_citoyen')}</span>
          </>
        )}
      </div>

      <div className="page-body">
        <Sidebar onLogout={onLogout} />

        <div className="main-content">
          {children}
        </div>

        {rightSidebar && (
          <div style={{ width: '240px', minWidth: '240px', padding: '24px 16px 24px 0', flexShrink: 0 }} className="d-none d-lg-block">
            {rightSidebar}
          </div>
        )}
      </div>

      <div className="page-footer">
        {t('footer_text')}
      </div>
    </div>
  );
};

export default MainLayout;
