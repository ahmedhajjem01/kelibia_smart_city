import { resolveBackendUrl } from '../lib/backendUrl'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

function WebcamCapture({ onCapture, onCancel }: { onCapture: (blob: Blob) => void; onCancel: () => void }) {
  const webcamRef = useRef<Webcam>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const capture = useCallback(() => {
    const s = webcamRef.current?.getScreenshot()
    if (s) setImgSrc(s)
  }, [])
  const confirm = () => {
    if (imgSrc) fetch(imgSrc).then(r => r.blob()).then(b => onCapture(b))
  }
  return (
    <div className="border rounded-3 p-3 bg-light text-center">
      {imgSrc ? (
        <>
          <img src={imgSrc} className="img-fluid rounded-3 mb-3" style={{ maxHeight: 200 }} />
          <div className="d-flex gap-2 justify-content-center">
            <button type="button" className="btn btn-success rounded-pill px-4" onClick={confirm}>
              <i className="fas fa-check me-1"></i> Confirmer
            </button>
            <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => setImgSrc(null)}>
              <i className="fas fa-redo me-1"></i> Reprendre
            </button>
          </div>
        </>
      ) : (
        <>
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-3 mb-3 w-100" style={{ maxHeight: 200 }} />
          <div className="d-flex gap-2 justify-content-center">
            <button type="button" className="btn btn-primary rounded-pill px-4" onClick={capture}>
              <i className="fas fa-camera me-1"></i> Prendre la photo
            </button>
            <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={onCancel}>
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  )
}

type FileKey = 'cin_copie' | 'quitus' | 'certificat_propriete' | 'plan_cadastral' | 'plan_situation'

interface DocConfig {
  key: FileKey
  label_fr: string
  label_ar: string
  accept: string
  camera: boolean
  required: boolean
  icon: string
}

const DOCS: DocConfig[] = [
  {
    key: 'cin_copie',
    label_fr: 'Copie de la Carte d\'Identité Nationale (CIN)',
    label_ar: 'نسخة من بطاقة التعريف الوطنية',
    accept: 'image/*,.pdf',
    camera: true,
    required: true,
    icon: 'fa-id-card',
  },
  {
    key: 'quitus',
    label_fr: 'Certificat de décharge fiscale municipale (Quitus)',
    label_ar: 'شهادة إبراء الأداءات البلدية للسنة الجارية',
    accept: '.pdf,image/*',
    camera: false,
    required: true,
    icon: 'fa-file-invoice',
  },
  {
    key: 'certificat_propriete',
    label_fr: 'Copie du certificat de propriété récent',
    label_ar: 'نسخة من شهادة الملكية حديثة العهد',
    accept: '.pdf,image/*',
    camera: false,
    required: true,
    icon: 'fa-home',
  },
  {
    key: 'plan_cadastral',
    label_fr: 'Plan cadastral (Extrait du plan)',
    label_ar: 'مثال للرسم العقاري',
    accept: '.pdf,image/*',
    camera: false,
    required: true,
    icon: 'fa-map',
  },
  {
    key: 'plan_situation',
    label_fr: 'Plan de situation du bien immobilier',
    label_ar: 'مثال موقعي للعقار موضوع الطلب',
    accept: '.pdf,image/*',
    camera: false,
    required: true,
    icon: 'fa-map-marked-alt',
  },
]

export default function DemandeCertificatVocationPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [form, setForm] = useState({ nom_prenom: '', cin: '', adresse_bien: '' })
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    cin_copie: null,
    quitus: null,
    certificat_propriete: null,
    plan_cadastral: null,
    plan_situation: null,
  })
  const [cameraActive, setCameraActive] = useState<FileKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setFile = (k: FileKey, f: File | null) => setFiles(prev => ({ ...prev, [k]: f }))

  useEffect(() => {
    const token = getAccessToken()
    if (!token) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUser(d) })
  }, [navigate])

  const allRequiredDocs = DOCS.filter(d => d.required).every(d => files[d.key] !== null)
  const canSubmit = form.nom_prenom.trim() && form.cin.length === 8 && form.adresse_bien.trim() && allRequiredDocs

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    const token = getAccessToken()
    if (!token) { navigate('/login'); return }

    const fd = new FormData()
    fd.append('nom_prenom', form.nom_prenom)
    fd.append('cin', form.cin)
    fd.append('adresse_bien', form.adresse_bien)
    DOCS.forEach(doc => {
      const f = files[doc.key]
      if (f) {
        const ext = f.name.split('.').pop() || 'bin'
        fd.append(doc.key, f, `${doc.key}_${Date.now()}.${ext}`)
      }
    })

    try {
      const res = await fetch(resolveBackendUrl('/api/construction/vocation/'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(JSON.stringify(d))
      }
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la soumission.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Certificat de vocation' }]}>
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="text-success mb-4"><i className="fas fa-check-circle fa-5x"></i></div>
          <h2 className="fw-bold mb-2">
            {lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Demande envoyée avec succès !'}
          </h2>
          <p className="text-muted mb-4 text-center">
            {lang === 'ar'
              ? 'سيتم معالجة طلب شهادة صبغة العقار في أجل 7 إلى 10 أيام.'
              : 'Votre demande de certificat de vocation sera traitée dans un délai de 7 à 10 jours.'}
          </p>
          <div className="d-flex gap-3">
            <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate('/mes-demandes')}>
              <i className="fas fa-tasks me-2"></i>
              {lang === 'ar' ? 'متابعة طلباتي' : 'Suivre mes demandes'}
            </button>
            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => navigate('/dashboard')}>
              {lang === 'ar' ? 'العودة للوحة التحكم' : 'Retour au tableau de bord'}
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: lang === 'ar' ? 'شهادة في صبغة عقار' : 'Certificat de vocation d\'un bien immobilier' }]}
    >
      <style>{`
        .voc-card { background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
        .voc-section { font-weight: 700; color: #1565c0; font-size: .95rem; border-bottom: 2px solid #e3f2fd; padding-bottom: .4rem; margin-bottom: 1.2rem; }
        .doc-row { background: #f8faff; border: 1px solid #e3f2fd; border-radius: .75rem; padding: 1rem 1.2rem; margin-bottom: .75rem; }
        .doc-row:last-child { margin-bottom: 0; }
        .fok { display: inline-flex; align-items: center; gap: .3rem; background: #d4edda; color: #155724; border-radius: .4rem; padding: .2rem .6rem; font-size: .8rem; }
        .doc-required { color: #dc3545; font-size: .75rem; font-weight: 600; }
      `}</style>

      <div className="container-fluid px-0 py-4" style={{ maxWidth: 760 }}>
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#1a3a5c,#1565c0)', color: '#fff', fontSize: '1.4rem' }}>
            <i className="fas fa-building"></i>
          </div>
          <div>
            <h1 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>
              {lang === 'ar' ? 'طلب شهادة في صبغة عقار' : 'Certificat de vocation d\'un bien immobilier'}
            </h1>
            <p className="text-muted mb-0 small">
              {lang === 'ar'
                ? 'للحصول على وثيقة رسمية تبين صبغة العقار (صناعي، فلاحي، فضاء تعمير...)'
                : 'Pour connaître l\'usage autorisé d\'un terrain ou d\'un bâtiment (industriel, agricole, urbain, etc.).'}
            </p>
          </div>
        </div>

        {/* Délai */}
        <div className="alert alert-info rounded-3 mb-4 small">
          <i className="fas fa-clock me-2"></i>
          <strong>{lang === 'ar' ? 'المدة المقدّرة:' : 'Délai estimé :'}</strong>{' '}
          {lang === 'ar' ? '7 إلى 10 أيام عمل' : '7 à 10 jours ouvrables'}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Identity */}
          <div className="voc-card mb-4">
            <div className="voc-section">
              <i className="fas fa-user me-2"></i>
              {lang === 'ar' ? 'معلومات المتقدم' : 'Informations du demandeur'}
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  {lang === 'ar' ? 'الاسم الكامل *' : 'Nom et Prénom *'}
                </label>
                <input
                  type="text" className="form-control rounded-3"
                  placeholder={lang === 'ar' ? 'الاسم واللقب' : 'Ex: Ahmed Ben Salah'}
                  value={form.nom_prenom} onChange={e => update('nom_prenom', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  {lang === 'ar' ? 'رقم البطاقة الوطنية *' : 'Numéro CIN *'}
                </label>
                <input
                  type="text" className="form-control rounded-3"
                  placeholder="12345678" maxLength={8}
                  value={form.cin} onChange={e => update('cin', e.target.value.replace(/\D/g, ''))}
                  required
                />
                {form.cin.length > 0 && form.cin.length !== 8 && (
                  <div className="text-danger small mt-1">
                    {lang === 'ar' ? 'يجب أن يتكون من 8 أرقام' : '8 chiffres requis'}
                  </div>
                )}
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  {lang === 'ar' ? 'عنوان العقار *' : 'Adresse du bien immobilier *'}
                </label>
                <input
                  type="text" className="form-control rounded-3"
                  placeholder={lang === 'ar' ? 'عنوان العقار الكامل' : 'Ex: Lot 15, Zone industrielle, Kélibia'}
                  value={form.adresse_bien} onChange={e => update('adresse_bien', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="voc-card mb-4">
            <div className="voc-section">
              <i className="fas fa-folder-open me-2"></i>
              {lang === 'ar' ? 'الوثائق المطلوبة' : 'Documents requis'}
            </div>
            <div className="mb-3 small text-muted">
              <i className="fas fa-info-circle me-1"></i>
              {lang === 'ar'
                ? 'يرجى إرفاق جميع الوثائق المطلوبة (PDF أو صورة).'
                : 'Veuillez joindre tous les documents requis (PDF ou image).'}
            </div>

            {DOCS.map(doc => (
              <div key={doc.key} className="doc-row">
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className={`fas ${doc.icon} text-primary`}></i>
                    <span className="fw-semibold small">
                      {lang === 'ar' ? doc.label_ar : doc.label_fr}
                    </span>
                    {doc.required && <span className="doc-required">*</span>}
                  </div>
                  {files[doc.key] && (
                    <span className="fok">
                      <i className="fas fa-check"></i> {files[doc.key]!.name.substring(0, 20)}{files[doc.key]!.name.length > 20 ? '...' : ''}
                    </span>
                  )}
                </div>

                {cameraActive === doc.key ? (
                  <WebcamCapture
                    onCapture={(blob) => {
                      setFile(doc.key, new File([blob], `${doc.key}_${Date.now()}.jpg`, { type: 'image/jpeg' }))
                      setCameraActive(null)
                    }}
                    onCancel={() => setCameraActive(null)}
                  />
                ) : (
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <input
                      type="file" accept={doc.accept}
                      className="form-control rounded-3 form-control-sm flex-grow-1"
                      onChange={e => setFile(doc.key, e.target.files?.[0] ?? null)}
                    />
                    {doc.camera && (
                      <button type="button" className="btn btn-outline-secondary btn-sm rounded-3"
                        onClick={() => setCameraActive(doc.key)}>
                        <i className="fas fa-camera me-1"></i>
                        {lang === 'ar' ? 'تصوير' : 'Photo'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          {!allRequiredDocs && (
            <div className="alert alert-warning rounded-3 mb-3 small">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {lang === 'ar'
                ? `يجب إرفاق ${DOCS.filter(d => d.required && !files[d.key]).length} وثيقة(وثائق) متبقية لإتمام الطلب.`
                : `${DOCS.filter(d => d.required && !files[d.key]).length} document(s) manquant(s) pour compléter votre dossier.`}
            </div>
          )}

          {error && (
            <div className="alert alert-danger rounded-3 mb-3 small">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <div className="d-flex gap-3 justify-content-end">
            <button type="button" className="btn btn-outline-secondary rounded-pill px-4"
              onClick={() => navigate(-1)}>
              {lang === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold"
              disabled={loading || !canSubmit}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>{lang === 'ar' ? 'جارٍ الإرسال...' : 'Envoi...'}</>
                : <><i className="fas fa-paper-plane me-2"></i>{lang === 'ar' ? 'إرسال الطلب' : 'Envoyer la demande'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
