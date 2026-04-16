import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';
import logo from '../assets/logo.png';

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

  const isAgentOrAdmin = user && (
    user.user_type === 'agent' || user.user_type === 'supervisor' || user.is_staff || user.is_superuser
  );

  /* active: red right-border + slight bg tint; inactive: muted white */
  const navItem = (isActive: boolean): string =>
    [
      'flex items-center gap-3 px-4 py-2 no-underline transition-all duration-150',
      isActive
        ? 'border-r-4 border-[#ae131a] bg-white/10 font-bold'
        : 'hover:bg-white/10',
    ].join(' ');

  return (
    <aside
      className="sidebar fixed left-0 top-0 h-full w-64 flex flex-col z-50 d-none d-md-flex"
      style={{
        background: '#0d1b2e',
        boxShadow: '4px 0 24px rgba(0,0,0,.35)',
        fontFamily: 'Public Sans, sans-serif',
        overflowY: 'auto',
      }}
    >
      <style>{`
        .sidebar a { color: rgba(255,255,255,0.55) !important; text-decoration: none !important; }
        .sidebar a:hover { color: #fff !important; }
        .sidebar a.active-nav, .sidebar a[aria-current="page"] { color: #fff !important; font-weight: 700; }
      `}</style>
      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <img src={logo} alt="Logo Kélibia" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '.82rem', letterSpacing: '.3px', lineHeight: 1.1, textTransform: 'uppercase' }}>
            Ville de Kélibia
          </div>
          <div style={{ color: '#ae131a', fontSize: '.68rem', fontWeight: 700, marginTop: 2 }}>بلدية قليبية</div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-3 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', padding: '0 8px', marginBottom: 6 }}>
          {t('nav_title')}
        </p>

        {isAgentOrAdmin ? (
          <NavLink to="/agent-dashboard" className={({ isActive }) => navItem(isActive)}>
            <i className="fas fa-shield-alt" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
            <span style={{ fontSize: '.78rem' }}>{t('back_to_agent_space')}</span>
          </NavLink>
        ) : (
          <>
            <NavLink to="/dashboard" end className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-tachometer-alt" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('dashboard')}</span>
            </NavLink>
            <NavLink to="/services" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-landmark" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('admin_services')}</span>
            </NavLink>
            <NavLink to="/mes-reclamations" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-bullhorn" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('my_reclamations')}</span>
            </NavLink>
            <NavLink to="/news" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-newspaper" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('news_title')}</span>
            </NavLink>
            <a className={navItem(false)} href="#mapCard" onClick={scrollToMap}>
              <i className="fas fa-map-marked-alt" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('gis_map')}</span>
            </a>
            <NavLink to="/mes-demandes" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-tasks" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('my_requests')}</span>
            </NavLink>
            <NavLink to="/mes-extraits" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-file-contract" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('extraits_hub_title')}</span>
            </NavLink>
            <NavLink to="/forum" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-comments" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '.78rem' }}>{t('forum')}</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* ── Bottom: Paramètres + Déconnexion ── */}
      <div className="px-3 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 12 }}>
        <p style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', padding: '8px 8px 4px', marginBottom: 2 }}>
          {t('account_title')}
        </p>
        <NavLink to="/profile" className={({ isActive }) => navItem(isActive)}>
          <i className="fas fa-cog" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
          <span style={{ fontSize: '.78rem' }}>{t('nav_profile')}</span>
        </NavLink>
        <a
          className={navItem(false)}
          href="#"
          style={{ color: 'rgba(252,165,165,0.85)' }}
          onClick={(e) => { e.preventDefault(); onLogout(); }}
        >
          <i className="fas fa-sign-out-alt" style={{ width: 16, textAlign: 'center', fontSize: '.85rem', flexShrink: 0 }}></i>
          <span style={{ fontSize: '.78rem' }}>{t('logout')}</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
