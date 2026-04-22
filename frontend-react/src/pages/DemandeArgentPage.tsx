import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { getAccessToken } from '../lib/authStorage'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'
import { useI18n } from '../i18n/LanguageProvider'

const WebcamCapture = ({ onCapture, onCancel, lang }: { onCapture: (blob: Blob) => void; onCancel: () => void; lang: string }) => {
  const webcamRef = useRef<Webcam>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const capture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot()
    if (src) setImgSrc(src)
  }, [])
  const confirm = () => {
    if (imgSrc) fetch(imgSrc).then(r => r.blob()).then(b => onCapture(b))
  }
  return (
    <div className={`text-center bg-dark p-3 rounded-4 shadow-lg mb-3 ${lang === 'ar' ? 'font-arabic' : ''}`}>
      {!imgSrc ? (
        <>
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
            className="w-100 rounded-3 mb-3 border border-secondary"
            videoConstraints={{ facingMode: 'environment' }} />
          <div className="d-flex justify-content-center gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <button type="button" onClick={capture} className="btn btn-warning btn-sm rounded-pill px-3 fw-bold"><i className={`fas fa-camera ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i> {lang === 'ar' ? 'التقاط' : 'Capturer'}</button>
            <button type="button" onClick={onCancel} className="btn btn-outline-light btn-sm rounded-pill px-3">{lang === 'ar' ? 'إلغاء' : 'Annuler'}</button>
          </div>
        </>
      ) : (
        <>
          <img src={imgSrc} alt="Capture" className="w-100 rounded-3 mb-3 border border-success border-3" />
          <div className="d-flex justify-content-center gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <button type="button" onClick={confirm} className="btn btn-success btn-sm rounded-pill px-3 fw-bold"><i className={`fas fa-check ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i> {lang === 'ar' ? 'تأكيد' : 'Confirmer'}</button>
            <button type="button" onClick={() => setImgSrc(null)} className="btn btn-outline-warning btn-sm rounded-pill px-3"><i className={`fas fa-undo ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i> {lang === 'ar' ? 'إعادة' : 'Reprendre'}</button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DemandeArgentPage() {
  const navigate = useNavigate()
  const { lang } = useI18n()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [formData, setFormData] = useState({ service_type: '', adresse_bien: '', description: '' })
  const [files, setFiles] = useState<{ cin_recto?: File; cin_verso?: File; document_propriete?: File }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cameraActive, setCameraActive] = useState<string | null>(null)
  const cinRectoRef = useRef<HTMLInputElement>(null)
  const cinVersoRef = useRef<HTMLInputElement>(null)
  const docProprieteRef = useRef<HTMLInputElement>(null)

  const SERVICE_TYPES = [
    { value: 'enregistrement_bien', label: lang === 'ar' ? 'تسجيل عقار (طابق أرضي، طابق علوي، مرآب)' : "Enregistrement d'un bien (Rez-de-chaussée, étage, garage)" },
    { value: 'changement_propriete', label: lang === 'ar' ? 'تغيير ملكية (شراء أو إرث)' : 'Changement de propriété (Achat ou héritage)' },
    { value: 'changement_vocation', label: lang === 'ar' ? 'تغيير صبغة (من سكن إلى تجارة، إلخ)' : 'Changement de vocation (Logement en commerce, etc.)' },
    { value: 'arret_activite', label: lang === 'ar' ? 'تصريح بإيقاف نشاط (غلق محل)' : "Déclaration d'arrêt d'activité (Fermer une boutique)" },
    { value: 'certificat_imposition', label: lang === 'ar' ? 'شهادة ترسيم بجدول الأداءات' : "Certificat d'inscription au rôle d'imposition" },
  ]

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUser(d) })
  }, [navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    if (e.target.files?.[0]) setFiles(prev => ({ ...prev, [key]: e.target.files![0] }))
  }

  const handleCapture = (blob: Blob, key: keyof typeof files) => {
    const file = new File([blob], `${key}.jpg`, { type: 'image/jpeg' })
    setFiles(prev => ({ ...prev, [key]: file }))
    setCameraActive(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.service_type || !formData.adresse_bien) {
      setError(lang === 'ar' ? 'الرجاء ملء جميع الحقول الإلزامية.' : 'Veuillez remplir tous les champs obligatoires.')
      return
    }
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('service_type', formData.service_type)
      data.append('adresse_bien', formData.adresse_bien)
      data.append('description', formData.description)
      if (files.cin_recto) {
        const ext = files.cin_recto.name.split('.').pop() || 'jpg'
        data.append('cin_recto', files.cin_recto, `cin_recto_${Date.now()}.${ext}`)
      }
      if (files.cin_verso) {
        const ext = files.cin_verso.name.split('.').pop() || 'jpg'
        data.append('cin_verso', files.cin_verso, `cin_verso_${Date.now()}.${ext}`)
      }
      if (files.document_propriete) {
        const ext = files.document_propriete.name.split('.').pop() || 'bin'
        data.append('document_propriete', files.document_propriete, `doc_prop_${Date.now()}.${ext}`)
      }

      const res = await fetch(resolveBackendUrl('/api/impots/demande/'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` },
        body: data,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(JSON.stringify(err) || (lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب.' : 'Erreur lors de la soumission.'))
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/mes-impots'), 2500)
    } catch (err) {
      setError(lang === 'ar' ? 'خطأ في الشبكة. يرجى المحاولة مرة أخرى.' : 'Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[
      { label: lang === 'ar' ? 'المالية والأداءات' : 'Argent & Impôts', href: '/mes-impots' },
      { label: lang === 'ar' ? 'طلب جديد' : 'Nouvelle demande' },
    ]}>
      <div className={`row justify-content-center ${lang === 'ar' ? 'font-arabic text-end' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header rounded-top-4 text-white py-3 px-4"
              style={{ background: 'linear-gradient(135deg, #198754, #20c997)' }}>
              <h4 className="mb-0 fw-bold">
                <i className={`fas fa-file-invoice-dollar ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
                {lang === 'ar' ? 'طلب — المالية والأداءات' : 'Demande — Argent & Impôts'}
              </h4>
              <p className="mb-0 small opacity-75">{lang === 'ar' ? 'التسجيلات الجبائية والعقارية البلدية' : 'Enregistrements fiscaux et immobiliers municipaux'}</p>
            </div>
            <div className="card-body p-4">
              {success ? (
                <div className="text-center py-5">
                  <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                  <h5 className="text-success">{lang === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Demande envoyée avec succès !'}</h5>
                  <p className="text-muted">{lang === 'ar' ? 'جاري التوجيه...' : 'Redirection en cours...'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger rounded-3">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">{lang === 'ar' ? 'نوع الخدمة' : 'Type de service'} <span className="text-danger">*</span></label>
                    <select name="service_type" className="form-select rounded-3" value={formData.service_type} onChange={handleChange} required>
                      <option value="">-- {lang === 'ar' ? 'اختر' : 'Sélectionner'} --</option>
                      {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">{lang === 'ar' ? 'عنوان العقار / المحل' : 'Adresse du bien / local'} <span className="text-danger">*</span></label>
                    <textarea name="adresse_bien" className="form-control rounded-3" rows={2}
                      value={formData.adresse_bien} onChange={handleChange} required
                      placeholder={lang === 'ar' ? 'الرقم، الشارع، الحي، قليبية...' : "Numéro, rue, quartier, Kélibia..."} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">{lang === 'ar' ? 'الوصف / التفاصيل' : 'Description / Détails'}</label>
                    <textarea name="description" className="form-control rounded-3" rows={3}
                      value={formData.description} onChange={handleChange}
                      placeholder={lang === 'ar' ? 'وضح طلبك...' : "Précisez votre demande..."} />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{lang === 'ar' ? 'بطاقة التعريف (الوجه)' : 'CIN Recto'}</label>
                      {cameraActive === 'cin_recto' ? (
                        <WebcamCapture lang={lang} onCapture={b => handleCapture(b, 'cin_recto')} onCancel={() => setCameraActive(null)} />
                      ) : (
                        <div className="d-flex gap-2 align-items-center">
                          <div className="border rounded-3 p-3 text-center bg-light flex-grow-1" style={{ cursor: 'pointer' }}
                            onClick={() => cinRectoRef.current?.click()}>
                            {files.cin_recto
                              ? <><i className={`fas fa-check-circle text-success ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i><span className="text-success small">{files.cin_recto.name}</span></>
                              : <><i className="fas fa-id-card fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">{lang === 'ar' ? 'انقر للتحميل' : 'Cliquer pour uploader'}</span></>}
                            <input ref={cinRectoRef} type="file" accept="image/*" className="d-none"
                              onChange={e => handleFileChange(e, 'cin_recto')} />
                          </div>
                          <button type="button" className="btn btn-warning rounded-3" onClick={() => setCameraActive('cin_recto')}>
                            <i className="fas fa-camera"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{lang === 'ar' ? 'بطاقة التعريف (الخلف)' : 'CIN Verso'}</label>
                      {cameraActive === 'cin_verso' ? (
                        <WebcamCapture lang={lang} onCapture={b => handleCapture(b, 'cin_verso')} onCancel={() => setCameraActive(null)} />
                      ) : (
                        <div className="d-flex gap-2 align-items-center">
                          <div className="border rounded-3 p-3 text-center bg-light flex-grow-1" style={{ cursor: 'pointer' }}
                            onClick={() => cinVersoRef.current?.click()}>
                            {files.cin_verso
                              ? <><i className={`fas fa-check-circle text-success ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i><span className="text-success small">{files.cin_verso.name}</span></>
                              : <><i className="fas fa-id-card fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">{lang === 'ar' ? 'انقر للتحميل' : 'Cliquer pour uploader'}</span></>}
                            <input ref={cinVersoRef} type="file" accept="image/*" className="d-none"
                              onChange={e => handleFileChange(e, 'cin_verso')} />
                          </div>
                          <button type="button" className="btn btn-warning rounded-3" onClick={() => setCameraActive('cin_verso')}>
                            <i className="fas fa-camera"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">{lang === 'ar' ? 'وثيقة الملكية' : 'Document de propriété'} <span className="text-muted small">({lang === 'ar' ? 'اختياري' : 'optionnel'})</span></label>
                    <div className="border rounded-3 p-3 text-center bg-light" style={{ cursor: 'pointer' }}
                      onClick={() => docProprieteRef.current?.click()}>
                      {files.document_propriete
                        ? <><i className={`fas fa-check-circle text-success ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i><span className="text-success small">{files.document_propriete.name}</span></>
                        : <><i className="fas fa-file-alt fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">{lang === 'ar' ? 'شهادة ملكية، عقد بيع... (اختياري)' : 'Titre foncier, acte notarié... (optionnel)'}</span></>}
                      <input ref={docProprieteRef} type="file" accept=".pdf,image/*" className="d-none"
                        onChange={e => handleFileChange(e, 'document_propriete')} />
                    </div>
                  </div>

                  <div className="d-grid">
                    <button type="submit" className="btn btn-success rounded-pill py-2 fw-bold" disabled={submitting}>
                      {submitting
                        ? <><span className={`spinner-border spinner-border-sm ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></span>{lang === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...'}</>
                        : <><i className={`fas fa-paper-plane ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'إرسال الطلب' : 'Soumettre la demande'}</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

