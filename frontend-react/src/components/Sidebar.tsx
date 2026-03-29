import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { t } = useI18n();

  const scrollToMap = (e: React.MouseEvent) => {
    e.preventDefault();
    const mapEl = document.getElementById('mapCard');
    if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="sidebar d-none d-md-block">
      <div className="sidebar-section-title">NAVIGATION</div>

      <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <i className="fas fa-tachometer-alt"></i>
        <span>{t('dashboard')}</span>
      </NavLink>
      <a className="sidebar-item" href="#mapCard" onClick={scrollToMap}>
        <i className="fas fa-map-marked-alt"></i>
        <span>Carte SIG</span>
      </a>
      <NavLink to="/mes-reclamations" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <i className="fas fa-bullhorn"></i>
        <span>{t('my_reclamations')}</span>
      </NavLink>
      <NavLink to="/mes-demandes" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <i className="fas fa-tasks"></i>
        <span>{t('my_requests')}</span>
      </NavLink>
      <NavLink to="/mes-extraits" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <i className="fas fa-file-contract"></i>
        <span>{t('mes_extraits')}</span>
      </NavLink>
      <NavLink to="/services" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <i className="fas fa-file-alt"></i>
        <span>{t('admin_services')}</span>
      </NavLink>
      <NavLink to="/news" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <i className="fas fa-newspaper"></i>
        <span>{t('news_title')}</span>
      </NavLink>

      <div className="sidebar-divider"></div>
      <div className="sidebar-section-title">COMPTE</div>

      <NavLink to="/profile" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <i className="fas fa-user-circle"></i>
        <span>{t('profile')}</span>
      </NavLink>
      <a className="sidebar-item text-danger" href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
        <i className="fas fa-sign-out-alt"></i>
        <span>{t('logout')}</span>
      </a>
    </div>
  );
};

export default Sidebar;
