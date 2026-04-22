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
  adresse_bien: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected'
  issued_document: string | null
  commentaire_agent: string
  created_at: string
}

export default function MesImpotsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean; has_active_asd: boolean } | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }

    const fetchAll = async () => {
      try {
        const userRes = await fetch(resolveBackendUrl('/api/accounts/me/'), {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (userRes.ok) setUser(await userRes.json())

        const res = await fetch(resolveBackendUrl('/api/impots/demande/'), {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'status_pending':
      case 'pending': return (
        <span className="badge bg-warning text-dark rounded-pill px-3"><i className="fas fa-clock me-1"></i> {t('status_pending')}</span>
      )
      case 'in_progress': 
        return <span className="badge bg-primary rounded-pill px-3"><i className="fas fa-spinner fa-spin me-1"></i> {t('status_in_progress')}</span>
      case 'validated':
      case 'approved':
        return <span className="badge bg-success rounded-pill px-3"><i className="fas fa-check-circle me-1"></i> {t('status_validated')}</span>
      case 'rejected': return <span className="badge bg-danger rounded-pill px-3"><i className="fas fa-times-circle me-1"></i> {t('status_rejected')}</span>
      default: return <span className="badge bg-secondary rounded-pill px-3">{status}</span>
    }
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: lang === 'ar' ? 'المالية والأداءات' : 'Argent & Impôts' }]}
    >
      <div className={`py-4 ${lang === 'ar' ? 'text-end font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="fw-bold section-title mb-1">
              <i className={`fas fa-file-invoice-dollar ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i> {lang === 'ar' ? 'طلباتي — المالية والأداءات' : 'Mes demandes — Argent & Impôts'}
            </h1>
            <p className="text-muted mb-0">{lang === 'ar' ? 'سجل طلباتك المالية والعقارية.' : 'Historique de vos demandes fiscales et immobilières.'}</p>
          </div>
          <Link to="/demande-argent" className="btn btn-primary rounded-pill px-4 shadow-sm">
            <i className={`fas fa-plus ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i> {t('new_request')}
          </Link>
        </div>

        {user && !user.is_verified && (
          <div 
            className="p-4 mb-4 d-flex align-items-center animate__animated animate__fadeInDown shadow-sm"
            style={{ background: '#FFF4CD', borderRadius: '20px', border: 'none', gap: '20px' }}
          >
            <div className="text-warning">
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#664d03' }}>{t('account_pending_verification')}</h5>
              <p className="mb-0 fs-6" style={{ color: '#664d03', opacity: 0.9 }}>{t('account_pending_verification_desc')}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 card shadow-sm border-0 rounded-4">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted mb-0">{t('loading')}</p>
          </div>
        ) : demandes.length === 0 ? (
          <div className="text-center py-5 card shadow-sm border-0 rounded-4">
            <div className="mb-4 opacity-25">
              <i className="fas fa-folder-open fa-4x text-muted"></i>
            </div>
            <h4 className="fw-bold text-muted">{t('no_requests_found')}</h4>
            <p className="text-muted mb-4">{t('no_requests_desc')}</p>
            <Link to="/demande-argent" className="btn btn-outline-primary rounded-pill px-4">
              {t('make_first_request')}
            </Link>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 border-0">{t('request_label')}</th>
                    <th className="py-3 border-0">{t('details_label')}</th>
                    <th className="py-3 border-0 text-center">{t('date_label')}</th>
                    <th className="py-3 border-0 text-center">{t('status_label')}</th>
                    <th className="px-4 py-3 border-0 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fas fa-file-invoice-dollar text-success"></i>
                          <span className="fw-bold text-dark">{d.service_type_label}</span>
                        </div>
                      </td>
                      <td className="text-muted small">
                        {d.adresse_bien}
                      </td>
                      <td className="text-center text-muted small">
                        {new Date(d.created_at).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column align-items-center gap-2">
                           {getStatusBadge(d.status)}
                           {d.status === 'pending' && !(d as any).is_paid && !user?.has_active_asd && (
                             <div className="d-flex flex-column gap-2">
                               <small className="text-warning fw-bold px-2 py-1 rounded bg-warning-light" style={{ fontSize: '0.62rem', backgroundColor: '#fff8e1', border: '1px solid #ffd54f' }}>
                                  <i className="fas fa-hourglass-half me-1"></i>
                                  {t('payment_required_msg')}
                               </small>
                               <button 
                                  className="btn btn-xs btn-outline-primary py-0 px-2 rounded-pill shadow-sm animate__animated animate__pulse animate__infinite" 
                                  style={{ fontSize: '0.65rem' }}
                                  onClick={() => navigate(`/paiement?amount=10.000&reason=${encodeURIComponent(d.service_type_label)}&requestId=${d.id}&requestType=impots&target=/mes-demandes-argent`)}
                               >
                                  <i className="fas fa-credit-card me-1"></i> {lang === 'ar' ? `10.000 د.ت` : `10.000 DT`} {t('pay_label') || 'Payer'}
                               </button>
                             </div>
                           )}
                           {(d as any).is_paid && (
                             <span className="badge bg-light text-success border border-success extra-small" style={{ fontSize: '0.6rem' }}>
                                {t('paid_label')} <i className="fas fa-check"></i>
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-4 text-end">
                        {d.issued_document ? (
                          <a href={d.issued_document} target="_blank" rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-success rounded-pill fw-bold">
                            <i className={`fas fa-download ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{lang === 'ar' ? 'تحميل' : 'Télécharger'}
                          </a>
                        ) : (
                          <span className="text-muted small">
                            —
                          </span>
                        )}
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
