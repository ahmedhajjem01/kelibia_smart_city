import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

interface Reclamation {
  id: number
  title: string
  description: string
  category: string
  status: string
  priority: string
  created_at: string
  latitude: number | null
  longitude: number | null
}

export default function MesReclamationsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [selectedRec, setSelectedRec] = useState<Reclamation | null>(null)

  useEffect(() => {
    fetchReclamations()
  }, [])

  async function fetchReclamations() {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    try {
      // Fetch User Info
      const userRes = await fetch(resolveBackendUrl('/api/accounts/me/'), {
        headers: { Authorization: `Bearer ${access}` },
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
      }

      const res = await fetch('/api/reclamations/', {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setReclamations(data)
      } else {
        setError(t('retrieval_error'))
      }
    } catch (err) {
      setError(t('error_msg'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="badge bg-warning text-dark rounded-pill">{t('status_pending')}</span>
      case 'in_progress': return <span className="badge bg-primary rounded-pill">{t('status_in_progress')}</span>
      case 'resolved': return <span className="badge bg-success rounded-pill">{t('status_resolved')}</span>
      case 'rejected': return <span className="badge bg-danger rounded-pill">{t('status_rejected')}</span>
      default: return <span className="badge bg-secondary rounded-pill">{status}</span>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgente': return <span className="badge bg-danger rounded-pill"><i className="fas fa-fire me-1"></i> {t('priority_urgente')}</span>
      case 'normale': return <span className="badge bg-info text-dark rounded-pill">{t('priority_normale')}</span>
      case 'faible': return <span className="badge bg-light text-dark border rounded-pill">{t('priority_faible')}</span>
      default: return null
    }
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => { navigate('/login') }}
      breadcrumbs={[{ label: t('my_reclamations') }]}
    >
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold section-title mb-1">
            <i className="fas fa-bullhorn text-danger me-3"></i>
            {t('my_reclamations')}
          </h2>
          <p className="text-muted small">{t('reclamations_subtitle')}</p>
        </div>
        <Link to="/nouvelle-reclamation" className="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow-sm">
          <i className="fas fa-plus me-2"></i> {t('new_reclamation')}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-3 text-muted">{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger rounded-4 p-4 shadow-sm">
          <i className="fas fa-exclamation-circle me-2"></i> {error}
        </div>
      ) : reclamations.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4 border-2 border-dashed">
          <div className="mb-4 text-muted opacity-50">
            <i className="fas fa-folder-open fa-4x"></i>
          </div>
          <h4 className="fw-bold text-muted">{t('no_declarations')}</h4>
          <p className="text-muted">{t('no_reclamations_msg')}</p>
          <Link to="/nouvelle-reclamation" className="btn btn-outline-danger rounded-pill px-4 mt-2">
            {t('submit_first_reclamation')}
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {reclamations.map((rec) => (
            <div key={rec.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 rounded-4 hover-lift overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex flex-column gap-2">
                      {getStatusBadge(rec.status)}
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <small className="text-muted">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <h5 className="fw-bold mb-2 text-dark">{rec.title}</h5>
                  <p className="text-muted small mb-3 text-truncate-2" style={{ minHeight: '3rem' }}>
                    {rec.description}
                  </p>
                  <div className="d-flex align-items-center text-muted small mt-auto">
                    <i className="fas fa-tag me-2"></i>
                    {t(`category_${rec.category}`)}
                  </div>
                </div>
                <div className="card-footer bg-light border-0 p-3 text-center">
                  <button 
                    className="btn btn-link btn-sm text-danger text-decoration-none fw-bold"
                    onClick={() => setSelectedRec(rec)}
                  >
                    {t('details_and_tracking')} <i className="fas fa-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRec && (
         <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
           <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                 <div className="modal-header bg-danger text-white border-0 py-3">
                    <h5 className="modal-title fw-bold">
                       <i className="fas fa-file-alt me-2"></i>
                       {selectedRec.title}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedRec(null)}></button>
                 </div>
                 <div className="modal-body p-4">
                    <div className="mb-4">
                       <label className="text-uppercase text-muted small fw-bold mb-1 d-block">{t('description_label')}</label>
                       <p className="mb-0">{selectedRec.description}</p>
                    </div>
                    <div className="row g-3">
                       <div className="col-6">
                          <label className="text-uppercase text-muted small fw-bold mb-1 d-block">{t('status_label')}</label>
                          {getStatusBadge(selectedRec.status)}
                       </div>
                       <div className="col-6">
                          <label className="text-uppercase text-muted small fw-bold mb-1 d-block">{t('priority_label')}</label>
                          {getPriorityBadge(selectedRec.priority)}
                       </div>
                       <div className="col-6">
                          <label className="text-uppercase text-muted small fw-bold mb-1 d-block">{t('category_label')}</label>
                          <span className="small">{t(`category_${selectedRec.category}`)}</span>
                       </div>
                       <div className="col-6">
                          <label className="text-uppercase text-muted small fw-bold mb-1 d-block">{t('demande_date')}</label>
                          <span className="small">{new Date(selectedRec.created_at).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
                 <div className="modal-footer bg-light border-0">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedRec(null)}>{t('event_close_btn')}</button>
                 </div>
              </div>
           </div>
         </div>
      )}

      <style>{`
        .hover-lift { transition: all 0.2s ease; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1); }
        .text-truncate-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
      `}</style>
    </MainLayout>
  )
}
