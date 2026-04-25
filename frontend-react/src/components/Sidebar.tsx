import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';
import logo from '../assets/logo.png';

interface SidebarProps {
  onLogout: () => void;
  user?: { first_name: string; last_name: string; email: string; is_verified: boolean; user_type?: string; is_staff?: boolean; is_superuser?: boolean } | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user, isOpen, onClose }) => {
  const { t, lang } = useI18n();

  const scrollToMap = (e: React.MouseEvent) => {
    e.preventDefault();
    const mapEl = document.getElementById('mapCard');
    if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
  };

  const isAgentOrAdmin = user && (
    user.user_type === 'agent' || user.user_type === 'supervisor' || user.is_staff || user.is_superuser
  );

  /* active: orange right-border + slight bg tint; inactive: muted white */
  const navItem = (isActive: boolean): string =>
    [
      'flex items-center gap-3 px-4 py-1.5 no-underline transition-all duration-150',
      isActive
        ? 'border-r-4 border-[#d4aa8d] bg-white/10 font-bold'
        : 'hover:bg-white/10',
    ].join(' ');

  return (
    <aside
      className={`sidebar fixed left-0 top-0 h-full w-64 flex flex-col z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      style={{
        background: 'linear-gradient(180deg, #045b7e 0%, #033f58 100%)',
        boxShadow: '4px 0 24px rgba(0,0,0,.35)',
        fontFamily: 'Public Sans, sans-serif',
        overflowY: 'auto',
      }}
    >
      <style>{`
        .sidebar a { color: rgba(255,255,255,0.6) !important; text-decoration: none !important; font-size: .73rem; }
        .sidebar a:hover { color: #fff !important; }
        .sidebar a[aria-current="page"] { color: #fff !important; font-weight: 700; }
        .sidebar p { font-size: .58rem !important; }
        .sidebar span { font-size: .73rem; }
      `}</style>

      {/* ── Brand ── */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        <img src={logo} alt="Logo National" style={{ width: 54, height: 54, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.3))' }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '.78rem', letterSpacing: '.3px', lineHeight: 1.2, textTransform: 'uppercase' }}>
            Smart City Portal
          </div>
          <div style={{ color: '#d4aa8d', fontSize: '.65rem', fontWeight: 700, lineHeight: 1.2 }}>الجمهورية التونسية</div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-2 py-3" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <p style={{ fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', padding: '0 10px', marginBottom: 4 }}>
          {t('nav_title')}
        </p>

        {isAgentOrAdmin ? (
          <NavLink to="/agent-dashboard" className={({ isActive }) => navItem(isActive)}>
            <i className="fas fa-shield-alt" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
            <span>{t('back_to_agent_space')}</span>
          </NavLink>
        ) : (
          <>
            <NavLink to="/dashboard" end className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-tachometer-alt" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{t('dashboard')}</span>
            </NavLink>
            <NavLink to="/services" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-landmark" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{t('admin_services')}</span>
            </NavLink>
            <NavLink to="/mes-reclamations" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-bullhorn" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{t('my_reclamations')}</span>
            </NavLink>
            <NavLink to="/news" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-newspaper" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{t('news_title')}</span>
            </NavLink>
            <NavLink to="/mes-demandes" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-tasks" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{t('my_requests')}</span>
            </NavLink>
            <NavLink to="/mes-impots" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-file-invoice-dollar" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{lang === 'ar' ? 'أدائي و جباياتي' : 'Mes Impôts & Taxes'}</span>
            </NavLink>
            <NavLink to="/mes-commerce" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-store" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{lang === 'ar' ? 'مساحاتي التجارية' : 'Boutiques & Commerces'}</span>
            </NavLink>
            <NavLink to="/mes-extraits" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-file-contract" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{t('extraits_hub_title')}</span>
            </NavLink>
            <NavLink to="/forum" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-comments" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
              <span>{t('forum')}</span>
            </NavLink>
          </>
        )}
        
        {/* Close button for mobile */}
        <button 
          className="md:hidden mt-4 mx-4 py-2 bg-white/10 rounded text-white text-xs font-bold"
          onClick={onClose}
        >
          {t('close') || 'Fermer'}
        </button>
      </nav>

      {/* ── Bottom: Profil + Déconnexion ── */}
      <div className="px-2 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 10 }}>
        <p style={{ fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', padding: '6px 10px 3px', marginBottom: 1 }}>
          {t('account_title')}
        </p>
        <NavLink to="/profile" className={({ isActive }) => navItem(isActive)}>
          <i className="fas fa-cog" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
          <span>{t('nav_profile')}</span>
        </NavLink>
        <a
          className={navItem(false)}
          href="#"
          style={{ color: 'rgba(255,183,133,0.85) !important' as any }}
          onClick={(e) => { e.preventDefault(); onLogout(); }}
        >
          <i className="fas fa-sign-out-alt" style={{ width: 16, textAlign: 'center', flexShrink: 0 }}></i>
          <span>{t('logout')}</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
