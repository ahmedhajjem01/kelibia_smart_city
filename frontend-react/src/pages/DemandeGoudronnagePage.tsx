import { resolveBackendUrl } from '../lib/backendUrl'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

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
          <img src={imgSrc} className="img-fluid rounded-3 mb-3" style={{ maxHeight: 220 }} />
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
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-3 mb-3 w-100" style={{ maxHeight: 220 }} />
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

export default function DemandeGoudronnagePage() {
  const { lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [form, setForm] = useState({
    nom_prenom: '',
    cin: '',
    adresse_residence: '',
    localisation_rue: '',
  })
  const [cinCopie, setCinCopie] = useState<File | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const token = getAccessToken()
    if (!token) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUser(d) })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const token = getAccessToken()
    if (!token) { navigate('/login'); return }

    const fd = new FormData()
    fd.append('nom_prenom', form.nom_prenom)
    fd.append('cin', form.cin)
    fd.append('adresse_residence', form.adresse_residence)
    fd.append('localisation_rue', form.localisation_rue)
    if (position) {
      fd.append('latitude', String(position[0]))
      fd.append('longitude', String(position[1]))
    }
    if (cinCopie) fd.append('cin_copie', cinCopie)

    try {
      const res = await fetch(resolveBackendUrl('/api/construction/goudronnage/'), {
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
      <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Demande de Goudronnage' }]}>
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="text-success mb-4"><i className="fas fa-check-circle fa-5x"></i></div>
          <h2 className="fw-bold mb-2">{lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Demande envoyée avec succès !'}</h2>
          <p className="text-muted mb-4 text-center">
            {lang === 'ar'
              ? 'سيتم معالجة طلب تعبيد الطريق من قِبل المصالح التقنية للبلدية.'
              : 'Votre demande de goudronnage sera traitée par les services techniques de la municipalité.'}
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
      breadcrumbs={[{ label: lang === 'ar' ? 'طلب تعبيد طريق' : 'Demande de Goudronnage de la Rue' }]}
    >
      <style>{`
        .goud-card { background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
        .goud-section { font-weight: 700; color: #1565c0; font-size: .95rem; border-bottom: 2px solid #e3f2fd; padding-bottom: .4rem; margin-bottom: 1.2rem; }
        .req-badge { display: inline-flex; align-items: center; gap: .4rem; background: #e3f2fd; color: #1565c0; border-radius: .5rem; padding: .25rem .7rem; font-size: .8rem; font-weight: 600; }
        .fok { display: inline-flex; align-items: center; gap: .3rem; background: #d4edda; color: #155724; border-radius: .4rem; padding: .2rem .6rem; font-size: .8rem; }
      `}</style>

      <div className="container-fluid px-0 py-4" style={{ maxWidth: 760 }}>
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#1a3a5c,#1565c0)', color: '#fff', fontSize: '1.4rem' }}>
            <i className="fas fa-road"></i>
          </div>
          <div>
            <h1 className="fw-bold mb-0" style={{ fontSize: '1.5rem' }}>
              {lang === 'ar' ? 'طلب تعبيد طريق' : 'Demande de Goudronnage de la Rue'}
            </h1>
            <p className="text-muted mb-0 small">
              {lang === 'ar'
                ? 'لطلب تعبيد الطريق أو تهيئتها أمام مقر سكنك'
                : 'Pour demander le goudronnage ou l\'aménagement de la route devant votre résidence.'}
            </p>
          </div>
        </div>

        {/* Documents requis */}
        <div className="alert alert-info rounded-3 mb-4 d-flex gap-2 align-items-start">
          <i className="fas fa-info-circle mt-1"></i>
          <div>
            <strong>{lang === 'ar' ? 'الوثائق المطلوبة:' : 'Documents requis :'}</strong>
            <div className="d-flex flex-wrap gap-2 mt-2">
              {[
                lang === 'ar' ? 'هوية صاحب المطلب' : 'Identité du demandeur',
                lang === 'ar' ? 'نسخة من البطاقة الوطنية' : 'Copie de la CIN',
                lang === 'ar' ? 'عنوان السكن' : 'Adresse de résidence',
                lang === 'ar' ? 'الموقع الدقيق للطريق' : 'Localisation exacte de la rue',
              ].map((doc, i) => (
                <span key={i} className="req-badge"><i className="fas fa-check"></i> {doc}</span>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="goud-card mb-4">
            <div className="goud-section">
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
                  placeholder={lang === 'ar' ? 'الاسم واللقب' : 'Ex: Mohamed Ben Ali'}
                  value={form.nom_prenom} onChange={e => update('nom_prenom', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  {lang === 'ar' ? 'رقم بطاقة التعريف الوطنية *' : 'Numéro CIN *'}
                </label>
                <input
                  type="text" className="form-control rounded-3"
                  placeholder="12345678" maxLength={8}
                  value={form.cin} onChange={e => update('cin', e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  {lang === 'ar' ? 'عنوان السكن *' : 'Adresse de résidence *'}
                </label>
                <input
                  type="text" className="form-control rounded-3"
                  placeholder={lang === 'ar' ? 'العنوان الكامل' : 'Ex: 12 Rue de la Mer, Kélibia'}
                  value={form.adresse_residence} onChange={e => update('adresse_residence', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="goud-card mb-4">
            <div className="goud-section">
              <i className="fas fa-road me-2"></i>
              {lang === 'ar' ? 'وصف الطريق المطلوب تعبيدها' : 'Description de la rue concernée'}
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">
                {lang === 'ar' ? 'الموقع الدقيق للطريق أو النهج *' : 'Localisation exacte de la rue / du chemin *'}
              </label>
              <textarea
                className="form-control rounded-3" rows={3}
                placeholder={lang === 'ar'
                  ? 'صف الطريق بدقة: اسم الشارع، الحي، القرب من المعالم...'
                  : 'Décrivez précisément: nom de la rue, quartier, repères proches...'}
                value={form.localisation_rue} onChange={e => update('localisation_rue', e.target.value)}
                required
              />
            </div>

            {/* Map */}
            <label className="form-label fw-semibold small mb-2">
              <i className="fas fa-map-marker-alt me-1 text-danger"></i>
              {lang === 'ar' ? 'حدد الموقع على الخريطة (اختياري)' : 'Indiquer sur la carte (facultatif)'}
            </label>
            <div className="rounded-3 overflow-hidden border" style={{ height: 280 }}>
              <MapContainer
                center={[36.8481, 11.0939]} zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onLocationSelect={(lat, lng) => setPosition([lat, lng])} />
                {position && <Marker position={position} />}
              </MapContainer>
            </div>
            {position && (
              <div className="mt-2 small text-muted">
                <i className="fas fa-check-circle text-success me-1"></i>
                {lang === 'ar' ? 'تم تحديد الموقع:' : 'Position sélectionnée :'} {position[0].toFixed(5)}, {position[1].toFixed(5)}
                <button type="button" className="btn btn-link btn-sm text-danger p-0 ms-2" onClick={() => setPosition(null)}>
                  {lang === 'ar' ? 'حذف' : 'Supprimer'}
                </button>
              </div>
            )}
          </div>

          <div className="goud-card mb-4">
            <div className="goud-section">
              <i className="fas fa-id-card me-2"></i>
              {lang === 'ar' ? 'نسخة من البطاقة الوطنية (اختياري)' : 'Copie de la CIN (facultatif)'}
            </div>

            {!cameraActive ? (
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <input
                  type="file" accept="image/*,.pdf"
                  className="form-control rounded-3 flex-grow-1"
                  onChange={e => setCinCopie(e.target.files?.[0] ?? null)}
                />
                <button type="button" className="btn btn-outline-secondary rounded-3"
                  onClick={() => setCameraActive(true)}>
                  <i className="fas fa-camera me-1"></i>
                  {lang === 'ar' ? 'تصوير' : 'Photo'}
                </button>
                {cinCopie && (
                  <span className="fok"><i className="fas fa-check"></i> {cinCopie.name}</span>
                )}
              </div>
            ) : (
              <WebcamCapture
                onCapture={(blob) => {
                  setCinCopie(new File([blob], `cin_${Date.now()}.jpg`, { type: 'image/jpeg' }))
                  setCameraActive(false)
                }}
                onCancel={() => setCameraActive(false)}
              />
            )}
          </div>

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
            <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold" disabled={loading}>
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
