import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

const resolveBackendUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  // If we are on localhost, use localhost:8000
  // In production, we assume media is served from the same base as /api/
  const base = window.location.hostname === 'localhost' ? 'http://localhost:8000' : ''
  return `${base}${path}`
}

type UserInfo = {
  first_name: string; last_name: string; email: string
  user_type?: string; is_staff?: boolean; is_superuser?: boolean; city?: string
}
type Reclamation = {
  id: number; title: string; description: string; created_at: string
  citizen_name?: string; status: string; category: string; priority: string
  service_responsable?: string; latitude?: number | null; longitude?: number | null; image?: string
  confidence?: { category?: number; priority?: number }
}

const CAT: Record<string, { label: string; cls: string }> = {
  lighting: { label: '💡 Éclairage', cls: 'cat-lighting' },
  trash:    { label: '🗑️ Déchets',   cls: 'cat-trash'    },
  roads:    { label: '🛣️ Voirie',    cls: 'cat-roads'    },
  noise:    { label: '🔊 Nuisances', cls: 'cat-noise'    },
  other:    { label: '📌 Autre',     cls: 'cat-other'    },
}
const STATUS: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'En attente', cls: 'status-pending'     },
  in_progress: { label: 'En cours',  cls: 'status-in_progress' },
  resolved:    { label: 'Résolue',   cls: 'status-resolved'    },
  rejected:    { label: 'Rejetée',   cls: 'status-rejected'    },
}
const PRIORITY: Record<string, { label: string; cls: string }> = {
  urgente: { label: '🔴 Urgente', cls: 'priority-urgente' },
  normale: { label: '🔵 Normale', cls: 'priority-normale' },
  faible:  { label: '🟣 Faible',  cls: 'priority-faible'  },
}
function initials(name: string) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}
function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })
}
const PAGE_SIZE = 10

function getRoleLabel(u: UserInfo | null) {
  if (!u) return 'Chargement...'
  if (u.is_superuser || u.is_staff || u.user_type === 'supervisor' || u.user_type === 'Superviseur') return 'Superviseur'
  return 'Agent Municipal'
}

