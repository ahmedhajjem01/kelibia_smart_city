import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

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

interface Reclamation {
  id: number
  title: string
  description: string
  category: string
  status: string
  priority: string
  latitude: number | null
  longitude: number | null
  citizen_name: string
  created_at: string
  service_responsable: string
}

export default function AgentReclamationsPage() {
  const { t, setLang } = useI18n()
  const navigate = useNavigate()
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRec, setSelectedRec] = useState<Reclamation | null>(null)

  useEffect(() => {
    fetchReclamations()
  }, [])

  async function fetchReclamations() {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }
    try {
      const res = await fetch('/api/reclamations/', {
        headers: { Authorization: `Bearer ${access}` }
      })
      if (res.ok) {
        const data = await res.json()
        setReclamations(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(id: number, newStatus: string) {
    const access = getAccessToken()
    if (!access) return

    try {
      const res = await fetch(`/api/reclamations/${id}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchReclamations()
        if (selectedRec?.id === id) {
          setSelectedRec({ ...selectedRec, status: newStatus })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getPriorityColor = (p: string) => {
    if (p === 'urgente') return 'danger'
    if (p === 'normale') return 'info'
    return 'secondary'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="badge bg-warning text-dark">{t('status_pending')}</span>
      case 'in_progress': return <span className="badge bg-primary">{t('status_in_progress')}</span>
      case 'resolved': return <span className="badge bg-success">{t('status_resolved')}</span>
      case 'rejected': return <span className="badge bg-danger">{t('status_rejected')}</span>
      default: return <span className="badge bg-secondary">{status}</span>
    }
  }

  return (
    <div className="vh-100 d-flex flex-column bg-light overflow-hidden">
        {/* Navbar */}
        <nav className="navbar navbar-dark bg-dark px-4 py-2 border-bottom border-secondary border-opacity-25">
            <div className="container-fluid">
                <div className="d-flex align-items-center">
                    <Link to="/agent-dashboard" className="btn btn-outline-light btn-sm me-3 rounded-circle">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h5 className="mb-0 text-white fw-bold">
                        <i className="fas fa-map-marked-alt text-danger me-2"></i>
                        Centre de Commandement des Réclamations
                    </h5>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => setLang('fr')}
                        title="Français"
                      >
                        <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => setLang('ar')}
                        title="العربية"
                      >
                        <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
                      </button>
                    </div>
                    <span className="badge bg-danger rounded-pill px-3">
                        {reclamations.filter(r => r.status === 'pending').length} en attente
                    </span>
                    <button onClick={fetchReclamations} className="btn btn-sm btn-outline-warning rounded-pill px-3">
                        <i className="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        </nav>

        <div className="d-flex flex-grow-1 overflow-hidden">
            {/* Sidebar */}
            <div className="bg-white border-end shadow-sm d-flex flex-column" style={{ width: '400px' }}>
                <div className="p-3 border-bottom bg-light">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                        <input type="text" className="form-control border-start-0" placeholder="Filtrer les signalements..." />
                    </div>
                </div>
                <div className="overflow-auto flex-grow-1 p-2">
                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>
                    ) : reclamations.map(rec => (
                        <div 
                            key={rec.id} 
                            onClick={() => setSelectedRec(rec)}
                            className={`card mb-2 border-0 rounded-3 shadow-sm cursor-pointer hover-lift ${selectedRec?.id === rec.id ? 'border-start border-4 border-danger bg-light' : ''}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span className={`badge bg-${getPriorityColor(rec.priority)} small px-2 py-1`}>
                                        {t(`priority_${rec.priority}`)}
                                    </span>
                                    {getStatusBadge(rec.status)}
                                </div>
                                <h6 className="fw-bold mb-1 text-dark text-truncate">{rec.title}</h6>
                                <p className="text-muted small mb-2 text-truncate-2">{rec.description}</p>
                                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                    <small className="text-muted"><i className="fas fa-user-circle me-1"></i> {rec.citizen_name}</small>
                                    <small className="text-muted">ID: #{rec.id}</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-grow-1 position-relative">
                <MapContainer center={KELIBIA_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {reclamations.map(rec => rec.latitude && rec.longitude && (
                        <Marker 
                            key={rec.id} 
                            position={[rec.latitude, rec.longitude]}
                            eventHandlers={{ click: () => setSelectedRec(rec) }}
                        >
                            <Popup>
                                <div className="p-1">
                                    <h6 className="fw-bold mb-1">{rec.title}</h6>
                                    <p className="small text-muted mb-2">{rec.description}</p>
                                    <button onClick={() => setSelectedRec(rec)} className="btn btn-xs btn-primary w-100 py-1">Voir Détails</button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Detail Overlay */}
                {selectedRec && (
                    <div className="position-absolute bottom-0 start-0 e-0 p-4 w-100" style={{ pointerEvents: 'none', zIndex: 1000 }}>
                        <div className="card shadow-lg border-0 rounded-4 mx-auto" style={{ maxWidth: '800px', pointerEvents: 'auto' }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            {getStatusBadge(selectedRec.status)}
                                            <span className={`badge bg-${getPriorityColor(selectedRec.priority)}`}>
                                                {t(`priority_${selectedRec.priority}`)} (AI Classification)
                                            </span>
                                        </div>
                                        <h4 className="fw-bold mb-1">{selectedRec.title}</h4>
                                        <p className="text-muted small mb-3">Service Responsable: <span className="text-primary fw-bold">{selectedRec.service_responsable}</span></p>
                                    </div>
                                    <button onClick={() => setSelectedRec(null)} className="btn-close"></button>
                                </div>
                                <p className="mb-4">{selectedRec.description}</p>
                                <div className="d-flex gap-3">
                                    {selectedRec.status === 'pending' && (
                                        <button onClick={() => handleStatusUpdate(selectedRec.id, 'in_progress')} className="btn btn-primary rounded-pill px-4">
                                            Marquer comme En Cours
                                        </button>
                                    )}
                                    {selectedRec.status === 'in_progress' && (
                                        <button onClick={() => handleStatusUpdate(selectedRec.id, 'resolved')} className="btn btn-success rounded-pill px-4">
                                            Marquer comme Résolue
                                        </button>
                                    )}
                                    <button onClick={() => handleStatusUpdate(selectedRec.id, 'rejected')} className="btn btn-outline-danger rounded-pill px-4">
                                        Rejeter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <style>{`
            .cursor-pointer { cursor: pointer; }
            .hover-lift { transition: transform 0.2s; }
            .hover-lift:hover { transform: translateY(-2px); }
            .text-truncate-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .btn-xs { padding: 0.2rem 0.5rem; font-size: 0.75rem; }
            .leaflet-container { z-index: 1; }
        `}</style>
    </div>
  )
}
