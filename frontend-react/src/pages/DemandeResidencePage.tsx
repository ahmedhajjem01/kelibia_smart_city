import React, { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    adresse_demandee: '',
    profession: '',
    telephone: '',
    motif_demande: '',
    demande_text: lang === 'ar' 
        ? 'أنا الموقع أسفله [الاسم و اللقب]، صاحب بطاقة التعريف الوطنية رقم [الرقم]، القاطن بـ [العنوان]، أطلب من سيادتكم الحصول على شهادة إقامة لـ [السبب].'
        : 'Je soussigné [Prénom Nom], titulaire de la CIN n° [CIN], exerçant la profession de [Profession], demeurant à [Adresse], sollicite par la présente l\'obtention d\'un certificat de résidence pour [Motif].'
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
    data.append('motif_demande', `${formData.motif_demande}\n\n Texte de la Demande:\n${formData.demande_text}`)

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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-9 col-lg-8">
          <div className="card shadow-lg border-0 overflow-hidden" style={{ borderRadius: '24px' }}>
            <div className="card-header bg-primary text-white p-4 border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0 fw-bold">
                  <i className="fas fa-home-user me-3"></i>
                  {t('req_residence')}
                </h3>
                <Link to="/dashboard" className="btn btn-outline-light btn-sm rounded-circle shadow-sm">
                  <i className="fas fa-times"></i>
                </Link>
              </div>
            </div>

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

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('profession')}</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-md-6">
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
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">{t('adresse_actuelle')}</label>
                    <textarea
                      className="form-control form-control-lg bg-light border-0"
                      rows={2}
                      value={formData.adresse_demandee}
                      onChange={(e) => setFormData({ ...formData, adresse_demandee: e.target.value })}
                      required
                      style={{ borderRadius: '12px' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">{t('motif')}</label>
                    <input
                      type="text"
                      className="form-control form-control-lg bg-light border-0"
                      value={formData.motif_demande}
                      onChange={(e) => setFormData({ ...formData, motif_demande: e.target.value })}
                      required
                      style={{ borderRadius: '12px' }}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold small text-uppercase text-muted mb-0">Modèle de Demande</label>
                        <span className="badge bg-light text-primary border rounded-pill px-3">Texte éditable</span>
                    </div>
                    <textarea
                      className="form-control bg-light border-0 p-3"
                      rows={4}
                      value={formData.demande_text}
                      onChange={(e) => setFormData({ ...formData, demande_text: e.target.value })}
                      style={{ borderRadius: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}
                    />
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
      
      <style>{`
        .hover-lift { transition: transform 0.2s; }
        .hover-lift:hover { transform: translateY(-3px); }
        .pulse { animation: pulse-animation 2s infinite; }
        @keyframes pulse-animation {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
