import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

const resolveBackendUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'services' | 'forum' | 'evenements' | 'stats' | 'demandes'>('dashboard')
  const [allEvenements, setAllEvenements] = useState<any[]>([])
  const [loadingEvenements, setLoadingEvenements] = useState(false)
  const [evStatusFilter, setEvStatusFilter] = useState('')
  const [evTypeFilter, setEvTypeFilter] = useState('')
  const [evSearch, setEvSearch] = useState('')
  const [evDetail, setEvDetail] = useState<any | null>(null)
  const [evSaving, setEvSaving] = useState(false)
  const [usersMode, setUsersMode] = useState<'unverified' | 'agents' | 'all'>('unverified')
   const [resetPwdResult, setResetPwdResult] = useState<{ name: string; password: string } | null>(null)
   const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  const [managedUsers, setManagedUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [servicesSummary, setServicesSummary] = useState<any>(null)
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [allServices, setAllServices] = useState<any[]>([])
  const [loadingServicesTab, setLoadingServicesTab] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [editServiceSaving, setEditServiceSaving] = useState(false)
  const [translatingField, setTranslatingField] = useState<string | null>(null)
  
  // Service editing extras
  const [serviceReqs, setServiceReqs] = useState<any[]>([])
  const [servicePdfAr, setServicePdfAr] = useState<File | null>(null)
  const [servicePdfFr, setServicePdfFr] = useState<File | null>(null)

  // ── Demandes Citoyens tab ──
  const [allDemandes, setAllDemandes] = useState<any[]>([])
  const [loadingDemandes, setLoadingDemandes] = useState(false)
  const [demandeDetail, setDemandeDetail] = useState<any | null>(null)
  const [demandeNewStatus, setDemandeNewStatus] = useState('')
  const [demandeSaving, setDemandeSaving] = useState(false)
  const [demandeSearchQ, setDemandeSearchQ] = useState('')
  const [demandeTypeFilter, setDemandeTypeFilter] = useState('')
  const [demandeStatusFilter, setDemandeStatusFilter] = useState('')

  const [allTopics, setAllTopics] = useState<any[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [forumStats, setForumStats] = useState<any | null>(null)
  const [forumSearch, setForumSearch] = useState('')

  const [mlStats, setMlStats] = useState<any | null>(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState<string | null>(null)

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
        fetchCategoriesAndServices()
      }
    } catch { setUser(null) }
  }

  async function fetchServicesSummary() {
    try {
      const res = await fetch('/api/supervisor/services-summary/', { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) setServicesSummary(await res.json())
    } catch (e) { console.error(e) }
  }

  async function fetchCategoriesAndServices() {
    setLoadingServicesTab(true)
    try {
      const res = await fetch('/api/services/list/', { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) {
        const data = await res.json()
        const cats: any[] = []
        const svcs: any[] = []
        data.forEach((c: any) => {
          cats.push({ id: c.id, name_fr: c.name_fr, name_ar: c.name_ar })
          c.services.forEach((s: any) => { svcs.push({ ...s, category_id: c.id, category_name: c.name_fr }) })
        })
        setAllCategories(cats); setAllServices(svcs)
      }
    } catch { showToast('Erreur chargement services', 'error') }
    finally { setLoadingServicesTab(false) }
  }

  async function handleAutoTranslate(text: string, callback: (translated: string) => void, fieldKey: string) {
    if (!text?.trim()) return
    setTranslatingField(fieldKey)
    try {
      const res = await fetch('/api/services/list/translate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      if (res.ok && data.translated) callback(data.translated)
      else if (data.error) showToast('Erreur traduction.', 'error')
    } catch { showToast('Erreur réseau traduction.', 'error') }
    finally { setTranslatingField(null) }
  }

  async function fetchMlStats() {
    setMlLoading(true); setMlError(null)
    try {
      const res = await fetch('/api/reclamations/ml_stats/', { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) { setMlError(`Erreur ${res.status} — Stats IA indisponibles.`); return }
      setMlStats(await res.json())
    } catch { setMlError('Erreur réseau — Stats IA indisponibles.') }
    finally { setMlLoading(false) }
  }

  async function deleteService(serviceId: number) {
    if (!window.confirm('Supprimer définitivement ce service ?')) return
    try {
      const res = await fetch(`/api/services/list/${serviceId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${access}` }
      })
      if (res.ok) {
        showToast('Service supprimé !')
        setAllServices(prev => prev.filter(s => s.id !== serviceId))
      } else {
        showToast('Impossible de supprimer ce service (peut-être lié à des demandes).', 'error')
      }
    } catch { showToast('Erreur réseau.', 'error') }
  }


  async function fetchDemandes() {
    setLoadingDemandes(true)
    try {
      const res = await fetch('/api/supervisor/manage-orders/', { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) setAllDemandes(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoadingDemandes(false) }
  }

  async function saveDemandStatus(order: any, newStatus: string) {
    setDemandeSaving(true)
    try {
      const res = await fetch('/api/supervisor/manage-orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify({ type: order.type, order_id: order.id, status: newStatus })
      })
      if (res.ok) {
        setAllDemandes(prev => prev.map(d => d.type === order.type && d.id === order.id ? { ...d, status: newStatus } : d))
        if (demandeDetail?.id === order.id && demandeDetail?.type === order.type) setDemandeDetail((p: any) => ({ ...p, status: newStatus }))
        showToast('Statut mis à jour !')
      } else { showToast('Erreur lors de la mise à jour.', 'error') }
    } catch { showToast('Erreur réseau.', 'error') }
    finally { setDemandeSaving(false) }
  }

  async function fetchEvenements() {
    setLoadingEvenements(true)
    try {
      const res = await fetch('/api/evenements/demande/', { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) {
        const data = await res.json()
        setAllEvenements(Array.isArray(data) ? data : (data.results || []))
      }
    } catch (e) { console.error(e) }
    finally { setLoadingEvenements(false) }
  }

  async function fetchTopics() {
    setLoadingTopics(true)
    try {
      const res = await fetch('/api/forum/topics/', { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) setAllTopics(await res.json())
      
      const sRes = await fetch('/api/forum/topics/stats/', { headers: { Authorization: `Bearer ${access}` } })
      if (sRes.ok) setForumStats(await sRes.json())
    } catch (e) { console.error(e) }
    finally { setLoadingTopics(false) }
  }

  async function handleTopicAction(id: number, action: 'pin' | 'resolve' | 'delete') {
    try {
      const isDelete = action === 'delete'
      if (isDelete && !window.confirm('Supprimer ce sujet définitivement ?')) return
      
      const res = await fetch(`/api/forum/topics/${id}/${isDelete ? '' : action + '/'}`, {
        method: isDelete ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${access}` }
      })
      if (res.ok) {
        showToast(isDelete ? 'Sujet supprimé !' : 'Action réussie !')
        if (isDelete) setAllTopics(prev => prev.filter(t => t.id !== id))
        else fetchTopics()
      }
    } catch { showToast('Erreur lors de l\'action.', 'error') }
  }

  async function handleEvStatus(id: number, newStatus: string, commentaire: string) {
    setEvSaving(true)
    try {
      const fd = new FormData()
      fd.append('status', newStatus)
      if (commentaire) fd.append('commentaire_agent', commentaire)
      const res = await fetch(`/api/evenements/demande/${id}/update-status/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${access}` },
        body: fd,
      })
      if (res.ok) {
        const updated = await res.json()
        setAllEvenements(prev => prev.map(ev => ev.id === id ? updated : ev))
        setEvDetail(null)
        showToast('Statut mis à jour avec succès.', 'success')
      } else {
        showToast('Erreur lors de la mise à jour.', 'error')
      }
    } catch { showToast('Erreur réseau.', 'error') }
    finally { setEvSaving(false) }
  }

  async function fetchManagedUsers(mode: 'unverified' | 'agents' | 'all') {
    setLoadingUsers(true)
    try {
      const res = await fetch(`/api/accounts/verify-citizens/?mode=${mode}`, { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) setManagedUsers(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoadingUsers(false) }
  }

  async function handleToggleUserStatus(userId: number, action: 'verify' | 'toggle_active' | 'delete' | 'promote_to_agent' | 'promote_to_supervisor' | 'demote_to_citizen' | 'reset_password') {
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
    const isSupervisor = user?.is_superuser || user?.is_staff || user?.user_type === 'supervisor'

    let filtered = allRecs.filter(r => {
      const ms = !s || r.title.toLowerCase().includes(s) || (r.citizen_name || '').toLowerCase().includes(s) || (r.description || '').toLowerCase().includes(s)
      const matchesBaseFilters = ms && (!filterStatus || r.status === filterStatus) && (!filterCategory || r.category === filterCategory) && (!filterPriority || r.priority === filterPriority) && (!urgentOnly || r.priority === 'urgente')
      
      // If user is just an agent (not supervisor), and filterStatus is not set to 'resolved', 
      // maybe we want to hide resolved ones? 
      // The user said "au la effacer pour lagent". Let's hide resolved ones from the "default" view for agents.
      if (!isSupervisor && !filterStatus && r.status === 'resolved') return false

      return matchesBaseFilters
    })

    // Sort: resolved items always go to the very end
    filtered.sort((a, b) => {
      if (a.status === 'resolved' && b.status !== 'resolved') return 1
      if (a.status !== 'resolved' && b.status === 'resolved') return -1
      return b.id - a.id // newest first for the rest
    })

    setFilteredRecs(filtered)
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
    if (activeTab !== 'dashboard' || !mapRef.current) return
    const L = (window as any).L; if (!L) return
    
    // If map already exists, just invalidate size (for visibility changes)
    if (leafletMap.current) {
      setTimeout(() => leafletMap.current?.invalidateSize(), 200)
      return
    }

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

    // Force small delay for resize
    setTimeout(() => m.invalidateSize(), 100)

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [activeTab, mapRef])

  useEffect(() => {
    const L = (window as any).L; if (!L || !leafletMap.current || !markersLayer.current) return
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
  }, [allRecs, activeTab])

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
      if (res.ok) { 
        setAllRecs(p => p.map(r => r.id === id ? { ...r, status: newStatus } : r)); 
        showToast(`Statut mis à jour → ${STATUS[newStatus]?.label || newStatus}`); 
        cb(true) 
      }
      else { showToast('Erreur lors de la mise à jour.', 'error'); cb(false) }
    } catch { showToast('Erreur réseau.', 'error'); cb(false) }
  }

  async function deleteReclamation(id: number) {
    if (!window.confirm('Voulez-vous supprimer définitivement ce signalement ?')) return
    try {
      const res = await fetch(`/api/reclamations/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${access}` }
      })
      if (res.ok) {
        showToast('Signalement supprimé !')
        setAllRecs(prev => prev.filter(r => r.id !== id))
      } else {
        showToast('Action non autorisée ou erreur technique.', 'error')
      }
    } catch { showToast('Erreur réseau.', 'error') }
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
          <a className="ag-nav-item" href="/profile"><i className="fas fa-user-circle"></i> Mon Profil</a>

          {/* ── Visible to ALL agents ── */}
          <div className="ag-divider"></div>
          <div className="ag-sec-title">ESPACE AGENT</div>
          <a className={`ag-nav-item${activeTab === 'dashboard' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('dashboard') }}>
            <i className="fas fa-exclamation-circle"></i> Réclamations
            {pending > 0 && <span className="ag-badge">{pending}</span>}
          </a>
          <a className={`ag-nav-item${activeTab === 'evenements' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('evenements'); fetchEvenements() }}>
            <i className="fas fa-calendar-alt"></i> Événements
            {allEvenements.filter((ev: any) => ev.status === 'pending').length > 0 && (
              <span className="ag-badge">{allEvenements.filter((ev: any) => ev.status === 'pending').length}</span>
            )}
          </a>
          <a className={`ag-nav-item${activeTab === 'stats' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('stats'); if (!mlStats && !mlLoading) fetchMlStats() }}>
            <i className="fas fa-robot"></i> Statistiques IA
          </a>

          {/* ── Supervisor / Admin only ── */}
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
              <a className={`ag-nav-item${activeTab === 'demandes' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('demandes'); fetchDemandes() }}>
                <i className="fas fa-folder-open"></i> Demandes Citoyens
                {allDemandes.filter(d => d.status === 'pending').length > 0 && <span className="ag-badge">{allDemandes.filter(d => d.status === 'pending').length}</span>}
              </a>
              <a className={`ag-nav-item${activeTab === 'forum' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('forum'); fetchTopics() }}>
                <i className="fas fa-comments"></i> Modération Forum
              </a>
            </>
          )}

          <div className="ag-divider"></div>
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
                              <td>
                                <div className="d-flex gap-1">
                                  <button className="ag-action-btn" onClick={() => { setDetailRec(r); setDetailStatus(r.status) }} title="Voir détail"><i className="fas fa-eye"></i></button>
                                  {(user?.is_superuser || user?.is_staff || user?.user_type === 'supervisor') && (
                                    <button className="ag-action-btn text-danger" onClick={() => deleteReclamation(r.id)} title="Supprimer définitivement"><i className="fas fa-trash"></i></button>
                                  )}
                                </div>
                              </td>
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
              <div className="ag-card-hdr-green" style={{ background: 'linear-gradient(90deg,#004d40,#00695c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, minHeight: '50px', padding: '8px 16px' }}>
                <span className="fw-bold"><i className="fas fa-users-cog me-2"></i>Administration des Comptes</span>
                <div className="btn-group btn-group-sm bg-white bg-opacity-10 p-1 rounded">
                  <button onClick={() => { setUsersMode('unverified'); fetchManagedUsers('unverified') }} className={`btn btn-sm ${usersMode === 'unverified' ? 'btn-light' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}>EN ATTENTE</button>
                  <button onClick={() => { setUsersMode('agents'); fetchManagedUsers('agents') }} className={`btn btn-sm ${usersMode === 'agents' ? 'btn-warning' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}><i className="fas fa-user-tie me-1"></i>AGENTS</button>
                  <button onClick={() => { setUsersMode('all'); fetchManagedUsers('all') }} className={`btn btn-sm ${usersMode === 'all' ? 'btn-light' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}>TOUS</button>
                </div>
                <button className="btn btn-sm btn-light ms-2" onClick={() => setShowAddUserModal(true)} style={{ fontSize: '11px', fontWeight: 600 }}><i className="fas fa-user-plus me-1"></i>AJOUTER AGENT</button>
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
                                {u.user_type === 'citizen' && (
                                  <button className="btn btn-sm btn-outline-info" title="Promouvoir Agent" onClick={(e) => { e.stopPropagation(); if(window.confirm(`Êtes-vous sûr de vouloir promouvoir "${u.full_name}" en Agent ? Il recevra des privilèges de modération.`)) handleToggleUserStatus(u.id, 'promote_to_agent') }}><i className="fas fa-briefcase"></i></button>
                                )}
                                {user?.is_superuser && u.user_type !== 'supervisor' && (
                                  <button className="btn btn-sm btn-outline-warning" title="Promouvoir Superviseur" onClick={(e) => { e.stopPropagation(); if(window.confirm(`Êtes-vous sûr de vouloir promouvoir "${u.full_name}" en Superviseur ? Il aura des accès administratifs complets.`)) handleToggleUserStatus(u.id, 'promote_to_supervisor') }}><i className="fas fa-crown"></i></button>
                                )}
                                {user?.is_superuser && (u.user_type === 'agent' || u.user_type === 'supervisor') && (
                                  <button className="btn btn-sm btn-outline-secondary" title="Rétrograder en Citoyen"
                                    onClick={(e) => { e.stopPropagation(); if(window.confirm(`Rétrograder "${u.full_name}" en Citoyen ? Il perdra ses droits d'agent.`)) handleToggleUserStatus(u.id, 'demote_to_citizen') }}>
                                    <i className="fas fa-user-minus"></i>
                                  </button>
                                )}
                                {user?.is_superuser && (u.user_type === 'agent' || u.user_type === 'supervisor') && (
                                  <button className="btn btn-sm btn-outline-info" title="Réinitialiser le mot de passe"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      if (!window.confirm(`Générer un nouveau mot de passe pour "${u.full_name}" ?`)) return
                                      try {
                                        const res = await fetch('/api/accounts/verify-citizens/', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
                                          body: JSON.stringify({ user_id: u.id, action: 'reset_password' })
                                        })
                                        const data = await res.json()
                                        if (res.ok) setResetPwdResult({ name: u.full_name, password: data.new_password })
                                        else showToast(data.error || 'Erreur', 'error')
                                      } catch { showToast('Erreur réseau', 'error') }
                                    }}>
                                    <i className="fas fa-key"></i>
                                  </button>
                                )}
                                <button className="btn btn-sm btn-outline-danger" title="Supprimer" onClick={(e) => { e.stopPropagation(); if(window.confirm('Supprimer cet utilisateur ?')) handleToggleUserStatus(u.id, 'delete') }}><i className="fas fa-trash"></i></button>
                                {(u.cin_front || u.cin_back) && (
                                  <button type="button" className="btn btn-sm btn-outline-primary" title="Voir CIN" onClick={() => setSelectedUser(u)}><i className="fas fa-id-card"></i></button>
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
               <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#1a237e,#283593)', height: '50px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="fw-bold"><i className="fas fa-file-invoice me-2"></i>Gestion des Services Municipaux</span>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-light" style={{ fontSize: '11px', fontWeight: 600 }} onClick={() => setShowAddServiceModal(true)}><i className="fas fa-plus me-1"></i>AJOUTER SERVICE</button>
                    <button className="btn btn-sm btn-outline-light" style={{ fontSize: '11px', fontWeight: 600 }} onClick={fetchCategoriesAndServices}><i className="fas fa-sync-alt"></i></button>
                  </div>
               </div>
               <div className="ag-card-body p-0">
                  {loadingServicesTab ? (
                    <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                  ) : allServices.length === 0 ? (
                    <div className="text-center p-5 text-muted"><i className="fas fa-file-invoice fa-3x mb-3 opacity-25"></i><p>Aucun service configuré.</p></div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ag-table">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Catégorie</th>
                            <th>Délai</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allServices.map(s => (
                            <tr key={s.id}>
                              <td>
                                <div className="fw-bold text-dark">{s.name_fr}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{s.name_ar}</div>
                              </td>
                              <td><span className="badge bg-light text-dark border">{s.category_name}</span></td>
                              <td style={{ fontSize: '12px' }}>{s.processing_time || '—'}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-outline-primary" title="Modifier" onClick={() => { 
                                     setEditingService(s); 
                                     setServiceReqs(s.requirements || []);
                                     setShowAddServiceModal(true); 
                                  }}><i className="fas fa-edit"></i></button>
                                  <button className="btn btn-sm btn-outline-danger" title="Supprimer" onClick={() => deleteService(s.id)}><i className="fas fa-trash"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Summary Section below table */}
                  <div className="ag-divider"></div>
                  <div className="p-4 bg-light border-top">
                     <h6 className="fw-bold mb-3"><i className="fas fa-chart-line me-2"></i>Résumé des Demandes Actives</h6>
                     <div className="row g-3">
                        <div className="col-md-4">
                           <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #1a237e' }}>
                              <div className="text-muted small fw-bold">RÉSIDENCE</div>
                              <div className="h4 mt-2 mb-0 text-primary">{servicesSummary?.attestation_residence || 0} en attente</div>
                           </div>
                        </div>
                        <div className="col-md-4">
                           <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #0d47a1' }}>
                              <div className="text-muted small fw-bold">NAISSANCE</div>
                              <div className="h4 mt-2 mb-0 text-primary">{servicesSummary?.declaration_naissance || 0} en attente</div>
                           </div>
                        </div>
                        <div className="col-md-4">
                           <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #01579b' }}>
                              <div className="text-muted small fw-bold">LIVRET FAMILLE</div>
                              <div className="h4 mt-2 mb-0 text-primary">{servicesSummary?.livret_famille || 0} en attente</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'demandes' ? (
            /* ── DEMANDES CITOYENS TAB ─────────────────────────────────── */
            <div className="ag-card animate__animated animate__fadeIn">
              <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#004968,#006d94)', height: '50px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="fw-bold"><i className="fas fa-folder-open me-2"></i>Demandes Administratives des Citoyens</span>
                <button className="btn btn-sm btn-outline-light" onClick={fetchDemandes}><i className="fas fa-sync-alt"></i></button>
              </div>

              {/* Stats strip */}
              {!loadingDemandes && allDemandes.length > 0 && (() => {
                const typeCounts: Record<string, number> = {}
                const statusCounts: Record<string, number> = { pending: 0, in_progress: 0, approved: 0, rejected: 0 }
                allDemandes.forEach((d: any) => {
                  typeCounts[d.type] = (typeCounts[d.type] || 0) + 1
                  if (statusCounts[d.status] !== undefined) statusCounts[d.status]++
                })
                return (
                  <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', padding: '12px 16px' }}>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {[
                        { lbl: 'Total',       val: allDemandes.length,        color: '#006d94', bg: '#e1f3fb' },
                        { lbl: 'En attente',  val: statusCounts.pending,       color: '#e65100', bg: '#fff3e0' },
                        { lbl: 'En cours',    val: statusCounts.in_progress,  color: '#1565c0', bg: '#e3f2fd' },
                        { lbl: 'Approuvées', val: statusCounts.approved,      color: '#2e7d32', bg: '#e8f5e9' },
                        { lbl: 'Rejetées',   val: statusCounts.rejected,      color: '#b71c1c', bg: '#ffebee' },
                      ].map(s => (
                        <div key={s.lbl} className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                          style={{ background: s.bg, border: `1px solid ${s.color}33` }}>
                          <span className="fw-bold" style={{ color: s.color, fontSize: '1.1rem' }}>{s.val}</span>
                          <span style={{ color: s.color, fontSize: '.78rem' }}>{s.lbl}</span>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {Object.entries(typeCounts).map(([type, count]) => {
                        const typeLabels: Record<string, string> = { residence: '🏠 Résidence', livret: '📘 Livret Famille', naissance: '👶 Naissance', mariage: '💍 Mariage', deces: '⚰️ Décès' }
                        return <span key={type} style={{ background: '#e8eaf6', color: '#283593', border: '1px solid #c5cae9', borderRadius: 12, padding: '2px 10px', fontSize: '.75rem', fontWeight: 600 }}>{typeLabels[type] || type} ({count})</span>
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Filters */}
              <div className="ag-filter-bar">
                <div className="ag-search-wrap">
                  <i className="fas fa-search"></i>
                  <input className="ag-search-input" placeholder="Rechercher citoyen..." value={demandeSearchQ} onChange={e => setDemandeSearchQ(e.target.value)} style={{ width: 220 }} />
                </div>
                <select className="ag-filter-select" value={demandeTypeFilter} onChange={e => setDemandeTypeFilter(e.target.value)}>
                  <option value="">Tous les types</option>
                  <option value="residence">🏠 Attestation de Résidence</option>
                  <option value="livret">📘 Livret de Famille</option>
                  <option value="naissance">👶 Déclaration de Naissance</option>
                  <option value="mariage">💍 Extrait de Mariage</option>
                  <option value="deces">⚰️ Extrait de Décès</option>
                </select>
                <select className="ag-filter-select" value={demandeStatusFilter} onChange={e => setDemandeStatusFilter(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="pending">⏳ En attente</option>
                  <option value="in_progress">🔄 En cours</option>
                  <option value="approved">✅ Approuvée</option>
                  <option value="rejected">❌ Rejetée</option>
                </select>
                {(demandeSearchQ || demandeTypeFilter || demandeStatusFilter) && (
                  <button className="ag-filter-btn" onClick={() => { setDemandeSearchQ(''); setDemandeTypeFilter(''); setDemandeStatusFilter('') }}>
                    <i className="fas fa-times"></i> Réinitialiser
                  </button>
                )}
              </div>

              {loadingDemandes ? (
                <div className="ag-spinner-wrap"><div className="spinner-border" style={{ color: '#006d94' }} role="status"></div><div className="mt-2" style={{ fontSize: '.82rem', color: '#888' }}>Chargement...</div></div>
              ) : (() => {
                const q = demandeSearchQ.toLowerCase()
                const typeLabelsMap: Record<string, string> = { residence: '🏠 Résidence', livret: '📘 Livret Famille', naissance: '👶 Naissance', mariage: '💍 Mariage', deces: '⚰️ Décès' }
                const filtered = allDemandes.filter((d: any) => {
                  if (demandeTypeFilter && d.type !== demandeTypeFilter) return false
                  if (demandeStatusFilter && d.status !== demandeStatusFilter) return false
                  if (q && !d.citizen_name?.toLowerCase().includes(q) && !d.citizen_email?.toLowerCase().includes(q) && !d.type_label?.toLowerCase().includes(q)) return false
                  return true
                })
                if (filtered.length === 0) return (
                  <div className="ag-empty"><i className="fas fa-folder-open d-block"></i><p>Aucune demande trouvée.</p></div>
                )
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ag-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Type de Demande</th>
                          <th>Citoyen</th>
                          <th>Détails</th>
                          <th>Statut</th>
                          <th>Paiement</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((d: any) => {
                          const stMap: Record<string, { cls: string; icon: string; label: string }> = {
                            pending:     { cls: 'status-pending',     icon: 'fa-clock',        label: 'En attente' },
                            in_progress: { cls: 'status-in_progress', icon: 'fa-spinner',      label: 'En cours' },
                            approved:    { cls: 'status-resolved',    icon: 'fa-check-circle', label: 'Approuvée' },
                            validated:   { cls: 'status-resolved',    icon: 'fa-check-circle', label: 'Validée' },
                            rejected:    { cls: 'status-rejected',    icon: 'fa-times-circle', label: 'Rejetée' },
                          }
                          const st = stMap[d.status] || { cls: 'status-pending', icon: 'fa-question', label: d.status }
                          // Build a short summary of key fields
                          let summary = ''
                          if (d.type === 'residence') summary = d.adresse ? `📍 ${String(d.adresse).slice(0, 40)}` : ''
                          else if (d.type === 'livret') summary = d.nom_chef ? `👤 ${d.nom_chef} ${d.prenom_chef}` : ''
                          else if (d.type === 'naissance') summary = d.prenom_fr ? `👶 ${d.prenom_fr} ${d.nom_fr}` : ''
                          return (
                            <tr key={`${d.type}-${d.id}`}>
                              <td style={{ color: '#aaa', fontSize: '.74rem' }}>#{d.id}</td>
                              <td>
                                <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: '.75rem', fontWeight: 600, background: '#e8eaf6', color: '#283593' }}>
                                  {typeLabelsMap[d.type] || d.type}
                                </span>
                                <div style={{ fontSize: '.68rem', color: '#aaa', marginTop: 2 }}>{d.type_label}</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{d.citizen_name}</div>
                                <div style={{ fontSize: '.72rem', color: '#888' }}>{d.citizen_email}</div>
                              </td>
                              <td style={{ fontSize: '.8rem', color: '#555', maxWidth: 160 }}>
                                <span className="text-truncate d-block" title={summary}>{summary || '—'}</span>
                              </td>
                              <td>
                                <span className={`status-badge ${st.cls}`}><i className={`fas ${st.icon} me-1`}></i>{st.label}</span>
                              </td>
                              <td>
                                {d.is_paid
                                  ? <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', fontSize: '.7rem' }}>💳 Payé</span>
                                  : <span className="badge" style={{ background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', fontSize: '.7rem' }}>⏳ Non payé</span>}
                              </td>
                              <td style={{ whiteSpace: 'nowrap', color: '#888', fontSize: '.78rem' }}>{formatDate(d.created_at)}</td>
                              <td>
                                <button className="ag-action-btn" onClick={() => { setDemandeDetail(d); setDemandeNewStatus(d.status) }} title="Voir / Traiter">
                                  <i className="fas fa-eye"></i>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}

              {/* ── Detail Modal */}
              {demandeDetail && (() => {
                const typeLabelsMap: Record<string, string> = { residence: '🏠 Attestation de Résidence', livret: '📘 Livret de Famille', naissance: '👶 Déclaration de Naissance', mariage: '💍 Extrait de Mariage', deces: '⚰️ Extrait de Décès' }
                return (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
                      <div style={{ background: 'linear-gradient(90deg,#004968,#006d94)', borderRadius: '16px 16px 0 0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}><i className="fas fa-folder-open me-2"></i>{typeLabelsMap[demandeDetail.type] || demandeDetail.type}</span>
                        <button onClick={() => setDemandeDetail(null)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: '.9rem' }}>✕</button>
                      </div>
                      <div style={{ padding: '20px 24px' }}>
                        {/* Citizen info */}
                        <div style={{ background: '#f0f7ff', borderRadius: 10, padding: '14px 16px', marginBottom: 18, border: '1px solid #bbdefb' }}>
                          <div style={{ fontSize: '.72rem', color: '#1565c0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Citoyen</div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>{demandeDetail.citizen_name}</div>
                          <div style={{ fontSize: '.82rem', color: '#555', marginTop: 2 }}>{demandeDetail.citizen_email}</div>
                          {demandeDetail.telephone && <div style={{ fontSize: '.82rem', color: '#555', marginTop: 2 }}><i className="fas fa-phone me-1"></i>{demandeDetail.telephone}</div>}
                        </div>

                        {/* Type-specific details */}
                        <div className="row g-3 mb-3">
                          {demandeDetail.type === 'residence' && (<>
                            <div className="col-12"><div className="det-label">Adresse demandée</div><div className="det-value">{demandeDetail.adresse || '—'}</div></div>
                            {demandeDetail.motif && <div className="col-12"><div className="det-label">Motif</div><div className="det-value">{demandeDetail.motif}</div></div>}
                            {demandeDetail.profession && <div className="col-6"><div className="det-label">Profession</div><div className="det-value">{demandeDetail.profession}</div></div>}
                          </>)}
                          {demandeDetail.type === 'livret' && (<>
                            <div className="col-6"><div className="det-label">Chef de famille</div><div className="det-value">{demandeDetail.nom_chef} {demandeDetail.prenom_chef}</div></div>
                            {demandeDetail.motif && <div className="col-6"><div className="det-label">Motif</div><div className="det-value">{demandeDetail.motif}</div></div>}
                            {demandeDetail.etat_livret && <div className="col-6"><div className="det-label">État du livret</div><div className="det-value">{demandeDetail.etat_livret}</div></div>}
                          </>)}
                          {demandeDetail.type === 'naissance' && (<>
                            <div className="col-6"><div className="det-label">Nouveau-né</div><div className="det-value">{demandeDetail.prenom_fr} {demandeDetail.nom_fr}</div></div>
                            <div className="col-6"><div className="det-label">Date de naissance</div><div className="det-value">{demandeDetail.date_naissance}</div></div>
                            {demandeDetail.lieu_naissance_fr && <div className="col-6"><div className="det-label">Lieu de naissance</div><div className="det-value">{demandeDetail.lieu_naissance_fr}</div></div>}
                            {demandeDetail.sexe && <div className="col-6"><div className="det-label">Sexe</div><div className="det-value">{demandeDetail.sexe}</div></div>}
                          </>)}

                          <div className="col-6"><div className="det-label">Paiement</div><div className="det-value">{demandeDetail.is_paid ? '✅ Payé' : '⏳ Non payé'}</div></div>
                          <div className="col-6"><div className="det-label">Date de la demande</div><div className="det-value">{formatDate(demandeDetail.created_at)}</div></div>
                        </div>

                        {/* Comment preview */}
                        {demandeDetail.commentaire_agent && (
                          <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
                            <div className="det-label">Commentaire agent précédent</div>
                            <div style={{ fontSize: '.85rem', color: '#444' }}>{demandeDetail.commentaire_agent}</div>
                          </div>
                        )}

                        <hr />
                        {/* Status update */}
                        <div className="mb-3">
                          <label className="det-label mb-2">Changer le statut de la demande</label>
                          <div className="d-flex gap-2 flex-wrap">
                            {[
                              { val: 'pending',     label: '⏳ En attente',  cls: 'btn-outline-warning' },
                              { val: 'in_progress', label: '🔄 En cours',    cls: 'btn-outline-primary' },
                              { val: 'approved',    label: '✅ Approuver',   cls: 'btn-outline-success' },
                              { val: 'rejected',    label: '❌ Rejeter',     cls: 'btn-outline-danger' },
                            ].map(opt => (
                              <button key={opt.val}
                                className={`btn btn-sm ${opt.cls} ${demandeNewStatus === opt.val ? 'active' : ''}`}
                                style={{ fontWeight: 600, fontSize: '.8rem', ...(demandeNewStatus === opt.val ? { opacity: 1 } : { opacity: .7 }) }}
                                onClick={() => setDemandeNewStatus(opt.val)}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-secondary btn-sm" onClick={() => setDemandeDetail(null)}>Fermer</button>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={demandeSaving || demandeNewStatus === demandeDetail.status}
                            onClick={() => saveDemandStatus(demandeDetail, demandeNewStatus)}>
                            {demandeSaving ? <><i className="fas fa-spinner fa-spin me-1"></i>En cours...</> : <><i className="fas fa-save me-1"></i>Enregistrer le statut</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : activeTab === 'forum' ? (
            /* ── FORUM MANAGEMENT TAB ─────────────────────────────────── */
            <div className="ag-card animate__animated animate__fadeIn">
              <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#311b92,#4527a0)' }}>
                <span><i className="fas fa-comments me-2"></i>Modération du Forum</span>
                <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.78rem' }} onClick={fetchTopics}>
                  <i className="fas fa-sync-alt me-1"></i>Actualiser
                </button>
              </div>

              {/* Forum Stats Strip */}
              {!loadingTopics && forumStats && (
                <div className="d-flex flex-wrap gap-2 p-3 border-bottom" style={{ background: '#f8f9fa' }}>
                  {[
                    { lbl: 'Sujets',       val: forumStats.total_topics,    color: '#311b92', bg: '#ede7f6' },
                    { lbl: 'Réponses',     val: forumStats.total_replies,   color: '#006064', bg: '#e0f7fa' },
                    { lbl: 'Membres Actifs', val: forumStats.active_members,  color: '#c62828', bg: '#ffebee' },
                    { lbl: 'Épinglés',    val: forumStats.pinned_topics,    color: '#f57f17', bg: '#fff8e1' },
                    { lbl: 'Résolus',      val: forumStats.resolved_topics,  color: '#2e7d32', bg: '#e8f5e9' },
                  ].map(s => (
                    <div key={s.lbl} className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                      style={{ background: s.bg, border: `1px solid ${s.color}33` }}>
                      <span className="fw-bold" style={{ color: s.color, fontSize: '1.1rem' }}>{s.val}</span>
                      <span style={{ color: s.color, fontSize: '.78rem' }}>{s.lbl}</span>
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm ms-auto rounded-pill px-3" onClick={() => navigate('/forum')}>
                    <i className="fas fa-external-link-alt me-1"></i> Voir le Forum Live
                  </button>
                </div>
              )}

              {/* Filters */}
              <div className="ag-filter-bar">
                <div className="ag-search-wrap">
                  <i className="fas fa-search"></i>
                  <input className="ag-search-input" placeholder="Rechercher un sujet..." value={forumSearch} onChange={e => setForumSearch(e.target.value)} />
                </div>
              </div>

              {loadingTopics ? (
                <div className="ag-spinner-wrap"><div className="spinner-border text-primary"></div></div>
              ) : (() => {
                const filtered = allTopics.filter(t => 
                  !forumSearch || t.title.toLowerCase().includes(forumSearch.toLowerCase()) || 
                  t.author_name?.toLowerCase().includes(forumSearch.toLowerCase())
                )
                if (filtered.length === 0) return <div className="ag-empty">Aucun sujet trouvé.</div>
                return (
                  <div className="table-responsive">
                    <table className="ag-table shadow-sm">
                      <thead>
                        <tr>
                          <th>Sujet</th>
                          <th>Auteur</th>
                          <th>Stats</th>
                          <th>État</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(t => (
                          <tr key={t.id}>
                            <td style={{ maxWidth: 250 }}>
                              <div className="fw-bold text-dark text-truncate" title={t.title}>{t.title}</div>
                              <div className="small text-muted text-truncate">{t.content?.slice(0, 60)}...</div>
                              <div className="mt-1">
                                {t.tags?.map((tg: any) => (
                                  <span key={tg.id} className="badge bg-light text-dark border me-1" style={{ fontSize: '10px' }}>{tg.name}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="small fw-bold text-primary">{t.author_name}</div>
                              <div className="text-muted" style={{ fontSize: '10px' }}>{formatDate(t.created_at)}</div>
                            </td>
                            <td>
                              <div className="small"><i className="fas fa-eye text-muted me-1"></i>{t.views}</div>
                              <div className="small"><i className="fas fa-comment text-muted me-1"></i>{t.replies_count}</div>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                {t.is_pinned && <span className="badge bg-warning text-dark" style={{ fontSize: '10px' }}><i className="fas fa-thumbtack me-1"></i>ÉPINGLÉ</span>}
                                {t.is_resolved && <span className="badge bg-success" style={{ fontSize: '10px' }}><i className="fas fa-check me-1"></i>RÉSOLU</span>}
                                {!t.is_pinned && !t.is_resolved && <span className="text-muted small">Normal</span>}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className={`btn btn-sm ${t.is_pinned ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => handleTopicAction(t.id, 'pin')} title="Épingler">
                                  <i className="fas fa-thumbtack"></i>
                                </button>
                                <button className={`btn btn-sm ${t.is_resolved ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleTopicAction(t.id, 'resolve')} title="Marquer Résolu">
                                  <i className="fas fa-check"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleTopicAction(t.id, 'delete')} title="Supprimer">
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          ) : activeTab === 'evenements' ? (
            /* ── ÉVÉNEMENTS TAB ──────────────────────────────────────── */
            <div className="ag-card animate__animated animate__fadeIn" style={{ overflow: 'visible' }}>
              <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#1a3a5c,#6f42c1)' }}>
                <span><i className="fas fa-calendar-alt me-2"></i>Gestion des demandes d'événements</span>
                <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.78rem' }} onClick={fetchEvenements}>
                  <i className="fas fa-sync-alt me-1"></i>Actualiser
                </button>
              </div>

              {/* Stats strip */}
              {!loadingEvenements && allEvenements.length > 0 && (() => {
                const ev_pending  = allEvenements.filter((e: any) => e.status === 'pending').length
                const ev_inprog   = allEvenements.filter((e: any) => e.status === 'in_progress').length
                const ev_approved = allEvenements.filter((e: any) => e.status === 'approved').length
                const ev_rejected = allEvenements.filter((e: any) => e.status === 'rejected').length
                const ev_conflict = allEvenements.filter((e: any) => e.has_conflict).length
                return (
                  <div className="d-flex flex-wrap gap-2 p-3 border-bottom" style={{ background: '#f8f9fa' }}>
                    {[
                      { lbl: 'Total',      val: allEvenements.length, color: '#1565c0', bg: '#e3f2fd' },
                      { lbl: 'En attente', val: ev_pending,  color: '#e65100', bg: '#fff3e0' },
                      { lbl: 'En cours',   val: ev_inprog,   color: '#0288d1', bg: '#e1f5fe' },
                      { lbl: 'Autorisés',  val: ev_approved, color: '#2e7d32', bg: '#e8f5e9' },
                      { lbl: 'Rejetés',    val: ev_rejected, color: '#b71c1c', bg: '#ffebee' },
                      { lbl: '⚠️ Conflits', val: ev_conflict, color: '#f57f17', bg: '#fff8e1' },
                    ].map(s => (
                      <div key={s.lbl} className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                        style={{ background: s.bg, border: `1px solid ${s.color}33` }}>
                        <span className="fw-bold" style={{ color: s.color, fontSize: '1.1rem' }}>{s.val}</span>
                        <span style={{ color: s.color, fontSize: '.78rem' }}>{s.lbl}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Filters */}
              <div className="ag-filter-bar gap-2">
                <div className="ag-search-wrap">
                  <i className="fas fa-search"></i>
                  <input className="ag-search-input" placeholder="Rechercher..." value={evSearch} onChange={e => setEvSearch(e.target.value)} />
                </div>
                <select className="ag-filter-select" value={evStatusFilter} onChange={e => setEvStatusFilter(e.target.value)}>
                  <option value="">Tous statuts</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="approved">Autorisé</option>
                  <option value="rejected">Rejeté</option>
                </select>
                <select className="ag-filter-select" value={evTypeFilter} onChange={e => setEvTypeFilter(e.target.value)}>
                  <option value="">Tous types</option>
                  <option value="fete_familiale">Fête familiale</option>
                  <option value="concert">Concert</option>
                  <option value="marche">Marché</option>
                  <option value="association">Association</option>
                  <option value="sportif">Sportif</option>
                  <option value="culturel">Culturel</option>
                  <option value="commercial">Commercial</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {loadingEvenements ? (
                <div className="ag-spinner-wrap"><div className="spinner-border spinner-border-sm me-2"></div>Chargement...</div>
              ) : (() => {
                const filtered = allEvenements.filter((ev: any) => {
                  if (evStatusFilter && ev.status !== evStatusFilter) return false
                  if (evTypeFilter && ev.type_evenement !== evTypeFilter) return false
                  if (evSearch) {
                    const q = evSearch.toLowerCase()
                    return ev.titre_evenement?.toLowerCase().includes(q) ||
                           ev.nom_organisateur?.toLowerCase().includes(q) ||
                           ev.lieu_details?.toLowerCase().includes(q)
                  }
                  return true
                })
                if (filtered.length === 0) return (
                  <div className="ag-empty"><i className="fas fa-calendar-times d-block"></i>Aucune demande d'événement.</div>
                )
                return (
                  <div className="table-responsive">
                    <table className="ag-table">
                      <thead><tr>
                        <th>Événement</th><th>Type</th><th>Lieu</th><th>Date</th><th>Organisateur</th><th>Statut</th><th>Conflit</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((ev: any) => {
                          const sc: Record<string, string> = {
                            pending:     'status-pending', in_progress: 'status-in_progress',
                            approved:    'status-resolved', rejected: 'status-rejected',
                          }
                          return (
                            <tr key={ev.id}>
                              <td className="fw-bold" style={{ maxWidth: 180 }}>
                                <div className="text-truncate">{ev.titre_evenement}</div>
                              </td>
                              <td><span className="cat-badge cat-other">{ev.type_evenement_display}</span></td>
                              <td style={{ fontSize: '.8rem', color: '#555', maxWidth: 140 }}>
                                <div className="text-truncate" title={ev.lieu_details}>{ev.lieu_details}</div>
                              </td>
                              <td style={{ fontSize: '.78rem', whiteSpace: 'nowrap' }}>
                                {ev.date_debut} → {ev.date_fin}<br />
                                <span className="text-muted">{ev.heure_debut?.slice(0,5)} — {ev.heure_fin?.slice(0,5)}</span>
                              </td>
                              <td style={{ fontSize: '.8rem' }}>{ev.nom_organisateur}</td>
                              <td><span className={`status-badge ${sc[ev.status] || 'bg-secondary'}`}>{ev.status_display}</span></td>
                              <td>
                                {ev.has_conflict ? (
                                  <span className="badge rounded-pill px-2" style={{ background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', fontSize: '.7rem' }}>
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    {ev.conflict_with_title ? `≈ ${ev.conflict_with_title.slice(0, 20)}` : 'Conflit'}
                                  </span>
                                ) : (
                                  <span className="text-muted" style={{ fontSize: '.75rem' }}>—</span>
                                )}
                              </td>
                              <td>
                                <button className="ag-action-btn" onClick={() => { setEvDetail(ev) }} title="Voir / Traiter">
                                  <i className="fas fa-eye"></i> Traiter
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}

            </div>
          ) : activeTab === 'stats' ? (
            /* ── STATISTIQUES IA TAB ──────────────────────────────────────── */
            <div className="ag-card animate__animated animate__fadeIn" style={{ overflow: 'visible' }}>
              <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(135deg,#1a237e,#283593)' }}>
                <span><i className="fas fa-brain me-2"></i>Statistiques IA — Classificateur NLP TF-IDF + LinearSVC</span>
                <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.78rem' }} onClick={fetchMlStats}>
                  <i className="fas fa-sync-alt me-1"></i>Recalculer
                </button>
              </div>
              <div style={{ padding: '24px 22px' }}>
                {mlLoading && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#1a237e' }}>
                    <div className="spinner-border" style={{ width: '2.5rem', height: '2.5rem' }} role="status"></div>
                    <p className="mt-3" style={{ fontSize: '.9rem', color: '#555' }}>Calcul des statistiques IA en cours…</p>
                    <p style={{ fontSize: '.77rem', color: '#aaa' }}>Première ouverture : entraînement du modèle en mémoire (~5s)</p>
                  </div>
                )}
                {!mlLoading && mlError && (
                  <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: 24, textAlign: 'center' }}>
                    <i className="fas fa-exclamation-triangle" style={{ color: '#b71c1c', fontSize: '2rem', display: 'block', marginBottom: 12 }}></i>
                    <p style={{ color: '#b71c1c', fontWeight: 600, marginBottom: 12 }}>{mlError}</p>
                    <button onClick={fetchMlStats} style={{ background: '#1a237e', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontSize: '.85rem' }}>
                      <i className="fas fa-redo me-1"></i>Réessayer
                    </button>
                  </div>
                )}
                {!mlLoading && !mlStats && !mlError && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
                    <i className="fas fa-robot" style={{ fontSize: '3rem', opacity: .3, display: 'block', marginBottom: 12 }}></i>
                    <p>Cliquez sur <strong>Recalculer</strong> pour charger les statistiques du modèle IA.</p>
                  </div>
                )}
                {!mlLoading && mlStats && (() => {
                  const CAT_LABELS: Record<string,string> = { lighting:'💡 Éclairage', trash:'🗑️ Déchets', roads:'🛣️ Voirie', noise:'🔊 Nuisances', other:'📌 Autre' }
                  const PRI_LABELS: Record<string,string> = { urgente:'🔴 Urgente', normale:'🔵 Normale', faible:'🟣 Faible' }
                  const LMAP_CAT: Record<string,string> = { lighting:'💡', trash:'🗑️', roads:'🛣️', noise:'🔊', other:'📌' }
                  const LMAP_PRI: Record<string,string> = { urgente:'🔴', normale:'🔵', faible:'🟣' }
                  return (
                    <>
                      {/* Accuracy summary cards */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
                        {[
                          { label: 'Précision — Catégorie', value: Math.round(mlStats.category.accuracy * 100) + '%', bg: '#e8f5e9', color: mlStats.category.accuracy >= 0.85 ? '#2e7d32' : '#f57f17', sub: `${mlStats.n_samples} exemples` },
                          { label: 'Précision — Priorité',  value: Math.round(mlStats.priority.accuracy * 100) + '%',  bg: '#e3f2fd', color: mlStats.priority.accuracy >= 0.85  ? '#1565c0' : '#f57f17', sub: 'TF-IDF + LinearSVC' },
                          { label: 'Échantillons',           value: mlStats.n_samples,                                    bg: '#f3e5f5', color: '#6a1b9a',                                               sub: 'Données annotées' },
                        ].map((c, i) => (
                          <div key={i} style={{ flex: 1, minWidth: 180, borderRadius: 12, padding: '20px 22px', textAlign: 'center', background: c.bg }}>
                            <div style={{ fontSize: '.82rem', color: '#555', marginBottom: 6 }}>{c.label}</div>
                            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 14, fontWeight: 700, fontSize: '1.6rem', background: c.color, color: '#fff' }}>{c.value}</div>
                            <div style={{ fontSize: '.73rem', color: '#888', marginTop: 6 }}>{c.sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* TABLE 1 — Category Classification Report */}
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a237e', margin: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>
                        <i className="fas fa-table"></i>Tableau 1 — Rapport de classification (Catégorie)
                      </div>
                      <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 12, lineHeight: 1.5 }}>
                        <b>Précision</b> = sur tout ce que le modèle a prédit "voirie", combien était vraiment voirie &nbsp;|&nbsp;
                        <b>Rappel</b> = sur toutes les vraies "voirie", combien le modèle a trouvé &nbsp;|&nbsp;
                        <b>F1</b> = moyenne harmonique &nbsp;|&nbsp; <b>Support</b> = nb exemples de test
                      </p>
                      <div className="ag-card" style={{ marginBottom: 22 }}>
                        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                            <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Catégorie</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Précision</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Rappel</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>F1-Score</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Support</th></tr></thead>
                            <tbody>
                              {mlStats.category.report.map((row: any) => {
                                const f1Color = row.f1 >= 0.85 ? '#2e7d32' : row.f1 >= 0.65 ? '#f57f17' : '#c62828'
                                return (
                                  <tr key={row.label} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '8px 12px', color: '#444' }}><strong>{CAT_LABELS[row.label] || row.label}</strong></td>
                                    <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.precision * 100)}%</td>
                                    <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.recall * 100)}%</td>
                                    <td style={{ padding: '8px 12px', color: '#444' }}><span style={{ color: f1Color, fontWeight: 700 }}>{Math.round(row.f1 * 100)}%</span></td>
                                    <td style={{ padding: '8px 12px', color: '#888' }}>{row.support}</td>
                                  </tr>
                                )
                              })}
                              <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
                                <td style={{ padding: '8px 12px' }}>Moyenne</td>
                                <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.category.report.reduce((s: number, r: any) => s + r.precision, 0) / mlStats.category.report.length * 100)}%</td>
                                <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.category.report.reduce((s: number, r: any) => s + r.recall, 0) / mlStats.category.report.length * 100)}%</td>
                                <td style={{ padding: '8px 12px', color: '#1565c0' }}>{Math.round(mlStats.category.report.reduce((s: number, r: any) => s + r.f1, 0) / mlStats.category.report.length * 100)}%</td>
                                <td style={{ padding: '8px 12px', color: '#888' }}>{mlStats.n_samples}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TABLE 2 — Confusion Matrix Category */}
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a237e', margin: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>
                        <i className="fas fa-th"></i>Tableau 2 — Matrice de confusion (Catégorie)
                      </div>
                      <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 12, lineHeight: 1.5 }}>
                        Lignes = catégorie <b>réelle</b>, Colonnes = catégorie <b>prédite</b>. <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '0 4px', borderRadius: 4 }}>Cases vertes</span> = correctes. <span style={{ background: '#fce4ec', color: '#b71c1c', padding: '0 4px', borderRadius: 4 }}>Cases rouges</span> = erreurs.
                      </p>
                      <div className="ag-card" style={{ marginBottom: 22 }}>
                        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                            <thead><tr style={{ background: '#f5f5f5' }}>
                              <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0', fontSize: '.72rem' }}>Réel ↓ / Prédit →</th>
                              {mlStats.category.labels.map((l: string) => <th key={l} style={{ textAlign: 'center', minWidth: 46, padding: 7, fontSize: '.8rem', borderBottom: '2px solid #e0e0e0', fontWeight: 700, color: '#333' }}>{LMAP_CAT[l] || l}</th>)}
                            </tr></thead>
                            <tbody>
                              {mlStats.category.confusion_matrix.map((row: number[], i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                  <td style={{ padding: '8px 12px', color: '#444' }}><strong style={{ fontSize: '.8rem' }}>{CAT_LABELS[mlStats.category.labels[i]] || mlStats.category.labels[i]}</strong></td>
                                  {row.map((val, j) => (
                                    <td key={j} style={{ textAlign: 'center', minWidth: 46, padding: 7, fontSize: '.8rem', background: i === j ? '#e8f5e9' : val > 0 ? '#fce4ec' : '', color: i === j ? '#1b5e20' : val > 0 ? '#b71c1c' : '', fontWeight: i === j ? 700 : 400 }}>{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TABLE 3 — Top NLP features */}
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a237e', margin: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>
                        <i className="fas fa-star"></i>Tableau 3 — Mots les plus importants par catégorie (NLP)
                      </div>
                      <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 12, lineHeight: 1.5 }}>Les mots à plus fort poids dans la décision TF-IDF + SVM. Plus le score est élevé, plus le mot est discriminatif.</p>
                      <div className="ag-card" style={{ marginBottom: 22 }}>
                        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                            <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Catégorie</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Mots-clés discriminatifs (NLP)</th></tr></thead>
                            <tbody>
                              {Object.entries(mlStats.category.top_features).map(([cat, words]: [string, any]) => (
                                <tr key={cat} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                  <td style={{ padding: '8px 12px', color: '#444' }}><strong>{CAT_LABELS[cat] || cat}</strong></td>
                                  <td style={{ padding: '8px 12px', color: '#444' }}>{words.map((w: any, i: number) => <span key={i} style={{ display: 'inline-block', padding: '3px 8px', background: '#e3f2fd', borderRadius: 8, fontSize: '.76rem', color: '#1565c0', margin: 2 }} title={`Score: ${w.score}`}>{w.word}</span>)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TABLE 4 — Priority Classification Report */}
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a237e', margin: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>
                        <i className="fas fa-flag"></i>Tableau 4 — Rapport de classification (Priorité)
                      </div>
                      <div className="ag-card" style={{ marginBottom: 22 }}>
                        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                            <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Priorité</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Précision</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Rappel</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>F1-Score</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>Support</th></tr></thead>
                            <tbody>
                              {mlStats.priority.report.map((row: any) => {
                                const f1Color = row.f1 >= 0.85 ? '#2e7d32' : row.f1 >= 0.65 ? '#f57f17' : '#c62828'
                                return (
                                  <tr key={row.label} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '8px 12px', color: '#444' }}><strong>{PRI_LABELS[row.label] || row.label}</strong></td>
                                    <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.precision * 100)}%</td>
                                    <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.recall * 100)}%</td>
                                    <td style={{ padding: '8px 12px', color: '#444' }}><span style={{ color: f1Color, fontWeight: 700 }}>{Math.round(row.f1 * 100)}%</span></td>
                                    <td style={{ padding: '8px 12px', color: '#888' }}>{row.support}</td>
                                  </tr>
                                )
                              })}
                              <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
                                <td style={{ padding: '8px 12px' }}>Moyenne</td>
                                <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.priority.report.reduce((s: number, r: any) => s + r.precision, 0) / mlStats.priority.report.length * 100)}%</td>
                                <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.priority.report.reduce((s: number, r: any) => s + r.recall, 0) / mlStats.priority.report.length * 100)}%</td>
                                <td style={{ padding: '8px 12px', color: '#1565c0' }}>{Math.round(mlStats.priority.report.reduce((s: number, r: any) => s + r.f1, 0) / mlStats.priority.report.length * 100)}%</td>
                                <td style={{ padding: '8px 12px', color: '#888' }}>{mlStats.n_samples}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TABLE 4b — Confusion Matrix Priority */}
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a237e', margin: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>
                        <i className="fas fa-th"></i>Tableau 4b — Matrice de confusion (Priorité)
                      </div>
                      <div className="ag-card" style={{ marginBottom: 22 }}>
                        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                            <thead><tr style={{ background: '#f5f5f5' }}>
                              <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0', fontSize: '.72rem' }}>Réel ↓ / Prédit →</th>
                              {mlStats.priority.labels.map((l: string) => <th key={l} style={{ textAlign: 'center', minWidth: 46, padding: 7, fontSize: '.8rem', borderBottom: '2px solid #e0e0e0', fontWeight: 700, color: '#333' }}>{LMAP_PRI[l] || l}</th>)}
                            </tr></thead>
                            <tbody>
                              {mlStats.priority.confusion_matrix.map((row: number[], i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                  <td style={{ padding: '8px 12px', color: '#444' }}><strong style={{ fontSize: '.8rem' }}>{PRI_LABELS[mlStats.priority.labels[i]] || mlStats.priority.labels[i]}</strong></td>
                                  {row.map((val, j) => (
                                    <td key={j} style={{ textAlign: 'center', minWidth: 46, padding: 7, fontSize: '.8rem', background: i === j ? '#e8f5e9' : val > 0 ? '#fce4ec' : '', color: i === j ? '#1b5e20' : val > 0 ? '#b71c1c' : '', fontWeight: i === j ? 700 : 400 }}>{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', padding: '10px 0 8px', color: '#aaa', fontSize: '.76rem' }}>
                        <i className="fas fa-info-circle me-1"></i>
                        Modèle entraîné en mémoire au démarrage · TF-IDF (n-grammes 1–2) + LinearSVC · {mlStats.n_samples} exemples
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          ) : null}

          {/* ── Événement detail modal */}
          {activeTab === 'evenements' && evDetail && (() => {
            return (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
                  <div className="ag-modal-hdr" style={{ background: 'linear-gradient(90deg,#1a3a5c,#6f42c1)', borderRadius: '16px 16px 0 0' }}>
                    <span className="title"><i className="fas fa-calendar-alt me-2"></i>{evDetail.titre_evenement}</span>
                    <button className="ag-close-btn" onClick={() => setEvDetail(null)}><i className="fas fa-times"></i></button>
                  </div>
                  <div className="p-4">
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <div className="det-label">Type</div>
                        <div className="det-value">{evDetail.type_evenement_display}</div>
                      </div>
                      <div className="col-6">
                        <div className="det-label">Organisateur</div>
                        <div className="det-value">{evDetail.nom_organisateur} — {evDetail.telephone_organisateur}</div>
                      </div>
                      <div className="col-6">
                        <div className="det-label">Lieu</div>
                        <div className="det-value">{evDetail.lieu_type_display} — {evDetail.lieu_details}</div>
                      </div>
                      <div className="col-6">
                        <div className="det-label">Dates & Horaires</div>
                        <div className="det-value">{evDetail.date_debut} → {evDetail.date_fin}</div>
                        <div className="det-value" style={{ fontSize: '.83rem', color: '#777' }}>{evDetail.heure_debut?.slice(0,5)} — {evDetail.heure_fin?.slice(0,5)}</div>
                      </div>
                      <div className="col-6">
                        <div className="det-label">Participants</div>
                        <div className="det-value">{evDetail.nombre_participants}</div>
                      </div>
                      <div className="col-6">
                        <div className="det-label">CIN organisateur</div>
                        <div className="det-value">{evDetail.cin_organisateur}</div>
                      </div>
                      <div className="col-12">
                        <div className="det-label">Description</div>
                        <div className="det-value" style={{ lineHeight: 1.7, fontSize: '.88rem' }}>{evDetail.description}</div>
                      </div>
                      {evDetail.has_conflict && (
                        <div className="col-12">
                          <div className="p-3 rounded-3 d-flex gap-2 align-items-start" style={{ background: '#fff8e1', border: '1px solid #ffe082', fontSize: '.85rem', color: '#e65100' }}>
                            <i className="fas fa-exclamation-triangle mt-1"></i>
                            <div>
                              <strong>Conflit détecté</strong> — un autre événement est prévu au même lieu pendant la même période.
                              {evDetail.conflict_with_title && <span> Événement concurrent : <em>« {evDetail.conflict_with_title} »</em></span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    {[
                      { key: 'cin_recto', label: 'CIN Recto' },
                      { key: 'cin_verso', label: 'CIN Verso' },
                      { key: 'programme_evenement', label: 'Programme' },
                      { key: 'plan_lieu', label: 'Plan du lieu' },
                      { key: 'attestation_assurance', label: 'Assurance' },
                      { key: 'plan_securite', label: 'Plan sécurité' },
                      { key: 'attestation_association', label: 'Attestation asso.' },
                    ].some(doc => evDetail[doc.key]) && (
                      <div className="mb-3">
                        <div className="det-label mb-2">Documents joints</div>
                        <div className="d-flex flex-wrap gap-2">
                          {[
                            { key: 'cin_recto', label: 'CIN Recto' },
                            { key: 'cin_verso', label: 'CIN Verso' },
                            { key: 'programme_evenement', label: 'Programme' },
                            { key: 'plan_lieu', label: 'Plan du lieu' },
                            { key: 'attestation_assurance', label: 'Assurance' },
                            { key: 'plan_securite', label: 'Plan sécurité' },
                            { key: 'attestation_association', label: 'Attestation asso.' },
                          ].filter(doc => evDetail[doc.key]).map(doc => (
                            <a key={doc.key} href={resolveBackendUrl(evDetail[doc.key])} target="_blank" rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary rounded-pill">
                              <i className="fas fa-file me-1"></i>{doc.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <hr />
                    {/* Agent action — 3-button workflow */}
                    <div className="mb-3">
                      <label className="det-label mb-2">Commentaire pour le citoyen</label>
                      <textarea className="form-control mt-1" rows={3} id="ev-detail-comment"
                        defaultValue={evDetail.commentaire_agent}
                        placeholder="Motif de la décision, informations complémentaires, modifications demandées..." />
                    </div>

                    {/* Current status pill */}
                    <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-muted small">Statut actuel :</span>
                      {(() => {
                        const cfg: Record<string, { cls: string; icon: string }> = {
                          pending:            { cls: 'bg-warning text-dark',  icon: 'fa-hourglass-half' },
                          in_progress:        { cls: 'bg-info text-white',    icon: 'fa-spinner' },
                          approved:           { cls: 'bg-success text-white', icon: 'fa-check-circle' },
                          rejected:           { cls: 'bg-danger text-white',  icon: 'fa-times-circle' },
                          changes_requested:  { cls: 'bg-warning text-dark',  icon: 'fa-edit' },
                        }
                        const c = cfg[evDetail.status] || { cls: 'bg-secondary text-white', icon: 'fa-question' }
                        return (
                          <span className={`badge rounded-pill px-3 py-2 ${c.cls}`} style={{ fontSize: '.8rem' }}>
                            <i className={`fas ${c.icon} me-1`}></i>{evDetail.status_display}
                          </span>
                        )
                      })()}
                    </div>

                    {/* 3-button decision row */}
                    <div className="d-flex gap-2 flex-wrap mt-2">
                      <button className="btn btn-success rounded-pill px-4 fw-bold flex-fill" disabled={evSaving}
                        onClick={() => {
                          const txt = document.getElementById('ev-detail-comment') as HTMLTextAreaElement
                          handleEvStatus(evDetail.id, 'approved', txt?.value || '')
                        }}
                        title="Autoriser cet événement">
                        {evSaving
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : <><i className="fas fa-check-circle me-2"></i>Approuver</>
                        }
                      </button>

                      <button className="btn btn-warning rounded-pill px-4 fw-bold flex-fill text-dark" disabled={evSaving}
                        onClick={() => {
                          const txt = document.getElementById('ev-detail-comment') as HTMLTextAreaElement
                          if (!txt?.value?.trim()) {
                            txt?.focus()
                            txt?.setCustomValidity('Veuillez indiquer les modifications demandées.')
                            txt?.reportValidity()
                            return
                          }
                          handleEvStatus(evDetail.id, 'changes_requested', txt.value)
                        }}
                        title="Demander des modifications au citoyen">
                        {evSaving
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : <><i className="fas fa-edit me-2"></i>Modifications</>
                        }
                      </button>

                      <button className="btn btn-danger rounded-pill px-4 fw-bold flex-fill" disabled={evSaving}
                        onClick={() => {
                          const txt = document.getElementById('ev-detail-comment') as HTMLTextAreaElement
                          handleEvStatus(evDetail.id, 'rejected', txt?.value || '')
                        }}
                        title="Rejeter cette demande">
                        {evSaving
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : <><i className="fas fa-times-circle me-2"></i>Rejeter</>
                        }
                      </button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <button className="btn btn-outline-secondary rounded-pill px-4"
                        onClick={() => {
                          const txt = document.getElementById('ev-detail-comment') as HTMLTextAreaElement
                          handleEvStatus(evDetail.id, 'in_progress', txt?.value || '')
                        }}
                        disabled={evSaving}
                        title="Marquer comme en cours d'examen">
                        <i className="fas fa-spinner me-2"></i>Mettre en traitement
                      </button>
                      <button className="btn btn-link text-muted text-decoration-none" onClick={() => setEvDetail(null)}>
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

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
                                      <div onClick={() => setEnlargedImage(selectedUser.cin_front)} style={{ cursor: 'zoom-in' }}>
                                         <img src={selectedUser.cin_front} className="rounded shadow-sm scale-on-hover" style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="Front CIN" />
                                      </div>
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
      {/* MODAL: RESET PASSWORD RESULT */}
      {resetPwdResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ width: '100%', maxWidth: '420px' }}>
            <div className="p-3 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(90deg,#1a3a5c,#0d6efd)', color: '#fff' }}>
              <h6 className="mb-0 fw-bold"><i className="fas fa-key me-2"></i>Mot de passe réinitialisé</h6>
              <button className="btn-close btn-close-white" onClick={() => setResetPwdResult(null)}></button>
            </div>
            <div className="p-4 text-center">
              <div className="mb-3 text-muted small">Nouveau mot de passe temporaire pour</div>
              <div className="fw-bold mb-3" style={{ fontSize: '1rem', color: '#1a1a2e' }}>{resetPwdResult.name}</div>
              <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                <code className="px-4 py-2 rounded-3 fw-bold" style={{ background: '#f0f5ff', color: '#0d6efd', fontSize: '1.15rem', letterSpacing: 2, border: '2px dashed #0d6efd' }}>
                  {resetPwdResult.password}
                </code>
                <button className="btn btn-sm btn-outline-primary rounded-pill" title="Copier"
                  onClick={() => { navigator.clipboard.writeText(resetPwdResult!.password); showToast('Mot de passe copié !') }}>
                  <i className="fas fa-copy"></i>
                </button>
              </div>
              <div className="alert alert-warning rounded-3 d-flex gap-2 align-items-start text-start" style={{ fontSize: '.82rem' }}>
                <i className="fas fa-exclamation-triangle mt-1 flex-shrink-0"></i>
                <span>Communiquez ce mot de passe à l'agent de façon sécurisée. Il devra le changer dès sa prochaine connexion.</span>
              </div>
              <button className="btn btn-primary rounded-pill px-5 mt-2" onClick={() => setResetPwdResult(null)}>
                <i className="fas fa-check me-2"></i>Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE ZOOM VIEWER */}
      {enlargedImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setEnlargedImage(null)}>
          <button style={{ position: 'absolute', top: 20, right: 20, background: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', zIndex: 5001 }}>
            <i className="fas fa-times text-dark"></i>
          </button>
          <img src={enlargedImage} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, boxShadow: '0 0 30px rgba(0,0,0,.5)', objectFit: 'contain' }} alt="Zoomed" />
        </div>
      )}

      {/* MODAL: ADD USER (AGENT/SUPERVISOR) */}
       {showAddUserModal && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
           <div className="bg-white rounded-3 shadow-lg overflow-hidden" style={{ width: '100%', maxWidth: '450px' }}>
             <div className="p-3 bg-dark text-white d-flex justify-content-between align-items-center">
               <h6 className="mb-0 fw-bold"><i className="fas fa-user-plus me-2"></i>Ajouter un Collaborateur</h6>
               <button className="btn-close btn-close-white" onClick={() => setShowAddUserModal(false)}></button>
             </div>
             <form className="p-4" onSubmit={async (e) => {
               e.preventDefault();
               const fd = new FormData(e.currentTarget);
               const data = Object.fromEntries(fd.entries());
               try {
                 const res = await fetch('/api/accounts/admin-create/', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
                   body: JSON.stringify(data)
                 });
                 if (res.ok) { showToast('Utilisateur créé !'); setShowAddUserModal(false); fetchManagedUsers('all') }
                 else { const err = await res.json(); showToast(err.error || 'Erreur', 'error') }
               } catch { showToast('Erreur réseau', 'error') }
             }}>
               <div className="mb-3"><label className="form-label small fw-bold">Nom d'utilisateur</label><input className="form-control" name="username" required placeholder="ex: agent_kcl" /></div>
               <div className="mb-3"><label className="form-label small fw-bold">Email</label><input className="form-control" name="email" type="email" required placeholder="agent@kelibia.tn" /></div>
               <div className="mb-3"><label className="form-label small fw-bold">Mot de passe</label><input className="form-control" name="password" type="password" required placeholder="••••••••" /></div>
               <div className="mb-3">
                 <label className="form-label small fw-bold">Type de compte</label>
                 <select className="form-select" name="user_type" defaultValue="agent">
                   <option value="agent">Agent Municipal</option>
                   <option value="supervisor">Superviseur (Superuser)</option>
                 </select>
               </div>
               <div className="d-grid"><button className="btn btn-dark" type="submit">Créer le compte</button></div>
             </form>
           </div>
         </div>
       )}

       {/* MODAL: ADD SERVICE */}
       {showAddServiceModal && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
           <div className="bg-white rounded-3 shadow-lg overflow-hidden animate__animated animate__zoomIn" style={{ width: '100%', maxWidth: '650px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
             <div className="p-3 text-white d-flex justify-content-between align-items-center" style={{ background: editingService ? 'linear-gradient(90deg,#003366,#004080)' : 'linear-gradient(90deg,#1e3c72,#2a5298)' }}>
               <h6 className="mb-0 fw-bold"><i className={`fas ${editingService ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>{editingService ? `Modifier : ${editingService.name_fr}` : 'Nouveau Service Municipal'}</h6>
               <button className="btn-close btn-close-white" onClick={() => { setShowAddServiceModal(false); setEditingService(null); setServiceReqs([]); setServicePdfAr(null); setServicePdfFr(null); }}></button>
             </div>
             <form className="p-4 overflow-auto" style={{ flex: 1 }} onSubmit={async (e) => {
               e.preventDefault();
               setEditServiceSaving(true)
               const formData = new FormData(e.currentTarget);
               
               try {
                 const url = editingService ? `/api/services/list/${editingService.id}/` : '/api/services/list/';
                 const method = editingService ? 'PATCH' : 'POST';
                 
                 const finalFd = new FormData();
                 finalFd.append('category', formData.get('category') as string);
                 finalFd.append('name_fr', formData.get('name_fr') as string);
                 finalFd.append('name_ar', formData.get('name_ar') as string);
                 finalFd.append('processing_time', formData.get('processing_time') as string);
                 finalFd.append('description_fr', formData.get('description_fr') as string);
                 finalFd.append('description_ar', formData.get('description_ar') as string);
                 
                 if (servicePdfAr) finalFd.append('form_pdf_ar', servicePdfAr);
                 if (servicePdfFr) finalFd.append('form_pdf_fr', servicePdfFr);
                 
                 serviceReqs.forEach((req, idx) => {
                    finalFd.append(`requirements[${idx}]name_fr`, req.name_fr);
                    finalFd.append(`requirements[${idx}]name_ar`, req.name_ar);
                    finalFd.append(`requirements[${idx}]is_mandatory`, String(req.is_mandatory));
                 });

                 const res = await fetch(url, { 
                   method,
                   headers: { Authorization: `Bearer ${access}` },
                   body: finalFd
                 });
                 if (res.ok) { 
                   showToast(editingService ? 'Service mis à jour !' : 'Service ajouté !');
                   setShowAddServiceModal(false); 
                   setEditingService(null);
                   setServiceReqs([]);
                   setServicePdfAr(null);
                   setServicePdfFr(null);
                   fetchCategoriesAndServices();
                 } else { 
                   const err = await res.json().catch(() => ({}));
                   showToast(Object.values(err).flat().join(', ') || 'Erreur lors de l\'enregistrement', 'error');
                 }
               } catch { showToast('Erreur réseau', 'error'); }
               finally { setEditServiceSaving(false); }
             }}>
               <div className="row g-3">
                 <div className="col-md-6">
                   <label className="form-label small fw-bold">Catégorie</label>
                   <select className="form-select" name="category" required defaultValue={editingService?.category_id || ''}>
                      <option value="">-- Choisir une catégorie --</option>
                      {allCategories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
                   </select>
                 </div>
                 <div className="col-md-6">
                   <label className="form-label small fw-bold">Délai de traitement</label>
                   <input className="form-control" name="processing_time" placeholder="ex: 2 jours à 1 semaine" defaultValue={editingService?.processing_time || ''} />
                 </div>
                 
                 <div className="col-md-12">
                    <div className="row g-2">
                       <div className="col-md-6">
                          <label className="form-label small fw-bold">Nom du service (FR)</label>
                          <div className="input-group input-group-sm">
                             <input className="form-control" name="name_fr" id="srv-name-fr" required defaultValue={editingService?.name_fr || ''} />
                             <button type="button" className="btn btn-outline-primary" 
                                onClick={() => {
                                   const fr = (document.getElementById('srv-name-fr') as HTMLInputElement).value;
                                   handleAutoTranslate(fr, (tr) => { (document.getElementById('srv-name-ar') as HTMLInputElement).value = tr; }, 'name');
                                }} disabled={translatingField === 'name'}>
                                {translatingField === 'name' ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-magic me-1"></i> Traduire</>}
                             </button>
                          </div>
                       </div>
                       <div className="col-md-6">
                          <label className="form-label small fw-bold" dir="rtl">اسم الخدمة (عربي)</label>
                          <input className="form-control form-control-sm" name="name_ar" id="srv-name-ar" dir="rtl" required defaultValue={editingService?.name_ar || ''} />
                       </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                     <div className="row g-2">
                        <div className="col-md-6">
                           <label className="form-label small fw-bold">Description (FR)</label>
                           <textarea className="form-control" name="description_fr" id="srv-desc-fr" rows={2} style={{ fontSize: '13px' }} defaultValue={editingService?.description_fr || ''}></textarea>
                           <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none mt-1" 
                              onClick={() => {
                                 const fr = (document.getElementById('srv-desc-fr') as HTMLTextAreaElement).value;
                                 handleAutoTranslate(fr, (tr) => { (document.getElementById('srv-desc-ar') as HTMLTextAreaElement).value = tr; }, 'desc');
                              }} style={{ fontSize: '11px' }} disabled={translatingField === 'desc'}>
                              {translatingField === 'desc' ? 'Traduction...' : '✨ Traduire la description en Arabe'}
                           </button>
                        </div>
                        <div className="col-md-6">
                           <label className="form-label small fw-bold" dir="rtl">وصف الخدمة (عربي)</label>
                           <textarea className="form-control" name="description_ar" id="srv-desc-ar" rows={2} dir="rtl" style={{ fontSize: '13px' }} defaultValue={editingService?.description_ar || ''}></textarea>
                        </div>
                     </div>
                  </div>

                 {/* Requirements Section */}
                 <div className="col-12 mt-3">
                    <div className="d-flex justify-content-between align-items-center bg-light p-2 border rounded">
                       <span className="fw-bold small text-primary"><i className="fas fa-file-alt me-2"></i>Documents Requis (Papers)</span>
                       <button type="button" className="btn btn-sm btn-primary" onClick={() => setServiceReqs([...serviceReqs, { name_fr: '', name_ar: '', is_mandatory: true }])}>
                          <i className="fas fa-plus me-1"></i> Ajouter
                       </button>
                    </div>
                    <div className="mt-2 border rounded p-2 bg-white" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                       {serviceReqs.length === 0 ? <div className="text-center text-muted small py-3">Aucun document configuré</div> : 
                          serviceReqs.map((req, idx) => (
                             <div key={idx} className="p-2 border-bottom d-flex gap-2 align-items-center">
                                <input className="form-control form-control-sm" placeholder="Nom FR" value={req.name_fr} onChange={e => { const n = [...serviceReqs]; n[idx].name_fr = e.target.value; setServiceReqs(n); }} />
                                <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-1" title="Traduire" 
                                    onClick={() => handleAutoTranslate(req.name_fr, (tr) => { const n = [...serviceReqs]; n[idx].name_ar = tr; setServiceReqs(n); }, `req-${idx}`)}>
                                    {translatingField === `req-${idx}` ? '...' : <i className="fas fa-magic" style={{ fontSize: '10px' }}></i>}
                                 </button>
                                <input className="form-control form-control-sm" dir="rtl" placeholder="اسم بالعربي" value={req.name_ar} onChange={e => { const n = [...serviceReqs]; n[idx].name_ar = e.target.value; setServiceReqs(n); }} />
                                <div className="form-check form-switch flex-shrink-0">
                                   <input className="form-check-input" type="checkbox" checked={req.is_mandatory} onChange={e => { const n = [...serviceReqs]; n[idx].is_mandatory = e.target.checked; setServiceReqs(n); }} />
                                </div>
                                <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={() => { const n = serviceReqs.filter((_, i) => i !== idx); setServiceReqs(n); }}><i className="fas fa-times"></i></button>
                             </div>
                          ))
                       }
                    </div>
                 </div>

                 {/* PDF Forms Section */}
                 <div className="col-md-6 mt-3">
                    <label className="form-label small fw-bold"><i className="fas fa-file-pdf me-1"></i>Formulaire PDF (FR)</label>
                    <input type="file" className="form-control form-control-sm" accept=".pdf" onChange={e => setServicePdfFr(e.target.files?.[0] || null)} />
                    {editingService?.form_pdf_fr && <div className="mt-1 small"><a href={editingService.form_pdf_fr} target="_blank" rel="noreferrer" className="text-success text-decoration-none"><i className="fas fa-check-circle me-1"></i>Fichier actuel existant</a></div>}
                 </div>
                 <div className="col-md-6 mt-3">
                    <label className="form-label small fw-bold"><i className="fas fa-file-pdf me-1"></i>Formulaire PDF (AR)</label>
                    <input type="file" className="form-control form-control-sm" accept=".pdf" dir="rtl" onChange={e => setServicePdfAr(e.target.files?.[0] || null)} />
                    {editingService?.form_pdf_ar && <div className="mt-1 small text-end"><a href={editingService.form_pdf_ar} target="_blank" rel="noreferrer" className="text-success text-decoration-none"><i className="fas fa-check-circle me-1"></i>الملف الحالي موجود</a></div>}
                 </div>
               </div>

               <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                 <button className="btn btn-light px-4 fw-bold" type="button" onClick={() => { setShowAddServiceModal(false); setEditingService(null); setServiceReqs([]); }}>Annuler</button>
                 <button className="btn btn-primary px-4 fw-bold shadow" type="submit" disabled={editServiceSaving}>
                   {editServiceSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}
                   {editingService ? 'Mettre à jour' : 'Enregistrer le Service'}
                 </button>
               </div>
             </form>
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
