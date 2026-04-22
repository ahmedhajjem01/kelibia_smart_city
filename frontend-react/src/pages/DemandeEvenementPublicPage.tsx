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

// Public-only types
const PUBLIC_TYPE_OPTIONS = [
  { value: 'concert',    label: '🎵 Concert / حفلة موسيقية' },
  { value: 'culturel',   label: '🎭 Événement culturel / حدث ثقافي' },
  { value: 'sportif',    label: '⚽ Événement sportif / حدث رياضي' },
  { value: 'marche',     label: '🛍️ Marché / سوق' },
  { value: 'association',label: '🤝 Activité associative / نشاط جمعوي' },
  { value: 'religieux',  label: '🕌 Événement religieux / تظاهرة دينية' },
  { value: 'commercial', label: '💼 Événement commercial / حدث تجاري' },
  { value: 'politique',  label: '🏛️ Meeting politique / تجمع سياسي' },
  { value: 'charite',    label: '❤️ Événement caritatif / نشاط خيري' },
  { value: 'autre',      label: '📋 Autre (préciser) / أخرى (تحديد)' },
]

const LIEU_OPTIONS = [
  { value: 'espace_public', label: 'Espace public (rue, place) / فضاء عمومي' },
  { value: 'salle_fetes',   label: 'Salle des fêtes municipale / قاعة الأفراح البلدية' },
  { value: 'stade',         label: 'Stade / ملعب' },
  { value: 'plage',         label: 'Plage / شاطئ' },
  { value: 'autre',         label: 'Autre lieu / مكان آخر' },
]

type GpsStatus = 'none' | 'manual' | 'gps' | 'loading'
const GPS_CONFIG: Record<GpsStatus, { color: string; bg: string; icon: string; text: string }> = {
  none:    { color: '#6c757d', bg: '#f8f9fa', icon: 'fa-map-marker-alt',       text: 'Aucune localisation' },
  manual:  { color: '#0d6efd', bg: '#e7f1ff', icon: 'fa-map-pin',              text: 'Position sur la carte' },
  gps:     { color: '#198754', bg: '#d1e7dd', icon: 'fa-location-arrow',       text: 'Position GPS détectée' },
  loading: { color: '#fd7e14', bg: '#fff3cd', icon: 'fa-circle-notch fa-spin', text: 'Récupération...' },
}

