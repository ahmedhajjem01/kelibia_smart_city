import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type Extrait = {
  id: number
  n_etat_civil: string | number

  nom_complet_fr: string
  nom_complet_ar: string
  date_naissance: string
  url_fr: string
  url_ar: string
  is_paid: boolean
}

type Declaration = {
  id: number
  prenom_fr: string
  prenom_ar: string
  nom_fr: string
  nom_ar: string
  date_naissance: string
  lieu_naissance_fr: string
  lieu_naissance_ar: string
  status: 'pending' | 'validated' | 'rejected'
  created_at: string
}

type DemandeExtrait = {
  id: number
  prenom_fr: string
  nom_fr: string
  prenom_ar: string
  nom_ar: string
  cin_declarant: string
  status: 'pending' | 'processed' | 'rejected'
  note_agent: string
  created_at: string
}

type MesExtraitsResponse = {
  mon_extrait?: Extrait | null
  conjoints?: Extrait[]
  enfants?: Extrait[]
}

const INIT_FORM = { prenom_fr: '', nom_fr: '', prenom_ar: '', nom_ar: '', cin_declarant: '' }

export default function MesNaissancesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<MesExtraitsResponse | null>(null)
  const [declarations, setDeclarations] = useState<Declaration[]>([])
  const [demandesExtrait, setDemandesExtrait] = useState<DemandeExtrait[]>([])
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean; has_active_asd: boolean } | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INIT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)

  const fetchAll = async () => {
    const token = getAccessToken()
    if (!token) { navigate('/login'); return }

    setLoading(true)
    setError(null)

    try {
      const [userRes, extraitsRes, declRes, demandeRes] = await Promise.all([
        fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(resolveBackendUrl('/extrait-naissance/api/mes-extraits/'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(resolveBackendUrl('/extrait-naissance/api/declaration/'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(resolveBackendUrl('/extrait-naissance/api/demande-extrait/'), { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (userRes.ok) setUser(await userRes.json())

      if (!extraitsRes.ok) {
        const errorData = (await extraitsRes.json().catch(() => null)) as { error?: string } | null
        throw new Error(errorData?.error || 'Impossible de trouver vos actes de naissance.')
      }
      setData(await extraitsRes.json())

      if (declRes.ok) {
        const declJson = await declRes.json()
        setDeclarations(Array.isArray(declJson) ? declJson : (declJson.results || []))
      }

      if (demandeRes.ok) {
        const demandeJson = await demandeRes.json()
        setDemandesExtrait(Array.isArray(demandeJson) ? demandeJson : (demandeJson.results || []))
      }
    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Erreur de connexion avec la base de données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [navigate, lang])

  function logout() { clearTokens(); navigate('/login') }

  async function handleSubmitDemande(e: React.FormEvent) {
    e.preventDefault()
    const token = getAccessToken()
    if (!token) return
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch(resolveBackendUrl('/extrait-naissance/api/demande-extrait/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(Object.values(err).flat().join(' ') || 'Erreur lors de l\'envoi.')
      }
      setFormSuccess(true)
      setForm(INIT_FORM)
      // Refresh demandes list
      const refreshRes = await fetch(resolveBackendUrl('/extrait-naissance/api/demande-extrait/'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (refreshRes.ok) {
        const j = await refreshRes.json()
        setDemandesExtrait(Array.isArray(j) ? j : (j.results || []))
      }
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function closeModal() {
    setShowModal(false)
    setFormError(null)
    setFormSuccess(false)
    setForm(INIT_FORM)
  }

  function card(extrait: Extrait) {
    const nomComplet = lang === 'ar' ? extrait.nom_complet_ar : extrait.nom_complet_fr
    return (
      <div className="col-md-6 col-lg-4 mb-4" key={`${extrait.n_etat_civil}`}>
        <div className="card shadow-sm h-100 border-primary" style={{ borderWidth: 2 }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <i className="fas fa-file-contract fa-2x text-primary opacity-50" />
              <span className="badge bg-primary rounded-pill">N° {extrait.n_etat_civil}</span>
            </div>
            <h5 className="card-title fw-bold">{nomComplet}</h5>
            <p className="card-text text-muted mb-4">
              <i className="fas fa-birthday-cake me-2" />
              {extrait.date_naissance}
            </p>
            <div className="d-flex gap-2">
              {(!extrait.is_paid && !user?.has_active_asd) ? (
                <button
                  className="btn btn-warning w-100 rounded-pill fw-bold animate__animated animate__pulse animate__infinite shadow-sm"
                  onClick={() => navigate(`/paiement?amount=0.500&reason=Extrait+de+Naissance&requestId=${extrait.id}&requestType=birth_extract&target=/mes-naissances&file_fr=${encodeURIComponent(resolveBackendUrl(extrait.url_fr))}&file_ar=${encodeURIComponent(resolveBackendUrl(extrait.url_ar))}`)}
                >
                  <i className="fas fa-lock me-2"></i> {t('pay_2dt') || 'Payer 0.500 DT'}
                </button>
              ) : (
                <>
                  <a href={`${resolveBackendUrl(extrait.url_fr)}?token=${getAccessToken()}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary flex-fill">
                    <i className="fas fa-print me-1" /> {lang === 'ar' ? 'الفرنسية' : 'FR'}
                  </a>
                  <a href={`${resolveBackendUrl(extrait.url_ar)}?token=${getAccessToken()}`} target="_blank" rel="noreferrer" className="btn btn-primary flex-fill arabic-font">
                    <i className="fas fa-print me-1" /> {t('version_ar')}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusCfg = {
    pending:   { bg: '#fff3cd', color: '#856404', label: t('status_pending') || 'En attente',  icon: 'fas fa-clock' },
    processed: { bg: '#d1e7dd', color: '#0f5132', label: t('status_validated') || 'Traité',    icon: 'fas fa-check-circle' },
    rejected:  { bg: '#f8d7da', color: '#842029', label: t('status_rejected') || 'Rejeté',    icon: 'fas fa-times-circle' },
  }

  return (
    <MainLayout user={user} onLogout={logout} breadcrumbs={[{ label: t('birth_extracts') }]}>

      {/* ── Modal demande d'extrait ── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.45)' }} onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-file-plus text-primary me-2" />
                  {t('request_birth_extract') || 'Demander mon extrait de naissance'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body pt-2">
                {formSuccess ? (
                  <div className="alert alert-success d-flex align-items-center gap-2">
                    <i className="fas fa-check-circle fa-lg" />
                    <span>{t('request_sent_success') || 'Votre demande a été envoyée avec succès.'}</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitDemande}>
                    {formError && <div className="alert alert-danger py-2 small">{formError}</div>}
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold">{lang === 'ar' ? 'الاسم (فر)' : 'Prénom (FR)'} *</label>
                        <input className="form-control" required value={form.prenom_fr}
                          onChange={e => setForm(f => ({ ...f, prenom_fr: e.target.value }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">{lang === 'ar' ? 'اللقب (فر)' : 'Nom (FR)'} *</label>
                        <input className="form-control" required value={form.nom_fr}
                          onChange={e => setForm(f => ({ ...f, nom_fr: e.target.value }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">{lang === 'ar' ? 'الاسم (عر)' : 'Prénom (AR)'}</label>
                        <input className="form-control" dir="rtl" value={form.prenom_ar}
                          onChange={e => setForm(f => ({ ...f, prenom_ar: e.target.value }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">{lang === 'ar' ? 'اللقب (عر)' : 'Nom (AR)'}</label>
                        <input className="form-control" dir="rtl" value={form.nom_ar}
                          onChange={e => setForm(f => ({ ...f, nom_ar: e.target.value }))} />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">{lang === 'ar' ? 'رقم بطاقة التعريف الوطنية' : 'CIN (8 chiffres)'} *</label>
                        <input className="form-control" required maxLength={8} inputMode="numeric"
                          value={form.cin_declarant}
                          onInput={e => { const el = e.currentTarget; el.value = el.value.replace(/\D/g, '').slice(0, 8) }}
                          onChange={e => setForm(f => ({ ...f, cin_declarant: e.target.value }))} />
                      </div>
                    </div>
                    <div className="d-grid mt-4">
                      <button type="submit" className="btn btn-primary rounded-pill fw-bold py-2" disabled={submitting}>
                        {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-2" />}
                        {t('submit_request') || 'Soumettre la demande'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
              {formSuccess && (
                <div className="modal-footer border-0 pt-0">
                  <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={closeModal}>Fermer</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`row mb-4 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="col d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold section-title">
              <i className="fas fa-baby me-2" />
              {t('birth_extracts')}
            </h2>
            <p className="text-muted">{t('extraction_desc')}</p>
          </div>
          <Link to="/services" className="btn btn-outline-secondary">
            <i className={`fas ${lang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'} me-2`} />
            {t('back_to_services') || 'Retour aux services'}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">{t('loading_identity')}</p>
        </div>
      ) : !user?.is_verified ? (
        <div className={`alert alert-warning border-0 shadow-sm p-4 d-flex align-items-center ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ borderRadius: '15px' }}>
          <i className={`fas fa-exclamation-triangle fa-2x ${lang === 'ar' ? 'ms-3' : 'me-3'} text-warning`}></i>
          <div>
            <h5 className="fw-bold mb-1">{t('unverified_title')}</h5>
            <p className="mb-0">{t('account_verification_required')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className={lang === 'ar' ? 'font-arabic text-end' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

          {/* ── Déclarations de naissance soumises ── */}
          {declarations.length > 0 && (
            <>
              <h4 className="mb-3 border-bottom pb-2">{t('my_birth_declarations') || 'Mes Déclarations de Naissance'}</h4>
              <div className="row mb-5">
                {declarations.map(decl => {
                  const sc = {
                    pending:   { bg: '#fff3cd', color: '#856404', label: t('status_pending') || 'En attente',  icon: 'fas fa-clock' },
                    validated: { bg: '#d1e7dd', color: '#0f5132', label: t('status_validated') || 'Validée',  icon: 'fas fa-check-circle' },
                    rejected:  { bg: '#f8d7da', color: '#842029', label: t('status_rejected') || 'Rejetée',   icon: 'fas fa-times-circle' },
                  }[decl.status] || { bg: '#fff3cd', color: '#856404', label: 'En attente', icon: 'fas fa-clock' }
                  const nomComplet = lang === 'ar' ? `${decl.prenom_ar} ${decl.nom_ar}` : `${decl.prenom_fr} ${decl.nom_fr}`
                  const dateSubmitted = new Date(decl.created_at).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')
                  const dateBirth = decl.date_naissance ? new Date(decl.date_naissance).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR') : '—'
                  return (
                    <div className="col-md-6 col-lg-4 mb-4" key={decl.id}>
                      <div className="card shadow-sm h-100 border-0" style={{ borderLeft: `4px solid ${sc.color}`, borderRadius: 12 }}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge rounded-pill" style={{ background: sc.bg, color: sc.color, fontSize: '.75rem', padding: '5px 10px' }}>
                              <i className={`${sc.icon} me-1`} /> {sc.label}
                            </span>
                            <small className="text-muted">#{decl.id}</small>
                          </div>
                          <h5 className="fw-bold mb-1">{nomComplet}</h5>
                          <p className="text-muted mb-1" style={{ fontSize: '.85rem' }}><i className="fas fa-birthday-cake me-1" />{dateBirth}</p>
                          <p className="text-muted mb-0" style={{ fontSize: '.78rem' }}><i className="fas fa-map-marker-alt me-1" />{lang === 'ar' ? decl.lieu_naissance_ar : decl.lieu_naissance_fr}</p>
                          <hr className="my-2" />
                          <p className="mb-0" style={{ fontSize: '.75rem', color: '#6c757d' }}>
                            <i className="fas fa-calendar-plus me-1" />{t('submitted_on') || 'Soumis le'} {dateSubmitted}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Demandes d'extrait de naissance ── */}
          {demandesExtrait.length > 0 && (
            <>
              <h4 className="mb-3 border-bottom pb-2">{t('my_extract_requests') || "Mes demandes d'extrait"}</h4>
              <div className="row mb-5">
                {demandesExtrait.map(dem => {
                  const sc = statusCfg[dem.status] || statusCfg['pending']
                  const nomComplet = lang === 'ar' && dem.nom_ar ? `${dem.prenom_ar} ${dem.nom_ar}` : `${dem.prenom_fr} ${dem.nom_fr}`
                  const dateSubmitted = new Date(dem.created_at).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')
                  return (
                    <div className="col-md-6 col-lg-4 mb-4" key={dem.id}>
                      <div className="card shadow-sm h-100 border-0" style={{ borderLeft: `4px solid ${sc.color}`, borderRadius: 12 }}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge rounded-pill" style={{ background: sc.bg, color: sc.color, fontSize: '.75rem', padding: '5px 10px' }}>
                              <i className={`${sc.icon} me-1`} /> {sc.label}
                            </span>
                            <small className="text-muted">#{dem.id}</small>
                          </div>
                          <h5 className="fw-bold mb-1">{nomComplet}</h5>
                          <p className="text-muted mb-1" style={{ fontSize: '.85rem' }}>
                            <i className="fas fa-id-card me-1" /> CIN : {dem.cin_declarant}
                          </p>
                          <hr className="my-2" />
                          <p className="mb-0" style={{ fontSize: '.75rem', color: '#6c757d' }}>
                            <i className="fas fa-calendar-plus me-1" />{t('submitted_on') || 'Soumis le'} {dateSubmitted}
                          </p>
                          {dem.note_agent && (
                            <div className="alert alert-info py-1 px-2 mt-2 mb-0" style={{ fontSize: '.78rem' }}>
                              <i className="fas fa-comment-dots me-1" /> <strong>{t('note_agent_label') || "Note de l'agent"} :</strong> {dem.note_agent}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Mon extrait de naissance ── */}
          <h4 className="mb-3 border-bottom pb-2">{t('my_birth_extract') || 'Mon Extrait de Naissance'}</h4>
          <div className="row mb-5">
            {data?.mon_extrait ? (
              card(data.mon_extrait)
            ) : (
              <div className="col-12">
                <div className="alert alert-secondary d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3">
                  <span className="flex-grow-1">{t('no_birth_extract_found')}</span>
                  <button className="btn btn-primary btn-sm rounded-pill flex-shrink-0 fw-bold" onClick={() => setShowModal(true)}>
                    <i className="fas fa-file-plus me-2" />
                    {t('request_birth_extract') || 'Demander mon extrait'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Extraits de mes enfants ── */}
          <h4 className="mb-3 border-bottom pb-2 mt-4">{t('my_children_extracts')}</h4>
          <div className="row">
            {data?.enfants && data.enfants.length > 0 ? (
              data.enfants.map((enf) => card(enf))
            ) : (
              <div className="col-12">
                <div className="alert alert-secondary text-muted">
                  <i className="fas fa-info-circle me-2" />
                  {t('no_child_birth_extract_found')}
                </div>
              </div>
            )}
          </div>

          {data?.conjoints && data.conjoints.length > 0 ? (
            <div className="mt-4">
              <h4 className="mb-3 border-bottom pb-2">{t('my_spouse_extracts')}</h4>
              <div className="row" id="conjointsList">
                {data.conjoints.map((c) => card(c))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </MainLayout>
  )
}
