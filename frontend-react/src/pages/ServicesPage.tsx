import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

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
  | { kind: 'declare_birth'; label: string; target: '/declaration-naissance' | '/demande-mariage' }
  | { kind: 'declare_death'; label: string; target: '/declaration-deces' }
  | { kind: 'disabled'; label: string }

export default function ServicesPage() {
  const { t, setLang, lang } = useI18n()
  const navigate = useNavigate()

  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)

  // Bootstrap modal uses DOM; keep minimal refs.

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
    const timeText =
      svc.processing_time ||
      (lang === 'ar' ? 'غير محدد' : 'Non spécifié')

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
    } else {
      requestButton = {
        kind: 'disabled',
        label: lang === 'ar' ? 'طلب عن بعد (قريبا)' : 'Demander en ligne (Bientôt)',
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
    if (window.bootstrap?.Modal && modalEl) {
      const instance = window.bootstrap.Modal.getOrCreateInstance(modalEl)
      instance.show()
    }
  }

  return (
    <div className="bg-light">
      <style>{`
        .service-card { transition: transform 0.2s; cursor: pointer; }
        .service-card:hover { transform: translateY(-5px); }
        .category-header { border-left: 5px solid #0d6efd; padding-left: 15px; margin-bottom: 25px; }
        [dir="rtl"] .category-header { border-left: none; border-right: 5px solid #0d6efd; padding-left: 0; padding-right: 15px; }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <a className="navbar-brand" href="#" data-i18n="home">
            <i className="fas fa-city me-2" />
            Kelibia Smart City
          </a>

          <div className="d-flex align-items-center">
            <div className="btn-group me-3" role="group">
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('fr')}
                title="Français"
              >
                <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('ar')}
                title="العربية"
              >
                <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
              </button>
            </div>

            <Link to="/dashboard" className="btn btn-outline-light btn-sm me-2">
              Tableau de bord
            </Link>
            <button className="btn btn-light btn-sm" onClick={logout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5 mb-5">
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold" data-i18n="admin_services">
              {t('admin_services')}
            </h2>
            <p className="text-muted">{t('services_desc_long')}</p>
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
            <p className="text-center text-muted">{lang === 'ar' ? 'لا توجد خدمات متاحة حالياً.' : 'Aucun service disponible pour le moment.'}</p>
          ) : (
            allCategories.map((cat) => {
              const catName = lang === 'ar' ? cat.name_ar : cat.name_fr
              return (
                <div key={cat.id} className="category-section mb-5">
                  <div className="category-header">
                    <h3 className="fw-bold">
                      <i className={`fas ${cat.icon || 'fa-folder-open'} me-2`} />
                      {catName}
                    </h3>
                  </div>
                  <div className="row g-4">
                    {cat.services
                      .filter((s) => {
                        const nameFr = s.name_fr.toLowerCase()
                        const nameAr = s.name_ar
                        return (
                          !nameFr.includes('extrait') &&
                          !nameAr.includes('مضمون') &&
                          !nameFr.includes('résidence') &&
                          !nameAr.includes('مسكن')
                        )
                      })
                      .map((service) => {
                        const svcName = lang === 'ar' ? service.name_ar : service.name_fr
                        const svcDesc =
                          lang === 'ar' ? service.description_ar : service.description_fr
                        return (
                          <div key={service.id} className="col-md-4">
                            <div
                              className="card h-100 service-card border-0 shadow-sm"
                              role="button"
                              tabIndex={0}
                              onClick={() => showModalById(cat.id, service.id)}
                            >
                              <div className="card-body">
                                <h5 className="card-title fw-bold">{svcName}</h5>
                                <p
                                  className="card-text small text-muted text-truncate"
                                  style={{ maxHeight: '3rem' }}
                                >
                                  {svcDesc}
                                </p>
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                  <span className="badge bg-light text-primary border">
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
                </div>
              )
            })
          )}
        </div>
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
                className={`btn ${modalState?.requestButton.kind === 'disabled' ? 'btn-primary disabled' : 'btn-primary'}`}
                onClick={() => {
                  if (!modalState) return
                  if (modalState.requestButton.kind === 'disabled') return

                  // Hide modal before navigating to avoid persistent backdrop
                  const modalEl = document.getElementById('serviceModal')
                  const bootstrap = (window as any).bootstrap
                  if (bootstrap?.Modal && modalEl) {
                    const instance = bootstrap.Modal.getInstance(modalEl)
                    if (instance) instance.hide()
                  }

                  // Cleanup backdrop and body classes manually to be safe in React
                  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
                  document.body.classList.remove('modal-open')
                  document.body.style.overflow = ''
                  document.body.style.paddingRight = ''

                  navigate(modalState.requestButton.target)
                }}
              >
                <i className="fas fa-paper-plane me-2" />
                <span>
                  {modalState?.requestButton.kind === 'disabled'
                    ? modalState?.requestButton.label
                    : modalState?.requestButton.label}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

