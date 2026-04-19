import { resolveBackendUrl } from '../lib/backendUrl'
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

  | { kind: 'declare_birth'; label: string; target: '/declaration-naissance' | '/demande-mariage' | '/demande-livret-famille' | '/demande-evenement' | '/demande-evenement-public' | '/demande-evenement-prive' | '/demande-construction' | '/demande-goudronnage' | '/demande-certificat-vocation' }

  | { kind: 'declare_death'; label: string; target: '/declaration-deces' | '/demande-inhumation' }

  | { kind: 'disabled'; label: string }



export default function ServicesPage() {

  const { t, lang } = useI18n()

  const navigate = useNavigate()



  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([])

  const [loading, setLoading] = useState(true)

  const [errorText, setErrorText] = useState<string | null>(null)

  const [user, setUser] = useState<{ 

    first_name: string; 

    last_name: string; 

    email: string; 

    is_verified: boolean;

    has_active_asd: boolean;

    asd_expiration: string | null;

  } | null>(null)

  

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

        // Fetch user profile and services in parallel for speed

        const [uRes, svcRes] = await Promise.all([

          fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } }),

          fetch(resolveBackendUrl('/api/services/categories/'), { headers: { Authorization: `Bearer ${access}` } }),

        ])



        // User profile — optional, don't fail if it errors

        if (uRes.ok) {

          try { setUser(await uRes.json()) } catch { /* ignore parse errors */ }

        }



        // Services — if token expired (401), retry without auth (it's a public endpoint)

        let finalSvcRes = svcRes

        if (svcRes.status === 401) {

          finalSvcRes = await fetch(resolveBackendUrl('/api/services/categories/'))

        }

        if (!finalSvcRes.ok) throw new Error(`Services returned ${finalSvcRes.status}`)

        const data = (await finalSvcRes.json()) as ServiceCategory[]

        if (!Array.isArray(data)) throw new Error('Unexpected response format')

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

    

    const reqs = svc.requirements.map((r) => ({ ar: r.name_ar, fr: r.name_fr }))



    const nameLower = svc.name_fr.toLowerCase().trim()

    const nameAr = svc.name_ar.trim()

    const isBirthReg = nameLower.includes('naissance') || nameAr.includes('ولادة')



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

    } else if (nameLower === 'extrait de mariage' || nameAr.includes('مضمون زواج')) {

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

    } else if (nameLower === 'événement public' || nameAr === 'فعالية عمومية') {

      requestButton = {

        kind: 'declare_birth',

        label: lang === 'ar' ? 'تقديم طلب' : 'Demander une autorisation',

        target: '/demande-evenement-public',

      }

    } else if (nameLower === 'événement privé' || nameAr === 'فعالية خاصة') {

      requestButton = {

        kind: 'declare_birth',

        label: lang === 'ar' ? 'تقديم طلب' : 'Faire une déclaration',

        target: '/demande-evenement-prive',

      }

    } else if (nameLower.includes('goudronnage') || nameAr.includes('تعبيد') || nameAr.includes('رصف')) {

      requestButton = {

        kind: 'declare_birth',

        label: lang === 'ar' ? 'تقديم طلب' : 'Demander en ligne',

        target: '/demande-goudronnage',

      }

    } else if (nameLower.includes('vocation') || nameAr.includes('صبغة') || nameAr.includes('وجهة')) {

      requestButton = {

        kind: 'declare_birth',

        label: lang === 'ar' ? 'تقديم طلب' : 'Demander en ligne',

        target: '/demande-certificat-vocation',

      }

    } else if (nameLower.includes('construction') || nameLower.includes('construire') || nameAr.includes('بناء') || nameAr.includes('ترخيص بناء')) {

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



      <div id="servicesContainer" style={{ minHeight: '600px' }}>

        {loading ? (

          <div className="py-4">

            <div className="skeleton-box services-skeleton" style={{ height: '400px' }}></div>

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

                const visibleServices = cat.services.filter(s => {

                  const nf = s.name_fr.toLowerCase()

                  const na = s.name_ar

                  return !nf.includes('extrait') && !na.includes('مضمون') && !nf.includes('résidence')

                })

                return (

                  <div key={cat.id} className="border rounded-4 overflow-hidden shadow-sm mb-2">

                    <button

                      className="w-100 d-flex align-items-center justify-content-between px-4 py-3 border-0 text-start"

                      style={{

                        background: isOpen ? 'linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%)' : '#fff',

                        color: isOpen ? '#fff' : '#1a1a2e',

                        cursor: 'pointer',

                        transition: 'all .25s',

                      }}

                      onClick={() => setOpenCatId(isOpen ? null : cat.id)}

                    >

                      <div className="d-flex align-items-center gap-3">

                        <div className="rounded-3 d-flex align-items-center justify-content-center"

                          style={{ width: 40, height: 40, background: isOpen ? 'rgba(255,255,255,.2)' : 'rgba(212,170,141,.1)', color: isOpen ? '#fff' : '#d4aa8d' }}>

                          <i className={`fas ${cat.icon || 'fa-folder-open'}`} />

                        </div>

                        <div>

                          <div className="fw-bold">{catName}</div>

                          <div style={{ fontSize: '.78rem', opacity: .75 }}>{visibleServices.length} {lang === 'ar' ? 'خدمة' : 'service(s)'}</div>

                        </div>

                      </div>

                      <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} />

                    </button>

                    {isOpen && (

                      <div className="p-4" style={{ background: '#f8faff', borderTop: '1px solid #E6F4F7' }}>

                        <div className="row g-3">

                          {visibleServices.map(service => (

                            <div key={service.id} className="col-md-4">

                              <div className="card h-100 service-card border-0 shadow-sm" role="button" onClick={() => showModalById(cat.id, service.id)} style={{ cursor: 'pointer', borderRadius: '12px' }}>

                                <div className="card-body">

                                  <h6 className="fw-bold">{lang === 'ar' ? service.name_ar : service.name_fr}</h6>

                                  <p className="small text-muted mb-0">{lang === 'ar' ? service.description_ar : service.description_fr}</p>

                                </div>

                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    )}

                  </div>

                )

              })}

          </div>

        )}



        {!loading && (

          <div className="category-section mb-5 mt-5">

            <h4 className="fw-bold border-bottom pb-2 mb-4">

              {lang === 'ar' ? 'الأداء والجباية المحلية' : 'Paiements et Taxes Locales'}

              <span className="badge bg-danger ms-2 small" style={{ fontSize: '0.6rem' }}>SIMULATION PFE</span>

            </h4>

            <div className="row g-4">

              {[

                { id: 't1', title: lang === 'ar' ? 'معلوم على العقارات' : 'Taxe Habitation', amount: '125.000', icon: 'fa-home' },


                { id: 't3', title: lang === 'ar' ? 'معلوم الخدمات' : 'Frais Services', amount: '2.000', icon: 'fa-file-invoice' }

              ].map(pay => (

                <div key={pay.id} className="col-md-4">

                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '15px' }}>

                    <div className="card-body p-4 text-center">

                      <i className={`fas ${pay.icon} fs-1 mb-3`} style={{ color: '#d4aa8d' }}></i>

                      <h5 className="fw-bold">{pay.title}</h5>

                      <h4 className="fw-bold mb-3" style={{ color: '#d4aa8d' }}>{pay.amount} DT</h4>

                      <button className="w-100 rounded-pill border-0 py-2 fw-bold" style={{ background: 'linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%)', color: '#fff', cursor: 'pointer' }} onClick={() => navigate(`/paiement?amount=${pay.amount}`)}>

                        {lang === 'ar' ? 'دفع الآن' : 'Payer'}

                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>



      <div className="modal fade" id="serviceModal" tabIndex={-1}>

        <div className="modal-dialog modal-lg">

          <div className="modal-content border-0 shadow">

            <div className="modal-header bg-primary text-white">

              <h5 className="modal-title">{modalState?.title ?? t('details_title')}</h5>

              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" />

            </div>

            <div className="modal-body p-4">

              <p className="text-muted">{modalState?.description}</p>

              <h6 className="fw-bold mt-4 mb-3">{t('documents_required')}</h6>

              <ul className="list-group list-group-flush">

                {modalState?.requirements.map((r, i) => (

                  <li key={i} className="list-group-item bg-transparent">{lang === 'ar' ? r.ar : r.fr}</li>

                ))}

              </ul>

              <div className="mt-4 p-3 bg-light rounded">

                <h6 className="fw-bold small mb-1">{t('estimated_time')}</h6>

                <p className="mb-0">{modalState?.timeText}</p>

              </div>



              {user && !user.is_verified && (

                <div className="alert alert-warning border-0 shadow-sm mt-4 p-3 d-flex align-items-center">

                  <i className="fas fa-exclamation-triangle me-3 text-warning"></i>

                  <div className="small">

                    <div className="fw-bold">{t('unverified_title') || 'Compte non vérifié'}</div>

                    <div>{t('account_verification_required') || 'La vérification de votre compte est requise pour effectuer cette demande en ligne.'}</div>

                  </div>

                </div>

              )}

            </div>

            <div className="modal-footer border-0">

              <button type="button" className="btn btn-light" data-bs-dismiss="modal">{t('close')}</button>

              <button

                type="button"

                className={`btn btn-primary ${modalState?.requestButton.kind === 'disabled' || !user?.is_verified ? 'disabled' : ''}`}

                onClick={() => {

                  if (!modalState || modalState.requestButton.kind === 'disabled') return

                  

                  if (modalState.requestButton.kind === 'extract_now') {

                    if (!user?.is_verified) { 

                      alert(t('account_unverified_msg'))

                      return 

                    }

                    

                    if (!user?.has_active_asd) {

                      if (window.confirm(t('pay_per_act_msg'))) {

                        const target = modalState.requestButton.target

                        const svcName = modalState.title

                        const url = `/paiement?amount=2.000&reason=${encodeURIComponent(svcName)}&target=${encodeURIComponent(target)}`

                        

                        // Close modal

                        const modalEl = document.getElementById('serviceModal')

                        if (modalEl) {

                          const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl)

                          if (inst) inst.hide()

                        }

                        navigate(url)

                        return

                      } else {

                        return

                      }

                    }

                  }



                  const modalEl = document.getElementById('serviceModal')

                  if (modalEl) {

                    const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl)

                    if (inst) inst.hide()

                  }

                  navigate(modalState.requestButton.target as string)

                }}

              >

                {modalState?.requestButton.label}

              </button>

            </div>

          </div>

        </div>

      </div>

      

      <style>{`

        .skeleton-box { background: #eee; background-image: linear-gradient(90deg, #eee 0px, #f5f5f5 40px, #eee 80px); background-size: 200% 100%; animation: shimmer 1.5s infinite linear; border-radius: 8px; }

        @keyframes shimmer { 0% { background-position: -100% 0; } 100% { background-position: 100% 0; } }

      `}</style>

    </MainLayout>

  )

}

