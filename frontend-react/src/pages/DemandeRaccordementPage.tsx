import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function DemandeRaccordementPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [form, setForm] = useState({
    type_reseau: 'eau',
    adresse_raccordement: '',
  })
  
  // Files
  const [cinCopie, setCinCopie] = useState<File | null>(null)
  const [titrePropriete, setTitrePropriete] = useState<File | null>(null)
  const [permisBatir, setPermisBatir] = useState<File | null>(null)
  const [planSituation, setPlanSituation] = useState<File | null>(null)

  const [position, setPosition] = useState<[number, number] | null>(null)

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
    if (!position) {
      setError(lang === 'ar' ? 'يرجى تحديد الموقع على الخريطة' : 'Veuillez sélectionner l\'emplacement sur la carte')
      return
    }
    
    setLoading(true)
    setError(null)
    const token = getAccessToken()
    if (!token) { navigate('/login'); return }

    const fd = new FormData()
    fd.append('type_reseau', form.type_reseau)
    fd.append('adresse_raccordement', form.adresse_raccordement)
    fd.append('latitude', String(position[0]))
    fd.append('longitude', String(position[1]))
    
    if (cinCopie) fd.append('cin_copie', cinCopie)
    if (titrePropriete) fd.append('titre_propriete', titrePropriete)
    if (permisBatir) fd.append('permis_batir', permisBatir)
    if (planSituation) fd.append('plan_situation', planSituation)

    try {
      const res = await fetch(resolveBackendUrl('/api/construction/raccordement/'), {
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
      <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Demande de Raccordement' }]}>
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="text-success mb-4"><i className="fas fa-check-circle fa-5x"></i></div>
          <h2 className="fw-bold mb-2">{lang === 'ar' ? 'تم تقديم الطلب بنجاح!' : 'Demande déposée avec succès !'}</h2>
          <p className="text-muted mb-4 text-center" style={{ maxWidth: 500 }}>
            {lang === 'ar'
              ? 'تم تسجيل طلب الربط الخاص بك. سيعوم خبير فني بالاتصال بك قريباً لتحديد موعد المعاينة الميدانية.'
              : 'Votre demande de raccordement a été enregistrée. Un technicien vous contactera prochainement pour programmer la visite technique.'}
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
      breadcrumbs={[{ label: lang === 'ar' ? 'طلب ربط بالشبكات' : 'Demande de Raccordement aux Réseaux Municipaux' }]}
    >
      <style>{`
        .rac-card { background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
        .rac-section { font-weight: 700; color: #1565c0; font-size: .95rem; border-bottom: 2px solid #e3f2fd; padding-bottom: .4rem; margin-bottom: 1.2rem; }
        .req-badge { display: inline-flex; align-items: center; gap: .4rem; background: #e3f2fd; color: #1565c0; border-radius: .5rem; padding: .25rem .7rem; font-size: .8rem; font-weight: 600; }
        .upload-slot { border: 2px dashed #e0e0e0; border-radius: 0.8rem; padding: 1rem; text-align: center; transition: all 0.2s; cursor: pointer; }
        .upload-slot:hover { border-color: #1565c0; background: #f8faff; }
        .upload-slot.has-file { border-style: solid; border-color: #2e7d32; background: #f1f8e9; }
      `}</style>

      <div className="container-fluid px-0 py-4" style={{ maxWidth: 850 }}>
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#1a3a5c,#1565c0)', color: '#fff', fontSize: '1.4rem' }}>
            <i className="fas fa-bolt"></i>
          </div>
          <div>
            <h1 className="fw-bold mb-0" style={{ fontSize: '1.5rem' }}>
              {lang === 'ar' ? 'طلب الربط بالشبكات' : 'Demande de Raccordement aux Réseaux'}
            </h1>
            <p className="text-muted mb-0 small">
              {lang === 'ar'
                ? 'الحصول على الموافقة لربط عقارك بشبكات الماء الصالح للشرب، الكهرباء، أو التطهير'
                : 'Demande officielle pour relier votre local aux réseaux d\'eau, d\'électricité ou d\'assainissement.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Type & Adresse */}
          <div className="rac-card mb-4">
            <div className="rac-section">
              <i className="fas fa-info-circle me-2"></i>
              {lang === 'ar' ? 'تفاصيل الطلب' : 'Détails de la demande'}
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">{lang === 'ar' ? 'نوع الشبكة *' : 'Type de réseau *'}</label>
                <select className="form-select rounded-3" value={form.type_reseau} onChange={e => update('type_reseau', e.target.value)}>
                    <option value="eau">{lang === 'ar' ? 'الماء (SONEDE)' : 'Eau (SONEDE)'}</option>
                    <option value="electricite">{lang === 'ar' ? 'الكهرباء (STEG)' : 'Électricité (STEG)'}</option>
                    <option value="assainissement">{lang === 'ar' ? 'التطهير (ONAS)' : 'Assainissement (ONAS)'}</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">{lang === 'ar' ? 'عنوان العقار *' : 'Adresse de l\'immeuble *'}</label>
                <input
                  type="text" className="form-control rounded-3"
                  placeholder={lang === 'ar' ? 'العنوان الكامل' : 'Ex: 45 Rue Ibn Khaldoun, Kélibia'}
                  value={form.adresse_raccordement} onChange={e => update('adresse_raccordement', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Localisation SIG */}
          <div className="rac-card mb-4">
            <div className="rac-section">
              <i className="fas fa-map-marker-alt me-2"></i>
              {lang === 'ar' ? 'الموقّع الجغرافي (SIG)' : 'Localisation Géographique (SIG)'}
            </div>
            <p className="small text-muted mb-3">
                {lang === 'ar' 
                    ? 'يرجى النقر على الخريطة لتحديد مكان العقار بالضبط. سيستخدم النظام هذه الإحداثيات لحساب المسافة عن الشبكة.' 
                    : 'Cliquez sur la carte pour marquer l\'emplacement exact de votre local. Le système calculera la distance par rapport au réseau existant.'}
            </p>
            <div className="rounded-3 overflow-hidden border mb-2" style={{ height: 350 }}>
              <MapContainer center={[36.8481, 11.0939]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onLocationSelect={(lat, lng) => setPosition([lat, lng])} />
                {position && <Marker position={position} />}
              </MapContainer>
            </div>
            {position && (
              <div className="mt-2 small text-success fw-bold d-flex align-items-center gap-2">
                <i className="fas fa-check-circle"></i>
                {lang === 'ar' ? 'تم تحديد الإحداثيات بنجاح' : 'Coordonnées capturées avec succès'}
              </div>
            )}
          </div>

          {/* Section 3: Pièces Jointes */}
          <div className="rac-card mb-4">
            <div className="rac-section">
              <i className="fas fa-file-upload me-2"></i>
              {lang === 'ar' ? 'الوثائق والملفات' : 'Documents et Justificatifs'}
            </div>
            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">{lang === 'ar' ? 'نسخة من بطاقة التعريف (CIN)' : 'Copie CIN (Recto/Verso)'}</label>
                    <div className={`upload-slot ${cinCopie ? 'has-file' : ''}`} onClick={() => document.getElementById('cin_up')?.click()}>
                        <i className={`fas ${cinCopie ? 'fa-file-alt' : 'fa-upload'} mb-2`}></i>
                        <div className="small">{cinCopie ? cinCopie.name : (lang === 'ar' ? 'اختر ملف' : 'Choisir un fichier')}</div>
                        <input type="file" id="cin_up" className="d-none" onChange={e => setCinCopie(e.target.files?.[0] || null)} />
                    </div>
                </div>
                <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">{lang === 'ar' ? 'شهادة ملكية / عقد شراء' : 'Titre de propriété / contrat'}</label>
                    <div className={`upload-slot ${titrePropriete ? 'has-file' : ''}`} onClick={() => document.getElementById('prop_up')?.click()}>
                        <i className={`fas ${titrePropriete ? 'fa-file-alt' : 'fa-upload'} mb-2`}></i>
                        <div className="small">{titrePropriete ? titrePropriete.name : (lang === 'ar' ? 'اختر ملف' : 'Choisir un fichier')}</div>
                        <input type="file" id="prop_up" className="d-none" onChange={e => setTitrePropriete(e.target.files?.[0] || null)} />
                    </div>
                </div>
                <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">{lang === 'ar' ? 'رخصة بناء سارية المفعول' : 'Permis de bâtir'}</label>
                    <div className={`upload-slot ${permisBatir ? 'has-file' : ''}`} onClick={() => document.getElementById('permis_up')?.click()}>
                        <i className={`fas ${permisBatir ? 'fa-file-alt' : 'fa-upload'} mb-2`}></i>
                        <div className="small">{permisBatir ? permisBatir.name : (lang === 'ar' ? 'اختر ملف' : 'Choisir un fichier')}</div>
                        <input type="file" id="permis_up" className="d-none" onChange={e => setPermisBatir(e.target.files?.[0] || null)} />
                    </div>
                </div>
                <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">{lang === 'ar' ? 'مثال موقع للعقار' : 'Plan de situation'}</label>
                    <div className={`upload-slot ${planSituation ? 'has-file' : ''}`} onClick={() => document.getElementById('plan_up')?.click()}>
                        <i className={`fas ${planSituation ? 'fa-file-alt' : 'fa-upload'} mb-2`}></i>
                        <div className="small">{planSituation ? planSituation.name : (lang === 'ar' ? 'اختر ملف' : 'Choisir un fichier')}</div>
                        <input type="file" id="plan_up" className="d-none" onChange={e => setPlanSituation(e.target.files?.[0] || null)} />
                    </div>
                </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger rounded-3 mb-3 small">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <div className="d-flex gap-3 justify-content-end mb-5">
            <button type="button" className="btn btn-outline-secondary rounded-pill px-4"
              onClick={() => navigate(-1)}>
              {lang === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>{lang === 'ar' ? 'جارٍ الإرسال...' : 'Envoi...'}</>
                : <><i className="fas fa-paper-plane me-2"></i>{lang === 'ar' ? 'تقديم الطلب' : 'Déposer le dossier'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
