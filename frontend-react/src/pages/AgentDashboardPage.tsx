import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

type UserInfo = {
  first_name: string
  last_name: string
  email: string
  user_type?: string
  is_staff?: boolean
  is_superuser?: boolean
}

type Reclamation = {
  id: number
  title: string
  description: string
  created_at: string
  citizen_name: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | string
}

function getStatusBadge(status: Reclamation['status'], t: (key: string) => string) {
  const normalized = String(status)
  const labels: Record<string, string> = {
    pending: t('status_pending'),
    in_progress: t('status_in_progress'),
    resolved: t('status_resolved'),
    rejected: t('status_rejected'),
  }

  const label = labels[normalized] || 'Inconnu'

  const classes: Record<string, string> = {
    pending: 'bg-warning text-dark',
    in_progress: 'bg-info',
    resolved: 'bg-success',
    rejected: 'bg-secondary',
  }

  const cls = classes[normalized] || 'bg-light text-dark'

  return <span className={`badge ${cls}`}>{label}</span>
}

export default function AgentDashboardPage() {
  const { t, setLang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [reclamations, setReclamations] = useState<Reclamation[] | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/accounts/me/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (!res.ok) throw new Error('Failed to fetch user info')
        const data = (await res.json()) as UserInfo

        setUser(data)

        // If it's not an agent/admin, redirect to citizen dashboard
        if (
          data.user_type !== 'agent' &&
          !data.is_staff &&
          !data.is_superuser
        ) {
          navigate('/dashboard')
          return
        }

        // Fetch reclamations
        const r = await fetch('/api/reclamations/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (!r.ok) throw new Error('Failed to fetch reclamations')
        const recData = (await r.json()) as Reclamation[]
        setReclamations(recData)
      } catch (e) {
        console.error(e)
        setReclamations([])
      }
    })()
  }, [navigate])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container">
          <a className="navbar-brand" href="#" data-i18n="agent_dashboard">
            Tableau de bord Agent
          </a>
          <div className="d-flex align-items-center">
            <div className="btn-group me-3" role="group" aria-label="Language">
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('fr')}
                title="Français"
              >
                <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('ar')}
                title="العربية"
              >
                <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
              </button>
            </div>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row">
          <div className="col-md-8">
            <div className="alert alert-success">
              <h4>{t('agent_welcome')}</h4>
              <p>{t('welcome_msg')}</p>
            </div>

            <div className="card shadow-sm mb-4 agent-card" style={{ borderLeft: '5px solid #198754' }}>
              <div className="card-body">
                <h5 className="card-title text-success">
                  <i className="fas fa-bullhorn me-2" />
                  {t('reclamations_mgnt')}
                </h5>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <p className="card-text text-muted mb-0">
                      Gérez les signalements des citoyens (bruit, voirie, etc.).
                    </p>
                    <Link to="/agent-reclamations" className="btn btn-success rounded-pill px-4 shadow-sm">
                        <i className="fas fa-map-marked-alt me-2"></i> Ouvrir le Centre de Commandement
                    </Link>
                </div>

                <div id="reclamationsList" className="mt-3">
                  {reclamations === null ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : reclamations.length === 0 ? (
                    <p className="text-muted text-center py-3">
                      Aucune réclamation pour le moment.
                    </p>
                  ) : (
                    <div className="list-group">
                      {reclamations.map((rec) => (
                        <div
                          key={rec.id}
                          className="list-group-item list-group-item-action"
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">{rec.title}</h6>
                            <small className="text-muted">
                              {new Date(rec.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <p className="mb-1 small text-truncate">{rec.description}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">Par: {rec.citizen_name}</small>
                            {getStatusBadge(rec.status, t)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">{t('profile')}</h6>
              </div>
              <div className="card-body text-center">
                <img
                  src="https://ui-avatars.com/api/?name=Agent&background=198754&color=fff"
                  className="rounded-circle mb-3"
                  width="80"
                  alt="Agent avatar"
                />
                <h6>{user ? `${user.first_name} ${user.last_name}` : t('loading')}</h6>
                <p className="text-muted small">{user ? user.email : '...'}</p>
                <span className="badge bg-success">Municipal Agent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

