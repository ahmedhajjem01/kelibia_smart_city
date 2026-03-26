import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'

export default function Sidebar({ variant = 'citizen', pendingCount = 0 }) {
  const { logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const handleLogout = (e) => { e.preventDefault(); logout(); navigate('/login') }

  if (variant === 'agent') {
    return (
      <div className="sidebar">
        <div className="sidebar-section-title">{t('navigation')}</div>
        <NavLink className={({isActive}) => 'sidebar-item' + (isActive ? ' active' : '')} to="/agent">
          <i className="fas fa-tachometer-alt"></i> Tableau de bord
        </NavLink>
        <a className="sidebar-item" href="#reclamationsCard">
          <i className="fas fa-bullhorn"></i> Signalements
          {pendingCount > 0 && <span className="sidebar-badge">{pendingCount}</span>}
        </a>
        <a className="sidebar-item" href="#mapCard">
          <i className="fas fa-map-marked-alt"></i> Carte SIG
        </a>
        <a className="sidebar-item" href="#"><i className="fas fa-newspaper"></i> Actualités</a>
        <div className="sidebar-divider"></div>
        <div className="sidebar-section-title">{t('account')}</div>
        <a className="sidebar-item" href="#"><i className="fas fa-user-circle"></i> Mon Profil</a>
        <a className="sidebar-item" href="#" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> {t('logout')}
        </a>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section-title">{t('navigation')}</div>
      <NavLink className={({isActive}) => 'sidebar-item' + (isActive ? ' active' : '')} to="/dashboard">
        <i className="fas fa-tachometer-alt"></i> <span>{t('dashboard')}</span>
      </NavLink>
      <a className="sidebar-item" href="#mapCard">
        <i className="fas fa-map-marked-alt"></i> <span>{t('map_view')}</span>
      </a>
      <NavLink className={({isActive}) => 'sidebar-item' + (isActive ? ' active' : '')} to="/mes-reclamations">
        <i className="fas fa-bullhorn"></i> <span>{t('my_reclamations')}</span>
      </NavLink>
      <NavLink className={({isActive}) => 'sidebar-item' + (isActive ? ' active' : '')} to="/services">
        <i className="fas fa-file-alt"></i> <span>{t('admin_services')}</span>
      </NavLink>
      <a className="sidebar-item" href="#"><i className="fas fa-newspaper"></i> <span>{t('news_title')}</span></a>
      <div className="sidebar-divider"></div>
      <div className="sidebar-section-title">{t('account')}</div>
      <a className="sidebar-item" href="#"><i className="fas fa-user-circle"></i> <span>{t('profile')}</span></a>
      <a className="sidebar-item" href="#" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i> <span>{t('logout')}</span>
      </a>
    </div>
  )
}