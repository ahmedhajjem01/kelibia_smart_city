import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';

interface TopNavProps {
  user: { first_name: string; last_name: string; first_name_ar?: string; last_name_ar?: string; user_type?: string; is_staff?: boolean; is_superuser?: boolean } | null;
  onLogout: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ user, onLogout }) => {
  const { t, setLang, lang } = useI18n();
  const navigate = useNavigate();

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
    <header className="fixed top-0 w-full z-50 shadow-sm" style={{ backgroundColor: '#1a73e8', color: 'white' }}>
      <div className={`flex justify-between items-center px-4 py-3 max-w-full mx-auto ${lang === 'ar' ? 'flex-row-reverse font-arabic' : ''}`}>
        
        {/* Logo / Brand (Right in RTL, Left in LTR) */}
        <div className="flex items-center gap-6">
          <Link
            to={isAgentOrAdmin ? '/agent-dashboard' : '/dashboard'}
            className="flex items-center gap-2 no-underline text-white hover:text-gray-100"
          >
            {lang === 'ar' ? (
              <>
                <span className="text-xl font-bold">{t('smart_city_portal') || 'بوابة المدينة الذكية'}</span>
                <i className="fas fa-city text-2xl"></i>
              </>
            ) : (
              <>
                <i className="fas fa-city text-2xl"></i>
                <span className="text-xl font-bold">Portail de la Ville Intelligente</span>
              </>
            )}
          </Link>

          {!isAgentOrAdmin && (
             <nav className={`hidden md:flex items-center gap-6 ${lang === 'ar' ? 'mr-6 flex-row-reverse' : 'ml-6'}`}>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline px-2 py-1 ${isActive ? 'text-white border-b-2 border-white' : 'text-blue-100 hover:text-white'}`
                }
              >
                {lang === 'ar' ? 'الرئيسية' : 'Accueil'}
              </NavLink>
              <NavLink
                to="/services"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline px-2 py-1 ${isActive ? 'text-white border-b-2 border-white' : 'text-blue-100 hover:text-white'}`
                }
              >
                {t('admin_services')}
              </NavLink>
              <NavLink
                to="/news"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline px-2 py-1 ${isActive ? 'text-white border-b-2 border-white' : 'text-blue-100 hover:text-white'}`
                }
              >
                {t('news_title')}
              </NavLink>
            </nav>
          )}
        </div>

        {/* Actions (Left in RTL, Right in LTR) */}
        <div className={`flex items-center gap-4 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
          
          {/* Citizen Forum Button */}
          {!isAgentOrAdmin && (
            <Link 
              to="/forum" 
              className={`flex items-center gap-2 px-3 py-1 border border-white/50 rounded hover:bg-white/10 transition-colors no-underline text-white text-sm font-medium ${lang === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <span>{lang === 'ar' ? 'منتدى المواطن' : 'Forum Citoyen'}</span>
              <i className={`fas ${lang === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'} text-xs`}></i>
            </Link>
          )}

          {/* Lang toggle (Flags) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang('ar')}
              className={`p-0 border overflow-hidden rounded-sm transition-opacity cursor-pointer flex items-center justify-center ${lang === 'ar' ? 'border-white opacity-100 ring-2 ring-white ring-offset-1 ring-offset-[#1a73e8]' : 'border-transparent opacity-60 hover:opacity-100'}`}
              style={{ width: '28px', height: '20px', background: 'transparent' }}
              title="العربية"
            >
              <img src="https://flagcdn.com/w40/tn.png" alt="Tunisia Flag" className="w-full h-full object-cover" />
            </button>
            <button
              onClick={() => setLang('fr')}
              className={`p-0 border overflow-hidden rounded-sm transition-opacity cursor-pointer flex items-center justify-center ${lang === 'fr' ? 'border-white opacity-100 ring-2 ring-white ring-offset-1 ring-offset-[#1a73e8]' : 'border-transparent opacity-60 hover:opacity-100'}`}
              style={{ width: '28px', height: '20px', background: 'transparent' }}
              title="Français"
            >
              <img src="https://flagcdn.com/w40/fr.png" alt="France Flag" className="w-full h-full object-cover" />
            </button>
          </div>

          <div className="h-6 w-px bg-white/30 mx-1"></div>

          {/* User Profile */}
          <div className={`hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer ${lang === 'ar' ? 'flex-row-reverse' : ''}`} onClick={() => navigate('/profile')}>
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-[#1a73e8] font-bold text-sm shadow-sm">
              {initials}
            </div>
            <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
              <p className="text-sm font-bold text-white leading-none mb-1">{displayName}</p>
              <p className="text-[10px] text-blue-100 uppercase tracking-widest leading-none">
                {isAgentOrAdmin ? (user?.user_type === 'supervisor' ? t('role_supervisor') : t('role_agent')) : t('citoyen_role')}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer border-0 bg-transparent active:scale-90 text-white"
            title={t('logout')}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;