const CSS = `
:root{--green-dark:#1a5c2a;--green-mid:#2e7d32;--green-light:#43a047;--red-tn:#c62828;--blue:#1565c0;--sidebar-bg:#1e2a3a;--sidebar-hover:#2d3f54;--body-bg:#eef2f7;--card-shadow:0 2px 12px rgba(0,0,0,.08)}
.agent-page{font-family:"Segoe UI",sans-serif;background:var(--body-bg);min-height:100vh}
.ag-topbar{background:var(--green-dark);color:#fff;font-size:.8rem;padding:4px 20px;display:flex;justify-content:space-between;align-items:center}
.ag-topbar a{color:rgba(255,255,255,.75);text-decoration:none;margin:0 6px}.ag-topbar a:hover{color:#fff}
.ag-navbar{background:#fff;border-bottom:3px solid var(--green-mid);padding:0 20px;display:flex;align-items:center;justify-content:space-between;height:68px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.ag-brand{display:flex;align-items:center;gap:14px;text-decoration:none}
.ag-logo{width:52px;height:52px;background:var(--green-mid);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.4rem}
.ag-title .main{font-size:1.05rem;font-weight:700;color:var(--green-dark);display:block}.ag-title .sub{font-size:.75rem;color:#777}
.ag-actions{display:flex;align-items:center;gap:10px}
.ag-lang-btn{background:none;border:1px solid #ddd;border-radius:6px;padding:4px 10px;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:.82rem;color:#444;transition:all .2s}
.ag-lang-btn:hover{border-color:var(--green-mid);color:var(--green-mid)}.ag-lang-btn.active{background:var(--green-mid);color:#fff;border-color:var(--green-mid)}
.ag-user-pill{background:var(--green-mid);color:#fff;border-radius:50px;padding:5px 14px 5px 5px;display:flex;align-items:center;gap:8px;font-size:.85rem}
.ag-user-pill .av{width:28px;height:28px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--green-mid);font-size:.75rem;font-weight:700}
.ag-logout{background:var(--red-tn);color:#fff;border:none;border-radius:6px;padding:5px 12px;font-size:.82rem;cursor:pointer;display:flex;align-items:center;gap:5px}
.ag-logout:hover{background:#b71c1c}
.ag-hero{background:linear-gradient(135deg,#1a3a5c 0%,#1565c0 100%);color:#fff;padding:22px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.ag-hero .greeting{font-size:1.15rem;font-weight:600}.ag-hero .sub{font-size:.85rem;opacity:.85}
.ag-hero .badge-role{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:20px;padding:4px 14px;font-size:.78rem}
.ag-breadcrumb{background:#fff;border-bottom:1px solid #e0e0e0;padding:8px 28px;font-size:.8rem;color:#666}
.ag-breadcrumb a{color:var(--green-mid);text-decoration:none}
.ag-body{display:flex;min-height:calc(100vh - 200px);align-items:flex-start}
.ag-sidebar{width:240px;min-width:240px;background:var(--sidebar-bg);color:#c8d6e5;padding:20px 0;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
.ag-sec-title{font-size:.68rem;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.35);padding:14px 20px 4px}
.ag-nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;border-left:3px solid transparent;transition:all .2s;font-size:.88rem;text-decoration:none;color:#c8d6e5}
.ag-nav-item:hover,.ag-nav-item.active{background:var(--sidebar-hover);color:#fff;border-left-color:#1565c0}
.ag-nav-item i{width:18px;text-align:center;font-size:.9rem}
.ag-divider{border-top:1px solid rgba(255,255,255,.06);margin:10px 0}
.ag-badge{margin-left:auto;background:var(--red-tn);color:#fff;border-radius:10px;padding:1px 7px;font-size:.7rem;font-weight:700}
.ag-main{flex:1;padding:24px 28px;overflow-x:hidden}
.ag-stat{background:#fff;border-radius:10px;padding:18px 20px;box-shadow:var(--card-shadow);display:flex;align-items:center;gap:16px;border-left:4px solid var(--green-mid);transition:transform .2s}
.ag-stat:hover{transform:translateY(-2px)}
.ag-stat .icon-box{width:46px;height:46px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
.ag-stat .val{font-size:1.5rem;font-weight:700;line-height:1;color:#1a1a2e}.ag-stat .lbl{font-size:.78rem;color:#888;margin-top:2px}
.ag-card{background:#fff;border-radius:10px;box-shadow:var(--card-shadow);margin-bottom:22px;overflow:hidden}
.ag-card-hdr-blue{background:linear-gradient(90deg,#1a3a5c,#1565c0);color:#fff;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;font-size:.9rem;font-weight:600}
.ag-card-hdr-green{background:linear-gradient(90deg,var(--green-dark),var(--green-light));color:#fff;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;font-size:.9rem;font-weight:600}
.ag-card-hdr-orange{background:linear-gradient(90deg,#bf360c,#ff6d00);color:#fff;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;font-size:.9rem;font-weight:600}
.ag-card-body{padding:18px}
.ag-filter-bar{padding:12px 18px;background:#f8f9fa;border-bottom:1px solid #e8e8e8;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ag-filter-select{border:1.5px solid #dde3ec;border-radius:7px;padding:5px 10px;font-size:.8rem;color:#444;background:#fff;cursor:pointer}
.ag-filter-btn{border:1.5px solid #dde3ec;border-radius:7px;padding:5px 12px;font-size:.8rem;color:#444;background:#fff;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px}
.ag-filter-btn:hover,.ag-filter-btn.active{background:#1565c0;color:#fff;border-color:#1565c0}
.ag-search-wrap{position:relative}
.ag-search-wrap i{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:#aaa;font-size:.8rem}
.ag-search-input{border:1.5px solid #dde3ec;border-radius:7px;padding:5px 10px 5px 30px;font-size:.8rem;width:200px;background:#fff}
.ag-table{width:100%;border-collapse:separate;border-spacing:0}
.ag-table thead th{background:#f4f6f8;color:#555;font-size:.75rem;font-weight:600;padding:10px 12px;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e0e0e0;white-space:nowrap}
.ag-table tbody tr{transition:background .15s}.ag-table tbody tr:hover{background:#f0f7ff}
.ag-table tbody td{padding:11px 12px;font-size:.83rem;color:#333;border-bottom:1px solid #f0f0f0;vertical-align:middle}
.cat-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:.72rem;font-weight:600;white-space:nowrap}
.cat-lighting{background:#fff8e1;color:#f57f17}.cat-trash{background:#e8f5e9;color:#2e7d32}.cat-roads{background:#ede7f6;color:#4527a0}.cat-noise{background:#fce4ec;color:#880e4f}.cat-other{background:#eceff1;color:#37474f}
.status-badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:.72rem;font-weight:600}
.status-pending{background:#fff3e0;color:#e65100}.status-in_progress{background:#e3f2fd;color:#1565c0}.status-resolved{background:#e8f5e9;color:#1b5e20}.status-rejected{background:#ffebee;color:#b71c1c}
.priority-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:.7rem;font-weight:700;white-space:nowrap}
.priority-urgente{background:#ffebee;color:#b71c1c;border:1px solid #ffcdd2}.priority-normale{background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb}.priority-faible{background:#f3e5f5;color:#6a1b9a;border:1px solid #e1bee7}
.service-badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:.68rem;font-weight:600;background:#e8eaf6;color:#283593;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis}
.ag-status-select{border:1.5px solid #dde3ec;border-radius:6px;padding:3px 8px;font-size:.75rem;cursor:pointer;background:#fff}
.ag-action-btn{background:none;border:1px solid #dde3ec;border-radius:6px;padding:4px 8px;font-size:.75rem;cursor:pointer;color:#555;transition:all .15s;display:inline-flex;align-items:center;gap:4px}
.ag-action-btn:hover{background:#1565c0;color:#fff;border-color:#1565c0}
.ag-empty{text-align:center;padding:40px 20px;color:#aaa}.ag-empty i{font-size:2.5rem;margin-bottom:10px;opacity:.4}
.ag-spinner-wrap{text-align:center;padding:30px;color:#1565c0}
.ag-profile-card{background:#fff;border-radius:10px;box-shadow:var(--card-shadow);overflow:hidden;margin-bottom:16px}
.ag-profile-hdr{background:linear-gradient(135deg,#1a3a5c,#1565c0);padding:24px;text-align:center;color:#fff}
.ag-profile-av{width:64px;height:64px;background:rgba(255,255,255,.25);border:3px solid rgba(255,255,255,.6);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:700;margin:0 auto 10px;color:#fff}
.ag-profile-name{font-size:.95rem;font-weight:700}.ag-profile-email{font-size:.75rem;opacity:.8;margin-top:2px}
.ag-profile-body{padding:14px 16px}
.ag-profile-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f5f5f5;font-size:.8rem}
.ag-profile-row:last-child{border-bottom:none}.ag-profile-row .lbl{color:#888}.ag-profile-row .val{color:#333;font-weight:600}
.mini-progress{height:6px;border-radius:3px;background:#eee;margin-top:4px;overflow:hidden}
.mini-progress .bar{height:100%;border-radius:3px;transition:width .6s}
.ag-pag-bar{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f0f0f0;font-size:.78rem;color:#888}
.ag-page-btn{background:#fff;border:1px solid #dde3ec;border-radius:5px;padding:3px 9px;font-size:.78rem;cursor:pointer;transition:all .2s}
.ag-page-btn:hover:not(:disabled){background:#1565c0;color:#fff;border-color:#1565c0}
.ag-page-btn:disabled{opacity:.4;cursor:not-allowed}.ag-page-btn.active{background:#1565c0;color:#fff;border-color:#1565c0}
.ag-toast-container{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.ag-toast{background:#fff;border-radius:10px;padding:12px 16px;box-shadow:0 4px 20px rgba(0,0,0,.15);font-size:.84rem;display:flex;align-items:center;gap:10px;min-width:280px;animation:ag-slide .3s ease}
.ag-toast.success{border-left:4px solid var(--green-mid)}.ag-toast.error{border-left:4px solid var(--red-tn)}
.ag-toast .ticon{font-size:1rem}.ag-toast.success .ticon{color:var(--green-mid)}.ag-toast.error .ticon{color:var(--red-tn)}
@keyframes ag-slide{from{transform:translateX(50px);opacity:0}to{transform:translateX(0);opacity:1}}
.ag-modal-hdr{background:linear-gradient(90deg,#1a3a5c,#1565c0);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}
.ag-modal-hdr .title{font-size:1rem;font-weight:700}
.ag-close-btn{background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9rem}
.ag-close-btn:hover{background:rgba(255,255,255,.4)}
.det-label{font-size:.75rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
.det-value{font-size:.9rem;color:#222;font-weight:500}
.ag-footer{background:var(--sidebar-bg);color:rgba(255,255,255,.5);text-align:center;font-size:.75rem;padding:14px}
.ag-footer span{color:#43a047}
.ag-dup-card{background:#fff;border-radius:10px;box-shadow:var(--card-shadow);margin-bottom:22px;overflow:hidden;border-left:4px solid #6a1b9a}
@media(max-width:768px){.ag-sidebar{display:none}.ag-main{padding:16px}}
/* ML confidence badge */
.conf-badge{display:inline-flex;align-items:center;gap:3px;font-size:.68rem;padding:2px 6px;border-radius:10px;font-weight:600;margin-left:4px}
.conf-high{background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7}
.conf-med{background:#fff8e1;color:#f57f17;border:1px solid #ffe082}
.conf-low{background:#fce4ec;color:#c62828;border:1px solid #ef9a9a}
/* reclassify box */
.reclassify-box{background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 14px;margin-top:12px}
.reclassify-box .rc-title{font-size:.8rem;font-weight:700;color:#f57f17;margin-bottom:8px}
`

