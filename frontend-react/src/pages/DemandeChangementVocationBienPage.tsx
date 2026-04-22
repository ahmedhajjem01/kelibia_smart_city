import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

// Fix for Leaflet marker icons
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

export default function DemandeChangementVocationBienPage() {
  const { lang, t } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    vocation_actuelle: 'logement', // logement, commerce, bureau, industrie
    vocation_nouvelle: 'commerce',
    num_titre_foncier: '',
    adresse_bien: '',
    motif: '',
  })

  const [position, setPosition] = useState<[number, number] | null>(null)
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    titre_propriete: null,
    plan_amenagement: null, // Plan d'aménagement ou descriptif
    cin_proprio: null,
  })

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    fetch(resolveBackendUrl('/api/accounts/me/'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => data && setUser(data))
      .catch(console.error)
  }, [navigate])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files?.[0]) {
      setFiles({ ...files, [field]: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const token = getAccessToken()
    if (!token) return

    setLoading(true)
    setError(null)

    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
    if (position) {
      fd.append('latitude', position[0].toString())
      fd.append('longitude', position[1].toString())
    }
    if (files.titre_propriete) fd.append('titre_propriete', files.titre_propriete)
    if (files.plan_amenagement) fd.append('plan_amenagement', files.plan_amenagement)
    if (files.cin_proprio) fd.append('cin_proprio', files.cin_proprio)

    try {
      // Simulation for PFE
      await new Promise(r => setTimeout(r, 1500))
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Changement de Vocation' }]}>
        <div className="container py-5 text-center">
          <div className="text-warning mb-4"><i className="fas fa-hammer fa-5x animate__animated animate__rotateIn"></i></div>
          <h2 className="fw-bold">{lang === 'ar' ? 'تم تسجيل طلب تغيير الصبغة' : 'Demande de changement de vocation enregistrée'}</h2>
          <p className="text-muted">{lang === 'ar' ? 'سيتم دراسة الطلب من قبل المصالح الفنية واللجنة المختصة ببلدية قليبية.' : 'Votre demande sera examinée par les services techniques et la commission compétente de la municipalité de Kélibia.'}</p>
          <div className="mt-4 gap-3 d-flex justify-content-center">
            <Link to="/mes-demandes" className="btn btn-primary rounded-pill px-4">{lang === 'ar' ? 'متابعة طلباتي' : 'Suivre mes demandes'}</Link>
            <Link to="/services" className="btn btn-outline-secondary rounded-pill px-4">{t('back_to_services')}</Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: lang === 'ar' ? 'تغيير صبغة عقار' : 'Changement de vocation' }]}
    >
      <div className={`container py-2 pb-5 ${lang === 'ar' ? 'text-end' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-warning text-dark p-4 d-flex align-items-center gap-3">
                <i className="fas fa-exchange-alt fa-2x"></i>
                <div>
                    <h2 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>{lang === 'ar' ? 'تغيير صبغة استعمال عقار' : 'Changement de Vocation du Bien'}</h2>
                    <p className="mb-0 small opacity-75">{lang === 'ar' ? 'تحويل عقار من صبغة سكنية إلى تجارية، مهنية أو غيرها' : 'Transformation d\'un logement en commerce, bureaux, etc.'}</p>
                </div>
              </div>
              <div className="card-body p-4 p-md-5">
                {error && <div className="alert alert-danger mb-4 shadow-sm rounded-3"><i className="fas fa-exclamation-triangle me-2"></i>{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="row g-4 mb-5">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'الصبغة الحالية' : 'Vocation actuelle'}</label>
                      <select className="form-select form-select-lg border-0 bg-light" value={formData.vocation_actuelle} onChange={e => setFormData({...formData, vocation_actuelle: e.target.value})} style={{ borderRadius: '12px' }}>
                        <option value="logement">{lang === 'ar' ? 'سكن' : 'Logement'}</option>
                        <option value="commerce">{lang === 'ar' ? 'تجارة' : 'Commerce'}</option>
                        <option value="bureau">{lang === 'ar' ? 'مكاتب / مهني' : 'Bureaux / Professionnel'}</option>
                        <option value="industrie">{lang === 'ar' ? 'صناعي' : 'Industriel'}</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'الصبغة المطلوبة' : 'Nouvelle vocation'}</label>
                      <select className="form-select form-select-lg border-0 bg-light" value={formData.vocation_nouvelle} onChange={e => setFormData({...formData, vocation_nouvelle: e.target.value})} style={{ borderRadius: '12px' }}>
                        <option value="commerce">{lang === 'ar' ? 'تجارة' : 'Commerce'}</option>
                        <option value="logement">{lang === 'ar' ? 'سكن' : 'Logement'}</option>
                        <option value="bureau">{lang === 'ar' ? 'مكاتب / مهني' : 'Bureaux / Professionnel'}</option>
                        <option value="industrie">{lang === 'ar' ? 'صناعي' : 'Industriel'}</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'رقم الرسم العقاري' : 'Numéro du Titre Foncier'}</label>
                      <input type="text" className="form-control form-control-lg border-0 bg-light" value={formData.num_titre_foncier} onChange={e => setFormData({...formData, num_titre_foncier: e.target.value})} required style={{ borderRadius: '12px' }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'عنوان العقار' : 'Adresse du bien'}</label>
                      <input type="text" className="form-control form-control-lg border-0 bg-light" value={formData.adresse_bien} onChange={e => setFormData({...formData, adresse_bien: e.target.value})} required style={{ borderRadius: '12px' }} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'الهدف من التغيير' : 'Justification / Motif du changement'}</label>
                      <textarea className="form-control border-0 bg-light" rows={3} value={formData.motif} onChange={e => setFormData({...formData, motif: e.target.value})} required style={{ borderRadius: '12px' }}></textarea>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="form-label fw-bold text-muted small text-uppercase mb-3 d-block">
                        <i className="fas fa-globe-africa me-2 text-warning"></i>
                        {lang === 'ar' ? 'موقع العقار على الخريطة' : 'Identifier le bien sur la carte'}
                    </label>
                    <div className="rounded-4 overflow-hidden border shadow-sm" style={{ height: 320 }}>
                        <MapContainer center={[36.8481, 11.0939]} zoom={15} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapClickHandler onLocationSelect={(lat, lng) => setPosition([lat, lng])} />
                            {position && <Marker position={position} icon={L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })} />}
                        </MapContainer>
                    </div>
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'شهادة ملكية' : 'Titre de Propriété'}</label>
                      <input type="file" className="form-control border-0 bg-light shadow-sm" onChange={e => handleFileChange(e, 'titre_propriete')} required style={{ borderRadius: '12px' }} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'خارطة / مشروع' : 'Plan / Descriptif'}</label>
                      <input type="file" className="form-control border-0 bg-light shadow-sm" onChange={e => handleFileChange(e, 'plan_amenagement')} required style={{ borderRadius: '12px' }} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'صورة CIN' : 'Copie CIN'}</label>
                      <input type="file" className="form-control border-0 bg-light shadow-sm" onChange={e => handleFileChange(e, 'cin_proprio')} required style={{ borderRadius: '12px' }} />
                    </div>
                  </div>

                  <div className="d-grid gap-3 pt-4">
                    <button type="submit" className="btn btn-warning btn-lg rounded-pill py-3 fw-bold shadow-lg" disabled={loading || !position}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-file-export me-2"></i>}
                      {lang === 'ar' ? 'إرسال طلب تغيير الصبغة' : 'Envoyer la demande de changement'}
                    </button>
                    {!position && <div className="text-center text-danger small fw-bold">{lang === 'ar' ? 'برجاء تحديد الموقع على الخريطة' : 'Localisation obligatoire sur la carte'}</div>}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
