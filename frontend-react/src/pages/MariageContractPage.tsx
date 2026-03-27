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

export default function MariageContractPage() {
  const { t, setLang } = useI18n()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    type_contrat: 'baladi',
    lieu_mariage: 'municipality',
    nom_epoux: '',
    cin_epoux: '',
    nom_epouse: '',
    cin_epouse: '',
    date_souhaitee: '',
    regime_matrimonial: 'separation',
  })
  
  const [files, setFiles] = useState<{ [key: string]: File | Blob | null }>({
    cin_recto_epoux: null,
    cin_verso_epoux: null,
    extrait_naissance_epoux: null,
    certificat_medical_epoux: null,
    cin_recto_epouse: null,
    cin_verso_epouse: null,
    extrait_naissance_epouse: null,
    certificat_medical_epouse: null,
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
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value)
    })

    if (formData.type_contrat === 'baladi') {
      Object.entries(files).forEach(([key, value]) => {
        if (value) data.append(key, value)
      })
    }

    try {
      const res = await fetch('/extrait-mariage/demandes/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: data,
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/mes-mariages'), 3000)
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
        <div className="col-md-10 col-lg-9">
          <div className="card shadow-lg border-0 overflow-hidden" style={{ borderRadius: '24px' }}>
            <div className="card-header bg-primary text-white p-4 border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0 fw-bold">
                  <i className="fas fa-heart me-3"></i>
                  {t('mariage_contract_title')}
                </h3>
                <div className="d-flex align-items-center gap-2">
                  <div className="btn-group btn-group-sm">
                    <button type="button" className="btn btn-outline-light" onClick={() => setLang('fr')}>
                      <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
                    </button>
                    <button type="button" className="btn btn-outline-light" onClick={() => setLang('ar')}>
                      <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
                    </button>
                  </div>
                  <Link to="/dashboard" className="btn btn-outline-light btn-sm rounded-circle shadow-sm">
                    <i className="fas fa-times"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="card-body p-4 p-md-5 bg-white">
              {success ? (
                <div className="text-center py-5">
                  <div className="mb-4 text-success">
                    <i className="fas fa-check-circle fa-5x"></i>
                  </div>
                  <h2 className="fw-bold mb-3">{t('mariage_apply_success')}</h2>
                  <p className="text-muted mb-0">Redirection...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger rounded-3 mb-4">{error}</div>}

                  {/* Type and Location */}
                  <div className="row g-4 mb-5 p-4 bg-light rounded-4 border-start border-4 border-primary">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('contrat_type')}</label>
                      <select
                        className="form-select form-select-lg border-0 shadow-sm"
                        value={formData.type_contrat}
                        onChange={(e) => setFormData({ ...formData, type_contrat: e.target.value })}
                        required
                        style={{ borderRadius: '12px' }}
                      >
                        <option value="baladi">{t('baladi')}</option>
                        <option value="adli">{t('adli')}</option>
                      </select>
                    </div>
                    {formData.type_contrat === 'baladi' && (
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">{t('lieu_mariage')}</label>
                        <select
                          className="form-select form-select-lg border-0 shadow-sm"
                          value={formData.lieu_mariage}
                          onChange={(e) => setFormData({ ...formData, lieu_mariage: e.target.value })}
                          required
                          style={{ borderRadius: '12px' }}
                        >
                          <option value="municipality">{t('municipality_hall')}</option>
                          <option value="private">{t('private_place')}</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {formData.type_contrat === 'adli' ? (
                    <div className="alert alert-info rounded-4 p-4 border-0 shadow-sm mb-5">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-info-circle fa-3x me-4 text-info"></i>
                        <p className="mb-0 fw-bold fs-5">{t('adli_info_msg')}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* groom info */}
                  <h5 className="fw-bold mb-4 text-primary border-bottom pb-2">
                    <i className="fas fa-mars me-2"></i> {t('groom_info')}
                  </h5>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('first_name')} & {t('last_name')}</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={formData.nom_epoux}
                        onChange={(e) => setFormData({ ...formData, nom_epoux: e.target.value })}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('cin_label')}</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={formData.cin_epoux}
                        onChange={(e) => setFormData({ ...formData, cin_epoux: e.target.value })}
                        required
                        maxLength={8}
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                  </div>

                  {formData.type_contrat === 'baladi' && (
                    <>
                      <div className="row">
                        <div className="col-md-6">{renderFileControl('cin_recto_epoux', t('cin_recto_label'), true)}</div>
                        <div className="col-md-6">{renderFileControl('cin_verso_epoux', t('cin_verso_label'), true)}</div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">{renderFileControl('extrait_naissance_epoux', t('birth_extract'), true)}</div>
                        <div className="col-md-6">{renderFileControl('certificat_medical_epoux', t('medical_cert'), true)}</div>
                      </div>
                    </>
                  )}

                  {/* bride info */}
                  <h5 className="fw-bold mb-4 mt-5 text-danger border-bottom pb-2">
                    <i className="fas fa-venus me-2"></i> {t('bride_info')}
                  </h5>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('first_name')} & {t('last_name')}</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={formData.nom_epouse}
                        onChange={(e) => setFormData({ ...formData, nom_epouse: e.target.value })}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('cin_label')}</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        value={formData.cin_epouse}
                        onChange={(e) => setFormData({ ...formData, cin_epouse: e.target.value })}
                        required
                        maxLength={8}
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                  </div>

                  {formData.type_contrat === 'baladi' && (
                    <>
                      <div className="row">
                        <div className="col-md-6">{renderFileControl('cin_recto_epouse', t('cin_recto_label'), true)}</div>
                        <div className="col-md-6">{renderFileControl('cin_verso_epouse', t('cin_verso_label'), true)}</div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">{renderFileControl('extrait_naissance_epouse', t('birth_extract'), true)}</div>
                        <div className="col-md-6">{renderFileControl('certificat_medical_epouse', t('medical_cert'), true)}</div>
                      </div>
                    </>
                  )}

                  {/* Marriage Details */}
                  <h5 className="fw-bold mb-4 mt-5 text-success border-bottom pb-2">
                    <i className="fas fa-calendar-alt me-2"></i> {t('details_title')}
                  </h5>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('desired_date')}</label>
                      <input
                        type="date"
                        className="form-control form-control-lg bg-light border-0"
                        value={formData.date_souhaitee}
                        onChange={(e) => setFormData({ ...formData, date_souhaitee: e.target.value })}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-uppercase text-muted">{t('matrimonial_regime')}</label>
                      <select
                        className="form-select form-select-lg bg-light border-0"
                        value={formData.regime_matrimonial}
                        onChange={(e) => setFormData({ ...formData, regime_matrimonial: e.target.value })}
                        required
                        style={{ borderRadius: '12px' }}
                      >
                        <option value="separation">{t('regime_separation')}</option>
                        <option value="communaute">{t('regime_communaute')}</option>
                      </select>
                    </div>
                  </div>

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
