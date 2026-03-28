import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

interface UnifiedRequest {
  id: number
  type: 'birth' | 'marriage' | 'death' | 'residence' | 'inhumation'
  title: string
  status: string
  date: string
  details: string
}

export default function MesDemandesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<UnifiedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)
    setError(null)

    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        
        // Fetch User Info
        const userRes = await fetch(resolveBackendUrl('/accounts/user/'), { headers })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        // Parallel fetching
        const [resBirth, resMarriage, resDeath, resResidence, resInhumation] = await Promise.all([
          fetch(resolveBackendUrl('/extrait-naissance/api/declaration/'), { headers }),
          fetch(resolveBackendUrl('/extrait-mariage/demandes/'), { headers }),
          fetch(resolveBackendUrl('/extrait-deces/api/declaration/'), { headers }),
          fetch(resolveBackendUrl('/api/residence/demande/'), { headers }),
          fetch(resolveBackendUrl('/extrait-deces/api/inhumation/'), { headers }),
        ])

        const unified: UnifiedRequest[] = []

        // 1. Birth
        if (resBirth.ok) {
          const births = await resBirth.json()
          births.forEach((b: any) => {
            unified.push({
              id: b.id,
              type: 'birth',
              title: t('declare_birth'),
              status: b.status,
              date: b.created_at,
              details: lang === 'ar' ? `${b.prenom_ar} ${b.nom_ar}` : `${b.prenom_fr} ${b.nom_fr}`
            })
          })
        }

        // 2. Marriage
        if (resMarriage.ok) {
          const marriages = await resMarriage.json()
          marriages.forEach((m: any) => {
            unified.push({
              id: m.id,
              type: 'marriage',
              title: t('mariage_contract_title'),
              status: m.status,
              date: m.created_at,
              details: lang === 'ar' ? `زوجين: ${m.nom_epoux_ar} & ${m.nom_epouse_ar}` : `Époux: ${m.nom_epoux_fr} & ${m.nom_epouse_fr}`
            })
          })
        }

        // 3. Death
        if (resDeath.ok) {
          const deathData = await resDeath.json()
          const deaths = deathData.my_declarations || []
          deaths.forEach((d: any) => {
            unified.push({
              id: d.id,
              type: 'death',
              title: t('declare_death'),
              status: d.status,
              date: d.created_at,
              details: d.defunt_detail ? (lang === 'ar' ? `${d.defunt_detail.prenom_ar} ${d.defunt_detail.nom_ar}` : `${d.defunt_detail.prenom_fr} ${d.defunt_detail.nom_fr}`) : 'N/A'
            })
          })
        }

        // 4. Residence
        if (resResidence.ok) {
          const residences = await resResidence.json()
          residences.forEach((r: any) => {
            unified.push({
              id: r.id,
              type: 'residence',
              title: t('req_residence'),
              status: r.status,
              date: r.created_at,
              details: r.adresse_demandee
            })
          })
        }

        // 5. Inhumation
        if (resInhumation.ok) {
          const data = await resInhumation.json()
          const inhumations = data.my_requests || []
          inhumations.forEach((i: any) => {
            unified.push({
              id: i.id,
              type: 'inhumation',
              title: t('inhumation_requests_title'),
              status: i.status,
              date: i.created_at,
              details: i.declaration_detail ? (lang === 'ar' ? `المتوفى: ${i.declaration_detail.defunt_detail.prenom_ar}` : `Défunt: ${i.declaration_detail.defunt_detail.prenom_fr}`) : '---'
            })
          })
        }

        // Sort by date descending
        unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setRequests(unified)

      } catch (err) {
        console.error(err)
        setError(t('error_msg'))
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [navigate, lang, t])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="badge bg-warning text-dark rounded-pill px-3"><i className="fas fa-clock me-1"></i> {t('status_pending')}</span>
      case 'validated':
      case 'approved':
      case 'signed':
      case 'resolved':
        return <span className="badge bg-success rounded-pill px-3"><i className="fas fa-check-circle me-1"></i> {t('status_validated')}</span>
      case 'rejected': return <span className="badge bg-danger rounded-pill px-3"><i className="fas fa-times-circle me-1"></i> {t('status_rejected')}</span>
      default: return <span className="badge bg-secondary rounded-pill px-3">{status}</span>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'birth': return <i className="fas fa-baby text-success"></i>
      case 'marriage': return <i className="fas fa-ring text-primary"></i>
      case 'death': return <i className="fas fa-dove text-dark"></i>
      case 'residence': return <i className="fas fa-home text-warning"></i>
      case 'inhumation': return <i className="fas fa-monument text-secondary"></i>
      default: return <i className="fas fa-file-alt"></i>
    }
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: t('my_requests') }]}
    >
      <div className={`py-4 ${lang === 'ar' ? 'text-end' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="fw-bold section-title mb-1">
              <i className="fas fa-tasks me-2"></i> {t('my_requests')}
            </h1>
            <p className="text-muted mb-0">{t('my_requests_desc')}</p>
          </div>
          <Link to="/services" className="btn btn-primary rounded-pill px-4 shadow-sm">
            <i className="fas fa-plus me-2"></i> {t('new_request')}
          </Link>
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 card shadow-sm border-0 rounded-4">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted mb-0">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger rounded-4 shadow-sm">
            <i className="fas fa-exclamation-circle me-2"></i> {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-5 card shadow-sm border-0 rounded-4">
            <div className="mb-4 opacity-25">
              <i className="fas fa-folder-open fa-4x text-muted"></i>
            </div>
            <h4 className="fw-bold text-muted">Aucune demande trouvée</h4>
            <p className="text-muted mb-4">Vous n'avez pas encore soumis de demande administrative.</p>
            <Link to="/services" className="btn btn-outline-primary rounded-pill px-4">
              Faire ma première demande
            </Link>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 border-0">{lang === 'ar' ? 'الطلب' : 'Demande'}</th>
                    <th className="py-3 border-0">{lang === 'ar' ? 'التوجيه' : 'Détails'}</th>
                    <th className="py-3 border-0 text-center">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="py-3 border-0 text-center">{lang === 'ar' ? 'الحالة' : 'Statut'}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={`${req.type}-${req.id}`}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          {getTypeIcon(req.type)}
                          <span className="fw-bold text-dark">{req.title}</span>
                        </div>
                      </td>
                      <td className="text-muted small">
                        {req.details}
                      </td>
                      <td className="text-center text-muted small">
                        {new Date(req.date).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                      </td>
                      <td className="text-center">
                        {getStatusBadge(req.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
