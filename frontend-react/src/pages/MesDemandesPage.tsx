import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

interface UnifiedRequest {
  id: number
  type: 'birth' | 'marriage' | 'death' | 'residence' | 'inhumation' | 'livret' | 'construction' | 'goudronnage' | 'vocation' | 'evenement' | 'raccordement'
  title: string
  status: string
  date: string
  details: string
  isPaid?: boolean
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
        const userRes = await fetch(resolveBackendUrl('/api/accounts/me/'), { headers })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        // Parallel fetching
        const [resBirth, resMarriage, resDeath, resResidence, resInhumation, resExtraits, resExtraitsMariage, resLivret, resConstruction, resGoudronnage, resVocation, resRaccordement, resEvenement] = await Promise.all([
          fetch(resolveBackendUrl('/extrait-naissance/api/declaration/'), { headers }),
          fetch(resolveBackendUrl('/extrait-mariage/demandes/'), { headers }),
          fetch(resolveBackendUrl('/extrait-deces/api/declaration/'), { headers }),
          fetch(resolveBackendUrl('/api/residence/demande/'), { headers }),
          fetch(resolveBackendUrl('/extrait-deces/api/inhumation/'), { headers }),
          fetch(resolveBackendUrl('/extrait-naissance/api/mes-extraits/'), { headers }),
          fetch(resolveBackendUrl('/extrait-mariage/extraits/'), { headers }),
          fetch(resolveBackendUrl('/livret-famille/demandes/'), { headers }),
          fetch(resolveBackendUrl('/api/construction/demandes/'), { headers }),
          fetch(resolveBackendUrl('/api/construction/goudronnage/'), { headers }),
          fetch(resolveBackendUrl('/api/construction/vocation/'), { headers }),
          fetch(resolveBackendUrl('/api/construction/raccordement/'), { headers }),
          fetch(resolveBackendUrl('/api/evenements/demande/'), { headers }),
        ])


        const unified: UnifiedRequest[] = []

        // 1. Birth Declarations
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

        // 2. Birth Extraits (Signed)
        if (resExtraits.ok) {
          const extData = await resExtraits.json()
          const processExtrait = (e: any, labelKey: string) => {
            unified.push({
              id: e.n_etat_civil,
              type: 'birth',
              title: t(labelKey),
              status: 'signed',
              date: e.date_naissance,
              details: lang === 'ar' ? e.nom_complet_ar : e.nom_complet_fr
            })
          }
          if (extData.mon_extrait) processExtrait(extData.mon_extrait, 'my_birth_cert')
          if (extData.enfants) extData.enfants.forEach((e: any) => processExtrait(e, 'child_birth_cert'))
        }

        // 3. Marriage Declarations
        if (resMarriage.ok) {
          const marriages = await resMarriage.json()
          marriages.forEach((m: any) => {
            unified.push({
              id: m.id,
              type: 'marriage',
              title: t('mariage_contract_title'),
              status: m.status,
              date: m.created_at,
              details: lang === 'ar' ? `زوجين: ${m.nom_epoux} & ${m.nom_epouse}` : `Époux: ${m.nom_epoux} & ${m.nom_epouse}`
            })
          })
        }

        // 4. Marriage Extraits (Signed)
        if (resExtraitsMariage.ok) {
          const extM = await resExtraitsMariage.json()
          extM.forEach((m: any) => {
            unified.push({
              id: m.numero_registre,
              type: 'marriage',
              title: t('view_mariage_cert'),
              status: 'signed',
              date: m.date_mariage,
              details: lang === 'ar' ? m.conjoint_ar : m.conjoint_fr
            })
          })
        }

        // 5. Death
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

        // 6. Residence
        if (resResidence.ok) {
          const residences = await resResidence.json()
          residences.forEach((r: any) => {
            unified.push({
              id: r.id,
              type: 'residence',
              title: t('req_residence'),
              status: r.status,
              date: r.created_at,
              details: r.adresse_demandee,
              isPaid: r.is_paid
            })
          })
        }


        // 7. Inhumation
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

