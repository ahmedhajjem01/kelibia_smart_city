import React, { useState, useEffect } from 'react'

import { useNavigate } from 'react-router-dom'

import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, useMap } from 'react-leaflet'

import L from 'leaflet'

import { getAccessToken } from '../lib/authStorage'

import { useI18n } from '../i18n/LanguageProvider'

import { resolveBackendUrl } from '../lib/backendUrl'

import MainLayout from '../components/MainLayout'



import markerIcon from 'leaflet/dist/images/marker-icon.png'

import markerShadow from 'leaflet/dist/images/marker-shadow.png'



let DefaultIcon = L.icon({

  iconUrl: markerIcon,

  shadowUrl: markerShadow,

  iconSize: [25, 41],

  iconAnchor: [12, 41]

})

L.Marker.prototype.options.icon = DefaultIcon



const KELIBIA_CENTER: [number, number] = [36.8474, 11.0991]



function LocationMarker({ position, onMapClick }: { position: [number, number] | null, onMapClick: (pos: [number, number]) => void }) {

  useMapEvents({ click(e) { onMapClick([e.latlng.lat, e.latlng.lng]) } })

  return position === null ? null : <Marker position={position} />

}



function RecenterMap({ position }: { position: [number, number] | null }) {

  const map = useMap()

  useEffect(() => { if (position) map.setView(position) }, [position, map])

  return null

}



const CSS = `

.rf-wrap { max-width: 720px; margin: 0 auto; }

.rf-card { background:#fff; border:1px solid #eeeeee; border-top:3px solid #d4aa8d; }

.rf-card-body { padding:28px 28px 24px; }

.rf-section-title { font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; margin-bottom:10px; }

.rf-label { font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px; color:#6b7280; margin-bottom:6px; display:block; }

.rf-input { width:100%; padding:10px 14px; border:1px solid #e5e7eb; background:#f9fafb; font-size:.85rem; color:#1a1c1c; outline:none; transition:border .15s; font-family:inherit; }

.rf-input:focus { border-color:#d4aa8d; background:#fff; }

.rf-input-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

.rf-submit-btn { width:100%; padding:14px; background:linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%); color:#fff; border:none; cursor:pointer; font-weight:800; font-size:.85rem; text-transform:uppercase; letter-spacing:1px; font-family:'Public Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:10px; transition:filter .2s; margin-top:24px; }

.rf-submit-btn:hover:not(:disabled) { filter:brightness(1.1); }

.rf-submit-btn:disabled { opacity:.6; cursor:not-allowed; }

.rf-gps-box { border:1px solid #e5e7eb; background:#f9fafb; padding:14px 16px; margin-bottom:12px; }

.rf-gps-status { display:flex; align-items:center; gap:8px; font-size:.78rem; font-weight:600; margin-bottom:10px; }

.rf-gps-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; background:#E6F4F7; color:#0F4C5C; border:1px solid #B5DDE5; cursor:pointer; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.3px; transition:background .15s; }

.rf-gps-btn:hover:not(:disabled) { background:#B5DDE5; }

.rf-gps-btn:disabled { opacity:.5; cursor:not-allowed; }

.rf-gps-clear { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; background:#f3f4f6; color:#374151; border:1px solid #e5e7eb; cursor:pointer; font-size:.72rem; font-weight:700; text-transform:uppercase; }

.rf-gps-clear:hover { background:#e5e7eb; }

.rf-map { height:280px; border:1px solid #e5e7eb; }

.rf-map-hint { font-size:.7rem; color:#9ca3af; margin-top:8px; display:flex; align-items:center; gap:5px; }

.rf-success { text-align:center; padding:60px 20px; }

.rf-success-icon { font-size:3rem; color:#065f46; margin-bottom:16px; }

.rf-success-title { font-size:1rem; font-weight:900; color:#1a1c1c; font-family:'Public Sans',sans-serif; text-transform:uppercase; margin-bottom:8px; }

.rf-success-sub { font-size:.78rem; color:#6b7280; }

.rf-error { background:#fee2e2; color:#991b1b; padding:12px 16px; font-size:.8rem; font-weight:600; margin-bottom:16px; border-left:3px solid #C44536; }

.rf-divider { border:none; border-top:1px solid #f3f4f6; margin:20px 0; }

`



