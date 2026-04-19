import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
L.Marker.prototype.options.icon = DefaultIcon

const KELIBIA_CENTER: [number, number] = [36.8474, 11.0991]

type GpsStatus = 'none' | 'manual' | 'gps' | 'loading'
const gpsStatusConfig: Record<GpsStatus, { color: string; bg: string; icon: string; text: string }> = {
  none:    { color: '#6c757d', bg: '#f8f9fa', icon: 'fa-map-marker-alt',      text: 'Aucune localisation sélectionnée' },
  manual:  { color: '#0d6efd', bg: '#e7f1ff', icon: 'fa-map-pin',             text: 'Position choisie sur la carte' },
  gps:     { color: '#198754', bg: '#d1e7dd', icon: 'fa-location-arrow',      text: 'Position GPS détectée' },
  loading: { color: '#fd7e14', bg: '#fff3cd', icon: 'fa-circle-notch fa-spin', text: 'Récupération de la position...' },
}

// ─── Webcam capture component ────────────────────────────────────────────────
const WebcamCapture = ({ onCapture, onCancel }: { onCapture: (blob: Blob) => void; onCancel: () => void }) => {
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
    <div className="text-center bg-dark p-3 rounded-4 shadow-lg mb-4">
      {!imgSrc ? (
        <>
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
            className="w-100 rounded-3 mb-3 border border-secondary"
            videoConstraints={{ facingMode: 'environment' }} />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={capture} className="btn btn-warning rounded-pill px-4 fw-bold"><i className="fas fa-camera me-2"></i> Capturer</button>
            <button type="button" onClick={onCancel} className="btn btn-outline-light rounded-pill px-4">Annuler</button>
          </div>
        </>
      ) : (
        <>
          <img src={imgSrc} alt="Capture" className="w-100 rounded-3 mb-3 border border-success border-3" />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={confirm} className="btn btn-success rounded-pill px-4 fw-bold"><i className="fas fa-check me-2"></i> Confirmer</button>
            <button type="button" onClick={() => setImgSrc(null)} className="btn btn-outline-warning rounded-pill px-4"><i className="fas fa-undo me-2"></i> Reprendre</button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Map click handler ────────────────────────────────────────────────────────
function LocationMarker({ position, onMapClick }: { position: [number, number] | null; onMapClick: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { onMapClick([e.latlng.lat, e.latlng.lng]) } })
  return position ? <Marker position={position} /> : null
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DemandeEvenementPage() {
  useI18n()
  const navigate = useNavigate()

  type UserInfo = { first_name: string; last_name: string; email: string; is_verified: boolean }
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cameraActive, setCameraActive] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('none')

  const [form, setForm] = useState({
    titre_evenement: '',
    type_evenement: 'fete_familiale',
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
    cin_recto: null,
    cin_verso: null,
    plan_lieu: null,
    programme_evenement: null,
    attestation_assurance: null,
    plan_securite: null,
    attestation_association: null,
  })

  // Fetch user info
  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok && r.json())
      .then(d => d && setUser(d))
      .catch(console.error)
  }, [navigate])

  const handleField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files?.[0]) setFiles(f => ({ ...f, [field]: e.target.files![0] }))
  }
  const handleCapture = (blob: Blob, field: string) => {
    setFiles(f => ({ ...f, [field]: new File([blob], `${field}.jpg`, { type: 'image/jpeg' }) }))
    setCameraActive(null)
  }

  const handleMapClick = (pos: [number, number]) => { setPosition(pos); setGpsStatus('manual') }
  const clearLocation = () => { setPosition(null); setGpsStatus('none') }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { setError('La géolocalisation n\'est pas supportée par votre navigateur.'); return }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition([pos.coords.latitude, pos.coords.longitude]); setGpsStatus('gps') },
      err => {
        setGpsStatus('none')
        if (err.code === err.PERMISSION_DENIED) setError('Accès à la localisation refusé. Veuillez l\'autoriser dans votre navigateur.')
        else setError('Impossible de récupérer votre position. Veuillez placer manuellement le marqueur sur la carte.')
      },
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
    Object.entries(files).forEach(([k, v]) => { if (v) data.append(k, v as Blob) })

    try {
      const res = await fetch(resolveBackendUrl('/api/evenements/demande/'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` },
        body: data,
      })
      if (res.ok) { setSuccess(true); setTimeout(() => navigate('/mes-evenements'), 3000) }
      else {
        const errData = await res.json()
        setError(typeof errData === 'object' ? JSON.stringify(errData) : String(errData))
      }
    } catch { setError('Une erreur est survenue. Vérifiez votre connexion et réessayez.') }
    finally { setLoading(false) }
  }

  const renderFileControl = (field: string, label: string, required = false) => (
    <div className="mb-4">
      <label className="form-label fw-bold text-muted small text-uppercase d-block mb-2">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {cameraActive === field ? (
        <WebcamCapture onCapture={blob => handleCapture(blob, field)} onCancel={() => setCameraActive(null)} />
      ) : (
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="flex-grow-1">
            <input type="file" className="form-control form-control-lg bg-light border-0 shadow-sm"
              onChange={e => handleFileChange(e, field)}
              accept={field === 'cin_recto' || field === 'cin_verso' ? 'image/*' : 'image/*,application/pdf'}
              required={required && !files[field]} style={{ borderRadius: '12px' }} />
          </div>
          {(field === 'cin_recto' || field === 'cin_verso') && (
            <button type="button" className="btn btn-warning rounded-pill px-3 shadow-sm"
              onClick={() => setCameraActive(field)} title="Prendre une photo">
              <i className="fas fa-camera"></i>
            </button>
          )}
          {files[field] && (
            <span className="badge bg-success rounded-pill px-3 py-2">
              <i className="fas fa-check me-1"></i> Ajouté
            </span>
          )}
        </div>
      )}
    </div>
  )

  const TYPE_OPTIONS = [
    { value: 'fete_familiale',  label: '🎂 Fête familiale / حفل عائلي' },
    { value: 'mariage',         label: '💍 Cérémonie de mariage / حفل زفاف' },
    { value: 'remise_diplomes', label: '🎓 Remise de diplômes / حفل التخرج' },
    { value: 'concert',         label: '🎵 Concert / حفلة موسيقية' },
    { value: 'marche',          label: '🛍️ Marché / سوق' },
    { value: 'association',     label: '🤝 Activité associative / نشاط جمعوي' },
    { value: 'sportif',         label: '⚽ Événement sportif / حدث رياضي' },
    { value: 'culturel',        label: '🎭 Événement culturel / حدث ثقافي' },
    { value: 'commercial',      label: '💼 Événement commercial / حدث تجاري' },
    { value: 'religieux',       label: '🕌 Événement religieux / تظاهرة دينية' },
    { value: 'politique',       label: '🏛️ Réunion / Meeting politique / تجمع سياسي' },
    { value: 'charite',         label: '❤️ Événement caritatif / نشاط خيري' },
    { value: 'autre',           label: '📋 Autre (préciser) / أخرى (تحديد)' },
  ]

  const LIEU_OPTIONS = [
    { value: 'espace_public',  label: 'Espace public (rue, place) / فضاء عمومي' },
    { value: 'salle_fetes',    label: 'Salle des fêtes municipale / قاعة الأفراح البلدية' },
    { value: 'stade',          label: 'Stade / ملعب' },
    { value: 'plage',          label: 'Plage / شاطئ' },
    { value: 'domicile_prive', label: 'Domicile privé / منزل خاص' },
    { value: 'autre',          label: 'Autre lieu / مكان آخر' },
  ]

  const inputClass = "form-control form-control-lg bg-light border-0 shadow-sm"
  const inputStyle = { borderRadius: '12px' }
  const labelClass = "form-label fw-bold small text-uppercase text-muted"

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: 'Demande d\'autorisation d\'événement' }]}>
      <div className="container py-2 pb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="rounded-3 p-3 shadow-sm" style={{ background: 'linear-gradient(135deg,#6f42c1,#0d6efd)', color: '#fff', fontSize: '1.5rem' }}>
                <i className="fas fa-calendar-plus"></i>
              </div>
              <div>
                <h2 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>Demande d'autorisation d'événement</h2>
                <p className="text-muted small mb-0">طلب إذن تنظيم تظاهرة — Municipalité de Kélibia</p>
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5 bg-white">
                {success ? (
                  <div className="text-center py-5">
                    <div className="mb-4" style={{ color: '#6f42c1' }}><i className="fas fa-check-circle fa-5x"></i></div>
                    <h3 className="fw-bold mb-2">Demande envoyée avec succès !</h3>
                    <p className="text-muted">طلبكم قيد المعالجة. تتم مراجعته من طرف البلدية.</p>
                    <p className="text-muted small">Redirection vers vos demandes...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className="alert alert-danger rounded-3 mb-4 d-flex align-items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i> {error}
                      </div>
                    )}

                    {/* ── SECTION 1: Événement ─────────────────────────────── */}
                    <div className="section-block mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#6f42c1', fontSize: '1rem' }}>1</span>
                        <h5 className="fw-bold mb-0 text-dark">Informations sur l'événement</h5>
                        <span className="ms-2 text-muted small" style={{ direction: 'rtl' }}>معلومات التظاهرة</span>
                      </div>

                      <div className="row g-3">
                        <div className="col-12">
                          <label className={labelClass}>Intitulé de l'événement <span className="text-danger">*</span></label>
                          <input type="text" className={inputClass} style={inputStyle}
                            value={form.titre_evenement} onChange={e => handleField('titre_evenement', e.target.value)}
                            placeholder="Ex: Fête de fin d'année scolaire / حفل نهاية السنة الدراسية" required />
                        </div>

                        <div className={form.type_evenement === 'autre' ? 'col-md-6' : 'col-md-6'}>
                          <label className={labelClass}>Type d'événement <span className="text-danger">*</span></label>
                          <select className={inputClass} style={inputStyle}
                            value={form.type_evenement} onChange={e => handleField('type_evenement', e.target.value)} required>
                            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>

                        {/* Free-text field shown only when "autre" is selected */}
                        {form.type_evenement === 'autre' && (
                          <div className="col-12">
                            <label className={labelClass}>
                              Précisez le type d'événement <span className="text-danger">*</span>
                              <span className="ms-2 text-muted fw-normal" style={{ direction: 'rtl' }}>حدد نوع التظاهرة</span>
                            </label>
                            <input type="text" className={inputClass} style={inputStyle}
                              value={form.type_evenement_libre}
                              onChange={e => handleField('type_evenement_libre', e.target.value)}
                              placeholder="Ex: Tournoi de pétanque, Foire artisanale, Exposition de peinture..."
                              required />
                            <div className="text-muted small mt-1">
                              <i className="fas fa-info-circle me-1"></i>
                              Cette précision aidera la mairie à traiter votre demande plus rapidement.
                            </div>
                          </div>
                        )}

                        <div className="col-md-6">
                          <label className={labelClass}>Nombre de participants estimé <span className="text-danger">*</span></label>
                          <input type="number" min={1} className={inputClass} style={inputStyle}
                            value={form.nombre_participants} onChange={e => handleField('nombre_participants', e.target.value)}
                            placeholder="Ex: 200" required />
                        </div>

                        <div className="col-12">
                          <label className={labelClass}>Description de l'événement <span className="text-danger">*</span></label>
                          <textarea className="form-control bg-light border-0 shadow-sm" rows={4}
                            style={{ borderRadius: '12px', resize: 'vertical' }}
                            value={form.description} onChange={e => handleField('description', e.target.value)}
                            placeholder="Décrivez le programme, les activités prévues, le public cible..." required />
                        </div>

                        {/* Association field shows only for 'association' type */}
                        {form.type_evenement === 'association' && (
                          <div className="col-12">
                            <label className={labelClass}>Nom de l'association</label>
                            <input type="text" className={inputClass} style={inputStyle}
                              value={form.association_nom} onChange={e => handleField('association_nom', e.target.value)}
                              placeholder="Nom officiel de l'association / اسم الجمعية" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── SECTION 2: Lieu & Dates ───────────────────────────── */}
                    <div className="section-block mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#0d6efd', fontSize: '1rem' }}>2</span>
                        <h5 className="fw-bold mb-0 text-dark">Lieu & Dates</h5>
                        <span className="ms-2 text-muted small" style={{ direction: 'rtl' }}>المكان والتواريخ</span>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className={labelClass}>Type de lieu <span className="text-danger">*</span></label>
                          <select className={inputClass} style={inputStyle}
                            value={form.lieu_type} onChange={e => handleField('lieu_type', e.target.value)} required>
                            {LIEU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className={labelClass}>Adresse précise <span className="text-danger">*</span></label>
                          <input type="text" className={inputClass} style={inputStyle}
                            value={form.lieu_details} onChange={e => handleField('lieu_details', e.target.value)}
                            placeholder="Ex: Rue de la Corniche, Kélibia" required />
                        </div>

                        <div className="col-md-3">
                          <label className={labelClass}>Date de début <span className="text-danger">*</span></label>
                          <input type="date" className={inputClass} style={inputStyle}
                            value={form.date_debut} onChange={e => handleField('date_debut', e.target.value)} required />
                        </div>
                        <div className="col-md-3">
                          <label className={labelClass}>Heure de début <span className="text-danger">*</span></label>
                          <input type="time" className={inputClass} style={inputStyle}
                            value={form.heure_debut} onChange={e => handleField('heure_debut', e.target.value)} required />
                        </div>
                        <div className="col-md-3">
                          <label className={labelClass}>Date de fin <span className="text-danger">*</span></label>
                          <input type="date" className={inputClass} style={inputStyle}
                            value={form.date_fin} onChange={e => handleField('date_fin', e.target.value)}
                            min={form.date_debut} required />
                        </div>
                        <div className="col-md-3">
                          <label className={labelClass}>Heure de fin <span className="text-danger">*</span></label>
                          <input type="time" className={inputClass} style={inputStyle}
                            value={form.heure_fin} onChange={e => handleField('heure_fin', e.target.value)} required />
                        </div>
                      </div>

                      {/* Map */}
                      <div className="mt-4">
                        <label className={labelClass}>Localisation sur la carte (optionnel)</label>

                        {/* GPS status badge */}
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          {(() => {
                            const cfg = gpsStatusConfig[gpsStatus]
                            return (
                              <span className="badge rounded-pill px-3 py-2 fw-normal"
                                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`, fontSize: '.82rem' }}>
                                <i className={`fas ${cfg.icon} me-1`}></i> {cfg.text}
                              </span>
                            )
                          })()}
                          {position && (
                            <span className="text-muted small">
                              {position[0].toFixed(5)}, {position[1].toFixed(5)}
                            </span>
                          )}
                        </div>

                        <div className="d-flex gap-2 mb-3 flex-wrap">
                          <button type="button"
                            className={`btn rounded-pill px-4 ${gpsStatus === 'loading' ? 'btn-warning disabled' : 'btn-outline-success'}`}
                            onClick={getCurrentLocation} disabled={gpsStatus === 'loading'}>
                            {gpsStatus === 'loading'
                              ? <><span className="spinner-border spinner-border-sm me-2"></span>Localisation...</>
                              : <><i className="fas fa-crosshairs me-2"></i>Ma position actuelle</>
                            }
                          </button>
                          {position && (
                            <button type="button" className="btn btn-outline-secondary rounded-pill px-4"
                              onClick={clearLocation}>
                              <i className="fas fa-times me-2"></i>Effacer
                            </button>
                          )}
                        </div>

                        <div className="rounded-4 overflow-hidden shadow-sm" style={{ height: 320, border: '2px solid #dee2e6' }}>
                          <MapContainer center={position || KELIBIA_CENTER} zoom={14}
                            style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' />
                            <LocationMarker position={position} onMapClick={handleMapClick} />
                          </MapContainer>
                        </div>
                        <p className="text-muted small mt-1">
                          <i className="fas fa-info-circle me-1"></i>
                          Cliquez sur la carte pour placer le marqueur ou utilisez le bouton "Ma position".
                        </p>
                      </div>
                    </div>

                    {/* ── SECTION 3: Organisateur ───────────────────────────── */}
                    <div className="section-block mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#198754', fontSize: '1rem' }}>3</span>
                        <h5 className="fw-bold mb-0 text-dark">Informations sur l'organisateur</h5>
                        <span className="ms-2 text-muted small" style={{ direction: 'rtl' }}>معلومات المنظِّم</span>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className={labelClass}>Nom complet <span className="text-danger">*</span></label>
                          <input type="text" className={inputClass} style={inputStyle}
                            value={form.nom_organisateur} onChange={e => handleField('nom_organisateur', e.target.value)}
                            placeholder="Prénom & Nom" required />
                        </div>
                        <div className="col-md-3">
                          <label className={labelClass}>CIN <span className="text-danger">*</span></label>
                          <input type="text" className={inputClass} style={inputStyle} maxLength={8}
                            value={form.cin_organisateur} onChange={e => handleField('cin_organisateur', e.target.value)}
                            placeholder="12345678" required />
                        </div>
                        <div className="col-md-3">
                          <label className={labelClass}>Téléphone <span className="text-danger">*</span></label>
                          <input type="tel" className={inputClass} style={inputStyle}
                            value={form.telephone_organisateur} onChange={e => handleField('telephone_organisateur', e.target.value)}
                            placeholder="XX XXX XXX" required />
                        </div>
                      </div>
                    </div>

                    {/* ── SECTION 4: Documents ──────────────────────────────── */}
                    <div className="section-block mb-5">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <span className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 32, height: 32, background: '#dc3545', fontSize: '1rem' }}>4</span>
                        <h5 className="fw-bold mb-0 text-dark">Documents justificatifs</h5>
                        <span className="ms-2 text-muted small" style={{ direction: 'rtl' }}>الوثائق المطلوبة</span>
                      </div>

                      <div className="row g-2">
                        <div className="col-md-6">{renderFileControl('cin_recto', 'CIN Recto', true)}</div>
                        <div className="col-md-6">{renderFileControl('cin_verso', 'CIN Verso', true)}</div>
                      </div>
                      {renderFileControl('programme_evenement', 'Programme de l\'événement (PDF)')}
                      {renderFileControl('plan_lieu', 'Plan / Carte du lieu')}
                      {renderFileControl('attestation_assurance', 'Attestation d\'assurance')}
                      {renderFileControl('plan_securite', 'Plan de sécurité')}
                      {form.type_evenement === 'association' &&
                        renderFileControl('attestation_association', 'Attestation d\'enregistrement de l\'association')}

                      <div className="alert alert-info rounded-3 mt-2 d-flex gap-2 align-items-start" style={{ fontSize: '.85rem' }}>
                        <i className="fas fa-info-circle mt-1"></i>
                        <span>
                          Les documents obligatoires sont marqués <strong className="text-danger">*</strong>.
                          Les autres peuvent être ajoutés ultérieurement ou apportés en personne à la mairie.
                        </span>
                      </div>
                    </div>

                    {/* ── Submit ────────────────────────────────────────────── */}
                    <div className="d-grid gap-3 mt-2">
                      <button type="submit" className="btn btn-primary btn-lg rounded-pill py-3 fw-bold shadow-lg"
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg,#6f42c1,#0d6efd)', border: 'none' }}>
                        {loading
                          ? <><span className="spinner-border spinner-border-sm me-3"></span>Envoi en cours...</>
                          : <><i className="fas fa-paper-plane me-3"></i>Soumettre la demande</>
                        }
                      </button>
                      <Link to="/dashboard" className="btn btn-link text-muted text-decoration-none text-center">
                        <i className="fas fa-arrow-left me-2"></i>Annuler
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