        // 8. Livret de Famille
        if (resLivret.ok) {
          const livrets = await resLivret.json()
          livrets.forEach((l: any) => {
            unified.push({
              id: l.id,
              type: 'livret',
              title: lang === 'ar' ? 'الدفتر العائلي' : 'Livret de Famille',
              status: l.status,
              date: l.created_at,
              details: lang === 'ar' ? `للأب: ${l.prenom_chef_famille} ${l.nom_chef_famille}` : `Pour: ${l.prenom_chef_famille} ${l.nom_chef_famille}`,
              isPaid: l.is_paid
            })
          })
        }

        // 9. Permis de construire
        if (resConstruction.ok) {
          const constructions = await resConstruction.json()
          constructions.forEach((c: any) => {
            const typeLabel = c.type_travaux_display || c.type_travaux || ''
            unified.push({
              id: c.id,
              type: 'construction',
              title: lang === 'ar' ? 'طلب ترخيص بناء' : 'Autorisation de construire',
              status: c.status,
              date: c.created_at,
              details: `${typeLabel} — ${c.adresse_terrain || ''}`,
              isPaid: c.is_paid
            })
          })
        }

        // 10. Goudronnage
        if (resGoudronnage.ok) {
          const goudronnages = await resGoudronnage.json()
          goudronnages.forEach((g: any) => {
            unified.push({
              id: g.id,
              type: 'goudronnage',
              title: lang === 'ar' ? 'طلب تعبيد طريق' : 'Demande de Goudronnage',
              status: g.status,
              date: g.created_at,
              details: g.adresse_residence || '',
              isPaid: g.is_paid
            })
          })
        }

        // 11. Certificat de vocation
        if (resVocation.ok) {
          const vocations = await resVocation.json()
          vocations.forEach((v: any) => {
            unified.push({
              id: v.id,
              type: 'vocation',
              title: lang === 'ar' ? 'شهادة صبغة عقار' : 'Certificat de vocation',
              status: v.status,
              date: v.created_at,
              details: v.adresse_bien || '',
              isPaid: v.is_paid
            })
          })
        }

        // 12. Raccordement
        if (resRaccordement.ok) {
          const raccordements = await resRaccordement.json()
          raccordements.forEach((r: any) => {
            unified.push({
              id: r.id,
              type: 'raccordement',
              title: lang === 'ar' ? 'طلب ربط بشبكة' : 'Demande de Raccordement',
              status: r.status,
              date: r.created_at,
              details: `${r.type_reseau} — ${r.adresse_raccordement}`,
              isPaid: r.is_paid
            })
          })
        }

