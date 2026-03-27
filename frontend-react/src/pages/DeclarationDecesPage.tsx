import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'

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

  const webcamRef = useRef<Webcam>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)

  const videoConstraints = {
    facingMode: 'environment', // Use back camera if available
  }

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'rapport_police_camera.jpg', { type: 'image/jpeg' })
          setCapturedFile(file)
          setShowCamera(false)
        })
    }
  }, [webcamRef])

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    ;(async () => {
      try {
        const response = await fetch(resolveBackendUrl('/extrait-deces/api/declaration/'), {
          headers: { Authorization: `Bearer ${access}` },
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          const msg =
            errData.detail ||
            errData.error ||
            `Erreur ${response.status}: impossible de charger les membres éligibles.`
          if (response.status === 401) {
            clearTokens()
            navigate('/login')
            return
          }
          throw new Error(msg)
        }

        const data = (await response.json()) as {
          eligible_relatives?: EligibleRelative[]
          warning?: string
        }

        const rels = data.eligible_relatives || []
        setEligible(rels)
        setNoEligible(rels.length === 0)

        // Show warning (no CIN / no Citoyen record) as a softer error
        if (data.warning) {
          setFetchError(data.warning)
        }
      } catch (e: any) {
        console.error(e)
        setEligible([])
        setNoEligible(true)
        setFetchError(e.message || 'Erreur lors du chargement des membres éligibles.')
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

      // Ensure both place of death fields are present even if only one was in the UI
      if (lang === 'ar') {
        if (!fd.has('lieu_deces_fr')) fd.append('lieu_deces_fr', '')
      } else {
        if (!fd.has('lieu_deces_ar')) fd.append('lieu_deces_ar', '')
      }

      // Inject camera-captured photo if present and no file was manually selected
      const fileInput = form.querySelector<HTMLInputElement>('#police_report')
      const hasManualFile = fileInput && fileInput.files && fileInput.files.length > 0
      if (capturedFile && !hasManualFile) {
        fd.set('police_report', capturedFile, capturedFile.name)
      }

      const response = await fetch(resolveBackendUrl('/extrait-deces/api/declaration/'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: fd,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        // DRF returns field-level errors as an object, extract the first message
        let errorMsg: string = t('error_msg')
        if (err) {
          if (typeof err.detail === 'string') {
            errorMsg = err.detail
          } else {
            const firstKey = Object.keys(err)[0]
            if (firstKey) {
              const val = err[firstKey]
              errorMsg = Array.isArray(val) ? val[0] : String(val)
            }
          }
        }
        alert(errorMsg)
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
                      <input 
                        type="datetime-local" 
                        className="form-control" 
                        id="date_deces" 
                        name="date_deces" 
                        required 
                        max={new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)}
                        min={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)}
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="lieu_deces" className="form-label">
                        {lang === 'ar' ? t('place_of_death_ar') : t('place_of_death_fr')}
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="lieu_deces" 
                        name={lang === 'ar' ? 'lieu_deces_ar' : 'lieu_deces_fr'} 
                        placeholder={lang === 'ar' ? 'مستشفى قليبية' : 'Hôpital de Kelibia'} 
                        required 
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="police_report" className="form-label d-block">
                        {t('police_report')} <span className="text-muted small">{t('police_report_desc')}</span>
                      </label>
                      
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <button 
                          type="button" 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowCamera(true)}
                        >
                          <i className="fas fa-camera me-1" />
                          {t('camera')}
                        </button>
                        <input 
                          type="file" 
                          className="form-control form-control-sm" 
                          id="police_report" 
                          name="police_report" 
                          accept="application/pdf,image/*" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) setCapturedFile(null) // clear camera if file chosen
                          }}
                        />
                      </div>

                      {capturedFile && (
                        <div className="mt-2 position-relative d-inline-block">
                          <img src={URL.createObjectURL(capturedFile)} alt="Capture" className="img-thumbnail" style={{ maxHeight: 100 }} />
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                            onClick={() => setCapturedFile(null)}
                            style={{ padding: '0 5px' }}
                          >
                            &times;
                          </button>
                          <div className="small text-success mt-1">Photo capturée prête</div>
                        </div>
                      )}
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
      {/* CAMERA MODAL */}
      {showCamera && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title text-primary fw-bold">
                  {t('capture_police_report')}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCamera(false)}></button>
              </div>
              <div className="modal-body text-center bg-dark p-0 overflow-hidden mt-3" style={{ minHeight: '300px' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  mirrored={false}
                  videoConstraints={videoConstraints}
                  className="w-100"
                  onUserMediaError={(err) => alert("Erreur caméra: " + err)}
                />
              </div>
              <div className="modal-footer border-0 justify-content-center pt-3 pb-4">
                <button type="button" className="btn btn-primary btn-lg rounded-pill px-5 shadow" onClick={capture}>
                  <i className="fas fa-camera me-2" />
                  {t('take_photo')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

