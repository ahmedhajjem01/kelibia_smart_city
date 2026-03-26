import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'

export default function HeroStrip({ role = 'citizen' }) {
  const { user } = useAuth()
  const { t } = useLang()
  const firstName = user?.first_name || (user?.email?.split('@')[0]) || ''

  if (role === 'agent') {
    return (
      <div className="hero-strip">
        <div>
          <div className="greeting">
            <i className="fas fa-shield-alt me-2"></i>
            <span>{t('agent_welcome')}</span> <strong>{firstName}</strong>
          </div>
          <div className="sub">Gérez les signalements des citoyens et assurez le suivi des interventions.</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge-role"><i className="fas fa-id-badge me-1"></i>Agent Municipal</span>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/40px-Flag_of_Tunisia.svg.png" height="22" style={{borderRadius:'3px'}} alt="Tunisie" />
        </div>
      </div>
    )
  }

  return (
    <div className="hero-strip">
      <div>
        <div className="greeting">
          <i className="fas fa-hand-wave me-2"></i>
          <span>{t('welcome')}</span> <strong>{firstName}</strong>
        </div>
        <div className="sub">{t('welcome_msg')}</div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span className="badge-role"><i className="fas fa-user me-1"></i>{t('citizen_role')}</span>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/40px-Flag_of_Tunisia.svg.png" height="22" style={{borderRadius:'3px'}} alt="Tunisie" />
      </div>
    </div>
  )
}