export default function ReclamationFormPage() {

  const { t } = useI18n()

  const navigate = useNavigate()



  const gpsStatusConfig = {

    none:    { color: '#9ca3af', icon: 'fa-map-marker-alt',      text: t('gps_no_selection') },

    manual:  { color: '#d4aa8d', icon: 'fa-map-pin',             text: t('gps_manual_pos') },

    gps:     { color: '#065f46', icon: 'fa-location-arrow',      text: t('gps_detected') },

    loading: { color: '#d97706', icon: 'fa-circle-notch fa-spin', text: t('gps_fetching') },

  }



  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState('')

  const [description, setDescription] = useState('')

  const [category, setCategory] = useState('other')

  const [image, setImage] = useState<File | null>(null)

  const [position, setPosition] = useState<[number, number] | null>(null)

  const [gpsStatus, setGpsStatus] = useState<'none' | 'manual' | 'gps' | 'loading'>('none')



  const categories = [

    { id: 'lighting', label: t('category_lighting') },

    { id: 'trash',    label: t('category_trash') },

    { id: 'roads',    label: t('category_roads') },

    { id: 'noise',    label: t('category_noise') },

    { id: 'other',    label: t('category_other') },

  ]



  const handleMapClick = (pos: [number, number]) => { setPosition(pos); setGpsStatus('manual') }



  const getCurrentLocation = () => {

    if (!navigator.geolocation) { setError(t('gps_not_supported')); return }

    setGpsStatus('loading')

    navigator.geolocation.getCurrentPosition(

      (pos) => { setPosition([pos.coords.latitude, pos.coords.longitude]); setGpsStatus('gps') },

      (err) => {

        setGpsStatus('none')

        setError(err.code === err.PERMISSION_DENIED ? t('gps_access_denied') : t('gps_error_retry'))

      },

      { enableHighAccuracy: true, timeout: 10000 }

    )

  }



  const clearLocation = () => { setPosition(null); setGpsStatus('none') }



  useEffect(() => {

    const access = getAccessToken()

    if (!access) { navigate('/login'); return }

    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })

      .then(res => res.ok && res.json()).then(data => data && setUser(data)).catch(console.error)

  }, [navigate])



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault()

    setLoading(true); setError(null)

    const access = getAccessToken()

    if (!access) { navigate('/login'); return }

    const formData = new FormData()

    formData.append('title', title)

    formData.append('description', description)

    formData.append('category', category)

    if (image) {
      // Shorten filename to avoid backend 100 char limit
      const extension = image.name.split('.').pop() || 'jpg'
      const newFile = new File([image], `signalement_${Date.now()}.${extension}`, { type: image.type })
      formData.append('image', newFile)
    }

    if (position) {

      formData.append('latitude', position[0].toString())

      formData.append('longitude', position[1].toString())

    }

    try {

      const res = await fetch(resolveBackendUrl('/api/reclamations/'), { method: 'POST', headers: { Authorization: `Bearer ${access}` }, body: formData })

      if (res.ok) { setSuccess(true); setTimeout(() => navigate('/mes-reclamations'), 3000) }

      else {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { detail: `Erreur serveur (${res.status})` };
        }
        setError(JSON.stringify(errorData));
      }
    } catch (e: any) {
      setError(e.message || t('error_msg'));
    } finally {
      setLoading(false)
    }

  }



  return (

    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: t('reclamation_title') }]}>

      <style>{CSS}</style>

      <div className="rf-wrap">

        <div className="rf-card">

          <div className="rf-card-body">

            {!user ? (
              <div className="text-center py-5">
                <i className="fas fa-spinner fa-spin fa-2x text-primary" />
                <p className="mt-2 text-muted">{t('loading') || 'Chargement en cours...'}</p>
              </div>
            ) : !user.is_verified ? (
              <div className="alert alert-warning border-0 shadow-sm p-4 d-flex align-items-center" style={{ borderRadius: '15px' }}>
                <i className="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
                <div>
                  <h5 className="fw-bold mb-1">{t('unverified_title')}</h5>
                  <p className="mb-0">{t('account_verification_required')}</p>
                </div>
              </div>
            ) : success ? (

              <div className="rf-success">

                <div className="rf-success-icon"><i className="fas fa-check-circle"></i></div>

                <div className="rf-success-title">{t('reclamation_success')}</div>

                <div className="rf-success-sub">{t('ai_analyzing_msg')}</div>

              </div>

            ) : (

              <form onSubmit={handleSubmit}>

                {error && <div className="rf-error"><i className="fas fa-exclamation-circle me-2"></i>{error}</div>}



                {/* Title */}

                <div style={{ marginBottom: 18 }}>

                  <label className="rf-label">{t('reclamation_title')}</label>

                  <input type="text" className="rf-input" value={title} onChange={e => setTitle(e.target.value)}

                    required placeholder={t('reclamation_placeholder_title')} />

                </div>



                {/* Category + Image */}

                <div className="rf-input-row" style={{ marginBottom: 18 }}>

                  <div>

                    <label className="rf-label">{t('category_label')}</label>

                    <select className="rf-input" value={category} onChange={e => setCategory(e.target.value)}>

                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}

                    </select>

                  </div>

                  <div>

                    <label className="rf-label">{t('image_label')}</label>

                    <input type="file" className="rf-input" onChange={e => e.target.files && setImage(e.target.files[0])} accept="image/*" />

                  </div>

                </div>



                {/* Description */}

                <div style={{ marginBottom: 18 }}>

                  <label className="rf-label">{t('description_label')}</label>

                  <textarea className="rf-input" rows={3} value={description} onChange={e => setDescription(e.target.value)}

                    required placeholder={t('description_placeholder')} style={{ resize: 'vertical' }} />

                </div>



                <hr className="rf-divider" />



                {/* Location */}

                <div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>

                    <label className="rf-label" style={{ marginBottom: 0 }}>

                      {t('reclamation_location')}

                      <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: '.68rem' }}>(optionnel)</span>

                    </label>

                    <div style={{ display: 'flex', gap: 8 }}>

                      {position && (

                        <button type="button" className="rf-gps-clear" onClick={clearLocation}>

                          <i className="fas fa-times"></i>{t('clear_btn')}

                        </button>

                      )}

                      <button type="button" className="rf-gps-btn" onClick={getCurrentLocation} disabled={gpsStatus === 'loading'}>

                        <i className={`fas ${gpsStatus === 'loading' ? 'fa-circle-notch fa-spin' : 'fa-location-arrow'}`}></i>

                        {gpsStatus === 'loading' ? t('loading') : t('use_my_location')}

                      </button>

                    </div>

                  </div>



                  {/* GPS status */}

                  <div className="rf-gps-box">

                    <div className="rf-gps-status" style={{ color: gpsStatusConfig[gpsStatus].color }}>

                      <i className={`fas ${gpsStatusConfig[gpsStatus].icon}`}></i>

                      {gpsStatusConfig[gpsStatus].text}

                    </div>

                    <div className="rf-input-row">

                      <div>

                        <label className="rf-label">Latitude</label>

                        <input type="number" step="0.000001" className="rf-input" placeholder="ex: 36.8474"

                          value={position ? position[0] : ''}

                          onChange={e => {

                            const val = parseFloat(e.target.value)

                            if (!isNaN(val)) { setPosition([val, position ? position[1] : KELIBIA_CENTER[1]]); setGpsStatus('manual') }

                            else if (e.target.value === '') { setPosition(null); setGpsStatus('none') }

                          }} />

                      </div>

                      <div>

                        <label className="rf-label">Longitude</label>

                        <input type="number" step="0.000001" className="rf-input" placeholder="ex: 11.0991"

                          value={position ? position[1] : ''}

                          onChange={e => {

                            const val = parseFloat(e.target.value)

                            if (!isNaN(val)) { setPosition([position ? position[0] : KELIBIA_CENTER[0], val]); setGpsStatus('manual') }

                            else if (e.target.value === '') { setPosition(null); setGpsStatus('none') }

                          }} />

                      </div>

                    </div>

                  </div>



                  {/* Map */}

                  <div className="rf-map">

                    <MapContainer center={position ?? KELIBIA_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>

                      <LayersControl position="topright">

                        <LayersControl.BaseLayer checked name={t('map_standard') || 'Standard'}>

                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />

                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name={t('map_satellite') || 'Satellite'}>

                          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

                            attribution='Tiles &copy; Esri' />

                        </LayersControl.BaseLayer>

                      </LayersControl>

                      <LocationMarker position={position} onMapClick={handleMapClick} />

                      <RecenterMap position={position} />

                    </MapContainer>

                  </div>

                  <div className="rf-map-hint">

                    <i className="fas fa-info-circle"></i>{t('map_instruction')}

                  </div>

                </div>



                {/* Submit */}

                <button type="submit" className="rf-submit-btn" disabled={loading}>

                  {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-paper-plane"></i>}

                  {t('submit')}

                </button>

              </form>

            )}

          </div>

        </div>

      </div>

    </MainLayout>

  )

}

