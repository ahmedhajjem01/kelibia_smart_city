import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getAccessToken } from '../lib/authStorage'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
L.Marker.prototype.options.icon = DefaultIcon

const KELIBIA_CENTER: [number, number] = [36.8474, 11.0991]

type PublicEvent = {
  id: number
  titre_evenement: string
  type_evenement: string
  type_evenement_display: string
  lieu_type: string
  lieu_type_display: string
  lieu_details: string
  latitude: number | null
  longitude: number | null
  date_debut: string
  date_fin: string
  heure_debut: string
  heure_fin: string
  description: string
  nombre_participants: number
  nom_organisateur: string
  association_nom: string | null
}

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'fete_familiale', label: '🎂 Fête familiale' },
  { value: 'concert',        label: '🎵 Concert' },
  { value: 'marche',         label: '🛍️ Marché' },
  { value: 'association',    label: '🤝 Activité associative' },
  { value: 'sportif',        label: '⚽ Événement sportif' },
  { value: 'culturel',       label: '🎭 Événement culturel' },
  { value: 'commercial',     label: '💼 Événement commercial' },
  { value: 'autre',          label: '📅 Autre' },
]

const TYPE_COLOR: Record<string, string> = {
  fete_familiale: '#e91e63',
  concert:        '#9c27b0',
  marche:         '#ff9800',
  association:    '#2196f3',
  sportif:        '#4caf50',
  culturel:       '#ff5722',
  commercial:     '#607d8b',
  autre:          '#795548',
}

const TYPE_ICON: Record<string, string> = {
  fete_familiale: 'fa-birthday-cake',
  concert:        'fa-music',
  marche:         'fa-store',
  association:    'fa-users',
  sportif:        'fa-running',
  culturel:       'fa-theater-masks',
  commercial:     'fa-briefcase',
  autre:          'fa-calendar-day',
}

