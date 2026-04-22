import { resolveBackendUrl } from '../lib/backendUrl'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getAccessToken } from '../lib/authStorage'
import MainLayout from '../components/MainLayout'
import { useI18n } from '../i18n/LanguageProvider'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
L.Marker.prototype.options.icon = DefaultIcon
const KELIBIA_CENTER: [number, number] = [36.8474, 11.0991]

const isHighRisk = (type: string, etages: number) => type === 'demolition' || etages > 3

function LocationMarker({ position, onMapClick }: { position: [number, number] | null; onMapClick: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { onMapClick([e.latlng.lat, e.latlng.lng]) } })
  return position ? <Marker position={position} /> : null
}

const WebcamCapture = ({ onCapture, onCancel }: { onCapture: (blob: Blob) => void; onCancel: () => void }) => {
  const webcamRef = useRef<Webcam>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const capture = useCallback(() => { const s = webcamRef.current?.getScreenshot(); if (s) setImgSrc(s) }, [])
  const confirm = () => { if (imgSrc) fetch(imgSrc).then(r => r.blob()).then(b => onCapture(b)) }
  return (
    <div className="text-center bg-dark p-3 rounded-4 mb-3">
      {!imgSrc ? (
        <>
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
            className="w-100 rounded-3 mb-2 border border-secondary"
            videoConstraints={{ facingMode: 'environment' }} />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={capture} className="btn btn-warning rounded-pill px-4 fw-bold">
              <i className="fas fa-camera me-2"></i>Capturer
            </button>
            <button type="button" onClick={onCancel} className="btn btn-outline-light rounded-pill px-4">Annuler</button>
          </div>
        </>
      ) : (
        <>
          <img src={imgSrc} alt="Capture" className="w-100 rounded-3 mb-2 border border-success border-3" />
          <div className="d-flex justify-content-center gap-3">
            <button type="button" onClick={confirm} className="btn btn-success rounded-pill px-4 fw-bold">
              <i className="fas fa-check me-2"></i>Confirmer
            </button>
            <button type="button" onClick={() => setImgSrc(null)} className="btn btn-outline-warning rounded-pill px-4">
              <i className="fas fa-undo me-2"></i>Reprendre
            </button>
          </div>
        </>
      )}
    </div>
  )
}

type Step = 1 | 2 | 3 | 4

type UserInfo = { first_name: string; last_name: string; email: string; is_verified: boolean }

