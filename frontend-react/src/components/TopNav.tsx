import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';

interface TopNavProps {
  user: { first_name: string; last_name: string; first_name_ar?: string; last_name_ar?: string } | null;
  onLogout: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ user, onLogout }) => {
  const { t, setLang, lang } = useI18n();

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar d-none d-md-flex">
        <div>
          <i className="fas fa-map-marker-alt me-1"></i> {lang === 'ar' ? 'بلدية قليبية — ولاية نابل' : 'Commune de Kélibia — Gouvernorat de Nabeul'}
        </div>
        <div>
          <a href="#"><i className="fas fa-phone me-1"></i>+216 72 296 239</a>
          <a href="#"><i className="fas fa-envelope me-1"></i>webmaster.commune-kelibia@topnet.tn</a>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav className="main-navbar">
        <Link className="navbar-brand-area" to="/dashboard">
          <div className="navbar-logo"><i className="fas fa-city"></i></div>
          <div className="navbar-title">
            <span className="main-title">{lang === 'ar' ? 'بلدية قليبية' : 'Commune de Kélibia'}</span>
            <span className="sub-title">{t('portal_citoyen')} — <span className="text-primary">Kelibia Smart City</span></span>
          </div>
        </Link>
        <div className="navbar-actions">
          <button 
            className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} 
            onClick={() => setLang('fr')}
          >
            <img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" /> FR
          </button>
          <button 
            className={`lang-btn ${lang === 'ar' ? 'active' : ''}`} 
            onClick={() => setLang('ar')}
          >
            <img src="https://flagcdn.com/w20/tn.png" width="16" alt="AR" /> عربي
          </button>
          <div className="user-pill d-none d-sm-flex">
            <div className="avatar">
              {user ? (lang === 'ar' && user.first_name_ar ? user.first_name_ar[0] : user.first_name[0]).toUpperCase() : '?'}
            </div>
            <span>{user ? (lang === 'ar' && user.first_name_ar ? `${user.first_name_ar} ${user.last_name_ar}` : `${user.first_name} ${user.last_name}`) : t('loading')}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span className="d-none d-sm-inline">{t('logout')}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default TopNav;