const WebcamCapture = ({ onCapture, onCancel }: { onCapture: (blob: Blob) => void; onCancel: () => void }) => {
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
            <button type="button" onClick={capture} className="btn btn-warning rounded-pill px-4 fw-bold"><i className="fas fa-camera me-2"></i>Capturer</button>
            <button type="button" onClick={onCancel} className="btn btn-outline-light rounded-pill px-4">Annuler</button>
          </div>
        </>
      ) : (
        <>
          <img src={img} alt="cap" className="w-100 rounded-3 mb-3 border border-success border-3" />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={() => fetch(img).then(r => r.blob()).then(b => onCapture(b))} className="btn btn-success rounded-pill px-4 fw-bold"><i className="fas fa-check me-2"></i>Confirmer</button>
            <button type="button" onClick={() => setImg(null)} className="btn btn-outline-warning rounded-pill px-4"><i className="fas fa-undo me-2"></i>Reprendre</button>
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

export default function DemandeEvenementPublicPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cameraActive, setCameraActive] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('none')

  const [form, setForm] = useState({
    titre_evenement: '',
    type_evenement: 'concert',
    type_evenement_libre: '',
    description: '',
    nombre_participants: '',
    lieu_type: 'espace_public',
    lieu_details: '',
    date_debut: '',
    date_fin: '',
    heure_debut: '',
    heure_fin: '',
    nom_organisateur: '',
    cin_organisateur: '',
    telephone_organisateur: '',
    association_nom: '',
  })

  const [files, setFiles] = useState<Record<string, File | Blob | null>>({
    cin_recto: null, cin_verso: null,
    plan_lieu: null, programme_evenement: null,
    attestation_assurance: null, plan_securite: null,
    attestation_association: null,
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

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[
        { label: "Demande d'événement", link: '/demande-evenement' },
        { label: 'Événement public' }
      ]}>
      <div className="container py-2 pb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">

            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="rounded-3 p-3 shadow-sm text-white" style={{ background: 'linear-gradient(135deg,#6f42c1,#0d6efd)', fontSize: '1.5rem' }}>
                <i className="fas fa-bullhorn"></i>
              </div>
              <div>
                <h2 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>
                  {lang === 'ar' ? 'طلب تنظيم فعالية عمومية' : 'Autorisation d\'événement public'}
                </h2>
                <p className="text-muted small mb-0">
                  {lang === 'ar' ? 'حفلات، مهرجانات، أحداث رياضية وثقافية...' : 'Concerts, festivals, événements sportifs et culturels...'}
                </p>
              </div>
              <span className="ms-auto badge rounded-pill px-3 py-2" style={{ background: '#f0e6ff', color: '#6f42c1', fontSize: '.8rem' }}>
                <i className="fas fa-globe me-1"></i>
                {lang === 'ar' ? 'عمومي' : 'Public'}
              </span>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5 bg-white">
                {success ? (
                  <div className="text-center py-5">
                    <i className="fas fa-check-circle fa-5x mb-4" style={{ color: '#6f42c1' }}></i>
                    <h3 className="fw-bold mb-2">Demande envoyée !</h3>
                    <p className="text-muted">Votre demande est en cours de traitement par la municipalité.</p>
                    <p className="text-muted small">Redirection en cours...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className="alert alert-danger rounded-3 mb-4 d-flex gap-2">
                        <i className="fas fa-exclamation-triangle mt-1"></i> {error}
                      </div>
                    )}

                    {/* ── 1. Événement ─────────────────────────────────────── */}
                    <div className="mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#6f42c1', fontSize: '1rem' }}>1</span>
                        <h5 className="fw-bold mb-0">
                          {lang === 'ar' ? 'معلومات الفعالية' : "Informations sur l'événement"}
                        </h5>
                      </div>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className={lc}>
                            {lang === 'ar' ? 'عنوان الفعالية' : "Intitulé de l'événement"} <span className="text-danger">*</span>
                          </label>
                          <input type="text" className={ic} style={is} required
                            value={form.titre_evenement} onChange={e => set('titre_evenement', e.target.value)}
                            placeholder="Ex: Festival de musique de Kélibia 2025" />
                        </div>

                        <div className="col-md-6">
                          <label className={lc}>
                            {lang === 'ar' ? 'نوع الفعالية' : "Type d'événement"} <span className="text-danger">*</span>
                          </label>
                          <select className={ic} style={is} required
                            value={form.type_evenement} onChange={e => set('type_evenement', e.target.value)}>
                            {PUBLIC_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className={lc}>
                            {lang === 'ar' ? 'عدد المشاركين المتوقع' : 'Nombre de participants estimé'} <span className="text-danger">*</span>
                          </label>
                          <input type="number" min={1} className={ic} style={is} required
                            value={form.nombre_participants} onChange={e => set('nombre_participants', e.target.value)}
                            placeholder="Ex: 500" />
                        </div>

                        {form.type_evenement === 'autre' && (
                          <div className="col-12">
                            <label className={lc}>Précisez le type <span className="text-danger">*</span></label>
                            <input type="text" className={ic} style={is} required
                              value={form.type_evenement_libre} onChange={e => set('type_evenement_libre', e.target.value)}
                              placeholder="Ex: Exposition de peinture, Tournoi de pétanque..." />
                          </div>
                        )}

                        {form.type_evenement === 'association' && (
                          <div className="col-12">
                            <label className={lc}>Nom de l'association</label>
                            <input type="text" className={ic} style={is}
                              value={form.association_nom} onChange={e => set('association_nom', e.target.value)}
                              placeholder="Nom officiel de l'association" />
                          </div>
                        )}

                        <div className="col-12">
                          <label className={lc}>
                            {lang === 'ar' ? 'وصف الفعالية' : "Description de l'événement"} <span className="text-danger">*</span>
                          </label>
                          <textarea className="form-control bg-light border-0 shadow-sm" rows={4}
                            style={{ borderRadius: '12px', resize: 'vertical' }} required
                            value={form.description} onChange={e => set('description', e.target.value)}
                            placeholder="Décrivez le programme, les activités, le public cible, les artistes invités..." />
                        </div>
                      </div>
                    </div>

                    {/* ── 2. Lieu & Dates ───────────────────────────────────── */}
                    <div className="mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#0d6efd', fontSize: '1rem' }}>2</span>
                        <h5 className="fw-bold mb-0">
                          {lang === 'ar' ? 'المكان والتواريخ' : 'Lieu & Dates'}
                        </h5>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className={lc}>Type de lieu <span className="text-danger">*</span></label>
                          <select className={ic} style={is} required
                            value={form.lieu_type} onChange={e => set('lieu_type', e.target.value)}>
                            {LIEU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className={lc}>Adresse précise <span className="text-danger">*</span></label>
                          <input type="text" className={ic} style={is} required
                            value={form.lieu_details} onChange={e => set('lieu_details', e.target.value)}
                            placeholder="Ex: Place de l'Indépendance, Kélibia" />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>Date début <span className="text-danger">*</span></label>
                          <input type="date" className={ic} style={is} required
                            value={form.date_debut} onChange={e => set('date_debut', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>Heure début <span className="text-danger">*</span></label>
                          <input type="time" className={ic} style={is} required
                            value={form.heure_debut} onChange={e => set('heure_debut', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>Date fin <span className="text-danger">*</span></label>
                          <input type="date" className={ic} style={is} required min={form.date_debut}
                            value={form.date_fin} onChange={e => set('date_fin', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>Heure fin <span className="text-danger">*</span></label>
                          <input type="time" className={ic} style={is} required
                            value={form.heure_fin} onChange={e => set('heure_fin', e.target.value)} />
                        </div>
                      </div>

                      {/* Map */}
                      <div className="mt-4">
                        <label className={lc}>Localisation GPS (optionnel)</label>
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          {(() => { const c = GPS_CONFIG[gpsStatus]; return (
                            <span className="badge rounded-pill px-3 py-2 fw-normal"
                              style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33`, fontSize: '.82rem' }}>
                              <i className={`fas ${c.icon} me-1`}></i>{c.text}
                            </span>
                          )})()}
                          {position && <span className="text-muted small">{position[0].toFixed(5)}, {position[1].toFixed(5)}</span>}
                        </div>
                        <div className="d-flex gap-2 mb-3">
                          <button type="button" onClick={getLocation}
                            className={`btn rounded-pill px-4 ${gpsStatus === 'loading' ? 'btn-warning disabled' : 'btn-outline-success'}`}>
                            <i className="fas fa-crosshairs me-2"></i>Ma position
                          </button>
                          {position && (
                            <button type="button" className="btn btn-outline-secondary rounded-pill px-4"
                              onClick={() => { setPosition(null); setGpsStatus('none') }}>
                              <i className="fas fa-times me-2"></i>Effacer
                            </button>
                          )}
                        </div>
                        <div className="rounded-4 overflow-hidden shadow-sm" style={{ height: 300, border: '2px solid #dee2e6' }}>
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
                          {lang === 'ar' ? 'معلومات المنظِّم' : "Informations sur l'organisateur"}
                        </h5>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className={lc}>Nom complet <span className="text-danger">*</span></label>
                          <input type="text" className={ic} style={is} required
                            value={form.nom_organisateur} onChange={e => set('nom_organisateur', e.target.value)}
                            placeholder="Prénom & Nom" />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>CIN <span className="text-danger">*</span></label>
                          <input type="text" className={ic} style={is} required maxLength={8}
                            value={form.cin_organisateur} onChange={e => set('cin_organisateur', e.target.value)}
                            placeholder="12345678" />
                        </div>
                        <div className="col-md-3">
                          <label className={lc}>Téléphone <span className="text-danger">*</span></label>
                          <input type="tel" className={ic} style={is} required
                            value={form.telephone_organisateur} onChange={e => set('telephone_organisateur', e.target.value)}
                            placeholder="XX XXX XXX" />
                        </div>
                      </div>
                    </div>

                    {/* ── 4. Documents ──────────────────────────────────────── */}
                    <div className="mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#dc3545', fontSize: '1rem' }}>4</span>
                        <h5 className="fw-bold mb-0">
                          {lang === 'ar' ? 'الوثائق المطلوبة' : 'Documents justificatifs'}
                        </h5>
                      </div>

                      {/* Required: CIN */}
                      <div className="row g-2 mb-3">
                        <div className="col-md-6"><FileControl field="cin_recto" label="CIN Recto" required /></div>
                        <div className="col-md-6"><FileControl field="cin_verso" label="CIN Verso" required /></div>
                      </div>

                      {/* Public events require more docs */}
                      <div className="alert border-0 rounded-3 mb-4 d-flex gap-2"
                        style={{ background: '#fff3e0', color: '#e65100', fontSize: '.85rem' }}>
                        <i className="fas fa-exclamation-circle mt-1"></i>
                        <span>
                          <strong>Événement public :</strong> Un plan de sécurité et une attestation d'assurance sont <strong>fortement recommandés</strong> pour les événements accueillant plus de 100 personnes.
                        </span>
                      </div>

                      <FileControl field="programme_evenement" label="Programme de l'événement (PDF)" />
                      <FileControl field="plan_lieu" label="Plan / Carte du lieu" />
                      <FileControl field="attestation_assurance" label="Attestation d'assurance responsabilité civile" />
                      <FileControl field="plan_securite" label="Plan de sécurité" />
                      {form.type_evenement === 'association' && (
                        <FileControl field="attestation_association" label="Attestation d'enregistrement de l'association" />
                      )}

                      <div className="alert alert-info rounded-3 mt-2 d-flex gap-2 align-items-start" style={{ fontSize: '.85rem' }}>
                        <i className="fas fa-info-circle mt-1"></i>
                        <span>Les documents marqués <strong className="text-danger">*</strong> sont obligatoires. Les autres peuvent être apportés à la mairie.</span>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="d-grid gap-3">
                      <button type="submit" disabled={loading}
                        className="btn btn-lg rounded-pill py-3 fw-bold shadow-lg text-white"
                        style={{ background: 'linear-gradient(135deg,#6f42c1,#0d6efd)', border: 'none' }}>
                        {loading
                          ? <><span className="spinner-border spinner-border-sm me-3"></span>Envoi en cours...</>
                          : <><i className="fas fa-paper-plane me-3"></i>Soumettre la demande</>}
                      </button>
                      <Link to="/demande-evenement" className="btn btn-link text-muted text-decoration-none text-center">
                        <i className="fas fa-arrow-left me-2"></i>Retour au choix
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
