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

  const navItem = (isActive: boolean) =>
    [
      'flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all no-underline duration-150',
      isActive
        ? 'font-bold text-[#ae131a] border-r-4 border-[#ae131a] bg-[#fef2f2]'
        : 'text-[#1a1c1c] opacity-70 hover:bg-[#e8e8e8]',
    ].join(' ');

  return (
    <aside
      className="sidebar fixed left-0 top-0 h-full w-64 flex flex-col py-8 z-50 d-none d-md-flex border-r"
      style={{ background: '#f9f9f9', boxShadow: '12px 0 32px -4px rgba(26,28,28,0.06)', fontFamily: 'Public Sans, sans-serif' }}
    >
      {/* Brand */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <i className="fas fa-landmark text-3xl" style={{ color: '#ae131a' }}></i>
        <div>
          <h1 className="text-base font-extrabold tracking-tight leading-none mb-0" style={{ color: '#ae131a' }}>
            VILLE DE KÉLIBIA
          </h1>
          <p className="text-[10px] font-bold mt-1 mb-0" style={{ color: '#ae131a' }}>بلدية قليبية</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-4 space-y-1">
        {isAgentOrAdmin ? (
          <NavLink to="/agent-dashboard" className={({ isActive }) => navItem(isActive)}>
            <i className="fas fa-shield-alt w-5 text-center"></i>
            <span>{t('back_to_agent_space')}</span>
          </NavLink>
        ) : (
          <>
            <NavLink to="/dashboard" end className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-tachometer-alt w-5 text-center"></i>
              <span>Tableau de bord / لوحة القيادة</span>
            </NavLink>
            <NavLink to="/services" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-landmark w-5 text-center"></i>
              <span>Services / الخدمات</span>
            </NavLink>
            <NavLink to="/mes-reclamations" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-bullhorn w-5 text-center"></i>
              <span>Plaintes / الشكاوي</span>
            </NavLink>
            <NavLink to="/news" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-newspaper w-5 text-center"></i>
              <span>Actualités / الأخبار</span>
            </NavLink>
            <a className={navItem(false)} href="#mapCard" onClick={scrollToMap}>
              <i className="fas fa-map-marked-alt w-5 text-center"></i>
              <span>Patrimoine / التراث</span>
            </a>
            <NavLink to="/mes-demandes" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-tasks w-5 text-center"></i>
              <span>Mes demandes / طلباتي</span>
            </NavLink>
            <NavLink to="/mes-extraits" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-file-contract w-5 text-center"></i>
              <span>État Civil / الحالة المدنية</span>
            </NavLink>
            <NavLink to="/forum" className={({ isActive }) => navItem(isActive)}>
              <i className="fas fa-comments w-5 text-center"></i>
              <span>Forum / المنتدى</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-4 mt-auto space-y-1 pt-6" style={{ borderTop: '1px solid #e8e8e8' }}>
        <NavLink to="/profile" className={({ isActive }) => navItem(isActive)}>
          <i className="fas fa-cog w-5 text-center"></i>
          <span>Paramètres</span>
        </NavLink>
        <a
          className={navItem(false)}
          href="#"
          onClick={(e) => { e.preventDefault(); onLogout(); }}
        >
          <i className="fas fa-sign-out-alt w-5 text-center"></i>
          <span>Déconnexion</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
