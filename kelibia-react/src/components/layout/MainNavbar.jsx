import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useNavigate } from 'react-router-dom'

function initials(name) {
  if (!name || !name.trim()) return '?'
  return name.trim().split(/s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function MainNavbar() {
  const { user, logout } = useAuth()
  const { lang, setLanguage, t } = useLang()
  const navigate = useNavigate()

  const fullName = user ? (user.first_name || '') + ' ' + (user.last_name || '') : ''
  const trimmedName = fullName.trim() || (user ? user.email : '')
  const inits = initials(trimmedName)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="main-navbar">
      <a className="navbar-brand-area" href="#">
        <div className="navbar-logo"><i className="fas fa-city"></i></div>
        <div className="navbar-title">
          <span className="main-title">{t('municipality')}</span>
          <span className="sub-title">{t('smart_city')}</span>
        </div>
      </a>
      <div className="navbar-actions">
        <button className={('lang-btn ' + (lang === 'fr' ? 'active' : ''))} onClick={() => setLanguage('fr')}>
          <img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" /> FR
        </button>
        <button className={('lang-btn ' + (lang === 'ar' ? 'active' : ''))} onClick={() => setLanguage('ar')}>
          <img src="https://flagcdn.com/w20/tn.png" width="16" alt="AR" /> عربي
        </button>
        <div className="user-pill">
          <div className="avatar">{inits}</div>
          <span>{trimmedName || t('loading')}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> {t('logout')}
        </button>
      </div>
    </nav>
  )
}