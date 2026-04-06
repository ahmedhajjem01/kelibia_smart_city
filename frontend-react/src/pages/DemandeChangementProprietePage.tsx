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

export default function DemandeChangementProprietePage() {
  const { lang, t } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    type_mutation: 'achat', // achat, heritage
    ancien_proprio: '',
    nouveau_proprio: '',
    num_titre_foncier: '',
    adresse_bien: '',
  })

  const [position, setPosition] = useState<[number, number] | null>(null)
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    acte_justificatif: null, // Contrat d'achat ou acte de succession
    cin_nouveau_proprio: null,
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
    if (files.acte_justificatif) fd.append('acte_justificatif', files.acte_justificatif)
    if (files.cin_nouveau_proprio) fd.append('cin_nouveau_proprio', files.cin_nouveau_proprio)

    try {
      // Simulation for PFE: wait 1.5s
      await new Promise(r => setTimeout(r, 1500))
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Mise à jour de Propriété' }]}>
        <div className="container py-5 text-center">
          <div className="text-primary mb-4"><i className="fas fa-file-signature fa-5x animate__animated animate__fadeIn"></i></div>
          <h2 className="fw-bold">{lang === 'ar' ? 'تم تسجيل طلب تغيير الملكية' : 'Demande de changement de propriété enregistrée'}</h2>
          <p className="text-muted">{lang === 'ar' ? 'سيتم دراسة الوثائق المقدمة وتحديث سجلات البلدية.' : 'Les documents seront examinés pour mettre à jour les registres fonciers de la municipalité.'}</p>
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
      breadcrumbs={[{ label: lang === 'ar' ? 'تغيير ملكية' : 'Changement de propriété' }]}
    >
      <div className={`container py-2 pb-5 ${lang === 'ar' ? 'text-end' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-gradient-navy text-white p-4 d-flex align-items-center gap-3" style={{ background: 'linear-gradient(135deg, #1a237e, #0d47a1)' }}>
                <i className="fas fa-file-contract fa-2x"></i>
                <div>
                    <h2 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>{lang === 'ar' ? 'تحيين ملكية عقار (بيع / إرث)' : 'Mutation de Propriété (Achat / Héritage)'}</h2>
                    <p className="mb-0 small opacity-75">{lang === 'ar' ? 'قم بتعديل سجلات البلدية عند انتقال ملكية عقار' : 'Mettez à jour les registres suite à une transaction ou une succession.'}</p>
                </div>
              </div>
              <div className="card-body p-4 p-md-5">
                {error && <div className="alert alert-danger mb-4 shadow-sm rounded-3">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                  <div className="row g-4 mb-5">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'سبب التغيير' : 'Motif du changement'}</label>
                      <div className="d-flex gap-3">
                        <div className={`flex-grow-1 p-3 border rounded-3 text-center cursor-pointer ${formData.type_mutation === 'achat' ? 'bg-primary text-white border-primary shadow' : 'bg-light text-muted'}`} 
                             onClick={() => setFormData({...formData, type_mutation: 'achat'})}>
                          <i className="fas fa-shopping-cart d-block mb-2 fa-lg"></i>
                          {lang === 'ar' ? 'شراء' : 'Achat'}
                        </div>
                        <div className={`flex-grow-1 p-3 border rounded-3 text-center cursor-pointer ${formData.type_mutation === 'heritage' ? 'bg-primary text-white border-primary shadow' : 'bg-light text-muted'}`}
                             onClick={() => setFormData({...formData, type_mutation: 'heritage'})}>
                          <i className="fas fa-users-cog d-block mb-2 fa-lg"></i>
                          {lang === 'ar' ? 'إرث' : 'Héritage'}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'رقم الرسم العقاري' : 'Numéro du Titre Foncier'}</label>
                      <input 
                        type="text" className="form-control form-control-lg border-0 bg-light shadow-sm py-3" 
                        placeholder="Ex: 55432/Nabeul"
                        value={formData.num_titre_foncier} onChange={e => setFormData({...formData, num_titre_foncier: e.target.value})}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'اسم المالك السابق' : 'Nom de l\'ancien propriétaire'}</label>
                      <input 
                        type="text" className="form-control form-control-lg border-0 bg-light shadow-sm" 
                        value={formData.ancien_proprio} onChange={e => setFormData({...formData, ancien_proprio: e.target.value})}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'اسم المالك الجديد' : 'Nom du nouveau propriétaire'}</label>
                      <input 
                        type="text" className="form-control form-control-lg border-0 bg-light shadow-sm" 
                        value={formData.nouveau_proprio} onChange={e => setFormData({...formData, nouveau_proprio: e.target.value})}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'عنوان العقار' : 'Adresse du bien'}</label>
                      <input 
                        type="text" className="form-control form-control-lg border-0 bg-light shadow-sm" 
                        value={formData.adresse_bien} onChange={e => setFormData({...formData, adresse_bien: e.target.value})}
                        required
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="form-label fw-bold text-muted small text-uppercase mb-3 d-block">
                        <i className="fas fa-map-marked-alt me-2 text-primary"></i>
                        {lang === 'ar' ? 'موقع العقار على الخريطة' : 'Identifier le bien sur la carte'}
                    </label>
                    <div className="rounded-4 overflow-hidden border shadow-sm" style={{ height: 350 }}>
                        <MapContainer center={[36.8481, 11.0939]} zoom={15} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapClickHandler onLocationSelect={(lat, lng) => setPosition([lat, lng])} />
                            {position && <Marker position={position} />}
                        </MapContainer>
                    </div>
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">
                          {formData.type_mutation === 'achat' 
                            ? (lang === 'ar' ? 'عقد البيع (PDF)' : 'Contrat de vente (PDF)') 
                            : (lang === 'ar' ? 'حجة الوفاة وحصر الإرث' : 'Acte de succession (PDF)')}
                      </label>
                      <input type="file" className="form-control border-0 bg-light shadow-sm" onChange={e => handleFileChange(e, 'acte_justificatif')} required style={{ borderRadius: '12px' }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'ب.ت.و المالك الجديد' : 'CIN du nouveau propriétaire'}</label>
                      <input type="file" className="form-control border-0 bg-light shadow-sm" onChange={e => handleFileChange(e, 'cin_nouveau_proprio')} required style={{ borderRadius: '12px' }} />
                    </div>
                  </div>

                  <div className="d-grid gap-3 pt-4">
                    <button type="submit" className="btn btn-primary btn-lg rounded-pill py-3 fw-bold shadow-lg" disabled={loading || !position}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-check-double me-2"></i>}
                      {lang === 'ar' ? 'إرسال طلب التحيين' : 'Valider la mutation de propriété'}
                    </button>
                    {!position && <div className="text-center text-danger small fw-bold">{lang === 'ar' ? 'برجاء تحديد موقع العقار على الخريطة' : 'Localisation obligatoire sur la carte'}</div>}
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
