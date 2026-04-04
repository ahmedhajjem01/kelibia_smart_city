import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

type ServiceRequirement = {
  id?: number
  name_fr: string
  name_ar: string
}

type Service = {
  id: number
  name_fr: string
  name_ar: string
  description_fr: string
  description_ar: string
  processing_time?: string | null
  requirements: ServiceRequirement[]
  form_pdf_fr?: string | null
  form_pdf_ar?: string | null
  availability?: {
    is_available: boolean
    reason_fr: string
    reason_ar: string
  }
}

type ServiceCategory = {
  id: number
  name_fr: string
  name_ar: string
  icon?: string | null
  services: Service[]
}

type RequestButtonState =
  | { kind: 'extract_now'; label: string; target: '/mes-extraits' | '/mes-mariages' | '/mes-deces' }
  | { kind: 'declare_birth'; label: string; target: '/declaration-naissance' | '/demande-mariage' | '/demande-livret-famille' | '/demande-evenement' | '/demande-construction' | '/demande-goudronnage' | '/demande-certificat-vocation' }
  | { kind: 'declare_death'; label: string; target: '/declaration-deces' | '/demande-inhumation' }
  | { kind: 'disabled'; label: string }

export default function ServicesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  // Track which category accordion is open (by id, null = all closed)
  const [openCatId, setOpenCatId] = useState<number | null>(null)

  const [modalState, setModalState] = useState<{
    title: string
    description: string
    requirements: { ar: string; fr: string }[]
    timeText: string
    requestButton: RequestButtonState
  } | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    setLoading(true)
    setErrorText(null)

    ;(async () => {
      try {
        // Fetch user for TopNav
        const uRes = await fetch('/api/accounts/me/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (uRes.ok) setUser(await uRes.json())

        const response = await fetch('/api/services/categories/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        const data = (await response.json()) as ServiceCategory[]
        if (!response.ok) throw new Error('bad response')
        setAllCategories(data)
      } catch (e) {
        console.error(e)
        setErrorText(
          'Erreur lors de la récupération des services. Veuillez réessayer plus tard.'
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate, lang])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  function showModalById(catId: number, svcId: number) {
    const cat = allCategories.find((c) => c.id === catId)
    if (!cat) return
    const svc = cat.services.find((s) => s.id === svcId)
    if (!svc) return

    const svcName = lang === 'ar' ? svc.name_ar : svc.name_fr
    const svcDesc = lang === 'ar' ? svc.description_ar : svc.description_fr
    let timeText = svc.processing_time || (lang === 'ar' ? 'غير محدد' : 'Non spécifié')
    if (svc.processing_time) {
      if (/[\u0600-\u06FF]/.test(svc.processing_time)) {
        if (lang === 'ar') {
          const match = svc.processing_time.match(/\(([\u0600-\u06FF\s]+.*?)\)$/)
          if (match) timeText = match[1]
        } else {
          timeText = svc.processing_time.replace(/\([\u0600-\u06FF\s]+.*?\)$/g, '').trim()
        }
      }
    }

    const reqs = svc.requirements.map((r) => ({ ar: r.name_ar, fr: r.name_fr }))

    // Determine request target based on service name
    const nameLower = svc.name_fr.toLowerCase().trim()
    const nameAr = svc.name_ar.trim()

    const isBirthReg =
      nameLower.includes('naissance') ||
      nameAr.includes('ولادة') ||
      nameAr.includes('ترسيم')

    let requestButton: RequestButtonState = { kind: 'disabled', label: t('request_online') }

    if (nameLower === 'extrait de naissance' || nameAr === 'مضمون ولادة') {
      requestButton = {
        kind: 'extract_now',
        label: lang === 'ar' ? 'استخراج فوري ⚡' : 'Extraction Immédiate ⚡',
        target: '/mes-extraits',
      }
    } else if (isBirthReg) {
      requestButton = {
        kind: 'declare_birth',
        label: lang === 'ar' ? 'طلب عن بعد' : 'Demander en ligne',
        target: '/declaration-naissance',
      }
    } else if (
      nameLower === 'extrait de mariage' ||
      nameAr === 'مضمون من رسم زواج' ||
      nameAr === 'مضمون زواج'
    ) {
      requestButton = {
        kind: 'extract_now',
        label: lang === 'ar' ? 'استخراج فوري ⚡' : 'Extraction Immédiate ⚡',
        target: '/mes-mariages',
      }
    } else if (nameLower === 'extrait de décès' || nameAr === 'مضمون وفاة') {
      requestButton = {
        kind: 'extract_now',
        label: lang === 'ar' ? 'استخراج فوري ⚡' : 'Extraction Immédiate ⚡',
        target: '/mes-deces',
      }
    } else if (nameLower.includes('déclaration de décès') || nameAr === 'تصريح بوفاة') {
      requestButton = {
        kind: 'declare_death',
        label: t('declare_death'),
        target: '/declaration-deces',
      }
    } else if (nameLower.includes('mariage') || nameAr.includes('زواج')) {
        requestButton = {
          kind: 'declare_birth',
          label: t('request_online'),
          target: '/demande-mariage',
        }
      } else if (nameLower.includes('inhumation') || nameAr.includes('دفن')) {
        requestButton = {
          kind: 'declare_death',
          label: lang === 'ar' ? 'طلب رخصة دفن' : 'Demander rdv Inhumation',
          target: '/demande-inhumation',
        }
      } else if (nameLower.includes('livret') || nameAr.includes('الدفتر')) {
        requestButton = {
          kind: 'declare_birth',
          label: lang === 'ar' ? 'طلب عن بعد' : 'Demander en ligne',
          target: '/demande-livret-famille',
        }
      } else if (
        nameLower.includes('fête') || nameLower.includes('fete') || nameLower.includes('événement') ||
        nameLower.includes('evenement') || nameLower.includes('concert') || nameLower.includes('association') ||
        nameLower.includes('manifestation') || nameLower.includes('rassemblement') ||
        nameAr.includes('حفل') || nameAr.includes('تظاهرة') || nameAr.includes('مهرجان') || nameAr.includes('تجمع')
      ) {
        requestButton = {
          kind: 'declare_birth',
          label: lang === 'ar' ? 'طلب ترخيص' : 'Demander une autorisation',
          target: '/demande-evenement',
        }
      } else if (nameLower.includes('goudronnage') || nameAr.includes('تعبيد') || nameAr.includes('رصف الطريق')) {
        requestButton = {
          kind: 'declare_birth',
          label: lang === 'ar' ? 'تقديم طلب' : 'Demander en ligne',
          target: '/demande-goudronnage',
        }
      } else if (nameLower.includes('vocation') || nameAr.includes('صبغة عقار') || nameAr.includes('صبغة')) {
        requestButton = {
          kind: 'declare_birth',
          label: lang === 'ar' ? 'تقديم طلب' : 'Demander en ligne',
          target: '/demande-certificat-vocation',
        }
      } else if (
        nameLower.includes('construire') || nameLower.includes('construction') ||
        nameLower.includes('permis') || nameLower.includes('rénovation') ||
        nameLower.includes('renovation') || nameLower.includes('extension') ||
        nameLower.includes('bâtiment') || nameLower.includes('batiment') ||
        nameLower.includes('immobilier') || nameLower.includes('terrain') ||
        nameAr.includes('بناء') || nameAr.includes('ترخيص بناء') || nameAr.includes('تعمير')
      ) {
        requestButton = {
          kind: 'declare_birth',
          label: lang === 'ar' ? 'تقديم طلب' : 'Demander en ligne',
          target: '/demande-construction',
        }
      } else {
      requestButton = {
        kind: 'disabled',
        label: lang === 'ar' ? 'طلب عن بعد (قريبا)' : 'Demander en ligne (Bientôt)',
      }
    }

    const availability = svc.availability || { is_available: true, reason_fr: '', reason_ar: '' }
    if (!availability.is_available) {
      requestButton = {
        kind: 'disabled',
        label: lang === 'ar' ? availability.reason_ar : availability.reason_fr,
      }
    }

    setModalState({
      title: svcName,
      description: svcDesc,
      requirements: reqs,
      timeText,
      requestButton,
    })

    // Show modal
    const modalEl = document.getElementById('serviceModal')
    if ((window as any).bootstrap?.Modal && modalEl) {
      const instance = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl)
      instance.show()
    }
  }

  return (
    <MainLayout
      user={user}
      onLogout={logout}
      breadcrumbs={[{ label: t('admin_services') }]}
    >
      <div className="row mb-4">
        <div className="col">
          <h2 className="fw-bold section-title">{t('admin_services')}</h2>
          <p className="text-muted small">{t('services_desc_long')}</p>
        </div>
      </div>

      <div id="servicesContainer">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">{t('loading_services')}</p>
          </div>
        ) : errorText ? (
          <div className="alert alert-danger">{errorText}</div>
        ) : allCategories.length === 0 ? (
          <p className="text-center text-muted">
            {lang === 'ar' ? 'لا توجد خدمات متاحة حالياً.' : 'Aucun service disponible pour le moment.'}
          </p>
        ) : (
          <div className="d-flex flex-column gap-2 mb-4">
            {allCategories
              .filter((cat) => !cat.name_fr.toLowerCase().includes('problèmes') && !cat.name_fr.toLowerCase().includes('signalements'))
              .map((cat) => {
                const catName = lang === 'ar' ? cat.name_ar : cat.name_fr
                const isOpen = openCatId === cat.id
                const visibleServices = cat.services.filter((s) => {
                  const nameFr = s.name_fr.toLowerCase()
                  const nameAr = s.name_ar
                  return (
                    !nameFr.includes('extrait') &&
                    !nameAr.includes('مضمون') &&
                    !nameFr.includes('résidence') &&
                    !nameAr.includes('مسكن')
                  )
                })
                return (
                  <div key={cat.id} className="border rounded-4 overflow-hidden shadow-sm"
                    style={{ transition: 'all .2s' }}>
                    {/* ── Accordion header (clickable) ── */}
                    <button
                      className="w-100 d-flex align-items-center justify-content-between px-4 py-3 border-0 text-start"
                      style={{
                        background: isOpen ? 'linear-gradient(135deg,#1a3a5c 0%,#1565c0 100%)' : '#fff',
                        color: isOpen ? '#fff' : '#1a1a2e',
                        cursor: 'pointer',
                        transition: 'all .25s',
                      }}
                      onClick={() => setOpenCatId(isOpen ? null : cat.id)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: 40, height: 40,
                            background: isOpen ? 'rgba(255,255,255,.2)' : '#e3f2fd',
                            color: isOpen ? '#fff' : '#1565c0',
                            fontSize: '1.1rem',
                          }}>
                          <i className={`fas ${cat.icon || 'fa-folder-open'}`} />
                        </div>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '1rem' }}>{catName}</div>
                          <div style={{ fontSize: '.78rem', opacity: .75 }}>
                            {visibleServices.length} {lang === 'ar' ? 'خدمة' : 'service(s)'}
                          </div>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
                        style={{ fontSize: '.85rem', opacity: .7 }} />
                    </button>

                    {/* ── Accordion body (services grid) ── */}
                    {isOpen && (
                      <div className="p-4" style={{ background: '#f8faff', borderTop: '1px solid #e3f2fd' }}>
                        {visibleServices.length === 0 ? (
                          <p className="text-muted small mb-0">
                            {lang === 'ar' ? 'لا توجد خدمات متاحة.' : 'Aucun service disponible.'}
                          </p>
                        ) : (
                          <div className="row g-3">
                            {visibleServices.map((service) => {
                              const svcName = lang === 'ar' ? service.name_ar : service.name_fr
                              const svcDesc = lang === 'ar' ? service.description_ar : service.description_fr
                              return (
                                <div key={service.id} className="col-md-4">
                                  <div
                                    className="card h-100 service-card border-0 shadow-sm"
                                    role="button"
                                    tabIndex={0}
                                    style={{ cursor: 'pointer', borderRadius: '12px', transition: 'transform .15s' }}
                                    onClick={() => showModalById(cat.id, service.id)}
                                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                                  >
                                    <div className="card-body">
                                      <h6 className="card-title fw-bold" style={{ fontSize: '.9rem' }}>{svcName}</h6>
                                      <p className="card-text small text-muted" style={{ maxHeight: '3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {svcDesc}
                                      </p>
                                      <div className="d-flex justify-content-between align-items-center mt-3">
                                        <span className="badge bg-light text-primary border" style={{ fontSize: '0.7rem' }}>
                                          {service.requirements.length} documents
                                        </span>
                                        <i className="fas fa-chevron-right text-primary opacity-50" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            }
          </div>
        )}

        {/* MUNICIPAL PAYMENTS SIMULATION (FOR PFE) */}

        {!loading && (
          <div className="category-section mb-5 animate__animated animate__fadeInUp">
            <div className="category-header border-bottom pb-2 mb-4 d-flex align-items-center">
              <div className="bg-warning text-white rounded-circle p-2 me-3 shadow-sm" style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-money-bill-wave fs-5"></i>
              </div>
              <h4 className="fw-bold mb-0">
                {lang === 'ar' ? 'الأداء والجباية المحلية' : 'Paiements et Taxes Locales'}
                <span className="badge bg-danger ms-3 rounded-pill" style={{ fontSize: '0.6rem' }}>SIMULATION PFE</span>
              </h4>
            </div>
            
            <div className="row g-4 text-start">
              {[
                { 
                  id: 'taxe1', 
                  title: lang === 'ar' ? 'معلوم على العقارات المبنية' : 'Taxe d\'habitation (TIB)', 
                  desc: lang === 'ar' ? 'دفع المعاليم السنوية للعقارات السكنية ببلدية قليبية.' : 'Paiement des taxes annuelles pour les locaux résidentiels à Kélibia.',
                  icon: 'fa-home',
                  amount: '125.000',
                  reason: 'Taxe Habitation 2024'
                },
                { 
                  id: 'fine1', 
                  title: lang === 'ar' ? 'الخطايا المرورية' : 'Amendes de Stationnement', 
                  desc: lang === 'ar' ? 'تسوية مخالفات المرور والوقوف المحررة بالمجال البلدي.' : 'Règlement des amendes de circulation constatées sur la zone municipale.',
                  icon: 'fa-car',
                  amount: '20.000',
                  reason: 'Amande Stationnement'
                },
                { 
                  id: 'service1', 
                  title: lang === 'ar' ? 'خلاص معلوم الخدمات' : 'Paiement Services Admin', 
                  desc: lang === 'ar' ? 'دفع معلوم استخراج الوثائق الإدارية عن بعد.' : 'Paiement des frais pour l\'obtention de documents administratifs.',
                  icon: 'fa-file-invoice',
                  amount: '2.000',
                  reason: 'Frais de Service'
                }
              ].map(pay => (
                <div key={pay.id} className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm transition-hover" style={{ borderRadius: '15px' }}>
                    <div className="card-body p-4">
                      <div className={`mb-3 text-primary bg-light rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '50px', height: '50px' }}>
                        <i className={`fas ${pay.icon} fs-4`}></i>
                      </div>
                      <h5 className="fw-bold mb-2">{pay.title}</h5>
                      <p className="small text-muted mb-4">{pay.desc}</p>
                      <button 
                        className="btn btn-primary w-100 rounded-pill fw-bold"
                        onClick={() => navigate(`/paiement?amount=${pay.amount}&reason=${encodeURIComponent(pay.reason)}&ref=PAY-${Math.floor(Math.random()*9000)}`)}
                      >
                        {lang === 'ar' ? 'دفع الآن 💳' : 'Payer Maintenant 💳'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Modal for service details */}
      <div className="modal fade" id="serviceModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title" id="modalTitle">
                {modalState?.title ?? t('details_title')}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" />
            </div>

            <div className="modal-body p-4">
              <div id="modalDescription" className="mb-4 text-muted">
                {modalState?.description ?? ''}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-file-alt me-2 text-primary" />
                    <span>{t('documents_required')}</span>
                  </h6>
                  <ul className="list-group list-group-flush mb-4" id="modalRequirements">
                    {modalState?.requirements?.length
                      ? modalState.requirements.map((r, idx) => (
                          <li
                            key={idx}
                            className="list-group-item bg-transparent d-flex justify-content-between align-items-center p-3"
                          >
                            <span>{lang === 'ar' ? r.ar : r.fr}</span>
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
                <div className="col-md-1" />
                <div className="col-md-5">
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <h6 className="fw-bold mb-2">
                        <i className="fas fa-clock me-2 text-info" />
                        <span>{t('estimated_time')}</span>
                      </h6>
                      <p className="mb-0">{modalState?.timeText ?? ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                {t('close')}
              </button>

              <button
                type="button"
                id="modalRequestBtn"
                className={`btn ${
                  modalState?.requestButton.kind === 'disabled' ? 'btn-primary disabled' : 'btn-primary'
                }`}
                onClick={() => {
                  if (!modalState) return
                  if (modalState.requestButton.kind === 'disabled') return

                  const modalEl = document.getElementById('serviceModal')
                  const bootstrap = (window as any).bootstrap
                  if (bootstrap?.Modal && modalEl) {
                    const instance = bootstrap.Modal.getInstance(modalEl)
                    if (instance) instance.hide()
                  }
                  navigate((modalState.requestButton as any).target)
                }}
              >
                <i className="fas fa-paper-plane me-2" />
                <span>{modalState?.requestButton.label}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