        // 13. Evenement
        if (resEvenement.ok) {
          const evenements = await resEvenement.json()
          evenements.forEach((e: any) => {
            unified.push({
              id: e.id,
              type: 'evenement',
              title: lang === 'ar' ? 'طلب ترخيص تظاهرة' : 'Autorisation d\'événement',
              status: e.status,
              date: e.created_at,
              details: e.titre_evenement,
              isPaid: e.is_paid
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
      case 'status_pending':
      case 'pending': return (
        <div className="d-flex flex-column align-items-center gap-1">
          <span className="badge bg-warning text-dark rounded-pill px-3"><i className="fas fa-clock me-1"></i> {t('status_pending')}</span>
        </div>
      )
      case 'in_progress': 
        return <span className="badge bg-primary rounded-pill px-3"><i className="fas fa-spinner fa-spin me-1"></i> {t('status_in_progress')}</span>
      case 'validated':
      case 'approved':
      case 'signed':
      case 'resolved':
      case 'favorable':
      case 'permis_delivre':
      case 'traite':
      case 'delivre':
        return <span className="badge bg-success rounded-pill px-3"><i className="fas fa-check-circle me-1"></i> {t('status_validated')}</span>
      case 'en_cours_instruction':
        return <span className="badge bg-primary rounded-pill px-3"><i className="fas fa-spinner fa-spin me-1"></i> {t('status_in_progress')}</span>
      case 'changes_requested':
        return <span className="badge bg-warning text-dark rounded-pill px-3"><i className="fas fa-edit me-1"></i> {lang === 'ar' ? 'تعديلات مطلوبة' : 'Modifications demandées'}</span>
      case 'ready':
        return <span className="badge bg-info text-dark rounded-pill px-3"><i className="fas fa-box-open me-1"></i> {t('status_ready')}</span>
      case 'defavorable':
      case 'rejet_definitif':
      case 'rejected': return <span className="badge bg-danger rounded-pill px-3"><i className="fas fa-times-circle me-1"></i> {t('status_rejected')}</span>


      default: return <span className="badge bg-secondary rounded-pill px-3">{status}</span>
    }
  }

  const getRequestPrice = (type: any) => {
    switch (type) {
      case 'birth':
      case 'marriage':
      case 'death':
        return '0.500';
      case 'residence':
      case 'goudronnage':
      case 'vocation':
      case 'inhumation':
        return '2.000';
      case 'livret':
      case 'evenement':
        return '5.000';
      case 'construction':
        return '20.000';
      default:
        return '2.000';
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'birth': return <i className="fas fa-baby text-success"></i>
      case 'marriage': return <i className="fas fa-ring text-primary"></i>
      case 'death': return <i className="fas fa-dove text-dark"></i>
      case 'residence': return <i className="fas fa-home text-warning"></i>
      case 'inhumation': return <i className="fas fa-monument text-secondary"></i>
      case 'livret': return <i className="fas fa-book-open text-info"></i>
      case 'construction': return <i className="fas fa-hard-hat text-warning"></i>
      case 'goudronnage': return <i className="fas fa-road text-secondary"></i>
      case 'vocation': return <i className="fas fa-building text-info"></i>
      case 'evenement': return <i className="fas fa-calendar-alt text-danger"></i>
      case 'raccordement': return <i className="fas fa-plug text-warning"></i>
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

        {user && !user.is_verified && (
          <div 
            className="p-4 mb-4 d-flex align-items-center animate__animated animate__fadeInDown shadow-sm"
            style={{ 
              background: '#FFF4CD', 
              borderRadius: '20px', 
              border: 'none',
              gap: '20px'
            }}
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
        ) : error ? (
          <div className="alert alert-danger rounded-4 shadow-sm">
            <i className="fas fa-exclamation-circle me-2"></i> {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-5 card shadow-sm border-0 rounded-4">
            <div className="mb-4 opacity-25">
              <i className="fas fa-folder-open fa-4x text-muted"></i>
            </div>
            <h4 className="fw-bold text-muted">{t('no_requests_found')}</h4>
            <p className="text-muted mb-4">{t('no_requests_desc')}</p>
            <Link to="/services" className="btn btn-outline-primary rounded-pill px-4">
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
                    <th className="py-3 border-0 text-center">{t('date')}</th>
                    <th className="py-3 border-0 text-center">{t('status_label')}</th>
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
                        <div className="d-flex flex-column align-items-center gap-2">
                           {getStatusBadge(req.status)}
                            {req.status === 'pending' && !req.isPaid && req.type !== 'birth' && req.type !== 'death' && (
                              <div className="d-flex flex-column gap-2">
                                <small className="text-warning fw-bold px-2 py-1 rounded bg-warning-light" style={{ fontSize: '0.62rem', backgroundColor: '#fff8e1', border: '1px solid #ffd54f' }}>
                                   <i className="fas fa-hourglass-half me-1"></i>
                                   {lang === 'ar' ? 'بانتظار الدفع لتتم معالجة الطلب' : 'En attente de paiement pour traitement'}
                                </small>
                                <button 
                                   className="btn btn-xs btn-outline-primary py-0 px-2 rounded-pill shadow-sm animate__animated animate__pulse animate__infinite" 
                                   style={{ fontSize: '0.65rem' }}
                                   onClick={() => navigate(`/paiement?amount=${getRequestPrice(req.type)}&reason=${encodeURIComponent(req.title)}&requestId=${req.id}&requestType=${req.type}&target=/mes-demandes`)}
                                >
                                   <i className="fas fa-credit-card me-1"></i> {lang === 'ar' ? `دفع ${getRequestPrice(req.type)} د.ت` : `Payer ${getRequestPrice(req.type)} DT`}
                                </button>
                              </div>
                            )}
                           {req.isPaid && (
                             <span className="badge bg-light text-success border border-success extra-small" style={{ fontSize: '0.6rem' }}>
                                {t('paid_label')} <i className="fas fa-check"></i>
                             </span>
                           )}
                        </div>
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