export default function DemandeConstructionPage() {
  const navigate = useNavigate()
  const { lang } = useI18n()
  
  const TYPE_TRAVAUX = [
    { value: 'construction_neuve', label: lang === 'ar' ? 'بناء جديد' : 'Construction neuve', emoji: '🏗️', risk: false },
    { value: 'renovation',         label: lang === 'ar' ? 'تجديد' : 'Rénovation',         emoji: '🔨', risk: false },
    { value: 'extension',          label: lang === 'ar' ? 'توسعة' : 'Extension',           emoji: '📐', risk: false },
    { value: 'demolition',         label: lang === 'ar' ? 'هدم' : 'Démolition',          emoji: '🏚️', risk: true  },
    { value: 'cloture',            label: lang === 'ar' ? 'سياج / حائط' : 'Clôture / Mur',       emoji: '🪨', risk: false },
    { value: 'piscine',            label: lang === 'ar' ? 'مسبح' : 'Piscine',             emoji: '🏊', risk: false },
    { value: 'panneau_solaire',    label: lang === 'ar' ? 'ألواح شمسية' : 'Panneaux solaires',   emoji: '☀️', risk: false },
    { value: 'ravalement',         label: lang === 'ar' ? 'ترميم الواجهة' : 'Ravalement façade',   emoji: '🎨', risk: false },
    { value: 'autre',              label: lang === 'ar' ? 'أخرى (تحديد)' : 'Autre (préciser)',     emoji: '📋', risk: false },
  ]

  const USAGE_BATIMENT = [
    { value: 'habitation',  label: lang === 'ar' ? '🏠 سكني' : '🏠 Habitation' },
    { value: 'commercial',  label: lang === 'ar' ? '🏪 تجاري' : '🏪 Commercial' },
    { value: 'industriel',  label: lang === 'ar' ? '🏭 صناعي' : '🏭 Industriel' },
    { value: 'agricole',    label: lang === 'ar' ? '🌾 فلاحي' : '🌾 Agricole' },
    { value: 'mixte',       label: lang === 'ar' ? '🏢 مختلط' : '🏢 Mixte' },
  ]

  const DOCS = [
    { key: 'titre_foncier',         label: lang === 'ar' ? 'شهادة ملكية' : 'Titre foncier',              icon: 'fa-file-alt',         required: true,  accept: '.pdf,.jpg,.jpeg,.png', camera: false },
    { key: 'plan_architectural',    label: lang === 'ar' ? 'مثال هندسي (PDF)' : 'Plan architectural (PDF)',    icon: 'fa-drafting-compass', required: true,  accept: '.pdf',                 camera: false },
    { key: 'photo_terrain',         label: lang === 'ar' ? 'صورة لقطعة الأرض' : 'Photo du terrain',           icon: 'fa-image',            required: false, accept: 'image/*',              camera: true  },
    { key: 'devis_estimatif',       label: lang === 'ar' ? 'كشف تقديري' : 'Devis estimatif',            icon: 'fa-calculator',       required: false, accept: '.pdf,.xlsx,.docx',     camera: false },
    { key: 'cin_proprietaire_recto',label: lang === 'ar' ? 'بطاقة تعريف المالك — الوجه' : 'CIN Propriétaire — Recto',   icon: 'fa-id-card',          required: true,  accept: 'image/*',              camera: true  },
    { key: 'cin_proprietaire_verso',label: lang === 'ar' ? 'بطاقة تعريف المالك — الخلف' : 'CIN Propriétaire — Verso',   icon: 'fa-id-card',          required: true,  accept: 'image/*',              camera: true  },
  ]

  const STEP_TITLES: Record<Step, string> = {
    1: lang === 'ar' ? 'طبيعة الأشغال' : 'Nature des travaux',
    2: lang === 'ar' ? 'قطعة الأرض والأبعاد' : 'Terrain & Dimensions',
    3: lang === 'ar' ? 'المالك والمقاول' : 'Propriétaire',
    4: lang === 'ar' ? 'الوثائق' : 'Documents',
  }
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [cameraActive, setCameraActive] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setUser(d) })
  }, [navigate])

  const [form, setForm] = useState({
    type_travaux: 'construction_neuve',
    type_travaux_libre: '',
    usage_batiment: 'habitation',
    description_travaux: '',
    adresse_terrain: '',
    numero_parcelle: '',
    surface_terrain: '',
    surface_construite: '',
    nombre_etages: '1',
    hauteur_max: '',
    date_debut_prevue: '',
    duree_travaux_mois: '',
    cout_estime: '',
    nom_proprietaire: '',
    cin_proprietaire: '',
    telephone_proprietaire: '',
    nom_entrepreneur: '',
    telephone_entrepreneur: '',
  })

  const [files, setFiles] = useState<Record<string, File | null>>({
    titre_foncier: null, plan_architectural: null, photo_terrain: null,
    devis_estimatif: null, cin_proprietaire_recto: null, cin_proprietaire_verso: null,
  })

  const highRisk = isHighRisk(form.type_travaux, parseInt(form.nombre_etages) || 1)
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setFile = (k: string, f: File | null) => setFiles(prev => ({ ...prev, [k]: f }))
  const handleCameraCapture = (fieldKey: string) => (blob: Blob) => {
    setFile(fieldKey, new File([blob], `${fieldKey}_${Date.now()}.jpg`, { type: 'image/jpeg' }))
    setCameraActive(null)
  }

  const canStep1 = !!(form.type_travaux && form.usage_batiment && form.description_travaux.trim().length >= 10)
  const canStep2 = !!(form.adresse_terrain.trim() && form.surface_terrain && form.surface_construite && Number(form.surface_terrain) >= Number(form.surface_construite) && form.date_debut_prevue && form.duree_travaux_mois)
  const canStep3 = !!(form.nom_proprietaire.trim() && form.cin_proprietaire.length === 8 && form.telephone_proprietaire.trim())

  const handleSubmit = async () => {
    setLoading(true); setError(null)
    try {
      const access = getAccessToken()
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (position) { fd.append('latitude', String(position[0])); fd.append('longitude', String(position[1])) }
      Object.entries(files).forEach(([k, f]) => {
        if (f) {
          const ext = f.name.split('.').pop() || 'bin'
          fd.append(k, f, `${k}_${Date.now()}.${ext}`)
        }
      })
      const res = await fetch(resolveBackendUrl('/api/construction/demandes/'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` },
        body: fd,
      })
      if (!res.ok) { const d = await res.json(); throw new Error(JSON.stringify(d)) }
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la soumission.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <MainLayout user={user} onLogout={() => navigate('/login')}>
      <div className={`container py-5 text-center ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="card border-0 shadow-lg rounded-4 p-5 mx-auto" style={{ maxWidth: 520 }}>
          <div className="mb-4"><i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i></div>
          <h2 className="fw-bold text-success mb-2">{lang === 'ar' ? 'تم إرسال الطلب!' : 'Demande soumise !'}</h2>
          <p className="text-muted mb-4">{lang === 'ar' ? 'تم تسجيل طلب رخصة البناء الخاص بك. سيقوم الفريق البلدي بدراسته في أقرب وقت ممكن.' : "Votre demande de permis de construire a été enregistrée. L'équipe municipale l'examinera dans les meilleurs délais."}</p>
          {highRisk && (
            <div className="alert alert-warning rounded-3 mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>{lang === 'ar' ? 'ملف ذو أولوية عالية' : 'Dossier haute priorité'}</strong> — {lang === 'ar' ? 'سيلزم إجراء معاينة فنية ميدانية.' : 'Une inspection technique sur site sera requise.'}
            </div>
          )}
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <button onClick={() => navigate('/mes-constructions')} className="btn btn-primary rounded-pill px-4">
              <i className={`fas fa-list ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'متابعة طلباتي' : 'Suivre mes demandes'}
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-outline-secondary rounded-pill px-4">
              <i className={`fas fa-home ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'لوحة القيادة' : 'Tableau de bord'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}>
      <style>{`
        .cst-wizard{display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem}
        .cst-step{display:flex;flex-direction:column;align-items:center}
        .cst-circ{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.88rem;transition:all .3s}
        .cst-circ.done{background:#198754;color:#fff}
        .cst-circ.act{background:linear-gradient(135deg,#0d6efd,#6610f2);color:#fff;box-shadow:0 0 0 4px #cfe2ff}
        .cst-circ.wait{background:#e9ecef;color:#6c757d}
        .cst-slbl{font-size:.68rem;margin-top:3px;font-weight:600;color:#6c757d;text-align:center;max-width:72px}
        .cst-slbl.act{color:#0d6efd}
        .cst-conn{flex:1;height:3px;background:#e9ecef;margin:0 4px;position:relative;top:-12px;min-width:18px}
        .cst-conn.on{background:linear-gradient(90deg,#198754,#0d6efd)}
        .fc{background:#fff;border-radius:1.1rem;box-shadow:0 4px 22px rgba(13,110,253,.09);padding:1.8rem}
        .sh{font-size:.95rem;font-weight:700;color:#0d6efd;border-bottom:2px solid #e7f1ff;padding-bottom:.4rem;margin-bottom:1.1rem}
        .tcard{padding:.75rem;border-radius:.7rem;border:2px solid #e9ecef;cursor:pointer;transition:all .2s;background:#f8f9fa;text-align:center;height:100%}
        .tcard.sel{border-color:#0d6efd;background:#e7f1ff}
        .tcard:hover{border-color:#86b7fe;background:#f0f5ff}
        .fok{display:flex;align-items:center;gap:.4rem;padding:.35rem .7rem;background:#d1e7dd;border-radius:.45rem;font-size:.8rem;color:#0a3622;font-weight:600;margin-top:.35rem}
        .rbanner{background:linear-gradient(135deg,#dc3545,#fd7e14);color:#fff;border-radius:.75rem;padding:.45rem .9rem;font-size:.83rem;font-weight:600;margin-bottom:.75rem}
      `}</style>

      <div className={`container py-4 ${lang === 'ar' ? 'font-arabic text-end' : ''}`} style={{ maxWidth: 750 }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center mb-4">
          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-2 d-inline-block">
            <i className={`fas fa-hard-hat ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'المنازل والبناء' : 'Maisons & Construction'}
          </span>
          <h2 className="fw-bold mb-0" style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {lang === 'ar' ? 'طلب رخصة بناء' : 'Demande de Permis de Construire'}
          </h2>
          <p className="text-muted small mb-0">رخصة البناء — Kelibia Municipality</p>
        </div>

        {user && !user.is_verified && (
          <div 
            className="p-4 mb-4 d-flex align-items-center shadow-sm"
            style={{ 
              background: '#FFF4CD', 
              borderRadius: '20px', 
              border: 'none',
              gap: '20px'
            }}
          >
            <div className="text-warning">
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#664d03' }}>{lang === 'ar' ? 'حساب في انتظار التحقق' : 'Compte en attente de vérification'}</h5>
              <p className="mb-0 fs-6" style={{ color: '#664d03', opacity: 0.9 }}>{lang === 'ar' ? 'يجب التحقق من حسابك من قبل الإدارة للوصول إلى هذه الخدمة.' : "Votre compte doit être vérifié par l'administration pour accéder à ce service."}</p>
            </div>
          </div>
        )}

        {/* Step wizard */}
        <div className="cst-wizard">
          {([1,2,3,4] as Step[]).map((s,i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className={`cst-conn${step > s-1 ? ' on' : ''}`} />}
              <div className="cst-step">
                <div className={`cst-circ ${step > s ? 'done' : step === s ? 'act' : 'wait'}`}>
                  {step > s ? <i className="fas fa-check" /> : s}
                </div>
                <div className={`cst-slbl${step === s ? ' act' : ''}`}>{STEP_TITLES[s]}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {highRisk && (
          <div className="rbanner d-flex align-items-center gap-2">
            <i className={`fas fa-exclamation-triangle ${lang === 'ar' ? 'ms-2' : ''}`}></i>
            <span>{lang === 'ar' ? `ملف ذو أولوية عالية — ${form.type_travaux === 'demolition' ? 'هدم' : `${form.nombre_etages} طوابق`} — يلزم إجراء معاينة فنية` : `Dossier haute priorité — ${form.type_travaux === 'demolition' ? 'Démolition' : `${form.nombre_etages} étages`} — inspection technique requise`}</span>
          </div>
        )}
        {error && <div className="alert alert-danger rounded-3 mb-3 small"><i className={`fas fa-times-circle ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{error}</div>}

        <div className="fc">

          {/* ── STEP 1 ── Nature des travaux */}
          {step === 1 && (
            <div>
              <p className="sh"><i className={`fas fa-tools ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'طبيعة الأشغال' : 'Nature des travaux / نوع الأشغال'}</p>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{lang === 'ar' ? 'نوع الأشغال' : 'Type de travaux'} <span className="text-danger">*</span></label>
                <div className="row g-2">
                  {TYPE_TRAVAUX.map(t => (
                    <div className="col-6 col-md-4" key={t.value}>
                      <div className={`tcard${form.type_travaux === t.value ? ' sel' : ''}`} onClick={() => update('type_travaux', t.value)}>
                        <div style={{ fontSize: '1.4rem' }}>{t.emoji}</div>
                        <div className="fw-semibold" style={{ fontSize: '.82rem' }}>{t.label}</div>
                        {t.risk && <span className="badge bg-danger mt-1" style={{ fontSize: '.63rem' }}>⚠️ {lang === 'ar' ? 'أولوية عالية' : 'Priorité haute'}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {form.type_travaux === 'autre' && (
                  <input className="form-control mt-2 rounded-3" placeholder={lang === 'ar' ? 'يرجى تحديد نوع الأشغال...' : "Précisez le type de travaux..."}
                    value={form.type_travaux_libre} onChange={e => update('type_travaux_libre', e.target.value)} />
                )}
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{lang === 'ar' ? 'استعمال المبنى' : 'Usage du bâtiment'} <span className="text-danger">*</span></label>
                <div className="d-flex flex-wrap gap-2">
                  {USAGE_BATIMENT.map(u => (
                    <button key={u.value} type="button" onClick={() => update('usage_batiment', u.value)}
                      className={`btn btn-sm rounded-pill ${form.usage_batiment === u.value ? 'btn-primary' : 'btn-outline-secondary'}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">{lang === 'ar' ? 'وصف الأشغال' : 'Description des travaux'} <span className="text-danger">*</span></label>
                <textarea className="form-control rounded-3" rows={4}
                  placeholder={lang === 'ar' ? 'قم بوصف الأشغال المخطط لها بالتفصيل (الطبيعة، المواد، الطرق...)' : "Décrivez en détail les travaux prévus (nature, matériaux, méthodes...)"}
                  value={form.description_travaux} onChange={e => update('description_travaux', e.target.value)} dir="auto" />
                <small className="text-muted">{form.description_travaux.length}/10 {lang === 'ar' ? 'حروف كحد أدنى' : 'caractères minimum'}</small>
              </div>
              <button className="btn btn-primary rounded-pill px-5 w-100 fw-bold" disabled={!canStep1} onClick={() => setStep(2)}>
                {lang === 'ar' ? 'متابعة' : 'Continuer'} <i className={`fas fa-arrow-${lang === 'ar' ? 'left' : 'right'} ms-2`}></i>
              </button>
            </div>
          )}

          {/* ── STEP 2 ── Terrain & Dimensions */}
          {step === 2 && (
            <div>
              <p className="sh"><i className={`fas fa-map-marked-alt ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'قطعة الأرض والأبعاد' : 'Terrain & Dimensions'}</p>
              <div className="row g-3 mb-3">
                <div className="col-md-8">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'عنوان قطعة الأرض' : 'Adresse du terrain'} <span className="text-danger">*</span></label>
                  <input className="form-control rounded-3" placeholder={lang === 'ar' ? 'مثال: شارع الزيتون، قليبية' : "Ex: Rue des Oliviers, Kelibia"}
                    value={form.adresse_terrain} onChange={e => update('adresse_terrain', e.target.value)} dir="auto" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'رقم القطعة' : 'N° de parcelle'}</label>
                  <input className="form-control rounded-3" placeholder={lang === 'ar' ? 'مثال: 12/ب' : "Ex: 12/B"}
                    value={form.numero_parcelle} onChange={e => update('numero_parcelle', e.target.value)} dir="auto" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'مساحة الأرض (م²)' : 'Surface terrain (m²)'} <span className="text-danger">*</span></label>
                  <input type="number" className="form-control rounded-3" placeholder="Ex: 300" min="1"
                    value={form.surface_terrain} onChange={e => update('surface_terrain', e.target.value)} dir="ltr" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'المساحة المبنية (م²)' : 'Surface à construire (m²)'} <span className="text-danger">*</span></label>
                  <input type="number" className="form-control rounded-3" placeholder="Ex: 150" min="1"
                    value={form.surface_construite} onChange={e => update('surface_construite', e.target.value)} dir="ltr" />
                  {form.surface_terrain && form.surface_construite && Number(form.surface_construite) > Number(form.surface_terrain) && (
                    <small className="text-danger fw-semibold d-block mt-1">⚠️ {lang === 'ar' ? 'لا يمكن أن تتجاوز مساحة الأرض' : 'Ne peut pas dépasser la surface du terrain'}</small>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'عدد الطوابق' : "Nbre d'étages"} <span className="text-danger">*</span></label>
                  <input type="number" className="form-control rounded-3" min="0" max="20"
                    value={form.nombre_etages} onChange={e => update('nombre_etages', e.target.value)} dir="ltr" />
                  {parseInt(form.nombre_etages) > 3 && <small className="text-danger fw-semibold">⚠️ {lang === 'ar' ? '+3 طوابق = أولوية عالية' : '+3 étages = haute priorité'}</small>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'الارتفاع الأقصى (م)' : 'Hauteur max. (m)'}</label>
                  <input type="number" className="form-control rounded-3" placeholder="Ex: 12" min="1"
                    value={form.hauteur_max} onChange={e => update('hauteur_max', e.target.value)} dir="ltr" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'التكلفة التقديرية (د.ت)' : 'Coût estimatif (DT)'}</label>
                  <input type="number" className="form-control rounded-3" placeholder="Ex: 85000" min="0"
                    value={form.cout_estime} onChange={e => update('cout_estime', e.target.value)} dir="ltr" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'تاريخ البدء المخطط' : 'Date début prévue'} <span className="text-danger">*</span></label>
                  <input type="date" className="form-control rounded-3"
                    value={form.date_debut_prevue} onChange={e => update('date_debut_prevue', e.target.value)} dir="ltr" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">{lang === 'ar' ? 'المدة التقديرية (أشهر)' : 'Durée estimée (mois)'} <span className="text-danger">*</span></label>
                  <input type="number" className="form-control rounded-3" placeholder="Ex: 6" min="1" max="120"
                    value={form.duree_travaux_mois} onChange={e => update('duree_travaux_mois', e.target.value)} dir="ltr" />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">
                  <i className={`fas fa-map-pin ${lang === 'ar' ? 'ms-1' : 'me-1'} text-primary`}></i>{lang === 'ar' ? 'الموقع الجغرافي (اختياري) — انقر على الخريطة' : 'Localisation GPS (optionnel) — cliquez sur la carte'}
                </label>
                <div className="rounded-3 overflow-hidden border" style={{ height: 240 }} dir="ltr">
                  <MapContainer center={KELIBIA_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                    <LocationMarker position={position} onMapClick={p => setPosition(p)} />
                  </MapContainer>
                </div>
                {position && (
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="badge bg-success rounded-pill px-3 py-2" dir="ltr">
                      <i className="fas fa-map-marker-alt me-1"></i>{position[0].toFixed(5)}, {position[1].toFixed(5)}
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => setPosition(null)}>{lang === 'ar' ? 'مسح' : 'Effacer'}</button>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(1)}>
                  <i className={`fas fa-arrow-${lang === 'ar' ? 'right' : 'left'} ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'رجوع' : 'Retour'}
                </button>
                <button className="btn btn-primary rounded-pill px-5 flex-grow-1 fw-bold" disabled={!canStep2} onClick={() => setStep(3)}>
                  {lang === 'ar' ? 'متابعة' : 'Continuer'} <i className={`fas fa-arrow-${lang === 'ar' ? 'left' : 'right'} ${lang === 'ar' ? 'me-2' : 'ms-2'}`}></i>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── Propriétaire & Entrepreneur */}
          {step === 3 && (
            <div>
              <p className="sh"><i className={`fas fa-user-tie ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'المالك والمقاول' : 'Propriétaire & Entrepreneur / المالك والمقاول'}</p>
              <div className="p-3 bg-light rounded-3 mb-3">
                <p className="fw-bold mb-2 text-primary small"><i className={`fas fa-id-card ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'معلومات المالك' : 'Informations du propriétaire'}</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">{lang === 'ar' ? 'الاسم الكامل' : 'Nom complet'} <span className="text-danger">*</span></label>
                    <input className="form-control rounded-3" placeholder={lang === 'ar' ? 'الاسم واللقب' : "Nom et prénom"}
                      value={form.nom_proprietaire} onChange={e => update('nom_proprietaire', e.target.value)} dir="auto" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">{lang === 'ar' ? 'بطاقة التعريف (8 أرقام)' : 'CIN (8 chiffres)'} <span className="text-danger">*</span></label>
                    <input className="form-control rounded-3" placeholder="12345678" maxLength={8}
                      value={form.cin_proprietaire}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 8) update('cin_proprietaire', val);
                      }} dir="ltr" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">{lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'} <span className="text-danger">*</span></label>
                    <input className="form-control rounded-3" placeholder="Ex: 25123456" maxLength={8}
                      value={form.telephone_proprietaire}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 8) update('telephone_proprietaire', val);
                      }} dir="ltr" />
                  </div>
                </div>
              </div>
              <div className="p-3 bg-light rounded-3 mb-3">
                <p className="fw-bold mb-2 text-warning small"><i className={`fas fa-hard-hat ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'المقاول (اختياري)' : 'Entrepreneur (optionnel)'}</p>
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label fw-semibold small">{lang === 'ar' ? 'اسم الشركة' : "Nom de l'entreprise"}</label>
                    <input className="form-control rounded-3" placeholder={lang === 'ar' ? 'مثال: شركة البناء بقليبية' : "Ex: SARL Bâtiment Kelibia"}
                      value={form.nom_entrepreneur} onChange={e => update('nom_entrepreneur', e.target.value)} dir="auto" />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-semibold small">{lang === 'ar' ? 'هاتف المقاول' : 'Téléphone entrepreneur'}</label>
                    <input className="form-control rounded-3" placeholder="Ex: 71234567"
                      value={form.telephone_entrepreneur} onChange={e => update('telephone_entrepreneur', e.target.value)} dir="ltr" />
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(2)}>
                  <i className={`fas fa-arrow-${lang === 'ar' ? 'right' : 'left'} ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'رجوع' : 'Retour'}
                </button>
                <button className="btn btn-primary rounded-pill px-5 flex-grow-1 fw-bold" disabled={!canStep3} onClick={() => setStep(4)}>
                  {lang === 'ar' ? 'متابعة' : 'Continuer'} <i className={`fas fa-arrow-${lang === 'ar' ? 'left' : 'right'} ${lang === 'ar' ? 'me-2' : 'ms-2'}`}></i>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── Documents */}
          {step === 4 && (
            <div>
              <p className="sh"><i className={`fas fa-file-upload ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'الوثائق المطلوبة' : 'Documents requis / الوثائق المطلوبة'}</p>
              <div className="alert alert-info rounded-3 small mb-3">
                <i className={`fas fa-info-circle ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'الوثائق التي تحمل علامة ' : 'Les documents marqués '}<strong>*</strong>{lang === 'ar' ? ' إلزامية.' : ' sont obligatoires.'}
              </div>
              {DOCS.map(doc => (
                <div key={doc.key} className="mb-3 p-3 rounded-3 border" style={{ background: '#fafbff' }}>
                  <label className="form-label fw-semibold small d-flex align-items-center gap-2">
                    <i className={`fas ${doc.icon} text-primary`}></i>
                    {doc.label} {doc.required && <span className="text-danger">*</span>}
                  </label>
                  {cameraActive === doc.key ? (
                    <WebcamCapture onCapture={handleCameraCapture(doc.key)} onCancel={() => setCameraActive(null)} />
                  ) : (
                    <div className="d-flex gap-2 flex-wrap">
                      <input type="file" accept={doc.accept} className="form-control rounded-3 flex-grow-1"
                        onChange={e => setFile(doc.key, e.target.files?.[0] ?? null)} />
                      {doc.camera && (
                        <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setCameraActive(doc.key)}>
                          <i className={`fas fa-camera ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{lang === 'ar' ? 'صورة' : 'Photo'}
                        </button>
                      )}
                    </div>
                  )}
                  {files[doc.key] && (
                    <div className="fok">
                      <i className={`fas fa-check-circle text-success ${lang === 'ar' ? 'ms-2' : ''}`}></i>
                      {files[doc.key]!.name} — {(files[doc.key]!.size / 1024).toFixed(0)} Ko
                      <button type="button" className={`btn btn-sm text-danger ${lang === 'ar' ? 'me-auto' : 'ms-auto'} p-0 border-0 bg-transparent`}
                        onClick={() => setFile(doc.key, null)}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Recap */}
              <div className="p-3 rounded-3 mb-3" style={{ background: '#f0f9f0', border: '1px solid #c3e6cb' }}>
                <p className="fw-bold mb-2 small text-success"><i className={`fas fa-clipboard-check ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'ملخص' : 'Récapitulatif'}</p>
                <div className="row g-1" style={{ fontSize: '.81rem' }}>
                  <div className="col-6"><span className="text-muted">{lang === 'ar' ? 'النوع :' : 'Type :'}</span> <strong>{TYPE_TRAVAUX.find(t => t.value === form.type_travaux)?.label}</strong></div>
                  <div className="col-6"><span className="text-muted">{lang === 'ar' ? 'المساحة :' : 'Surface :'}</span> <strong>{form.surface_construite} m²</strong></div>
                  <div className="col-6"><span className="text-muted">{lang === 'ar' ? 'الطوابق :' : 'Étages :'}</span> <strong>{form.nombre_etages}</strong></div>
                  <div className="col-6"><span className="text-muted">{lang === 'ar' ? 'المالك :' : 'Propriétaire :'}</span> <strong>{form.nom_proprietaire}</strong></div>
                  <div className="col-12"><span className="text-muted">{lang === 'ar' ? 'العنوان :' : 'Adresse :'}</span> <strong>{form.adresse_terrain || '—'}</strong></div>
                  {form.cout_estime && <div className="col-6"><span className="text-muted">{lang === 'ar' ? 'التكلفة :' : 'Coût :'}</span> <strong>{form.cout_estime} DT</strong></div>}
                  {highRisk && <div className="col-12 mt-1"><span className="badge bg-danger">⚠️ {lang === 'ar' ? 'ملف ذو أولوية عالية' : 'Dossier haute priorité'}</span></div>}
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(3)} disabled={loading}>
                  <i className={`fas fa-arrow-${lang === 'ar' ? 'right' : 'left'} ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'رجوع' : 'Retour'}
                </button>
                <button className="btn btn-success rounded-pill px-5 flex-grow-1 fw-bold" onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>{lang === 'ar' ? 'إرسال...' : 'Envoi...'}</>
                    : <><i className={`fas fa-paper-plane ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'إرسال الطلب' : 'Soumettre la demande'}</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  )
}
