import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import { getAccessToken } from '../lib/authStorage'
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

export default function DemandeLivretFamillePage() {
  const { lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    nom_chef_famille: '',
    prenom_chef_famille: '',
    motif_demande: 'premier_livret',
    etat_livret: 'actif',
    cin_epoux: '',
    cin_epouse: '',
  })

  const [files, setFiles] = useState<{ [key: string]: File | Blob | null }>({
    photo_chef_famille: null,
    extrait_mariage: null,
    extrait_naissance_epoux1: null,
    extrait_naissance_epoux2: null,
    extraits_enfants: null,
    extrait_deces_epoux: null,
    jugement_divorce: null,
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
    fetch(resolveBackendUrl('/api/accounts/me/'), {
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
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value)
    })

    Object.entries(files).forEach(([key, value]) => {
      if (value) data.append(key, value)
    })

    try {
      const res = await fetch(resolveBackendUrl('/api/livret-famille/demandes/'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: data,
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/mes-demandes'), 3000)
      } else {
        const errData = await res.json()
        setError(JSON.stringify(errData))
      }
    } catch (err) {
      setError(lang === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const renderFileControl = (field: string, label: string, required = false) => (
    <div className="mb-4">
      <label className="form-label fw-bold small text-uppercase text-muted d-block mb-2">
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
            title="Prendre une photo"
          >
            <i className="fas fa-camera"></i>
          </button>
          {files[field] && (
            <span className="badge bg-success rounded-pill px-3 py-2 ms-2">
              <i className="fas fa-check me-1"></i>
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
      breadcrumbs={[{ label: lang === 'ar' ? 'طلب دفتر عائلي' : 'Demande Livret de Famille' }]}
    >
      <div className="container py-2 pb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="card shadow-sm border-0 overflow-hidden" style={{ borderRadius: '24px' }}>
              <div className="card-body p-4 p-md-5 bg-white">
                {success ? (
                  <div className="text-center py-5">
                    <div className="mb-4 text-success">
                      <i className="fas fa-check-circle fa-5x"></i>
                    </div>
                    <h2 className="fw-bold mb-3">{lang === 'ar' ? 'تم تقديم الطلب بنجاح' : 'Demande soumise avec succès'}</h2>
                    <p className="text-muted mb-0">{lang === 'ar' ? 'جاري التحويل...' : 'Redirection...'}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <h3 className="fw-bold mb-4">{lang === 'ar' ? 'طلب دفتر عائلي' : 'Demande de Livret de Famille'}</h3>

                    {error && <div className="alert alert-danger rounded-3 mb-4">{error}</div>}

                    {/* Personal Info */}
                    <div className="row g-4 mb-4 p-4 bg-light rounded-4 border-start border-4 border-primary">
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">{lang === 'ar' ? 'سبب الطلب' : 'Motif de la demande'}</label>
                        <select
                          className="form-select form-select-lg border-0 shadow-sm"
                          value={formData.motif_demande}
                          onChange={(e) => setFormData({ ...formData, motif_demande: e.target.value })}
                          required
                          style={{ borderRadius: '12px' }}
                        >
                          <option value="premier_livret">{lang === 'ar' ? 'أول دفتر' : 'Premier livret'}</option>
                          <option value="renouvellement">{lang === 'ar' ? 'تجديد' : 'Renouvellement'}</option>
                          <option value="duplicata">{lang === 'ar' ? 'نظير / ضياع' : 'Duplicata / Perte'}</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">{lang === 'ar' ? 'اسم رئيس العائلة' : 'Nom du Chef de famille'}</label>
                        <input
                          type="text"
                          className="form-control form-control-lg bg-light border-0 shadow-sm"
                          value={formData.nom_chef_famille}
                          onChange={(e) => setFormData({ ...formData, nom_chef_famille: e.target.value })}
                          required
                          style={{ borderRadius: '12px' }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">{lang === 'ar' ? 'لقب رئيس العائلة' : 'Prénom du Chef de famille'}</label>
                        <input
                          type="text"
                          className="form-control form-control-lg bg-light border-0 shadow-sm"
                          value={formData.prenom_chef_famille}
                          onChange={(e) => setFormData({ ...formData, prenom_chef_famille: e.target.value })}
                          required
                          style={{ borderRadius: '12px' }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">{lang === 'ar' ? 'بطاقة تعريف الزوج' : 'CIN de l\'époux'}</label>
                        <input
                          type="text"
                          className="form-control form-control-lg bg-light border-0 shadow-sm"
                          value={formData.cin_epoux}
                          onChange={(e) => setFormData({ ...formData, cin_epoux: e.target.value })}
                          maxLength={8}
                          required
                          style={{ borderRadius: '12px' }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">{lang === 'ar' ? 'بطاقة تعريف الزوجة' : 'CIN de l\'épouse'}</label>
                        <input
                          type="text"
                          className="form-control form-control-lg bg-light border-0 shadow-sm"
                          value={formData.cin_epouse}
                          onChange={(e) => setFormData({ ...formData, cin_epouse: e.target.value })}
                          maxLength={8}
                          required
                          style={{ borderRadius: '12px' }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">{lang === 'ar' ? 'الحالة المدنية' : 'État Civil'}</label>
                        <select
                          className="form-select form-select-lg border-0 shadow-sm"
                          value={formData.etat_livret}
                          onChange={(e) => setFormData({ ...formData, etat_livret: e.target.value })}
                          required
                          style={{ borderRadius: '12px' }}
                        >
                          <option value="actif">{lang === 'ar' ? 'متزوج(ة)' : 'Marié(e)'}</option>
                          <option value="divorce">{lang === 'ar' ? 'مطلق(ة)' : 'Divorcé(e)'}</option>
                          <option value="deces">{lang === 'ar' ? 'أرمل(ة)' : 'Veuf/Veuve'}</option>
                        </select>
                      </div>
                    </div>

                    <h5 className="fw-bold mb-4 text-primary border-bottom pb-2">
                      <i className="fas fa-file-invoice me-2"></i> {lang === 'ar' ? 'الوثائق المطلوبة' : 'Documents requis'}
                    </h5>

                    <div className="row">
                      <div className="col-md-6">{renderFileControl('extrait_mariage', lang === 'ar' ? 'مضمون زواج' : 'Extrait de mariage', true)}</div>
                      <div className="col-md-6">{renderFileControl('photo_chef_famille', lang === 'ar' ? 'صورة رئيس العائلة' : 'Photo de famille', false)}</div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">{renderFileControl('extrait_naissance_epoux1', lang === 'ar' ? 'مضمون ولادة الزوج' : 'Extrait naissance Époux 1', true)}</div>
                      <div className="col-md-6">{renderFileControl('extrait_naissance_epoux2', lang === 'ar' ? 'مضمون ولادة الزوجة' : 'Extrait naissance Époux 2', true)}</div>
                    </div>

                    <div className="row">
                      {(formData.motif_demande === 'renouvellement' || formData.motif_demande === 'duplicata') && (
                        <div className="col-md-6">{renderFileControl('extraits_enfants', lang === 'ar' ? 'مضامين للأبناء' : 'Extraits des enfants', true)}</div>
                      )}
                      {formData.etat_livret === 'deces' && (
                        <div className="col-md-6">{renderFileControl('extrait_deces_epoux', lang === 'ar' ? 'مضمون وفاة الزوج عند تسليم الدفتر للام' : 'Extrait décès Conjoint', true)}</div>
                      )}
                    </div>

                    <div className="row">
                      {formData.etat_livret === 'divorce' && (
                        <div className="col-md-6">{renderFileControl('jugement_divorce', lang === 'ar' ? 'نسخة من حكم الطلاق (بالنسبة للزوجه المطلقة الحاضنة)' : 'Jugement de divorce (divorcés)', true)}</div>
                      )}
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
                        {lang === 'ar' ? 'إرسال الطلب' : 'Soumettre la demande'}
                      </button>
                      <Link to="/services" className="btn btn-link text-muted text-decoration-none text-center">
                        {lang === 'ar' ? 'رجوع' : 'Retour'}
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
