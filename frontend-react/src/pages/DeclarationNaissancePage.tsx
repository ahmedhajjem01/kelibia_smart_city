import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

type ScanStatus =
  | { kind: 'idle'; text: string }
  | { kind: 'processing'; text: string }
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | { kind: 'warning'; text: string }

export default function DeclarationNaissancePage() {
  const { t, setLang } = useI18n()
  const navigate = useNavigate()

  const token = useMemo(() => getAccessToken(), [])

  const attachmentRef = useRef<HTMLInputElement | null>(null)

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [scanStatus, setScanStatus] = useState<ScanStatus>(() => ({
    kind: 'idle',
    text: "Téléchargez une photo ou un scan du document papier remis par l'hôpital.",
  }))
  const [scanProgressVisible, setScanProgressVisible] = useState(false)
  const [scanDisabled, setScanDisabled] = useState(false)

  useEffect(() => {
    if (!token) navigate('/login')
  }, [navigate, token])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  function simulateScan() {
    const fileInput = attachmentRef.current
    const file = fileInput?.files?.[0]
    if (!file) {
      alert(t('error_msg'))
      return
    }

    const fileName = file.name.toLowerCase()

    setScanDisabled(true)
    setScanProgressVisible(true)
    setScanStatus({ kind: 'processing', text: t('scan_processing') })

    setTimeout(() => {
      setScanProgressVisible(false)

      if (fileName.includes('blurry') || fileName.includes('flou')) {
        setScanStatus({ kind: 'error', text: t('scan_error_blurry') })
      } else if (
        fileName.includes('notification') ||
        fileName.includes('birth') ||
        fileName.includes('naissance') ||
        fileName.includes('real')
      ) {
        setScanStatus({ kind: 'success', text: t('scan_success') })
      } else {
        setScanStatus({ kind: 'warning', text: t('scan_error_invalid') })
      }

      setScanDisabled(false)
    }, 1500)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)

    try {
      const form = e.currentTarget as HTMLFormElement
      const fd = new FormData(form)

      const file = fd.get('attachment')
      const payload = new FormData()

      payload.append('prenom_fr', String(fd.get('prenom_fr') || ''))
      payload.append('prenom_ar', String(fd.get('prenom_ar') || ''))
      payload.append('nom_fr', String(fd.get('nom_fr') || ''))
      payload.append('nom_ar', String(fd.get('nom_ar') || ''))
      payload.append('date_naissance', String(fd.get('date_naissance') || ''))
      payload.append('lieu_naissance_fr', String(fd.get('lieu_naissance_fr') || ''))
      payload.append('lieu_naissance_ar', String(fd.get('lieu_naissance_ar') || ''))
      payload.append('sexe', String(fd.get('sexe') || ''))
      payload.append('cin_pere', String(fd.get('cin_pere') || ''))
      payload.append('cin_mere', String(fd.get('cin_mere') || ''))
      payload.append('commentaire', String(fd.get('commentaire') || ''))

      if (file && file instanceof File && file.size > 0) {
        payload.append('attachment', file)
      }

      const res = await fetch('/extrait-naissance/api/declaration/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(JSON.stringify(err))
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert(t('error_msg'))
    } finally {
      setSubmitting(false)
    }
  }

  const scanText = (() => {
    switch (scanStatus.kind) {
      case 'processing':
        return <span className="text-primary fw-bold">{scanStatus.text}</span>
      case 'success':
        return (
          <span className="text-success fw-bold">
            <i className="fas fa-check-circle me-1" />
            {scanStatus.text}
          </span>
        )
      case 'error':
        return (
          <span className="text-danger fw-bold">
            <i className="fas fa-exclamation-triangle me-1" />
            {scanStatus.text}
          </span>
        )
      case 'warning':
        return (
          <span className="text-warning fw-bold">
            <i className="fas fa-question-circle me-1" />
            {scanStatus.text}
          </span>
        )
      default:
        return scanStatus.text
    }
  })()

  return (
    <div className="bg-light">
      <style>{`
        .arabic-font { font-family: 'Cairo', sans-serif; }
        .step-card { border-radius: 15px; border: none; }
        .form-label { font-weight: 600; color: #495057; }
        .section-title { border-left: 4px solid #0d6efd; padding-left: 10px; margin-bottom: 20px; }
        [dir="rtl"] .section-title { border-left: none; border-right: 4px solid #0d6efd; padding-left: 0; padding-right: 10px; }
        .verify-box { background: #e7f1ff; border-radius: 10px; padding: 20px; margin-bottom: 30px; border: 1px dashed #0d6efd; }
      `}</style>

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
          <div className="col-md-9">
            <div className="card step-card shadow">
              <div className="card-header bg-white p-4 border-0">
                <h2 className="fw-bold text-primary mb-1">{t('birth_decl_title')}</h2>
                <p className="text-muted">{t('birth_decl_desc')}</p>
              </div>

              <div className="card-body p-4">
                {!submitted ? (
                  <form id="birthDeclarationForm" onSubmit={onSubmit}>
                    <h5 className="section-title fw-bold text-dark">{t('newborn_info')}</h5>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="prenom_fr" className="form-label">
                          {t('first_name_fr')}
                        </label>
                        <input type="text" className="form-control" id="prenom_fr" name="prenom_fr" required />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="prenom_ar" className="form-label">
                          {t('first_name_ar')}
                        </label>
                        <input type="text" className="form-control" id="prenom_ar" name="prenom_ar" dir="rtl" required />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="nom_fr" className="form-label">
                          {t('last_name_fr')}
                        </label>
                        <input type="text" className="form-control" id="nom_fr" name="nom_fr" required />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="nom_ar" className="form-label">
                          {t('last_name_ar')}
                        </label>
                        <input type="text" className="form-control" id="nom_ar" name="nom_ar" dir="rtl" required />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="date_naissance" className="form-label">
                          {t('date_of_birth')}
                        </label>
                        <input type="datetime-local" className="form-control" id="date_naissance" name="date_naissance" required />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="sexe" className="form-label">
                          {t('gender')}
                        </label>
                        <select className="form-select" id="sexe" name="sexe" required>
                          <option value="M">{t('male')}</option>
                          <option value="F">{t('female')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label htmlFor="lieu_naissance_fr" className="form-label">
                          {t('place_of_birth_fr')}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="lieu_naissance_fr"
                          name="lieu_naissance_fr"
                          placeholder="Hôpital de Kelibia"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="lieu_naissance_ar" className="form-label">
                          {t('place_of_birth_ar')}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="lieu_naissance_ar"
                          name="lieu_naissance_ar"
                          dir="rtl"
                          placeholder="مستشفى قليبية"
                          required
                        />
                      </div>
                    </div>

                    <h5 className="section-title fw-bold text-dark">{t('profile')}</h5>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label htmlFor="cin_pere" className="form-label">
                          CIN Père
                        </label>
                        <input type="text" className="form-control" id="cin_pere" name="cin_pere" maxLength={8} />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="cin_mere" className="form-label">
                          CIN Mère
                        </label>
                        <input type="text" className="form-control" id="cin_mere" name="cin_mere" maxLength={8} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label htmlFor="attachment" className="form-label mb-0">
                          {t('attachment_scan')}
                        </label>
                        <a href="img/real_birth_notification.png" target="_blank" rel="noreferrer" className="btn btn-sm btn-link text-decoration-none">
                          <i className="fas fa-image me-1" />
                          {t('view_example')}
                        </a>
                      </div>

                      <div className="input-group">
                        <input
                          ref={attachmentRef}
                          type="file"
                          className="form-control"
                          id="attachment"
                          name="attachment"
                          accept="image/*,application/pdf"
                        />
                        <button
                          className="btn btn-outline-primary"
                          type="button"
                          id="scanBtn"
                          disabled={scanDisabled}
                          onClick={simulateScan}
                        >
                          <i className="fas fa-check-double me-2" />
                          {t('scan_quality_check')}
                        </button>
                      </div>

                      {scanProgressVisible ? (
                        <div id="scanProgress" className="progress mt-2" style={{ height: 10 }}>
                          <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: '100%' }} />
                        </div>
                      ) : null}

                      <div id="scanStatus" className="form-text">
                        {scanText}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="commentaire" className="form-label">
                        {t('comments')}
                      </label>
                      <textarea className="form-control" id="commentaire" name="commentaire" rows={2} />
                    </div>

                    <div className="d-grid pt-3">
                      <button type="submit" className="btn btn-primary btn-lg" id="submitBtn" disabled={submitting}>
                        <i className="fas fa-baby me-2" />
                        {submitting ? (
                          <span>{t('processing')}</span>
                        ) : (
                          <span>Envoyer la déclaration</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div id="successMsg" className="alert alert-success mt-4">
                    <i className="fas fa-check-circle me-2" />
                    {t('birth_declaration_success')}
                    <div className="mt-3">
                      <Link to="/dashboard" className="btn btn-success btn-sm">
                        Retour au tableau de bord
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

