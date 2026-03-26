import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

type Demande = {
  id: number
  adresse_demandee: string
  status: 'pending' | 'approved' | 'rejected'
  issued_document: string | null
  commentaire_agent: string
  created_at: string
}

export default function MesResidencesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    fetch('/api/residence/demande/', {
      headers: { Authorization: `Bearer ${access}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setDemandes(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [navigate])

  const getStatusBadge = (status: Demande['status']) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning text-dark">{t('status_pending')}</span>
      case 'approved':
        return <span className="badge bg-success">{t('status_approved')}</span>
      case 'rejected':
        return <span className="badge bg-danger">{t('status_rejected')}</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary text-uppercase fw-bold m-0">
          <i className="fas fa-home me-2"></i>
          {t('mes_residences')}
        </h2>
        <Link to="/demande-residence" className="btn btn-primary rounded-pill shadow-sm">
          <i className="fas fa-plus me-2"></i>
          {t('req_residence')}
        </Link>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted">{t('loading')}</p>
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center p-5">
              <i className="fas fa-folder-open fa-3x text-light mb-3"></i>
              <p className="text-muted mb-0">Aucune demande trouvée.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4 py-3">Date</th>
                    <th className="border-0 py-3">Adresse</th>
                    <th className="border-0 py-3 text-center">Statut</th>
                    <th className="border-0 px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 text-muted small">
                        {new Date(d.created_at).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                      </td>
                      <td className="fw-bold text-dark">{d.adresse_demandee}</td>
                      <td className="text-center">{getStatusBadge(d.status)}</td>
                      <td className="px-4 text-end">
                        {d.issued_document ? (
                          <a
                            href={d.issued_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-success rounded-pill fw-bold"
                          >
                            <i className="fas fa-download me-1"></i>
                            {t('download_doc')}
                          </a>
                        ) : (
                            <button className="btn btn-sm btn-outline-secondary rounded-pill disabled" disabled>
                                <i className="fas fa-hourglass-half me-1"></i>
                                {t('status_pending')}
                            </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <Link to="/dashboard" className="btn btn-link link-secondary text-decoration-none p-0">
            <i className={`fas ${lang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'} me-2`}></i>
            {t('home')}
        </Link>
      </div>
    </div>
  )
}
