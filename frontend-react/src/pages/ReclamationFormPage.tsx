import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

// Fix for default marker icon in Leaflet + React
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

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

export default function ReclamationFormPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [image, setImage] = useState<File | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(KELIBIA_CENTER)

  const categories = [
    { id: 'lighting', label: t('category_lighting') },
    { id: 'trash', label: t('category_trash') },
    { id: 'roads', label: t('category_roads') },
    { id: 'noise', label: t('category_noise') },
    { id: 'other', label: t('category_other') },
  ]

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
      })
    }
  }

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    // Fetch User Info
    fetch(resolveBackendUrl('/accounts/user/'), {
      headers: { Authorization: `Bearer ${access}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => data && setUser(data))
      .catch(console.error)
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('category', category)
    if (image) formData.append('image', image)
    if (position) {
      formData.append('latitude', position[0].toString())
      formData.append('longitude', position[1].toString())
    }

    try {
      const res = await fetch('/api/reclamations/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: formData,
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/mes-reclamations'), 3000)
      } else {
        const data = await res.json()
        setError(JSON.stringify(data))
      }
    } catch (err) {
      setError(t('error_msg'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: t('reclamation_title') }]}
    >
      <div className="container py-2 pb-5">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            
            <div className="card-body p-4 p-md-5">
              {success ? (
                <div className="text-center py-5">
                  <div className="mb-4 text-success pulse">
                    <i className="fas fa-check-circle fa-5x"></i>
                  </div>
                  <h2 className="fw-bold mb-3">{t('reclamation_success')}</h2>
                  <p className="text-muted">L'IA municipale analyse votre demande...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger rounded-3 mb-4">{error}</div>}

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">{t('reclamation_title')}</label>
                    <input
                      type="text"
                      className="form-control form-control-lg bg-light border-0 shadow-sm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="Ex: Lampadaire en panne, Nid de poule..."
                      style={{ borderRadius: '12px' }}
                    />
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">Catégorie</label>
                        <select 
                            className="form-select form-select-lg bg-light border-0 shadow-sm"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ borderRadius: '12px' }}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold small text-uppercase text-muted">Image / Preuve (Optionnel)</label>
                        <input
                            type="file"
                            className="form-control form-control-lg bg-light border-0 shadow-sm"
                            onChange={(e) => e.target.files && setImage(e.target.files[0])}
                            accept="image/*"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Description</label>
                    <textarea
                      className="form-control form-control-lg bg-light border-0 shadow-sm"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      placeholder="Décrivez le problème en quelques mots..."
                      style={{ borderRadius: '12px' }}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold small text-uppercase text-muted mb-0">{t('reclamation_location')}</label>
                        <button type="button" onClick={getCurrentLocation} className="btn btn-sm btn-outline-primary rounded-pill px-3">
                            <i className="fas fa-location-arrow me-2"></i> {t('use_my_location')}
                        </button>
                    </div>
                    <div className="rounded-4 overflow-hidden shadow-sm border" style={{ height: '300px' }}>
                        <MapContainer center={KELIBIA_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <LocationMarker position={position} setPosition={setPosition} />
                        </MapContainer>
                    </div>
                    <small className="text-muted mt-2 d-block">
                        <i className="fas fa-info-circle me-1"></i> {t('pick_location')}
                    </small>
                  </div>

                  <div className="d-grid mt-5">
                    <button
                      type="submit"
                      className="btn btn-danger btn-lg rounded-pill py-3 fw-bold shadow-lg hover-lift"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-3"></span>
                      ) : (
                        <i className="fas fa-paper-plane me-3"></i>
                      )}
                      {t('submit')}
                    </button>
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
