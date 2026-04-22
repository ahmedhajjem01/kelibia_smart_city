import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

import { useI18n } from '../i18n/LanguageProvider'

type Demande = {
  id: number
  type_travaux: string
  type_travaux_display: string
  type_travaux_libre: string | null
  usage_batiment_display: string
  adresse_terrain: string
  numero_parcelle: string
  surface_terrain: number
  surface_construite: number
  nombre_etages: number
  date_debut_prevue: string
  duree_travaux_mois: number
  cout_estime: string | null
  nom_proprietaire: string
  nom_entrepreneur: string
  status: string
  status_display: string
  priorite: string
  priorite_display: string
  is_high_risk: boolean
  commentaire_agent: string
  permis_signe: string | null
  is_paid: boolean
  created_at: string
  updated_at: string
}

type UserInfo = { first_name: string; last_name: string; email: string; is_verified: boolean; has_active_asd?: boolean }

const STATUS_CONFIG: Record<string, { cls: string; icon: string }> = {
  pending:              { cls: 'bg-primary text-white',  icon: 'fa-clock' },
  en_cours_instruction: { cls: 'bg-warning text-dark',   icon: 'fa-search' },
  favorable:            { cls: 'bg-info text-white',     icon: 'fa-thumbs-up' },
  defavorable:          { cls: 'bg-danger text-white',   icon: 'fa-thumbs-down' },
  changes_requested:    { cls: 'bg-warning text-dark',   icon: 'fa-edit' },
  permis_delivre:       { cls: 'bg-success text-white',  icon: 'fa-award' },
  rejet_definitif:      { cls: 'bg-dark text-white',     icon: 'fa-ban' },
}

const TYPE_EMOJI: Record<string, string> = {
  construction_neuve: '🏗️',
  renovation:         '🔨',
  extension:          '📐',
  demolition:         '🏚️',
  cloture:            '🪨',
  piscine:            '🏊',
  panneau_solaire:    '☀️',
  ravalement:         '🎨',
  autre:              '📋',
}

