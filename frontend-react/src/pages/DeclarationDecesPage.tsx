import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

type EligibleRelative = {
  id: number
  prenom_ar: string
  nom_ar: string
  prenom_fr: string
  nom_fr: string
  cin: string | null
}

export default function DeclarationDecesPage() {
  const { t, setLang, lang } = useI18n()
  const navigate = useNavigate()

  const [eligible, setEligible] = useState<EligibleRelative[] | null>(null)
  const [noEligible, setNoEligible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    ;(async () => {
      try {
        const response = await fetch('/extrait-deces/api/declaration/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        const data = (await response.json()) as {
          eligible_relatives?: EligibleRelative[]
        }
        if (!response.ok) throw new Error('bad response')

        const rels = data.eligible_relatives || []
        setEligible(rels)
        setNoEligible(rels.length === 0)
      } catch (e) {
        console.error(e)
        setEligible([])
        setNoEligible(true)
        setFetchError('Erreur lors du chargement des membres éligibles.')
      }
    })()
  }, [navigate, lang])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const access = getAccessToken()
    if (!access) return

    if (noEligible) return

    setSubmitting(true)
    try {
      const form = e.currentTarget as HTMLFormElement
      const fd = new FormData(form)

      const response = await fetch('/extrait-deces/api/declaration/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: fd,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert((err && err.detail) || t('error_msg'))
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert(t('error_msg'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <Link to="/dashboard" className="navbar-brand">
            <i className="fas fa-city me-2" />
            Kelibia Smart City
          </Link>

          <div className="d-flex align-items-center">
            <div className="btn-group me-3" role="group">
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('fr')}
              >
                FR
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('ar')}
              >
                AR
              </button>
            </div>
            <Link to="/services" className="btn btn-outline-light btn-sm me-2">
              {t('admin_services')}
            </Link>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card step-card shadow">
              <div className="card-header bg-white p-4 border-0">
                <h2 className="fw-bold text-primary mb-1">{t('death_decl_title')}</h2>
                <p className="text-muted">{t('death_decl_desc')}</p>
              </div>

              <div className="card-body p-4">
                {!submitted ? (
                  <form id="deathDeclarationForm" onSubmit={onSubmit}>
                    <div className="mb-4">
                      <label htmlFor="defunt" className="form-label">
                        {t('select_relative')}
                      </label>
                      <select className="form-select form-select-lg" id="defunt" name="defunt" required disabled={noEligible}>
                        <option value="" disabled selected>
                          Chargement...
                        </option>
                        {(eligible || []).map((rel) => {
                          const name = lang === 'ar' ? `${rel.prenom_ar} ${rel.nom_ar}` : `${rel.prenom_fr} ${rel.nom_fr}`
                          return (
                            <option key={rel.id} value={rel.id}>
                              {name} (CIN: {rel.cin || 'N/A'})
                            </option>
                          )
                        })}
                      </select>
                      {noEligible ? (
                        <div className="alert alert-warning mt-2" style={{ marginTop: 8 }}>
                          {t('no_eligible_relatives')}
                        </div>
                      ) : null}
                    </div>

                    {fetchError ? <div className="alert alert-danger">{fetchError}</div> : null}

                    <div className="mb-4">
                      <label htmlFor="date_deces" className="form-label">
                        {t('date_of_death')}
                      </label>
                      <input type="datetime-local" className="form-control" id="date_deces" name="date_deces" required />
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label htmlFor="lieu_deces_fr" className="form-label">
                          {t('place_of_death_fr')}
                        </label>
                        <input type="text" className="form-control" id="lieu_deces_fr" name="lieu_deces_fr" placeholder="Hôpital de Kelibia" required />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="lieu_deces_ar" className="form-label">
                          {t('place_of_death_ar')}
                        </label>
                        <input type="text" className="form-control" id="lieu_deces_ar" name="lieu_deces_ar" placeholder="مستشفى قليبية" required />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="police_report" className="form-label">
                        {t('police_report')} <span className="text-muted small">{t('police_report_desc')}</span>
                      </label>
                      <input type="file" className="form-control" id="police_report" name="police_report" accept="application/pdf,image/*" />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="commentaire" className="form-label">
                        {t('comments')}
                      </label>
                      <textarea className="form-control" id="commentaire" name="commentaire" rows={3} />
                    </div>

                    <div className="d-grid pt-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        id="submitBtn"
                        disabled={noEligible || submitting}
                      >
                        <i className="fas fa-paper-plane me-2" />
                        {submitting ? t('processing') : t('submit')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div id="successMsg" className="alert alert-success mt-4">
                    <i className="fas fa-check-circle me-2" />
                    {t('declaration_success')}
                    <div className="mt-3">
                      <Link to="/dashboard" className="btn btn-success btn-sm">
                        {t('dashboard')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

