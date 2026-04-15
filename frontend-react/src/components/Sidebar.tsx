import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';

interface SidebarProps {
  onLogout: () => void;
  user?: { first_name: string; last_name: string; email: string; is_verified: boolean; user_type?: string; is_staff?: boolean; is_superuser?: boolean } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user }) => {
  const { t } = useI18n();

  const scrollToMap = (e: React.MouseEvent) => {
    e.preventDefault();
    const mapEl = document.getElementById('mapCard');
    if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
  };

  const isAgentOrAdmin = user && (user.user_type === 'agent' || user.user_type === 'supervisor' || user.is_staff || user.is_superuser);

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all no-underline hover:translate-x-1 ${
      isActive
        ? 'font-bold'
        : 'hover:bg-white/10'
    }`;

  return (
    <aside className="sidebar fixed left-0 top-0 h-full w-60 flex flex-col p-4 z-40 d-none d-md-flex"
      style={{ fontFamily: 'Public Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500, background: '#0d1b2e', color: '#fff' }}>

      {/* Logo header */}
      <div className="mb-8 flex items-center gap-3 px-2 pt-6">
        <i className="fas fa-city text-2xl" style={{ color: '#F18221' }}></i>
        <div>
          <h2 className="text-base font-black tracking-tight mb-0" style={{ color: '#fff' }}>
            {isAgentOrAdmin ? 'Portail Agent' : 'Citoyen'}
          </h2>
          <p className="text-[10px] uppercase tracking-widest mb-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Kelibia Smart City</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {isAgentOrAdmin ? t('nav_agent_space') : t('nav_title')}
        </p>

        {isAgentOrAdmin ? (
          <NavLink to="/agent-dashboard"
            className={({ isActive }) => navItemClass(isActive)}
            style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
            <i className="fas fa-shield-alt w-4 text-center"></i>
            <span>{t('back_to_agent_space')}</span>
          </NavLink>
        ) : (
          <>
            <NavLink to="/dashboard"
              className={({ isActive }) => navItemClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
              <i className="fas fa-tachometer-alt w-4 text-center"></i>
              <span>{t('dashboard')}</span>
            </NavLink>
            <a className={navItemClass(false)} href="#mapCard" onClick={scrollToMap}
              style={{ color: 'rgba(255,255,255,0.65)' }}>
              <i className="fas fa-map-marked-alt w-4 text-center"></i>
              <span>{t('gis_map')}</span>
            </a>
            <NavLink to="/mes-reclamations"
              className={({ isActive }) => navItemClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
              <i className="fas fa-bullhorn w-4 text-center"></i>
              <span>{t('my_reclamations')}</span>
            </NavLink>
            <NavLink to="/mes-demandes"
              className={({ isActive }) => navItemClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
              <i className="fas fa-tasks w-4 text-center"></i>
              <span>{t('my_requests')}</span>
            </NavLink>
            <NavLink to="/mes-extraits"
              className={({ isActive }) => navItemClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
              <i className="fas fa-file-contract w-4 text-center"></i>
              <span>{t('extraits_hub_title')}</span>
            </NavLink>
          </>
        )}

        <NavLink to="/services"
          className={({ isActive }) => navItemClass(isActive)}
          style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
          <i className="fas fa-file-alt w-4 text-center"></i>
          <span>{t('admin_services')}</span>
        </NavLink>
        <NavLink to="/news"
          className={({ isActive }) => navItemClass(isActive)}
          style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
          <i className="fas fa-newspaper w-4 text-center"></i>
          <span>{t('news_title')}</span>
        </NavLink>
        <NavLink to="/forum"
          className={({ isActive }) => navItemClass(isActive)}
          style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
          <i className="fas fa-comments w-4 text-center"></i>
          <span>{t('forum') || 'Forum'}</span>
        </NavLink>
      </nav>

      {/* Bottom section */}
      <div className="mt-auto space-y-1 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('account_title')}</p>
        <NavLink to="/profile"
          className={({ isActive }) => navItemClass(isActive)}
          style={({ isActive }) => ({ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(255,255,255,0.12)' : undefined })}>
          <i className="fas fa-user-circle w-4 text-center"></i>
          <span>{t('profile')}</span>
        </NavLink>
        <a
          className={navItemClass(false)}
          href="#"
          style={{ color: '#fca5a5' }}
          onClick={(e) => { e.preventDefault(); onLogout(); }}
        >
          <i className="fas fa-sign-out-alt w-4 text-center"></i>
          <span>{t('logout')}</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