export default function AgentDashboardPage() {
  const { lang, setLang } = useI18n()
  const navigate = useNavigate()
  const access = getAccessToken()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [allRecs, setAllRecs] = useState<Reclamation[]>([])
  const [filteredRecs, setFilteredRecs] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [recError, setRecError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([])
  const [detailRec, setDetailRec] = useState<Reclamation | null>(null)
  const [detailStatus, setDetailStatus] = useState('')
  const [detailSaving, setDetailSaving] = useState(false)
  const [showDupPanel, setShowDupPanel] = useState(false)
  const [reClsCat, setReClsCat] = useState('')
  const [reClsPrio, setReClsPrio] = useState('')
  const [reClsSaving, setReClsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'services' | 'forum'>('dashboard')
  const [usersMode, setUsersMode] = useState<'unverified' | 'all'>('unverified')

  const [managedUsers, setManagedUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [servicesSummary, setServicesSummary] = useState<any>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markersLayer = useRef<any>(null)
  const styleInjected = useRef(false)

  useEffect(() => {
    if (styleInjected.current) return
    styleInjected.current = true
    const s = document.createElement('style')
    s.textContent = CSS
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!access) { navigate('/login'); return }
    fetchUserInfo()
  }, [])

  useEffect(() => { applyFilters() }, [allRecs, search, filterStatus, filterCategory, filterPriority, urgentOnly])

  async function fetchUserInfo() {
    try {
      const res = await fetch('/api/accounts/me/', { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) throw new Error()
      const u: UserInfo = await res.json()
      if (u.user_type !== 'agent' && u.user_type !== 'supervisor' && !u.is_staff && !u.is_superuser) { navigate('/dashboard'); return }
      setUser(u)
      fetchReclamations()
      if (u.user_type === 'supervisor' || u.is_staff || u.is_superuser) {
        fetchManagedUsers(usersMode)
        fetchServicesSummary()
      }
    } catch { setUser(null) }
  }

  async function fetchServicesSummary() {
    try {
      const res = await fetch('/api/supervisor/services-summary/', { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) setServicesSummary(await res.json())
    } catch (e) { console.error(e) }
  }

  async function fetchManagedUsers(mode: 'unverified' | 'all') {
    setLoadingUsers(true)
    try {
      const res = await fetch(`/api/accounts/verify-citizens/?mode=${mode}`, { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) setManagedUsers(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoadingUsers(false) }
  }

  async function handleToggleUserStatus(userId: number, action: 'verify' | 'toggle_active') {
    try {
      const res = await fetch('/api/accounts/verify-citizens/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify({ user_id: userId, action })
      })
      if (res.ok) {
        const data = await res.json()
        showToast(data.message || 'Action réussie !')
        if (action === 'verify') {
          if (usersMode === 'unverified') setManagedUsers(prev => prev.filter(u => u.id !== userId))
          else setManagedUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: true } : u))
          if (selectedUser?.id === userId) setSelectedUser((p: any) => p ? { ...p, is_verified: true } : null)
        } else {
          setManagedUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: data.is_active } : u))
          if (selectedUser?.id === userId) setSelectedUser((p: any) => p ? { ...p, is_active: data.is_active } : null)
        }
      }
    } catch (e) { showToast('Erreur lors de l\'action.', 'error') }
  }


  async function fetchReclamations() {
    setLoading(true); setRecError(false)
    try {
      const res = await fetch('/api/reclamations/', { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllRecs(Array.isArray(data) ? data : (data.results || []))
    } catch { setRecError(true) }
    finally { setLoading(false) }
  }

  function applyFilters() {
    const s = search.toLowerCase()
    setFilteredRecs(allRecs.filter(r => {
      const ms = !s || r.title.toLowerCase().includes(s) || (r.citizen_name || '').toLowerCase().includes(s) || (r.description || '').toLowerCase().includes(s)
      return ms && (!filterStatus || r.status === filterStatus) && (!filterCategory || r.category === filterCategory) && (!filterPriority || r.priority === filterPriority) && (!urgentOnly || r.priority === 'urgente')
    }))
    setCurrentPage(1)
  }

  const total    = allRecs.length
  const pending  = allRecs.filter(r => r.status === 'pending').length
  const inprog   = allRecs.filter(r => r.status === 'in_progress').length
  const resolved = allRecs.filter(r => r.status === 'resolved').length
  const rejected = allRecs.filter(r => r.status === 'rejected').length

  function detectDuplicates() {
    const groups: Record<string, Reclamation[]> = {}
    allRecs.forEach(r => {
      const k = r.title.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40)
      if (!groups[k]) groups[k] = []
      groups[k].push(r)
    })
    const dupGroups = Object.values(groups).filter(a => a.length > 1)
    return { dupCount: new Set(dupGroups.flat().map(r => r.id)).size, dupGroups }
  }
  const { dupCount, dupGroups } = detectDuplicates()

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return
    const L = (window as any).L; if (!L) return
    const m = L.map(mapRef.current).setView([36.8467, 11.1047], 13)
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(m)
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 19 })
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '© OpenTopoMap', maxZoom: 17 })
    markersLayer.current = L.layerGroup().addTo(m)
    L.control.layers(
      { '🗺️ OpenStreetMap': osm, '🛰️ Satellite (Esri)': sat, '🏔️ Topographique (WMS)': topo },
      { '📍 Signalements': markersLayer.current },
      { position: 'topright', collapsed: false }
    ).addTo(m)
    const legend = L.control({ position: 'bottomleft' })
    legend.onAdd = function () {
      const div = L.DomUtil.create('div')
      div.style.cssText = 'background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.15);font-size:12px;min-width:170px;'
      div.innerHTML = `<div style="font-weight:700;margin-bottom:6px;color:#1a3a5c;border-bottom:1px solid #eee;padding-bottom:4px;">📋 Légende</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Statut des signalements</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:12px;height:12px;border-radius:50%;background:#e65100;display:inline-block;"></span> En attente</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:12px;height:12px;border-radius:50%;background:#1565c0;display:inline-block;"></span> En cours</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:12px;height:12px;border-radius:50%;background:#1b5e20;display:inline-block;"></span> Résolu</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span style="width:12px;height:12px;border-radius:50%;background:#757575;display:inline-block;"></span> Rejeté</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Couches SIG (3 couches)</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:18px;height:10px;background:#e3f2fd;border:1px solid #90caf9;display:inline-block;border-radius:2px;"></span> OSM Standard</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:18px;height:10px;background:#795548;border:1px solid #5d4037;display:inline-block;border-radius:2px;"></span> Satellite Esri</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span style="width:18px;height:10px;background:#e8f5e9;border:1px solid #81c784;display:inline-block;border-radius:2px;"></span> Topographique WMS</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Overlays GeoJSON</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:20px;height:4px;background:#1565c0;opacity:.5;display:inline-block;border:1px solid #1565c0;"></span> Zones</div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#424242;display:inline-block;"></span> Routes</div>`
      return div
    }
    legend.addTo(m)
    leafletMap.current = m
  }, [mapRef.current])

  useEffect(() => {
    const L = (window as any).L; if (!L || !markersLayer.current) return
    markersLayer.current.clearLayers()
    const BLT = 36.8467, BLG = 11.1047
    allRecs.forEach(r => {
      const hc = r.latitude != null && r.longitude != null
      const lat = hc ? r.latitude! : (BLT + (Math.random() - 0.5) * 0.04)
      const lng = hc ? r.longitude! : (BLG + (Math.random() - 0.5) * 0.06)
      const cm: Record<string, string> = { pending: '#e65100', in_progress: '#1565c0', resolved: '#1b5e20', rejected: '#757575' }
      const color = cm[r.status] || '#888'
      const cat = CAT[r.category] || CAT.other
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);${!hc ? 'opacity:0.65;' : ''}">${cat.label.split(' ')[0]}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15],
      })
      const mk = L.marker([lat, lng], { icon }).addTo(markersLayer.current)
      const prio = PRIORITY[r.priority] || PRIORITY.normale
      const pc: Record<string, string> = { urgente: '#b71c1c', normale: '#1565c0', faible: '#6a1b9a' }
      const prioColor = pc[r.priority] || '#1565c0'
      mk.bindPopup(`<div style="min-width:210px;font-size:13px;"><strong style="color:#1a3a5c;">${r.title}</strong><br>
        <span style="color:#888;font-size:11px;">${cat.label}</span><br>
        <span style="font-size:11px;">👤 ${r.citizen_name || '—'}</span><br>
        <span style="font-size:11px;">📅 ${formatDate(r.created_at)}</span><br>
        <span style="font-size:11px;">🏢 ${r.service_responsable || '—'}</span><br>
        <div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap;">
          <span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}44;">${STATUS[r.status]?.label || r.status}</span>
          <span style="padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;background:${prioColor}18;color:${prioColor};border:1px solid ${prioColor}33;">${prio.label}</span>
          ${!hc ? '<span style="font-size:10px;color:#aaa;">(approx.)</span>' : ''}
        </div></div>`)
    })
  }, [allRecs])

  function showToast(msg: string, type = 'success') {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  async function quickUpdateStatus(id: number, newStatus: string, _old: string, cb: (ok: boolean) => void) {
    try {
      const res = await fetch(`/api/reclamations/${id}/update_status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) { setAllRecs(p => p.map(r => r.id === id ? { ...r, status: newStatus } : r)); showToast(`Statut mis à jour → ${STATUS[newStatus]?.label || newStatus}`); cb(true) }
      else { showToast('Erreur lors de la mise à jour.', 'error'); cb(false) }
    } catch { showToast('Erreur réseau.', 'error'); cb(false) }
  }

  async function saveDetailStatus() {
    if (!detailRec) return; setDetailSaving(true)
    try {
      const res = await fetch(`/api/reclamations/${detailRec.id}/update_status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify({ status: detailStatus }),
      })
      if (res.ok) { setAllRecs(p => p.map(r => r.id === detailRec.id ? { ...r, status: detailStatus } : r)); showToast('Statut enregistré !'); setDetailRec(null) }
      else showToast('Erreur.', 'error')
    } catch { showToast('Erreur réseau.', 'error') }
    finally { setDetailSaving(false) }
  }

  async function saveReclassify() {
    if (!detailRec) return
    if (!reClsCat && !reClsPrio) { showToast('Choisissez au moins catégorie ou priorité.', 'error'); return }
    setReClsSaving(true)
    try {
      const body: Record<string, string> = {}
      if (reClsCat)  body.category = reClsCat
      if (reClsPrio) body.priority = reClsPrio
      const res = await fetch(`/api/reclamations/${detailRec.id}/reclassify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setAllRecs(p => p.map(r => r.id === detailRec.id
        ? { ...r, category: updated.category, priority: updated.priority, service_responsable: updated.service_responsable }
        : r))
      setDetailRec(prev => prev ? { ...prev, category: updated.category, priority: updated.priority, service_responsable: updated.service_responsable } : null)
      showToast('Reclassification enregistrée !')
      setReClsCat(''); setReClsPrio('')
    } catch { showToast('Erreur lors de la reclassification.', 'error') }
    finally { setReClsSaving(false) }
  }

  const totalPages = Math.ceil(filteredRecs.length / PAGE_SIZE)
  const pageRecs = filteredRecs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const pct = (v: number) => total > 0 ? Math.round(v / total * 100) : 0
  const catCounts: Record<string, number> = {}
  allRecs.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1 })
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : 'Chargement...'
  const inits = initials(fullName)

  return (
    <div className="agent-page">
      <div className="ag-topbar">
        <div><i className="fas fa-map-marker-alt me-1"></i> Commune de Kélibia — Gouvernorat de Nabeul</div>
        <div><a href="#"><i className="fas fa-phone me-1"></i>+216 72 295 XXX</a><a href="#"><i className="fas fa-envelope me-1"></i>contact@kelibia.tn</a></div>
      </div>
      <nav className="ag-navbar">
        <a className="ag-brand" href="#">
          <div className="ag-logo"><i className="fas fa-city"></i></div>
          <div className="ag-title"><span className="main">بلدية قليبية — Commune de Kélibia</span><span className="sub">Espace Agent — Kelibia Smart City</span></div>
        </a>
        <div className="ag-actions">
          <button className={`ag-lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}><img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" /> FR</button>
          <button className={`ag-lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}><img src="https://flagcdn.com/w20/tn.png" width="16" alt="AR" /> عربي</button>
          <div className="ag-user-pill"><div className="av">{inits}</div><span>{fullName}</span></div>
          <button className="ag-logout" onClick={() => { clearTokens(); navigate('/login') }}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
        </div>
      </nav>
      <div className="ag-hero">
        <div>
          <div className="greeting"><i className="fas fa-shield-alt me-2"></i>{user?.user_type === 'supervisor' || user?.is_superuser ? 'Espace Superviseur' : 'Espace Agent'} — <strong>{user?.first_name || '...'}</strong></div>
          <div className="sub">{user?.user_type === 'supervisor' || user?.is_superuser ? 'Supervisez les activités municipales et gérez les utilisateurs.' : 'Gérez les signalements des citoyens et assurez le suivi des interventions.'}</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge-role"><i className="fas fa-id-badge me-1"></i>{getRoleLabel(user)}</span>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/40px-Flag_of_Tunisia.svg.png" height="22" style={{ borderRadius: 3 }} alt="Tunisie" />
        </div>
      </div>
      <div className="ag-breadcrumb">
        <a href="#"><i className="fas fa-home me-1"></i>Accueil</a><span className="mx-2 text-muted">/</span><span>Espace Agent</span><span className="mx-2 text-muted">/</span><span>Gestion des Signalements</span>
      </div>
      <div className="ag-body">
        <div className="ag-sidebar">
          <div className="ag-sec-title">NAVIGATION</div>
          <a className="ag-nav-item" href="#"><i className="fas fa-user-circle"></i> Mon Profil</a>
          
          {(user?.user_type === 'supervisor' || user?.is_superuser || user?.is_staff) && (
            <>
              <div className="ag-divider"></div>
              <div className="ag-sec-title">ADMINISTRATION HUB</div>
              <a className={`ag-nav-item${activeTab === 'users' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('users'); fetchManagedUsers(usersMode) }}>
                <i className="fas fa-users-cog"></i> Gestion Utilisateurs
                {managedUsers.filter(u => !u.is_verified).length > 0 && <span className="ag-badge">{managedUsers.filter(u => !u.is_verified).length}</span>}
              </a>
              <a className={`ag-nav-item${activeTab === 'services' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('services') }}>
                <i className="fas fa-file-invoice"></i> Services Municipaux
              </a>
              <a className={`ag-nav-item${activeTab === 'forum' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('forum') }}>
                <i className="fas fa-comments"></i> Modération Forum
              </a>
            </>
          )}

          <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); clearTokens(); navigate('/login') }}><i className="fas fa-sign-out-alt"></i> Déconnexion</a>
        </div>
        <div className="ag-main">
          {activeTab === 'dashboard' ? (
            <>
              <div className="row g-3 mb-4">
                {([
                  { val: total,    lbl: 'Total',      color: '#2e7d32', bg: '#e8f5e9', icon: 'fa-list-check'   },
                  { val: pending,  lbl: 'En attente', color: '#e65100', bg: '#fff3e0', icon: 'fa-clock'        },
                  { val: inprog,   lbl: 'En cours',   color: '#1565c0', bg: '#e3f2fd', icon: 'fa-tools'        },
                  { val: resolved, lbl: 'Résolus',    color: '#1b5e20', bg: '#e8f5e9', icon: 'fa-check-circle' },
                  { val: rejected, lbl: 'Rejetés',    color: '#b71c1c', bg: '#ffebee', icon: 'fa-times-circle' },
                  { val: dupCount, lbl: 'Doublons',   color: '#6a1b9a', bg: '#f3e5f5', icon: 'fa-copy', onClick: () => setShowDupPanel(p => !p) },
                ] as any[]).map((s, i) => (
                  <div key={i} className="col-6 col-md-2">
                    <div className="ag-stat" style={{ borderLeftColor: s.color, cursor: s.onClick ? 'pointer' : 'default' }} onClick={s.onClick}>
                      <div className="icon-box" style={{ background: s.bg }}><i className={`fas ${s.icon}`} style={{ color: s.color }}></i></div>
                      <div>
                        <div className="val">{loading ? '—' : s.val}</div>
                        <div className="lbl">{s.lbl}{s.icon === 'fa-copy' && <i className="fas fa-eye ms-1" style={{ fontSize: '.65rem', color: '#aaa' }}></i>}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {showDupPanel && (
                <div className="ag-dup-card">
                  <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#4a148c,#6a1b9a)' }}>
                    <span><i className="fas fa-copy me-2"></i>Signalements potentiellement en double</span>
                    <button onClick={() => setShowDupPanel(false)} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 6, fontSize: '.78rem', padding: '4px 10px', cursor: 'pointer' }}><i className="fas fa-times me-1"></i> Fermer</button>
                  </div>
                  <div style={{ padding: 16 }}>
                    {dupGroups.length === 0
                      ? <div style={{ textAlign: 'center', padding: 30, color: '#888' }}><i className="fas fa-check-circle" style={{ color: '#2e7d32', fontSize: '2rem', display: 'block', marginBottom: 10 }}></i>Aucun doublon détecté.</div>
                      : dupGroups.map((grp, gi) => (
                        <div key={gi} style={{ background: '#f9f0ff', border: '1px solid #e1bee7', borderRadius: 8, padding: '12px 16px', marginBottom: 10 }}>
                          <div style={{ fontSize: '.78rem', color: '#6a1b9a', fontWeight: 700, marginBottom: 8 }}><i className="fas fa-copy me-1"></i>{grp.length} signalements similaires</div>
                          {grp.map((r: Reclamation) => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ede7f6', fontSize: '.8rem' }}>
                              <span><strong>#{r.id}</strong> — {r.title}</span><span style={{ color: '#888' }}>{STATUS[r.status]?.label || r.status}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="ag-card" id="ag-map-card">
                <div className="ag-card-hdr-blue">
                  <span><i className="fas fa-map-marked-alt me-2"></i>Carte des Signalements — Kélibia</span>
                  <span style={{ fontSize: '.75rem', opacity: .7 }}>{allRecs.length} signalement(s)</span>
                </div>
                <div id="ag-map" ref={mapRef} style={{ height: 380, width: '100%', borderRadius: '0 0 10px 10px' }}></div>
              </div>
              <div className="ag-card" id="ag-recs-card">
                <div className="ag-card-hdr-blue">
                  <span><i className="fas fa-bullhorn me-2"></i>Gestion des Signalements</span>
                  <button onClick={fetchReclamations} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 6, fontSize: '.78rem', padding: '4px 10px', cursor: 'pointer' }}><i className="fas fa-sync-alt me-1"></i> Actualiser</button>
                </div>
                <div className="ag-filter-bar">
                  <div className="ag-search-wrap"><i className="fas fa-search"></i><input className="ag-search-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                  <select className="ag-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="">Tous les statuts</option><option value="pending">En attente</option><option value="in_progress">En cours</option><option value="resolved">Résolus</option><option value="rejected">Rejetés</option></select>
                  <select className="ag-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}><option value="">Toutes catégories</option><option value="lighting">Éclairage</option><option value="trash">Déchets</option><option value="roads">Voirie</option><option value="noise">Nuisances</option><option value="other">Autre</option></select>
                  <select className="ag-filter-select" value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setUrgentOnly(false) }}><option value="">Toutes priorités</option><option value="urgente">🔴 Urgente</option><option value="normale">🔵 Normale</option><option value="faible">🟣 Faible</option></select>
                  <button className={`ag-filter-btn${urgentOnly ? ' active' : ''}`} onClick={() => { setUrgentOnly(u => !u); setFilterPriority(urgentOnly ? '' : 'urgente') }}><i className="fas fa-fire"></i> Urgents seulement</button>
                  <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#888' }}>{filteredRecs.length} résultat(s)</span>
                </div>
                {loading && <div className="ag-spinner-wrap"><div className="spinner-border" style={{ color: '#1565c0', width: '2rem', height: '2rem' }} role="status"></div><div className="mt-2" style={{ fontSize: '.82rem', color: '#888' }}>Chargement des signalements...</div></div>}
                {!loading && recError && <div className="ag-empty"><i className="fas fa-exclamation-triangle d-block" style={{ color: '#e53935' }}></i><p>Erreur lors du chargement.</p><button onClick={fetchReclamations} style={{ background: '#1565c0', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', cursor: 'pointer', fontSize: '.83rem' }}><i className="fas fa-redo me-1"></i> Réessayer</button></div>}
                {!loading && !recError && filteredRecs.length === 0 && <div className="ag-empty"><i className="fas fa-inbox d-block"></i><p>Aucun signalement trouvé.</p></div>}
                {!loading && !recError && filteredRecs.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ag-table">
                      <thead><tr><th>#</th><th>Titre</th><th>Citoyen</th><th>Catégorie</th><th>Priorité</th><th>Confiance IA</th><th>Service</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
                      <tbody>
                        {pageRecs.map(r => {
                          const cat = CAT[r.category] || CAT.other
                          const prio = PRIORITY[r.priority] || PRIORITY.normale
                          const svc = r.service_responsable || '—'
                          return (
                            <tr key={r.id}>
                              <td style={{ color: '#aaa', fontSize: '.74rem' }}>#{r.id}</td>
                              <td><div style={{ fontWeight: 600, color: '#1a1a2e', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div><div style={{ fontSize: '.7rem', color: '#aaa', marginTop: 1 }}>{(r.description || '').slice(0, 40)}{(r.description || '').length > 40 ? '…' : ''}</div></td>
                              <td style={{ fontSize: '.8rem', color: '#444' }}>{r.citizen_name || '—'}</td>
                              <td><span className={`cat-badge ${cat.cls}`}>{cat.label}</span></td>
                              <td><span className={`priority-badge ${prio.cls}`}>{prio.label}</span></td>
                              <td>{(() => {
                                const cc = r.confidence?.category
                                const v = cc !== undefined ? cc : undefined
                                if (v === undefined) return <span className="conf-badge conf-med">🤖 —</span>
                                if (v >= 0.80) return <span className="conf-badge conf-high">🤖 {Math.round(v*100)}%</span>
                                if (v >= 0.60) return <span className="conf-badge conf-med">⚠️ {Math.round(v*100)}%</span>
                                return <span className="conf-badge conf-low">❌ {Math.round(v*100)}%</span>
                              })()}</td>
                              <td><span className="service-badge" title={svc}>{svc}</span></td>
                              <td><QSSelect rec={r} onUpdate={quickUpdateStatus} /></td>
                              <td style={{ whiteSpace: 'nowrap', color: '#888', fontSize: '.78rem' }}>{formatDate(r.created_at)}</td>
                              <td><button className="ag-action-btn" onClick={() => { setDetailRec(r); setDetailStatus(r.status) }} title="Voir détail"><i className="fas fa-eye"></i></button></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {totalPages > 1 && (
                      <div className="ag-pag-bar">
                        <span>Page {currentPage} / {totalPages} — {filteredRecs.length} signalement(s)</span>
                        <div className="d-flex gap-2">
                          <button className="ag-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><i className="fas fa-chevron-left"></i></button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const p = Math.max(1, currentPage - 2) + i; return p > totalPages ? null : <button key={p} className={`ag-page-btn${p === currentPage ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button> })}
                          <button className="ag-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><i className="fas fa-chevron-right"></i></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'users' ? (
            <div className="ag-card animate__animated animate__fadeIn">
              <div className="ag-card-hdr-green" style={{ background: 'linear-gradient(90deg,#004d40,#00695c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '50px', padding: '0 16px' }}>
                <span className="fw-bold"><i className="fas fa-users-cog me-2"></i>Administration des Comptes</span>
                <div className="btn-group btn-group-sm bg-white bg-opacity-10 p-1 rounded">
                  <button onClick={() => { setUsersMode('unverified'); fetchManagedUsers('unverified') }} className={`btn btn-sm ${usersMode === 'unverified' ? 'btn-light' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}>EN ATTENTE</button>
                  <button onClick={() => { setUsersMode('all'); fetchManagedUsers('all') }} className={`btn btn-sm ${usersMode === 'all' ? 'btn-light' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}>TOUS</button>
                </div>
              </div>
              <div className="ag-card-body p-0">
                {loadingUsers ? (
                   <div className="text-center p-5"><div className="spinner-border text-success"></div></div>
                ) : managedUsers.length === 0 ? (
                  <div className="text-center p-5 text-muted"><i className="fas fa-users fa-3x mb-3 opacity-25"></i><p>Aucun utilisateur trouvé.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ag-table shadow-sm">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Type / Rôle</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managedUsers.map(u => (
                          <tr key={u.id} className="ag-row-clickable" onClick={() => setSelectedUser(u)} style={{ borderLeft: u.is_verified ? 'none' : '4px solid #ff9800' }}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                 <div className="ag-user-av-sm">{u.full_name?.charAt(0) || 'U'}</div>
                                 <div className="flex-grow-1">
                                    <div className="fw-bold text-dark">{u.full_name}</div>
                                    <div className="text-muted small" style={{ fontSize: '11px' }}>{u.email}</div>
                                    <div className="text-muted" style={{ fontSize: '.7rem' }}>CIN: {u.cin} | Inscrit: {formatDate(u.date_joined)}</div>
                                 </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${u.user_type === 'citizen' ? 'bg-light text-primary border' : 'bg-primary'}`}>
                                {u.user_type === 'citizen' ? 'Citoyen' : u.user_type === 'agent' ? 'Agent' : 'Superviseur'}
                              </span>
                            </td>
                            <td>
                               <div className="d-flex flex-column gap-1">
                                  {u.is_verified ? <span className="badge bg-success" style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '10px' }}><i className="fas fa-check-circle me-1"></i>VÉRIFIÉ</span> 
                                                 : <span className="badge bg-warning" style={{ background: '#fff3e0', color: '#e65100', fontSize: '10px' }}><i className="fas fa-clock me-1"></i>ATTENTE</span>}
                                  {u.is_active ? <span className="badge bg-info" style={{ background: '#e1f5fe', color: '#0288d1', fontSize: '10px' }}><i className="fas fa-user-check me-1"></i>ACTIF</span> 
                                               : <span className="badge bg-danger" style={{ background: '#ffebee', color: '#c62828', fontSize: '10px' }}><i className="fas fa-user-slash me-1"></i>BLOQUÉ</span>}
                               </div>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                {!u.is_verified && (
                                  <button className="btn btn-sm btn-success" title="Approuver" onClick={() => handleToggleUserStatus(u.id, 'verify')}><i className="fas fa-check"></i></button>
                                )}
                                <button className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-danger'}`} title={u.is_active ? 'Bloquer' : 'Débloquer'} onClick={() => handleToggleUserStatus(u.id, 'toggle_active')}>
                                  <i className={`fas ${u.is_active ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                                </button>
                                {(u.cin_front || u.cin_back) && (
                                  <a href={resolveBackendUrl(u.cin_front || u.cin_back)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary" title="Voir CIN"><i className="fas fa-id-card"></i></a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'services' ? (
            <div className="ag-card animate__animated animate__fadeIn">
               <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#1a237e,#283593)', height: '50px', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                  <span className="fw-bold"><i className="fas fa-file-invoice me-2"></i>Centre des Services Municipaux</span>
               </div>
               <div className="p-5 text-center">
                  <i className="fas fa-file-invoice fa-3x mb-3 text-muted"></i>
                  <h5 className="fw-bold">Gestion des Demandes de Services</h5>
                  <p className="text-muted">Suivi en temps réel des demandes citoyennes nécessitant une validation.</p>
                  <div className="row g-3 mt-4">
                     <div className="col-md-4">
                        <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #1a237e' }}>
                           <div className="text-muted small fw-bold">RÉSIDENCE</div>
                           <div className="h2 mt-2 mb-0 text-primary">{servicesSummary?.attestation_residence || 0}</div>
                           <div className="small text-muted">Demandes en attente</div>
                        </div>
                     </div>
                     <div className="col-md-4">
                        <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #0d47a1' }}>
                           <div className="text-muted small fw-bold">NAISSANCE</div>
                           <div className="h2 mt-2 mb-0 text-primary">{servicesSummary?.declaration_naissance || 0}</div>
                           <div className="small text-muted">Déclarations à valider</div>
                        </div>
                     </div>
                     <div className="col-md-4">
                        <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #01579b' }}>
                           <div className="text-muted small fw-bold">LIIVRET FAMILLE</div>
                           <div className="h2 mt-2 mb-0 text-primary">{servicesSummary?.livret_famille || 0}</div>
                           <div className="small text-muted">Demandes à traiter</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="ag-card animate__animated animate__fadeIn">
               <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#311b92,#4527a0)', height: '50px', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                  <span className="fw-bold"><i className="fas fa-comments me-2"></i>{user?.user_type === 'supervisor' || user?.is_superuser ? 'Espace Superviseur' : 'Modération du Forum & Actualités'}</span>
               </div>
               <div className="p-5 text-center">
                  <i className="fas fa-shield-alt fa-3x mb-3 text-muted"></i>
                  <h5 className="fw-bold">Espace Modération Superviseur</h5>
                  <p className="text-muted">Gérez les sujets du forum, modérez les commentaires et gérez les actualités de la ville.</p>
                  <button className="btn btn-primary mt-3" onClick={() => navigate('/forum')}><i className="fas fa-external-link-alt me-2"></i>Aller au Forum</button>
               </div>
            </div>
          )}

        </div>
        <div style={{ width: 240, minWidth: 240, padding: '24px 16px 24px 0', flexShrink: 0 }}>

          <div className="ag-profile-card">
            <div className="ag-profile-hdr"><div className="ag-profile-av">{inits}</div><div className="ag-profile-name">{fullName}</div><div className="ag-profile-email">{user?.email || '...'}</div></div>
            <div className="ag-profile-body">
              <div className="ag-profile-row"><span className="lbl">Rôle</span><span className="val" style={{ color: '#1565c0' }}>{getRoleLabel(user)}</span></div>
              <div className="ag-profile-row"><span className="lbl">Ville</span><span className="val">{user?.city || 'Kélibia'}</span></div>
              <div className="ag-profile-row"><span className="lbl">Dossiers</span><span className="val">{inprog}</span></div>
            </div>
          </div>
          <div className="ag-card">
            <div className="ag-card-hdr-green"><span><i className="fas fa-chart-pie me-2"></i>Avancement</span></div>
            <div className="ag-card-body">
              {[
                { lbl: 'En attente', val: pct(pending),  color: '#e65100' },
                { lbl: 'En cours',   val: pct(inprog),   color: '#1565c0' },
                { lbl: 'Résolus',    val: pct(resolved), color: '#1b5e20' },
              ].map(b => (
                <div key={b.lbl} className="mb-3">
                  <div className="d-flex justify-content-between" style={{ fontSize: '.78rem', marginBottom: 3 }}><span style={{ color: b.color }}>{b.lbl}</span><span style={{ fontWeight: 600 }}>{b.val}%</span></div>
                  <div className="mini-progress"><div className="bar" style={{ background: b.color, width: `${b.val}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="ag-card">
            <div className="ag-card-hdr-orange"><span><i className="fas fa-layer-group me-2"></i>Par catégorie</span></div>
            <div className="ag-card-body">
              {Object.keys(catCounts).length === 0
                ? <div style={{ color: '#aaa', fontSize: '.8rem', textAlign: 'center' }}>Chargement...</div>
                : Object.entries(catCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([k, v]) => {
                  const cat = CAT[k] || CAT.other
                  const p = total > 0 ? Math.round((v as number) / total * 100) : 0
                  return (
                    <div key={k} className="mb-2">
                      <div className="d-flex justify-content-between" style={{ fontSize: '.76rem', marginBottom: 2 }}><span>{cat.label}</span><span style={{ fontWeight: 600 }}>{v as number}</span></div>
                      <div className="mini-progress"><div className="bar" style={{ background: '#1565c0', width: `${p}%` }}></div></div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
      <div className="ag-footer">© 2025 <span>Commune de Kélibia</span> — Espace Agent Kelibia Smart City &nbsp;|&nbsp; Tous droits réservés</div>
      <div className="ag-toast-container">
        {toasts.map(t => <div key={t.id} className={`ag-toast ${t.type}`}><i className={`fas fa-${t.type === 'success' ? 'check-circle' : 'exclamation-circle'} ticon`}></i><span>{t.msg}</span></div>)}
      </div>
      {detailRec && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setDetailRec(null) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="ag-modal-hdr"><div className="title"><i className="fas fa-file-alt me-2"></i>Détail du Signalement</div><button className="ag-close-btn" onClick={() => setDetailRec(null)}><i className="fas fa-times"></i></button></div>
            <div style={{ padding: 24 }}>
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="mb-3"><div className="det-label">Titre</div><div className="det-value">{detailRec.title}</div></div>
                  <div className="mb-3"><div className="det-label">Description</div><div className="det-value" style={{ lineHeight: 1.6 }}>{detailRec.description || '—'}</div></div>
                  <div className="row g-2 mb-3">
                    <div className="col-6"><div className="det-label">Catégorie</div><div className="det-value"><span className={`cat-badge ${(CAT[detailRec.category] || CAT.other).cls}`}>{(CAT[detailRec.category] || CAT.other).label}</span></div></div>
                    <div className="col-6"><div className="det-label">Statut actuel</div><div className="det-value"><span className={`status-badge ${(STATUS[detailRec.status] || STATUS.pending).cls}`}>{(STATUS[detailRec.status] || STATUS.pending).label}</span></div></div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="det-label">Priorité (IA)</div>
                      <div className="det-value">
                        <span className={`priority-badge ${(PRIORITY[detailRec.priority] || PRIORITY.normale).cls}`}>{(PRIORITY[detailRec.priority] || PRIORITY.normale).label}</span>
                        {detailRec.confidence?.priority !== undefined && (
                          <span className={`conf-badge ${detailRec.confidence.priority >= 0.80 ? 'conf-high' : detailRec.confidence.priority >= 0.60 ? 'conf-med' : 'conf-low'}`}>
                            🤖 {Math.round(detailRec.confidence.priority * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-6"><div className="det-label">Service responsable</div><div className="det-value" style={{ fontSize: '.82rem' }}>{detailRec.service_responsable || '—'}</div></div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6"><div className="det-label">Citoyen</div><div className="det-value">{detailRec.citizen_name || '—'}</div></div>
                    <div className="col-6"><div className="det-label">Date de signalement</div><div className="det-value">{formatDate(detailRec.created_at)}</div></div>
                  </div>
                  {detailRec.image && <div><div className="det-label mb-2">Photo jointe</div><img src={detailRec.image} style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }} alt="Photo" /></div>}
                  {/* ── Manual reclassify panel ─────────────────────── */}
                  {(detailRec.confidence?.category !== undefined && detailRec.confidence.category < 0.60) || true ? (
                    <div className="reclassify-box">
                      <div className="rc-title"><i className="fas fa-robot me-1"></i>Correction manuelle de la classification IA</div>
                      {detailRec.confidence?.category !== undefined && detailRec.confidence.category < 0.60 && (
                        <div style={{ fontSize: '.75rem', color: '#b71c1c', marginBottom: 8, background: '#fce4ec', padding: '4px 8px', borderRadius: 6 }}>
                          ⚠️ Confiance IA faible ({Math.round(detailRec.confidence.category * 100)}%) — vérifiez la classification
                        </div>
                      )}
                      <div className="row g-2">
                        <div className="col-6">
                          <label style={{ fontSize: '.75rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>Catégorie</label>
                          <select className="form-select form-select-sm" value={reClsCat} onChange={e => setReClsCat(e.target.value)}>
                            <option value="">— Garder actuelle —</option>
                            <option value="lighting">💡 Éclairage</option>
                            <option value="trash">🗑️ Déchets</option>
                            <option value="roads">🛣️ Voirie</option>
                            <option value="noise">🔊 Nuisances</option>
                            <option value="other">📌 Autre</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label style={{ fontSize: '.75rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: 3 }}>Priorité</label>
                          <select className="form-select form-select-sm" value={reClsPrio} onChange={e => setReClsPrio(e.target.value)}>
                            <option value="">— Garder actuelle —</option>
                            <option value="urgente">🔴 Urgente</option>
                            <option value="normale">🔵 Normale</option>
                            <option value="faible">🟣 Faible</option>
                          </select>
                        </div>
                      </div>
                      <button className="btn btn-warning btn-sm mt-2 w-100" onClick={saveReclassify} disabled={reClsSaving || (!reClsCat && !reClsPrio)}>
                        {reClsSaving ? <><span className="spinner-border spinner-border-sm me-1"></span>Enregistrement...</> : <><i className="fas fa-edit me-1"></i>Appliquer la correction</>}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="col-md-4">
                  <div className="det-label mb-2">Changer le statut</div>
                  <select className="form-select mb-3" value={detailStatus} onChange={e => setDetailStatus(e.target.value)}>
                    <option value="pending">⏳ En attente</option><option value="in_progress">🔧 En cours</option><option value="resolved">✅ Résolue</option><option value="rejected">❌ Rejetée</option>
                  </select>
                  <button className="btn btn-primary w-100" onClick={saveDetailStatus} disabled={detailSaving}>
                    {detailSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Enregistrement...</> : <><i className="fas fa-save me-2"></i>Enregistrer</>}
                  </button>
                  <div style={{ height: 180, marginTop: 14, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#aaa', fontSize: '.8rem' }}><i className="fas fa-map-pin me-1"></i>Pas de coordonnées</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CITIZEN VERIFICATION MODAL ── */}
      {selectedUser && (
        <div className="ag-modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedUser(null)}>
           <div className="ag-modal-content animate__animated animate__zoomIn" style={{ maxWidth: 900 }}>
              <div className="ag-modal-hdr" style={{ background: '#004d40' }}>
                 <div className="title"><i className="fas fa-user-check me-2"></i>Vérification d'Identité : {selectedUser.full_name}</div>
                 <button className="ag-close-btn" onClick={() => setSelectedUser(null)}><i className="fas fa-times"></i></button>
              </div>
              <div className="p-4 bg-light">
                 <div className="row g-4">
                    {/* Left: Inputted Info */}
                    <div className="col-md-5">
                       <div className="p-4 bg-white rounded shadow-sm">
                          <h6 className="fw-bold text-success border-bottom pb-2 mb-3"><i className="fas fa-info-circle me-2"></i>Données de l'inscription</h6>
                          
                          <div className="row mb-3">
                             <div className="col-5 text-muted small">Nom & Prénom</div>
                             <div className="col-7 fw-bold">{selectedUser.full_name}</div>
                          </div>
                          <div className="row mb-3">
                             <div className="col-5 text-muted small">CIN Citoyen</div>
                             <div className="col-7 fw-bold" style={{ letterSpacing: 2 }}>{selectedUser.cin}</div>
                          </div>
                          <div className="row mb-3">
                             <div className="col-5 text-muted small">Naissance</div>
                             <div className="col-7">
                                {selectedUser.date_of_birth ? <div>{selectedUser.date_of_birth}</div> : <i className="text-muted">—</i>}
                                <div className="small text-muted">{selectedUser.place_of_birth || 'Lieu inconnu'}</div>
                             </div>
                          </div>
                          
                          <div className="mb-4">
                             <div className={`p-2 rounded mt-2 d-flex align-items-center gap-2 ${selectedUser.is_married ? 'bg-primary bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                                <i className={`fas ${selectedUser.is_married ? 'fa-ring' : 'fa-user'}`}></i>
                                <span className="small fw-bold">{selectedUser.is_married ? 'MARIÉ(E)' : 'CÉLIBATAIRE'}</span>
                             </div>
                             {selectedUser.is_married && (
                                <div className="mt-2 text-dark bg-light p-2 rounded border small">
                                   <div className="fw-bold text-muted mb-1" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Conjoint(e)</div>
                                   <div>{selectedUser.spouse_first_name} {selectedUser.spouse_last_name}</div>
                                   <div className="text-muted">CIN: {selectedUser.spouse_cin}</div>
                                </div>
                             )}
                          </div>

                          <div className="d-grid gap-2">
                             {!selectedUser.is_verified ? (
                                <button className="btn btn-success" onClick={() => handleToggleUserStatus(selectedUser.id, 'verify')}>
                                   <i className="fas fa-check-circle me-2"></i>Valider l'identité
                                </button>
                             ) : (
                                <div className="alert alert-success d-flex align-items-center mb-0 py-2">
                                   <i className="fas fa-check-double me-2"></i>Identité Validée
                                </div>
                             )}
                             <button className={`btn ${selectedUser.is_active ? 'btn-outline-danger' : 'btn-danger'}`} onClick={() => handleToggleUserStatus(selectedUser.id, 'toggle_active')}>
                                <i className={`fas ${selectedUser.is_active ? 'fa-user-slash' : 'fa-user-check'} me-2 rotate-hover`}></i>
                                {selectedUser.is_active ? 'Bloquer ce compte' : 'Débloquer maintenant'}
                             </button>
                          </div>
                       </div>
                    </div>
                    
                    {/* Right: CIN Images */}
                    <div className="col-md-7">
                       <div className="p-4 bg-white rounded shadow-sm h-100">
                          <h6 className="fw-bold text-success border-bottom pb-2 mb-3"><i className="fas fa-id-card me-2"></i>Documents CIN à vérifier</h6>
                          <div className="row g-2">
                             <div className="col-12">
                                <label className="small text-muted mb-1">FACE AVANT (RECTO)</label>
                                <div className="ag-cin-preview mb-3">
                                   {selectedUser.cin_front ? (
                                      <a href={selectedUser.cin_front} target="_blank" rel="noreferrer">
                                         <img src={selectedUser.cin_front} className="rounded shadow-sm scale-on-hover" style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="Front CIN" />
                                      </a>
                                   ) : (
                                      <div className="p-5 text-center bg-light text-muted small rounded">Non fournie</div>
                                   )}
                                </div>
                             </div>
                             <div className="col-12">
                                <label className="small text-muted mb-1">FACE ARRIÈRE (VERSO)</label>
                                <div className="ag-cin-preview">
                                   {selectedUser.cin_back ? (
                                      <a href={selectedUser.cin_back} target="_blank" rel="noreferrer">
                                         <img src={selectedUser.cin_back} className="rounded shadow-sm scale-on-hover" style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="Back CIN" />
                                      </a>
                                   ) : (
                                      <div className="p-5 text-center bg-light text-muted small rounded">Non fournie</div>
                                   )}
                                </div>
                             </div>
                          </div>
                          <div className="small text-muted text-center mt-3 bg-light p-2 rounded">
                             <i className="fas fa-search-plus me-1"></i> Cliquez sur l'image pour l'agrandir et vérifier les détails.
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

function QSSelect({ rec, onUpdate }: { rec: Reclamation; onUpdate: (id: number, ns: string, os: string, cb: (ok: boolean) => void) => void }) {
  const [val, setVal] = useState(rec.status)
  const [dis, setDis] = useState(false)
  return (
    <select className="ag-status-select" value={val} disabled={dis}
      onChange={e => {
        const ns = e.target.value, os = val; setDis(true)
        onUpdate(rec.id, ns, os, ok => { if (ok) setVal(ns); else setVal(os); setDis(false) })
      }}>
      <option value="pending">⏳ En attente</option>
      <option value="in_progress">🔧 En cours</option>
      <option value="resolved">✅ Résolue</option>
      <option value="rejected">❌ Rejetée</option>
    </select>
  )
}
