import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type Demande = {
  id: number
  service_type: string
  service_type_label: string
  nom_commerce: string
  adresse_commerce: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected'
  issued_document: string | null
  commentaire_agent: string
  created_at: string
}

export default function MesCommercePage() {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }

    const fetchAll = async () => {
      try {
        const userRes = await fetch(resolveBackendUrl('/api/accounts/me/'), {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (userRes.ok) setUser(await userRes.json())

        const res = await fetch('/api/commerce/demande/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        const data = await res.json()
        setDemandes(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [navigate])

  const getStatusBadge = (status: Demande['status']) => {
    switch (status) {
      case 'pending':    return <span className="badge bg-warning text-dark">En attente</span>
      case 'in_progress': return <span className="badge bg-info text-dark">En cours</span>
      case 'approved':   return <span className="badge bg-success">Approuvée</span>
      case 'rejected':   return <span className="badge bg-danger">Rejetée</span>
      default:           return <span className="badge bg-secondary">{status}</span>
    }
  }

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Boutiques & Commerces' }]}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="section-title text-primary text-uppercase fw-bold m-0">
            <i className="fas fa-store me-2"></i>
            Mes demandes — Boutiques & Commerces
          </h2>
          <p className="text-muted small">Historique de vos demandes de licences commerciales.</p>
        </div>
        <Link to="/demande-commerce" className="btn btn-primary rounded-pill shadow-sm">
          <i className="fas fa-plus me-2"></i>
          Nouvelle demande
        </Link>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Chargement...</p>
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
                    <th className="border-0 py-3">Type de service</th>
                    <th className="border-0 py-3">Commerce</th>
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
                      <td className="fw-semibold text-dark">{d.service_type_label}</td>
                      <td className="text-muted small">{d.nom_commerce} — {d.adresse_commerce}</td>
                      <td className="text-center">{getStatusBadge(d.status)}</td>
                      <td className="px-4 text-end">
                        {d.issued_document ? (
                          <a href={d.issued_document} target="_blank" rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-success rounded-pill fw-bold">
                            <i className="fas fa-download me-1"></i>Télécharger
                          </a>
                        ) : (
                          <button className="btn btn-sm btn-outline-secondary rounded-pill disabled" disabled>
                            <i className="fas fa-hourglass-half me-1"></i>En attente
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
    </MainLayout>
  )
}
