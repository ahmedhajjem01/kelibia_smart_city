import { resolveBackendUrl } from '../lib/backendUrl'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
L.Marker.prototype.options.icon = DefaultIcon
const KELIBIA_CENTER: [number, number] = [36.8474, 11.0991]

const WebcamCapture = ({ onCapture, onCancel, lang }: { onCapture: (blob: Blob) => void; onCancel: () => void; lang?: string }) => {
  const ref = useRef<Webcam>(null)
  const [img, setImg] = useState<string | null>(null)
  const capture = useCallback(() => { const s = ref.current?.getScreenshot(); if (s) setImg(s) }, [])
  return (
    <div className="text-center bg-dark p-3 rounded-4 shadow-lg mb-4">
      {!img ? (
        <>
          <Webcam audio={false} ref={ref} screenshotFormat="image/jpeg"
            className="w-100 rounded-3 mb-3" videoConstraints={{ facingMode: 'environment' }} />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={capture} className="btn btn-warning rounded-pill px-4 fw-bold"><i className={`fas fa-camera ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'التقاط' : 'Capturer'}</button>
            <button type="button" onClick={onCancel} className="btn btn-outline-light rounded-pill px-4">{lang === 'ar' ? 'إلغاء' : 'Annuler'}</button>
          </div>
        </>
      ) : (
        <>
          <img src={img} alt="cap" className="w-100 rounded-3 mb-3 border border-success border-3" />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={() => fetch(img).then(r => r.blob()).then(b => onCapture(b))} className="btn btn-success rounded-pill px-4 fw-bold"><i className={`fas fa-check ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'تأكيد' : 'Confirmer'}</button>
            <button type="button" onClick={() => setImg(null)} className="btn btn-outline-warning rounded-pill px-4"><i className={`fas fa-undo ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'إعادة' : 'Reprendre'}</button>
          </div>
        </>
      )}
    </div>
  )
}

function LocationMarker({ position, onMapClick }: { position: [number, number] | null; onMapClick: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { onMapClick([e.latlng.lat, e.latlng.lng]) } })
  return position ? <Marker position={position} /> : null
}

export default function DemandeEvenementPrivePage() {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cameraActive, setCameraActive] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('none')

  const PRIVATE_TYPE_OPTIONS = [
    { value: 'mariage',         label: lang === 'ar' ? '💍 زفاف' : '💍 Mariage' },
    { value: 'fete_familiale',  label: lang === 'ar' ? '🎂 احتفال عائلي' : '🎂 Fête familiale' },
    { value: 'remise_diplomes', label: lang === 'ar' ? '🎓 تسليم الشهادات' : '🎓 Remise de diplômes' },
  ]

  const LIEU_OPTIONS = [
    { value: 'salle_fetes',    label: lang === 'ar' ? 'قاعة الأفراح' : 'Salle des fêtes' },
    { value: 'domicile_prive', label: lang === 'ar' ? 'المنزل الخاص' : 'Domicile privé' },
    { value: 'espace_public',  label: lang === 'ar' ? 'فضاء عمومي (شارع، ساحة)' : 'Espace public (rue, place)' },
    { value: 'stade',          label: lang === 'ar' ? 'ملعب' : 'Stade' },
    { value: 'autre',          label: lang === 'ar' ? 'مكان آخر' : 'Autre lieu' },
  ]

  type GpsStatus = 'none' | 'manual' | 'gps' | 'loading'
  const GPS_CONFIG: Record<GpsStatus, { color: string; bg: string; icon: string; text: string }> = {
    none:    { color: '#6c757d', bg: '#f8f9fa', icon: 'fa-map-marker-alt',       text: lang === 'ar' ? 'لا يوجد موقع' : 'Aucune localisation' },
    manual:  { color: '#198754', bg: '#d1e7dd', icon: 'fa-map-pin',              text: lang === 'ar' ? 'موقع على الخريطة' : 'Position sur la carte' },
    gps:     { color: '#198754', bg: '#d1e7dd', icon: 'fa-location-arrow',       text: lang === 'ar' ? 'موقع تم تحديده' : 'Position GPS détectée' },
    loading: { color: '#fd7e14', bg: '#fff3cd', icon: 'fa-circle-notch fa-spin', text: lang === 'ar' ? 'جاري التحميل...' : 'Récupération...' },
  }

  const [form, setForm] = useState({
    titre_evenement: '',
    type_evenement: 'mariage',
    description: '',
    nombre_participants: '',
    lieu_type: 'salle_fetes',
    lieu_details: '',
    date_debut: '',
    date_fin: '',
    heure_debut: '',
    heure_fin: '',
    nom_organisateur: '',
    cin_organisateur: '',
    telephone_organisateur: '',
  })

  const [files, setFiles] = useState<Record<string, File | Blob | null>>({
    cin_recto: null,
    cin_verso: null,
    programme_evenement: null,
  })

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setUser(d)).catch(() => {})
  }, [navigate])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setFile = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files?.[0]) setFiles(f => ({ ...f, [field]: e.target.files![0] }))
  }
  const handleCapture = (blob: Blob, field: string) => {
    setFiles(f => ({ ...f, [field]: new File([blob], `${field}.jpg`, { type: 'image/jpeg' }) }))
    setCameraActive(null)
  }

  const getLocation = () => {
    if (!navigator.geolocation) return
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      p => { setPosition([p.coords.latitude, p.coords.longitude]); setGpsStatus('gps') },
      () => setGpsStatus('none'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) data.append(k, v) })
    if (position) { data.append('latitude', String(position[0])); data.append('longitude', String(position[1])) }
    Object.entries(files).forEach(([k, v]) => {
      if (v) {
        if (v instanceof File) {
          const extension = v.name.split('.').pop()
          const newName = `${k}_${Date.now()}.${extension}`
          const renamedFile = new File([v], newName, { type: v.type })
          data.append(k, renamedFile)
        } else {
          data.append(k, v as Blob)
        }
      }
    })
    try {
      const res = await fetch(resolveBackendUrl('/api/evenements/demande/'), {
        method: 'POST', headers: { Authorization: `Bearer ${access}` }, body: data,
      })
      if (res.ok) { setSuccess(true); setTimeout(() => navigate('/mes-evenements'), 3000) }
      else { const d = await res.json(); setError(typeof d === 'object' ? JSON.stringify(d) : String(d)) }
    } catch { setError('Une erreur est survenue. Vérifiez votre connexion.') }
    finally { setLoading(false) }
  }

  const ic = 'form-control form-control-lg bg-light border-0 shadow-sm'
  const is = { borderRadius: '12px' }
  const lc = 'form-label fw-bold small text-uppercase text-muted'

  const FileControl = ({ field, label, required = false }: { field: string; label: string; required?: boolean }) => (
    <div className="mb-4">
      <label className="form-label fw-bold text-muted small text-uppercase d-block mb-2">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {cameraActive === field ? (
        <WebcamCapture onCapture={b => handleCapture(b, field)} onCancel={() => setCameraActive(null)} />
      ) : (
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="flex-grow-1">
            <input type="file" className="form-control form-control-lg bg-light border-0 shadow-sm"
              onChange={e => setFile(e, field)}
              accept={field === 'cin_recto' || field === 'cin_verso' ? 'image/*' : 'image/*,application/pdf'}
              required={required && !files[field]} style={is} />
          </div>
          {(field === 'cin_recto' || field === 'cin_verso') && (
            <button type="button" className="btn btn-warning rounded-pill px-3 shadow-sm"
              onClick={() => setCameraActive(field)}><i className="fas fa-camera"></i></button>
          )}
          {files[field] && <span className="badge bg-success rounded-pill px-3 py-2"><i className="fas fa-check me-1"></i>Ajouté</span>}
        </div>
      )}
    </div>
  )

  // Label helpers by event type
  const eventTypeLabel = PRIVATE_TYPE_OPTIONS.find(o => o.value === form.type_evenement)?.label ?? ''

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[
        { label: lang === 'ar' ? 'طلب تنظيم فعالية' : "Demande d'événement", link: '/demande-evenement' },
        { label: lang === 'ar' ? 'فعالية خاصة' : 'Événement privé' }
      ]}>
      <div className={`container py-2 pb-5 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">

            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="rounded-3 p-3 shadow-sm text-white" style={{ background: 'linear-gradient(135deg,#198754,#20c997)', fontSize: '1.5rem' }}>
                <i className="fas fa-home"></i>
              </div>
              <div>
                <h2 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>
                  {lang === 'ar' ? 'طلب إذن تنظيم فعالية خاصة' : 'Déclaration d\'événement privé'}
                </h2>
                <p className="text-muted small mb-0">
                  {lang === 'ar' ? 'زفاف، فرح عائلي، تخرج...' : 'Mariage, fête familiale, remise de diplômes...'}
                </p>
              </div>
              <span className="ms-auto badge rounded-pill px-3 py-2" style={{ background: '#e8f5e9', color: '#198754', fontSize: '.8rem' }}>
                <i className="fas fa-lock me-1"></i>
                {lang === 'ar' ? 'خاص' : 'Privé'}
              </span>
            </div>

            {/* Info note for private events */}
            <div className="alert border-0 rounded-4 mb-4 d-flex align-items-start gap-3"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0 !important' }}>
              <i className="fas fa-info-circle mt-1" style={{ color: '#198754', fontSize: '1.1rem' }}></i>
              <div style={{ fontSize: '.85rem', color: '#166534' }}>
                <strong>{lang === 'ar' ? 'تصريح مسبق بسيط' : 'Déclaration préalable simplifiée'}</strong>
                <p className="mb-0 mt-1">
                  {lang === 'ar'
                    ? 'الفعاليات الخاصة تتطلب فقط تصريحًا مسبقًا للتأكد من عدم تعارضها مع فعاليات أخرى في نفس المكان. لا يُشترط خطة أمن ولا تأمين.'
                    : 'Les événements privés nécessitent uniquement une déclaration préalable pour s\'assurer qu\'il n\'y a pas de conflit de lieu. Aucun plan de sécurité ni assurance n\'est requis.'}
                </p>
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5 bg-white">
                {success ? (
                  <div className="text-center py-5">
                    <i className="fas fa-check-circle fa-5x mb-4" style={{ color: '#198754' }}></i>
                    <h3 className="fw-bold mb-2">{lang === 'ar' ? 'تم إرسال التصريح!' : 'Déclaration envoyée !'}</h3>
                    <p className="text-muted">{lang === 'ar' ? 'تم استلام تصريح الفعالية الخاصة بك من قبل البلدية.' : "Votre déclaration d'événement privé a été reçue par la municipalité."}</p>
                    <p className="text-muted small">{lang === 'ar' ? 'جاري التوجيه...' : 'Redirection en cours...'}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className="alert alert-danger rounded-3 mb-4 d-flex gap-2">
                        <i className={`fas fa-exclamation-triangle mt-1 ${lang === 'ar' ? 'ms-2' : ''}`}></i> {error}
                      </div>
                    )}

                    {/* ── 1. Événement ─────────────────────────────────────── */}
                    <div className="mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#198754', fontSize: '1rem' }}>1</span>
                        <h5 className="fw-bold mb-0">
                          {lang === 'ar' ? 'معلومات الفعالية' : "Informations sur l'événement"}
                        </h5>
                      </div>
                      <div className="row g-3">

                        <div className="col-md-6">
                          <label className={lc}>
                            {lang === 'ar' ? 'نوع الفعالية' : "Type d'événement"} <span className="text-danger">*</span>
                          </label>
                          <select className={ic} style={is} required dir="auto"
                            value={form.type_evenement} onChange={e => set('type_evenement', e.target.value)}>
                            {PRIVATE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className={lc}>
                            {lang === 'ar' ? 'عنوان / اسم الفعالية' : "Intitulé / Nom de l'événement"} <span className="text-danger">*</span>
                          </label>
                          <input type="text" className={ic} style={is} required dir="auto"
                            value={form.titre_evenement} onChange={e => set('titre_evenement', e.target.value)}
                            placeholder={
                              lang === 'ar' ?
                              (form.type_evenement === 'mariage' ? 'مثال: زفاف بن علي — الطرابلسي' :
                              form.type_evenement === 'fete_familiale' ? 'مثال: عيد ميلاد محمد، 50 سنة' :
                              'مثال: حفل تخرج — عائلة شعبان') :
                              (form.type_evenement === 'mariage' ? 'Ex: Mariage Ben Ali — Trabelsi' :
                              form.type_evenement === 'fete_familiale' ? 'Ex: Anniversaire de Mohamed, 50 ans' :
                              'Ex: Remise de diplômes — Famille Chaabane')
                            } />
                        </div>

                        <div className="col-md-6">
                          <label className={lc}>
                            {lang === 'ar' ? 'عدد المدعوين المتوقع' : 'Nombre d\'invités estimé'} <span className="text-danger">*</span>
                          </label>
                          <input type="number" min={1} className={ic} style={is} required dir="ltr"
                            value={form.nombre_participants} onChange={e => set('nombre_participants', e.target.value)}
                            placeholder="Ex: 150" />
                        </div>

                        <div className="col-12">
                          <label className={lc}>
                            {lang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes / Remarques (optionnel)'}
                          </label>
                          <textarea className="form-control bg-light border-0 shadow-sm" rows={3}
                            style={{ borderRadius: '12px', resize: 'vertical' }} dir="auto"
                            value={form.description} onChange={e => set('description', e.target.value)}
                            placeholder={
                              lang === 'ar'
                                ? 'أي معلومات إضافية تودّ الإشارة إليها...'
                                : 'Informations complémentaires, besoins particuliers, programme...'
                            } />
                        </div>
                      </div>
                    </div>

                    {/* ── 2. Lieu & Dates ───────────────────────────────────── */}
                    <div className="mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#20c997', fontSize: '1rem' }}>2</span>
                        <h5 className="fw-bold mb-0">
                          {lang === 'ar' ? 'المكان والتواريخ' : 'Lieu & Dates'}
                        </h5>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className={lc}>{lang === 'ar' ? 'نوع المكان' : 'Type de lieu'} <span className="text-danger">*</span></label>
                          <select className={ic} style={is} required dir="auto"
                            value={form.lieu_type} onChange={e => set('lieu_type', e.target.value)}>
                            {LIEU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className={lc}>{lang === 'ar' ? 'العنوان بالتفصيل' : 'Adresse précise'} <span className="text-danger">*</span></label>
                          <input type="text" className={ic} style={is} required dir="auto"
                            value={form.lieu_details} onChange={e => set('lieu_details', e.target.value)}
                            placeholder={
                              lang === 'ar'
                                ? form.lieu_type === 'domicile_prive'
                                  ? 'مثال: 12 نهج ابن خلدون، قليبية'
                                  : form.lieu_type === 'salle_fetes'
                                  ? 'مثال: قاعة الأفراح الخضراء، قليبية'
                                  : 'مثال: ساحة الاستقلال، قليبية'
                                : form.lieu_type === 'domicile_prive'
                                  ? 'Ex: 12 Rue Ibn Khaldoun, Kélibia'
                                  : form.lieu_type === 'salle_fetes'
                                  ? 'Ex: Salle des fêtes El Khadra, Kélibia'
                                  : 'Ex: Place de l\'Indépendance, Kélibia'
                            } />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>{lang === 'ar' ? 'تاريخ البدء' : 'Date début'} <span className="text-danger">*</span></label>
                          <input type="date" className={ic} style={is} required dir="ltr"
                            value={form.date_debut} onChange={e => set('date_debut', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>{lang === 'ar' ? 'ساعة البدء' : 'Heure début'} <span className="text-danger">*</span></label>
                          <input type="time" className={ic} style={is} required dir="ltr"
                            value={form.heure_debut} onChange={e => set('heure_debut', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>{lang === 'ar' ? 'تاريخ الانتهاء' : 'Date fin'} <span className="text-danger">*</span></label>
                          <input type="date" className={ic} style={is} required min={form.date_debut} dir="ltr"
                            value={form.date_fin} onChange={e => set('date_fin', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>{lang === 'ar' ? 'ساعة الانتهاء' : 'Heure fin'} <span className="text-danger">*</span></label>
                          <input type="time" className={ic} style={is} required dir="ltr"
                            value={form.heure_fin} onChange={e => set('heure_fin', e.target.value)} />
                        </div>
                      </div>

                      {/* Map */}
                      <div className="mt-4">
                        <label className={lc}>{lang === 'ar' ? 'الموقع الجغرافي (اختياري)' : 'Localisation GPS (optionnel)'}</label>
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          {(() => { const c = GPS_CONFIG[gpsStatus]; return (
                            <span className="badge rounded-pill px-3 py-2 fw-normal"
                              style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33`, fontSize: '.82rem' }} dir="ltr">
                              <i className={`fas ${c.icon} ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{c.text}
                            </span>
                          )})()}
                          {position && <span className="text-muted small" dir="ltr">{position[0].toFixed(5)}, {position[1].toFixed(5)}</span>}
                        </div>
                        <div className="d-flex gap-2 mb-3">
                          <button type="button" onClick={getLocation}
                            className={`btn rounded-pill px-4 ${gpsStatus === 'loading' ? 'btn-warning disabled' : 'btn-outline-success'}`}>
                            <i className={`fas fa-crosshairs ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'موقعي' : 'Ma position'}
                          </button>
                          {position && (
                            <button type="button" className="btn btn-outline-secondary rounded-pill px-4"
                              onClick={() => { setPosition(null); setGpsStatus('none') }}>
                              <i className={`fas fa-times ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'مسح' : 'Effacer'}
                            </button>
                          )}
                        </div>
                        <div className="rounded-4 overflow-hidden shadow-sm" style={{ height: 280, border: '2px solid #dee2e6' }} dir="ltr">
                          <MapContainer center={position || KELIBIA_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker position={position} onMapClick={p => { setPosition(p); setGpsStatus('manual') }} />
                          </MapContainer>
                        </div>
                      </div>
                    </div>

                    {/* ── 3. Organisateur ───────────────────────────────────── */}
                    <div className="mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#198754', fontSize: '1rem' }}>3</span>
                        <h5 className="fw-bold mb-0">
                          {lang === 'ar' ? 'معلومات المُصرِّح' : 'Informations sur le déclarant'}
                        </h5>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className={lc}>{lang === 'ar' ? 'الاسم الكامل' : 'Nom complet'} <span className="text-danger">*</span></label>
                          <input type="text" className={ic} style={is} required dir="auto"
                            value={form.nom_organisateur} onChange={e => set('nom_organisateur', e.target.value)}
                            placeholder={lang === 'ar' ? 'الاسم واللقب' : "Prénom & Nom"} />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>{lang === 'ar' ? 'بطاقة التعريف' : 'CIN'} <span className="text-danger">*</span></label>
                          <input type="text" className={ic} style={is} required maxLength={8} dir="ltr"
                            value={form.cin_organisateur} onChange={e => set('cin_organisateur', e.target.value)}
                            placeholder="12345678" />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>{lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'} <span className="text-danger">*</span></label>
                          <input type="tel" className={ic} style={is} required dir="ltr"
                            value={form.telephone_organisateur} onChange={e => set('telephone_organisateur', e.target.value)}
                            placeholder="XX XXX XXX" />
                        </div>
                      </div>
                    </div>

                    {/* ── 4. Documents ──────────────────────────────────────── */}
                    <div className="mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#20c997', fontSize: '1rem' }}>4</span>
                        <h5 className="fw-bold mb-0">
                          {lang === 'ar' ? 'الوثائق المطلوبة' : 'Documents justificatifs'}
                        </h5>
                      </div>

                      {/* Private events: only CIN required */}
                      <div className="alert border-0 rounded-3 mb-4 d-flex gap-2"
                        style={{ background: '#f0fdf4', color: '#166534', fontSize: '.85rem' }}>
                        <i className={`fas fa-check-circle mt-1 ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
                        <span>
                          <strong>{lang === 'ar' ? 'فعالية خاصة:' : 'Événement privé :'}</strong> {lang === 'ar' ? 'نسخة من بطاقة التعريف الوطنية هي الوثيقة الإلزامية الوحيدة.' : 'Seule la copie de votre CIN est obligatoire.'}
                          {eventTypeLabel.includes('Mariage') && (lang === 'ar' ? ' بالنسبة للزفاف، يمكنك أيضاً إرفاق عقد كراء القاعة إن وجد.' : ' Pour un mariage, vous pouvez aussi joindre le contrat de location de salle si disponible.')}
                        </span>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-6"><FileControl field="cin_recto" label="CIN Recto" required /></div>
                        <div className="col-md-6"><FileControl field="cin_verso" label="CIN Verso" required /></div>
                      </div>

                      <FileControl field="programme_evenement" label={lang === 'ar' ? 'برنامج / عقد القاعة (اختياري)' : "Programme / Contrat de salle (optionnel)"} />

                      <div className="alert alert-info rounded-3 mt-2 d-flex gap-2 align-items-start" style={{ fontSize: '.85rem' }}>
                        <i className={`fas fa-info-circle mt-1 ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
                        <span>{lang === 'ar' ? 'الوثائق التي تحمل علامة ' : 'Les documents marqués '}<strong className="text-danger">*</strong>{lang === 'ar' ? ' إلزامية. يمكن تقديم باقي الوثائق إلى البلدية إذا لزم الأمر.' : ' sont obligatoires. Les autres peuvent être apportés à la mairie si nécessaire.'}</span>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="d-grid gap-3">
                      <button type="submit" disabled={loading}
                        className="btn btn-lg rounded-pill py-3 fw-bold shadow-lg text-white"
                        style={{ background: 'linear-gradient(135deg,#198754,#20c997)', border: 'none' }}>
                        {loading
                          ? <><span className="spinner-border spinner-border-sm me-3"></span>{lang === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...'}</>
                          : <><i className={`fas fa-paper-plane ${lang === 'ar' ? 'ms-3' : 'me-3'}`}></i>{lang === 'ar' ? 'إرسال التصريح' : 'Soumettre la déclaration'}</>}
                      </button>
                      <Link to="/demande-evenement" className="btn btn-link text-muted text-decoration-none text-center">
                        <i className={`fas fa-arrow-${lang === 'ar' ? 'right' : 'left'} ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'الرجوع للاختيار' : 'Retour au choix'}
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
