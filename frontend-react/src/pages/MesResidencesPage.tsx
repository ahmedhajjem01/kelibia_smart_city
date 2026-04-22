import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type Demande = {
  id: number
  adresse_demandee: string
  status: 'pending' | 'approved' | 'rejected'
  is_paid: boolean
  issued_document: string | null
  commentaire_agent: string
  created_at: string
}

export default function MesResidencesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean; has_active_asd: boolean } | null>(null)
  
  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    const fetchAll = async () => {
      try {
        // Fetch User Info
        const userRes = await fetch(resolveBackendUrl('/api/accounts/me/'), {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        const res = await fetch(resolveBackendUrl('/api/residence/demande/'), {
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

  const getStatusBadge = (d: Demande) => {
    if (!d.is_paid && !user?.has_active_asd) {
      return <span className="badge bg-secondary text-white">{t('status_unpaid') || 'Non payé'}</span>
    }
    switch (d.status) {
      case 'pending':
        return <span className="badge bg-warning text-dark">{t('status_pending')}</span>
      case 'approved':
        return <span className="badge bg-success">{t('status_approved')}</span>
      case 'rejected':
        return <span className="badge bg-danger">{t('status_rejected')}</span>
      default:
        return <span className="badge bg-secondary">{d.status}</span>
    }
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: t('mes_residences') }]}
    >
      <div className={`d-flex justify-content-between align-items-center mb-4 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
          <h2 className="section-title text-primary text-uppercase fw-bold m-0">
            <i className="fas fa-home me-2"></i>
            {t('mes_residences')}
          </h2>
          <p className="text-muted small">{t('residence_history_desc')}</p>
        </div>
        <Link to="/demande-residence" className="btn btn-primary rounded-pill shadow-sm">
          <i className="fas fa-plus me-2"></i>
          {t('req_residence')}
        </Link>
      </div>

      <div className={`card shadow-sm border-0 rounded-4 overflow-hidden ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">{t('loading')}</p>
            </div>
          ) : !user?.is_verified ? (
            <div className="alert alert-warning border-0 shadow-sm p-4 d-flex align-items-center m-4" style={{ borderRadius: '15px' }}>
              <i className="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
              <div>
                <h5 className="fw-bold mb-1">{t('unverified_title')}</h5>
                <p className="mb-0">{t('account_verification_required')}</p>
              </div>
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center p-5">
              <i className="fas fa-folder-open fa-3x text-light mb-3"></i>
              <p className="text-muted mb-0">{t('no_requests_found')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4 py-3">{t('date_label')}</th>
                    <th className="border-0 py-3">{t('address_label') || 'Adresse'}</th>
                    <th className="border-0 py-3 text-center">{t('status_label')}</th>
                    <th className="border-0 px-4 py-3 text-end">{t('actions_label')}</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 text-muted small">
                        {new Date(d.created_at).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                      </td>
                      <td className="fw-bold text-dark">{d.adresse_demandee}</td>
                      <td className="text-center">{getStatusBadge(d)}</td>
                      <td className="px-4 text-end">
                        {(!d.is_paid && !user?.has_active_asd) ? (
                           <Link to={`/paiement-simulation?type=residence&id=${d.id}`} className="btn btn-sm btn-primary rounded-pill fw-bold">
                             <i className="fas fa-credit-card me-1"></i>
                             {t('pay_2dt') || 'Payer'}
                           </Link>
                        ) : d.issued_document ? (
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
    </MainLayout>
  )
}
