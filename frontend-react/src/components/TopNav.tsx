import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';

interface TopNavProps {
  user: { first_name: string; last_name: string; first_name_ar?: string; last_name_ar?: string; user_type?: string; is_staff?: boolean; is_superuser?: boolean } | null;
  onLogout: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ user, onLogout }) => {
  const { t, setLang, lang } = useI18n();

  const isAgentOrAdmin = user && (user.user_type === 'agent' || user.user_type === 'supervisor' || user.is_staff || user.is_superuser);
  const displayName = user
    ? (lang === 'ar' && user.first_name_ar
        ? `${user.first_name_ar} ${user.last_name_ar ?? ''}`
        : `${user.first_name} ${user.last_name}`)
    : t('loading');
  const initials = user
    ? (lang === 'ar' && user.first_name_ar ? user.first_name_ar[0] : user.first_name[0]).toUpperCase()
    : '?';

  return (
    <header className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-full mx-auto">

        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-8">
          <Link
            to={isAgentOrAdmin ? '/agent-dashboard' : '/dashboard'}
            className="flex items-center gap-3 no-underline"
          >
            <i className="fas fa-city text-2xl" style={{ color: '#c61f2c' }}></i>
            <span className="text-xl font-bold uppercase tracking-tight" style={{ color: '#c61f2c', fontFamily: 'Public Sans, sans-serif' }}>
              {lang === 'ar' ? 'بلدية قليبية' : 'Ville de Kélibia'}
            </span>
          </Link>

          {/* Horizontal nav links — hidden on mobile, shown for citizen */}
          {!isAgentOrAdmin && (
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline ${isActive ? 'text-red-700 border-b-2 border-red-700 pb-1' : 'text-slate-600 hover:text-red-600'}`
                }
              >
                {lang === 'ar' ? 'الرئيسية' : 'Accueil'}
              </NavLink>
              <NavLink
                to="/services"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline ${isActive ? 'text-red-700 border-b-2 border-red-700 pb-1' : 'text-slate-600 hover:text-red-600'}`
                }
              >
                {t('admin_services')}
              </NavLink>
              <NavLink
                to="/news"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline ${isActive ? 'text-red-700 border-b-2 border-red-700 pb-1' : 'text-slate-600 hover:text-red-600'}`
                }
              >
                {t('news_title')}
              </NavLink>
              <NavLink
                to="/forum"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline ${isActive ? 'text-red-700 border-b-2 border-red-700 pb-1' : 'text-slate-600 hover:text-red-600'}`
                }
              >
                Forum
              </NavLink>
              <NavLink
                to="/dashboard"
                end={false}
                className="text-sm font-bold no-underline"
                style={{ color: '#c61f2c' }}
              >
                Mon Espace
              </NavLink>
            </nav>
          )}
        </div>

        {/* Right: lang toggle + user pill + logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang('fr')}
              className={`text-xs font-black uppercase tracking-widest cursor-pointer transition-colors border-0 bg-transparent px-1 ${lang === 'fr' ? 'text-slate-900' : 'text-slate-400 hover:text-red-600'}`}
            >
              FR
            </button>
            <span className="text-slate-300 text-xs">|</span>
            <button
              onClick={() => setLang('ar')}
              className={`text-xs font-black uppercase tracking-widest cursor-pointer transition-colors border-0 bg-transparent px-1 ${lang === 'ar' ? 'text-slate-900' : 'text-slate-400 hover:text-red-600'}`}
            >
              AR
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          {/* User pill */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 leading-none">{displayName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {isAgentOrAdmin ? (user?.user_type === 'supervisor' ? 'Superviseur' : 'Agent') : t('citoyen_role')}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: '#c61f2c' }}
            >
              {initials}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent active:scale-90"
            title={t('logout')}
          >
            <i className="fas fa-sign-out-alt text-slate-600"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
