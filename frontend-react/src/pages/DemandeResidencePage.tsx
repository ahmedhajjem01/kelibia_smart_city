import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import { getAccessToken, clearTokens } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

const WebcamCapture = ({ onCapture, onCancel }: { onCapture: (blob: Blob) => void, onCancel: () => void }) => {
  const webcamRef = useRef<Webcam>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setImgSrc(imageSrc)
    }
  }, [webcamRef])

  const confirm = () => {
    if (imgSrc) {
      fetch(imgSrc)
        .then(res => res.blob())
        .then(blob => onCapture(blob))
    }
  }

  return (
    <div className="text-center bg-dark p-3 rounded-4 shadow-lg mb-4">
      {!imgSrc ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-100 rounded-3 mb-3 border border-secondary"
            videoConstraints={{ facingMode: 'environment' }}
          />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={capture} className="btn btn-warning rounded-pill px-4 fw-bold shadow">
              <i className="fas fa-camera me-2"></i> Capturer
            </button>
            <button type="button" onClick={onCancel} className="btn btn-outline-light rounded-pill px-4">
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          <img src={imgSrc} alt="Capture" className="w-100 rounded-3 mb-3 border border-success border-3" />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={confirm} className="btn btn-success rounded-pill px-4 fw-bold shadow">
              <i className="fas fa-check me-2"></i> Confirmer
            </button>
            <button type="button" onClick={() => setImgSrc(null)} className="btn btn-outline-warning rounded-pill px-4">
                <i className="fas fa-undo me-2"></i> Reprendre
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DemandeResidencePage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    adresse_demandee: '',
    profession: '',
    telephone: '',
    motif_demande: '',
    nom_prenom: '',
    cin: '',
  })
  
  const [files, setFiles] = useState<{ [key: string]: File | Blob | null }>({
    cin_recto: null,
    cin_verso: null,
    quitus_municipal: null,
    acte_deces_conjoint: null,
  })

  const [cameraActive, setCameraActive] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [field]: e.target.files[0] })
    }
  }

  function handleCapture(blob: Blob, field: string) {
    const file = new File([blob], `${field}.jpg`, { type: 'image/jpeg' })
    setFiles({ ...files, [field]: file })
    setCameraActive(null)
  }

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    // Fetch User Info
    fetch(resolveBackendUrl('/accounts/user/'), {
      headers: { Authorization: `Bearer ${access}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => data && setUser(data))
      .catch(console.error)
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    const data = new FormData()
    data.append('adresse_demandee', formData.adresse_demandee)
    data.append('profession', formData.profession)
    data.append('telephone', formData.telephone)
    const demandeText = lang === 'ar'
      ? `أنا الموقع أسفله ${formData.nom_prenom}، صاحب بطاقة التعريف الوطنية رقم ${formData.cin}، المزاول لمهنة ${formData.profession}، القاطن بـ ${formData.adresse_demandee}، أطلب من سيادتكم الحصول على شهادة إقامة لـ ${formData.motif_demande}.`
      : `Je soussigné ${formData.nom_prenom}, titulaire de la CIN n° ${formData.cin}, exerçant la profession de ${formData.profession}, demeurant à ${formData.adresse_demandee}, sollicite par la présente l'obtention d'un certificat de résidence pour ${formData.motif_demande}.`
    data.append('motif_demande', `${formData.motif_demande}\n\n Texte de la Demande:\n${demandeText}`)

    if (files.cin_recto) data.append('cin_recto', files.cin_recto as Blob)
    if (files.cin_verso) data.append('cin_verso', files.cin_verso as Blob)
    if (files.quitus_municipal) data.append('quitus_municipal', files.quitus_municipal as Blob)
    if (files.acte_deces_conjoint) data.append('acte_deces_conjoint', files.acte_deces_conjoint as Blob)

    try {
      const res = await fetch('/api/residence/demande/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: data,
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/mes-residences'), 3000)
      } else {
        const errData = await res.json()
        setError(JSON.stringify(errData))
      }
    } catch (err) {
      setError(t('error_msg'))
    } finally {
      setLoading(false)
    }
  }

  const renderFileControl = (field: string, label: string, required = false) => (
    <div className="mb-4">
      <label className="form-label fw-bold text-muted small text-uppercase d-block mb-2">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {cameraActive === field ? (
        <WebcamCapture 
            onCapture={(blob) => handleCapture(blob, field)} 
            onCancel={() => setCameraActive(null)} 
        />
      ) : (
        <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="flex-grow-1 position-relative">
                <input
                    type="file"
                    className="form-control form-control-lg bg-light border-0 shadow-sm"
                    onChange={(e) => handleFileChange(e, field)}
                    accept="image/*,application/pdf"
                    required={required && !files[field]}
                    style={{ borderRadius: '12px' }}
                />
            </div>
            <button
                type="button"
                className="btn btn-warning rounded-pill px-3 shadow-sm hover-lift"
                onClick={() => setCameraActive(field)}
                title={t('take_photo')}
            >
                <i className="fas fa-camera"></i>
            </button>
            {files[field] && (
                <span className="badge bg-success rounded-pill px-3 py-2">
                    <i className="fas fa-check me-1"></i> {t('success_msg')}
                </span>
            )}
        </div>
      )}
    </div>
  )

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: t('residence_req_title') }]}
    >
      <div className="container py-2 pb-5">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">

            <div className="card-body p-4 p-md-5 bg-white">
              {success ? (
                <div className="text-center py-5">
                  <div className="mb-4 text-success">
                    <i className="fas fa-check-circle fa-5x"></i>
                  </div>
                  <h2 className="fw-bold mb-3">{t('success_msg')}</h2>
                  <p className="text-muted mb-0">Redirection vers vos demandes...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger rounded-3 mb-4">{error}</div>}

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">{t('telephone')}</label>
                    <input
                      type="tel"
                      className="form-control form-control-lg bg-light border-0"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      required
                      style={{ borderRadius: '12px' }}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold small text-uppercase text-muted mb-0">{t('demande_template_title')}</label>
                        <span className="badge bg-warning text-dark border rounded-pill px-3">
                          <i className="fas fa-info-circle me-1"></i>
                          {t('demande_fields_only')}
                        </span>
                    </div>
                    <div
                      className="p-4 rounded-4 border"
                      style={{
                        background: 'linear-gradient(135deg, #fefefe 0%, #f8f6f0 100%)',
                        fontSize: '1.05rem',
                        lineHeight: '2.4',
                        direction: lang === 'ar' ? 'rtl' : 'ltr',
                        fontFamily: lang === 'ar' ? 'inherit' : '"Georgia", serif',
                      }}
                    >
                      {lang === 'ar' ? (
                        <p className="mb-0" style={{ textAlign: 'right' }}>
                          أنا الموقع أسفله{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.nom_prenom}
                            onChange={(e) => setFormData({ ...formData, nom_prenom: e.target.value })}
                            placeholder={t('full_name_placeholder')}
                            required
                          />
                          ، صاحب بطاقة التعريف الوطنية رقم{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.cin}
                            onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                            placeholder={t('cin_placeholder')}
                            required
                          />
                          ، المزاول لمهنة{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.profession}
                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                            placeholder={t('profession')}
                            required
                          />
                          ، القاطن بـ{' '}
                          <input
                            type="text"
                            className="demande-inline-input demande-inline-input--wide"
                            value={formData.adresse_demandee}
                            onChange={(e) => setFormData({ ...formData, adresse_demandee: e.target.value })}
                            placeholder={t('adresse_actuelle')}
                            required
                          />
                          ، أطلب من سيادتكم الحصول على شهادة إقامة لـ{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.motif_demande}
                            onChange={(e) => setFormData({ ...formData, motif_demande: e.target.value })}
                            placeholder={t('motif_placeholder')}
                            required
                          />
                          .
                        </p>
                      ) : (
                        <p className="mb-0">
                          Je soussigné{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.nom_prenom}
                            onChange={(e) => setFormData({ ...formData, nom_prenom: e.target.value })}
                            placeholder={t('full_name_placeholder')}
                            required
                          />
                          , titulaire de la CIN n°{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.cin}
                            onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                            placeholder={t('cin_placeholder')}
                            required
                          />
                          , exerçant la profession de{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.profession}
                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                            placeholder={t('profession')}
                            required
                          />
                          , demeurant à{' '}
                          <input
                            type="text"
                            className="demande-inline-input demande-inline-input--wide"
                            value={formData.adresse_demandee}
                            onChange={(e) => setFormData({ ...formData, adresse_demandee: e.target.value })}
                            placeholder={t('adresse_actuelle')}
                            required
                          />
                          , sollicite par la présente l'obtention d'un certificat de résidence pour{' '}
                          <input
                            type="text"
                            className="demande-inline-input"
                            value={formData.motif_demande}
                            onChange={(e) => setFormData({ ...formData, motif_demande: e.target.value })}
                            placeholder={t('motif_placeholder')}
                            required
                          />
                          .
                        </p>
                      )}
                    </div>
                  </div>

                  <hr className="my-5 opacity-25" />

                  <h5 className="fw-bold mb-4 text-primary">
                    <i className="fas fa-file-invoice me-2"></i>
                    Documents Justificatifs
                  </h5>

                  <div className="row">
                    <div className="col-md-6">
                        {renderFileControl('cin_recto', t('cin_recto_label'), true)}
                    </div>
                    <div className="col-md-6">
                        {renderFileControl('cin_verso', t('cin_verso_label'), true)}
                    </div>
                  </div>

                  {renderFileControl('quitus_municipal', t('quitus_label'), true)}
                  
                  <div className="mb-4">
                      <a 
                        href="https://vitemp.finances.gov.tn/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline-info btn-sm rounded-pill px-3"
                      >
                        <i className="fas fa-external-link-alt me-2"></i>
                        {t('impot_service_link')}
                      </a>
                  </div>

                  {renderFileControl('acte_deces_conjoint', t('deces_conjoint_label'))}

                  <div className="d-grid gap-3 mt-5">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg rounded-pill py-3 fw-bold shadow-lg hover-lift"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-3"></span>
                      ) : (
                        <i className="fas fa-paper-plane me-3 pulse"></i>
                      )}
                      {t('submit_req')}
                    </button>
                    <Link to="/dashboard" className="btn btn-link text-muted text-decoration-none">
                      {t('close')}
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </MainLayout>
  )
}