export default function MesConstructionsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    const fetchAll = async () => {
      try {
        const [userRes, demandesRes] = await Promise.all([
          fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/construction/demandes/'), { headers: { Authorization: `Bearer ${access}` } }),
        ])
        if (userRes.ok) setUser(await userRes.json())
        if (demandesRes.ok) {
          const data = await demandesRes.json()
          setDemandes(Array.isArray(data) ? data : (data.results || []))
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [navigate])

  const fmt = (d: string) => d
    ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: lang === 'ar' ? 'رخص البناء الخاصة بي' : 'Mes permis de construire' }]}>

      <div className={`py-4 ${lang === 'ar' ? 'text-end font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold text-primary m-0" style={{ fontSize: '1.2rem' }}>
              <i className={`fas fa-hard-hat ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
              {lang === 'ar' ? 'طلبات رخص البناء الخاصة بي' : 'Mes Permis de Construire'}
            </h2>
            <p className="text-muted small mb-0">{lang === 'ar' ? 'سجل طلبات رخص البناء والتهيئة.' : 'Historique de vos demandes de permis de construire.'}</p>
          </div>
          <Link to="/demande-construction" className="btn btn-primary rounded-pill shadow-sm px-4">
            <i className={`fas fa-plus ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{t('new_request')}
          </Link>
        </div>

        {user && !user.is_verified && (
          <div 
            className="p-4 mb-4 d-flex align-items-center shadow-sm"
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

        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted">{t('loading')}</p>
              </div>
            ) : demandes.length === 0 ? (
              <div className="text-center py-5 card border-0 shadow-none">
                <i className="fas fa-hard-hat fa-3x text-muted opacity-25 mb-3 d-block"></i>
                <h4 className="fw-bold text-muted">{lang === 'ar' ? 'لم يتم العثور على أي طلب' : 'Aucune demande trouvée'}</h4>
                <p className="text-muted mb-4">{lang === 'ar' ? 'لم تقم بتقديم أي طلب رخصة بناء بعد.' : 'Vous n\'avez soumis aucune demande de permis de construire pour le moment.'}</p>
                <Link to="/demande-construction" className="btn btn-outline-primary rounded-pill px-4">
                  {t('make_first_request')}
                </Link>
              </div>
            ) : (
            <div className="p-3 p-md-4 d-flex flex-column gap-3">
              {demandes.map(d => {
                const sc = STATUS_CONFIG[d.status] || { cls: 'bg-secondary text-white', icon: 'fa-question' }
                const emoji = TYPE_EMOJI[d.type_travaux] || '🏗️'
                const isExpanded = expandedId === d.id
                return (
                  <div key={d.id} className="border-0 rounded-4 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

                    {d.is_high_risk && (
                      <div className="px-4 py-2 d-flex align-items-center gap-2"
                        style={{ background: '#fff3e0', borderBottom: '1px solid #ffcc02', fontSize: '.82rem', color: '#e65100' }}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <strong>{lang === 'ar' ? 'ملف ذو أولوية قصوى' : 'Dossier haute priorité'}</strong> — {lang === 'ar' ? 'يتطلب معاينة ميدانية' : 'Inspection technique sur site requise'}
                      </div>
                    )}

                    <div className="p-4 d-flex align-items-start gap-3 flex-wrap bg-white"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0d6efd,#6610f2)', fontSize: '1.4rem' }}>
                        {emoji}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span className="fw-bold" style={{ fontSize: '1rem', color: '#1a1a2e' }}>{d.type_travaux_display}</span>
                          {d.type_travaux === 'autre' && d.type_travaux_libre && (
                            <span className="text-muted small">— {d.type_travaux_libre}</span>
                          )}
                          <span className={`badge rounded-pill ${sc.cls}`} style={{ fontSize: '.72rem' }}>
                            <i className={`fas ${sc.icon} ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{d.status_display}
                          </span>
                          {d.priorite === 'haute' && (
                            <span className="badge bg-danger rounded-pill" style={{ fontSize: '.72rem' }}>
                              <i className={`fas fa-exclamation-triangle ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{lang === 'ar' ? 'أولوية قصوى' : 'Haute priorité'}
                            </span>
                          )}
                          {d.is_paid && (
                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill" style={{ fontSize: '.7rem' }}>
                              <i className={`fas fa-check-circle ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{lang === 'ar' ? 'خالص' : 'Frais réglés'}
                            </span>
                          )}
                        </div>
                        <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '.82rem', color: '#777' }}>
                          <span><i className={`fas fa-map-marker-alt ${lang === 'ar' ? 'ms-1' : 'me-1'} text-primary opacity-75`}></i>{d.adresse_terrain}</span>
                          <span><i className={`fas fa-expand ${lang === 'ar' ? 'ms-1' : 'me-1'} text-success opacity-75`}></i>{d.surface_construite} {lang === 'ar' ? 'م²' : 'm²'}</span>
                          <span><i className={`fas fa-layer-group ${lang === 'ar' ? 'ms-1' : 'me-1'} text-warning opacity-75`}></i>{d.nombre_etages} {lang === 'ar' ? 'طوابق' : (d.nombre_etages > 1 ? 'étages' : 'étage')}</span>
                          <span><i className={`fas fa-calendar ${lang === 'ar' ? 'ms-1' : 'me-1'} text-info opacity-75`}></i>{fmt(d.created_at)}</span>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-muted`} style={{ marginTop: 4 }}></i>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-top" style={{ background: '#fafbfc' }}>
                        <div className="row g-3 mt-2">
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'نوع الاستعمال' : 'Usage'}</div>
                            <div>{d.usage_batiment_display}</div>
                          </div>
                          {d.numero_parcelle && (
                            <div className="col-md-6">
                              <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'رقم القطعة' : 'N° Parcelle'}</div>
                              <div>{d.numero_parcelle}</div>
                            </div>
                          )}
                          <div className="col-md-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'مساحة الأرض' : 'Surface terrain'}</div>
                            <div>{d.surface_terrain} {lang === 'ar' ? 'م²' : 'm²'}</div>
                          </div>
                          <div className="col-md-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'تاريخ البدء المتوقع' : 'Date début prévue'}</div>
                            <div>{fmt(d.date_debut_prevue)}</div>
                          </div>
                          <div className="col-md-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'مدة الأشغال' : 'Durée travaux'}</div>
                            <div>{d.duree_travaux_mois} {lang === 'ar' ? 'أشهر' : 'mois'}</div>
                          </div>
                          {d.cout_estime && (
                            <div className="col-md-6">
                              <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'التكلفة التقديرية' : 'Coût estimatif'}</div>
                              <div>{parseFloat(d.cout_estime).toLocaleString(lang === 'ar' ? 'ar-TN' : 'fr-FR')} {lang === 'ar' ? 'د.ت' : 'DT'}</div>
                            </div>
                          )}
                          {d.nom_entrepreneur && (
                            <div className="col-md-6">
                              <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'المقاول' : 'Entrepreneur'}</div>
                              <div>{d.nom_entrepreneur}</div>
                            </div>
                          )}
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'المالك' : 'Propriétaire'}</div>
                            <div>{d.nom_proprietaire}</div>
                          </div>
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'تاريخ التحديث' : 'Mis à jour'}</div>
                            <div>{fmt(d.updated_at)}</div>
                          </div>

                          {d.status === 'changes_requested' && (
                            <div className="col-12">
                              <div className="p-3 rounded-3 d-flex gap-2 align-items-start"
                                style={{ background: '#fff8e1', border: '2px solid #f9a825', fontSize: '.88rem' }}>
                                <i className={`fas fa-edit mt-1 ${lang === 'ar' ? 'ms-2' : 'me-2'}`} style={{ color: '#f57f17' }}></i>
                                <div>
                                  <strong style={{ color: '#e65100' }}>{lang === 'ar' ? 'يطلب منكم العون إجراء تعديلات' : 'L\'agent vous demande des modifications'}</strong>
                                  <p className="mb-0 mt-1 text-muted small">
                                    {lang === 'ar' ? 'يرجى الاطلاع على التعليق أدناه وإعادة تقديم الطلب.' : 'Veuillez consulter le commentaire ci-dessous et soumettre une nouvelle demande corrigée.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {d.status === 'favorable' && (
                            <div className="col-12">
                              <div className="p-3 rounded-3 d-flex gap-2 align-items-start"
                                style={{ background: '#e3f9f5', border: '2px solid #20c997', fontSize: '.88rem' }}>
                                <i className={`fas fa-thumbs-up mt-1 text-success ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
                                <div>
                                  <strong className="text-success">{lang === 'ar' ? 'رأي إيجابي' : 'Avis favorable'}</strong>
                                  <p className="mb-0 mt-1 text-muted small">
                                    {lang === 'ar' ? 'تم إبداء رأي إيجابي حول ملفكم. سيتم تسليم الرخصة قريباً.' : 'Votre dossier a reçu un avis favorable. Le permis officiel sera bientôt délivré.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {d.commentaire_agent && (
                            <div className="col-12">
                              <div className="text-muted small text-uppercase fw-bold mb-1">{lang === 'ar' ? 'تعليق العون' : 'Commentaire de l\'agent'}</div>
                              <div className="p-3 rounded-3 border" style={{ background: '#fff', fontSize: '.88rem' }}>
                                <i className={`fas fa-comment-dots ${lang === 'ar' ? 'ms-2' : 'me-2'} text-primary`}></i>{d.commentaire_agent}
                              </div>
                            </div>
                          )}

                          <div className="col-12">
                            {d.status === 'pending' && !d.is_paid && !user?.has_active_asd && (
                              <div className="p-3 mt-2 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3"
                                style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="text-warning" style={{ fontSize: '1.5rem' }}>
                                    <i className="fas fa-file-invoice-dollar"></i>
                                  </div>
                                  <div>
                                    <strong className="d-block">{lang === 'ar' ? 'يجب دفع معلوم دراسة الملف' : 'Frais de dossier requis'}</strong>
                                    <span className="text-muted small">{lang === 'ar' ? 'الرجاء دفع 50.000 د.ت لمعالجة الطلب.' : 'Veuillez régler 50.000 DT pour le traitement du dossier.'}</span>
                                  </div>
                                </div>
                                <button 
                                  className="btn btn-primary rounded-pill px-4 animate__animated animate__pulse animate__infinite"
                                  onClick={() => navigate(`/paiement?amount=50.000&reason=${encodeURIComponent(d.type_travaux_display)}&requestId=${d.id}&requestType=construction&target=/mes-constructions`)}
                                >
                                  <i className={`fas fa-credit-card ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
                                  {lang === 'ar' ? 'دفع 50.000 د.ت' : 'Payer 50.000 DT'}
                                </button>
                              </div>
                            )}

                            {d.permis_signe ? (
                              <a href={resolveBackendUrl(d.permis_signe)} target="_blank" rel="noopener noreferrer"
                                className="btn btn-success rounded-pill px-4 shadow-sm mt-3">
                                <i className={`fas fa-file-contract ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'تحميل الرخصة' : 'Télécharger le permis'}
                              </a>
                            ) : d.status === 'permis_delivre' ? (
                              <div className="mt-3 text-muted small">
                                <i className={`fas fa-hourglass-half ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{lang === 'ar' ? 'وثيقة في طور الإعداد...' : 'Document en cours de préparation...'}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