export default function EvenementsPublicsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'map'>('list')

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (access) {
      fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
        .then(r => r.ok && r.json()).then(d => d && setUser(d)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [filterType, filterDateFrom, filterDateTo, search])

  async function fetchEvents() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterType) params.append('type', filterType)
    if (filterDateFrom) params.append('date_from', filterDateFrom)
    if (filterDateTo) params.append('date_to', filterDateTo)
    if (search) params.append('search', search)
    try {
      const res = await fetch(`/api/evenements/publics/?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : (data.results || []))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmtTime = (t: string) => t ? t.slice(0, 5) : '—'

  const isOngoing = (ev: PublicEvent) => {
    const now = new Date()
    return new Date(ev.date_debut) <= now && new Date(ev.date_fin) >= now
  }
  const isUpcoming = (ev: PublicEvent) => new Date(ev.date_debut) > new Date()

  const eventsWithGPS = events.filter(e => e.latitude && e.longitude)

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: 'Événements publics' }]}>

      {/* Hero */}
      <div className="rounded-4 mb-4 p-4 text-white"
        style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #6f42c1 100%)' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1"><i className="fas fa-calendar-star me-2"></i>Événements publics</h2>
            <p className="mb-0 opacity-85" style={{ fontSize: '.9rem' }}>
              التظاهرات العمومية المرخصة من بلدية قليبية — Événements autorisés par la municipalité de Kélibia
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <span className="badge rounded-pill px-3 py-2"
              style={{ background: 'rgba(255,255,255,.2)', fontSize: '.85rem' }}>
              <i className="fas fa-check-circle me-1"></i>{events.length} événement{events.length !== 1 ? 's' : ''}
            </span>
            <Link to="/demande-evenement" className="btn btn-light rounded-pill px-4 fw-bold text-primary shadow-sm">
              <i className="fas fa-plus me-2"></i>Organiser un événement
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                <input type="text" className="form-control border-start-0 bg-white"
                  placeholder="Rechercher un événement..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select bg-white" value={filterType} onChange={e => setFilterType(e.target.value)}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="form-control bg-white" placeholder="Du"
                value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="form-control bg-white" placeholder="Au"
                value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <div className="d-flex rounded-3 overflow-hidden border" style={{ height: 38 }}>
                <button className={`flex-fill btn btn-sm fw-bold ${view === 'list' ? 'btn-primary' : 'btn-white'}`}
                  onClick={() => setView('list')}>
                  <i className="fas fa-list me-1"></i>Liste
                </button>
                <button className={`flex-fill btn btn-sm fw-bold ${view === 'map' ? 'btn-primary' : 'btn-white'}`}
                  onClick={() => setView('map')}>
                  <i className="fas fa-map me-1"></i>Carte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="mt-3 text-muted">Chargement des événements...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-calendar-times fa-3x text-muted opacity-25 mb-3 d-block"></i>
          <p className="text-muted">Aucun événement autorisé pour l'instant.</p>
          <p className="text-muted small">Vérifiez plus tard ou modifiez vos filtres.</p>
        </div>
      ) : view === 'list' ? (
        /* ── LIST VIEW ──────────────────────────────────────────── */
        <div className="row g-3">
          {events.map(ev => {
            const color = TYPE_COLOR[ev.type_evenement] || '#6c757d'
            const icon = TYPE_ICON[ev.type_evenement] || 'fa-calendar-day'
            const ongoing = isOngoing(ev)
            const upcoming = isUpcoming(ev)
            return (
              <div key={ev.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 rounded-4 shadow-sm h-100"
                  style={{ overflow: 'hidden', transition: 'transform .2s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  onClick={() => setSelectedEvent(ev === selectedEvent ? null : ev)}>

                  {/* Color band */}
                  <div className="d-flex align-items-center gap-3 p-3"
                    style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)`, borderBottom: `3px solid ${color}` }}>
                    <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 44, height: 44, background: color, color: '#fff', fontSize: '1.15rem' }}>
                      <i className={`fas ${icon}`}></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold text-truncate" style={{ color: '#1a1a2e', fontSize: '.95rem' }}>{ev.titre_evenement}</div>
                      <div className="small text-muted">{ev.type_evenement_display}</div>
                    </div>
                    {ongoing && (
                      <span className="badge bg-success rounded-pill" style={{ fontSize: '.68rem', whiteSpace: 'nowrap' }}>
                        <i className="fas fa-circle me-1" style={{ fontSize: '.5rem' }}></i>En cours
                      </span>
                    )}
                    {upcoming && (
                      <span className="badge bg-primary rounded-pill" style={{ fontSize: '.68rem', whiteSpace: 'nowrap' }}>
                        <i className="fas fa-clock me-1"></i>À venir
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="d-flex flex-column gap-2" style={{ fontSize: '.83rem', color: '#555' }}>
                      <div><i className="fas fa-map-marker-alt me-2 text-danger"></i>{ev.lieu_details}</div>
                      <div><i className="fas fa-calendar-alt me-2 text-primary"></i>
                        {fmt(ev.date_debut)} → {fmt(ev.date_fin)}
                      </div>
                      <div><i className="fas fa-clock me-2 text-success"></i>
                        {fmtTime(ev.heure_debut)} — {fmtTime(ev.heure_fin)}
                      </div>
                      <div><i className="fas fa-users me-2 text-info"></i>
                        {ev.nombre_participants} participants attendus
                      </div>
                      {ev.association_nom && (
                        <div><i className="fas fa-building me-2 text-secondary"></i>{ev.association_nom}</div>
                      )}
                    </div>

                    {selectedEvent?.id === ev.id && (
                      <div className="mt-3 pt-3 border-top" style={{ fontSize: '.83rem' }}>
                        <div className="text-muted fw-bold small text-uppercase mb-1">Description</div>
                        <p className="mb-2" style={{ lineHeight: 1.6 }}>{ev.description}</p>
                        <div className="text-muted fw-bold small text-uppercase mb-1">Organisateur</div>
                        <div>{ev.nom_organisateur}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── MAP VIEW ───────────────────────────────────────────── */
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-body p-0" style={{ height: 550 }}>
            <MapContainer center={KELIBIA_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' />
              {eventsWithGPS.map(ev => (
                <Marker key={ev.id} position={[ev.latitude!, ev.longitude!]}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div className="fw-bold mb-1" style={{ color: TYPE_COLOR[ev.type_evenement] || '#333' }}>
                        <i className={`fas ${TYPE_ICON[ev.type_evenement] || 'fa-calendar'} me-1`}></i>
                        {ev.titre_evenement}
                      </div>
                      <div className="small text-muted mb-1">{ev.type_evenement_display}</div>
                      <div className="small"><i className="fas fa-calendar me-1"></i>{fmt(ev.date_debut)} → {fmt(ev.date_fin)}</div>
                      <div className="small"><i className="fas fa-clock me-1"></i>{fmtTime(ev.heure_debut)} — {fmtTime(ev.heure_fin)}</div>
                      <div className="small"><i className="fas fa-users me-1"></i>{ev.nombre_participants} participants</div>
                      <div className="small text-muted mt-1">{ev.lieu_details}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {eventsWithGPS.length < events.length && (
            <div className="px-4 py-2 bg-light border-top" style={{ fontSize: '.82rem', color: '#888' }}>
              <i className="fas fa-info-circle me-1"></i>
              {events.length - eventsWithGPS.length} événement(s) sans coordonnées GPS ne sont pas affichés sur la carte.
            </div>
          )}
        </div>
      )}
    </MainLayout>
  )
}
