import { resolveBackendUrl } from '../lib/backendUrl'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import PriorityExplanationModal from '../components/PriorityExplanationModal'
import logo from '../assets/logo.png'
import tunisiaLogo from '../assets/tunisia_log.png'








type UserInfo = {

  id?: number;

  first_name: string; last_name: string; email: string

  user_type?: string; is_staff?: boolean; is_superuser?: boolean; city?: string

  cin?: string; phone?: string; address?: string; governorate?: string; place_of_birth?: string

  has_active_asd?: boolean;

  asd_expiration?: string | null;

}

type Reclamation = {

  id: number; title: string; description: string; created_at: string

  citizen_name?: string; status: string; category: string; priority: string

  service_responsable?: string; latitude?: number | null; longitude?: number | null; image?: string

  confidence?: { category?: number; priority?: number }

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



function getRoleLabel(u: UserInfo | null, t: any) {

  if (!u) return t('loading')

  if (u.user_type === 'agent') return t('agent_municipal')

  if (u.is_superuser || u.is_staff || u.user_type === 'supervisor' || u.user_type === 'Superviseur') return t('supervisor')

  return t('citizen')

}



const CSS = `

@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;700;900&family=Work+Sans:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body,.agent-page{font-family:'Work Sans',sans-serif;background:#f9f9f9;color:#1a1c1c}
h1,h2,h3,h4{font-family:'Public Sans',sans-serif}

.ag-sidebar{position:fixed;left:0;top:0;height:100vh;width:256px;background:#f3f3f3;border-right:1px solid #e8e8e8;display:flex;flex-direction:column;padding:24px 16px;z-index:100;overflow-y:auto}
.ag-sidebar-brand{display:flex;align-items:center;gap:12px;padding:0 8px;margin-bottom:32px}
.ag-sidebar-brand img{width:40px;height:40px;object-fit:contain}
.ag-brand-name{font-family:'Public Sans',sans-serif;font-size:1rem;font-weight:700;color:#ae131a;line-height:1.2}
.ag-brand-sub{font-size:0.6rem;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;font-weight:500}
.ag-sidebar-nav{flex:1;display:flex;flex-direction:column;gap:2px}
.ag-nav-item{display:flex;align-items:center;gap:12px;padding:11px 12px;color:#6b7280;text-decoration:none;border-radius:6px;font-size:0.875rem;font-weight:500;transition:all .15s;border-right:3px solid transparent;position:relative}
.ag-nav-item:hover{color:#ae131a;background:rgba(174,19,26,0.06)}
.ag-nav-item.active{color:#ae131a;font-weight:700;border-right-color:#ae131a;background:rgba(174,19,26,0.06)}
.ag-nav-item i{width:18px;text-align:center;font-size:0.9rem}
.ag-badge{margin-left:auto;background:#ae131a;color:#fff;border-radius:10px;padding:1px 7px;font-size:0.65rem;font-weight:700}
.ag-sec-title{font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;color:#9ca3af;font-weight:700;padding:8px 12px 4px}
.ag-divider{border-top:1px solid #e5e7eb;margin:8px 0}
.ag-sidebar-bottom{margin-top:auto;display:flex;flex-direction:column;gap:4px;padding-top:16px;border-top:1px solid #e5e7eb}
.ag-new-report-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#ae131a,#d2312f);color:#fff;padding:12px;border-radius:6px;font-weight:700;font-size:0.875rem;cursor:pointer;border:none;width:100%;box-shadow:0 4px 12px rgba(174,19,26,.25);transition:opacity .15s;margin-bottom:8px}
.ag-new-report-btn:hover{opacity:0.9}

.ag-topnav{position:fixed;top:0;right:0;left:256px;height:64px;background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;padding:0 32px;z-index:99;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.ag-topnav-search{position:relative;display:flex;align-items:center}
.ag-topnav-search i{position:absolute;left:12px;color:#9ca3af;font-size:0.8rem}
.ag-topnav-search input{padding:8px 16px 8px 36px;background:#f3f3f3;border:none;border-radius:9999px;font-size:0.85rem;width:260px;outline:none;font-family:'Work Sans',sans-serif}
.ag-topnav-right{display:flex;align-items:center;gap:20px}
.ag-lang-toggle{display:flex;gap:12px}
.ag-lang-btn{background:none;border:none;font-size:0.7rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;cursor:pointer;padding:0}
.ag-lang-btn.active{color:#1a1c1c}
.ag-lang-btn:hover{color:#ae131a}
.ag-topnav-icons{display:flex;gap:16px;align-items:center}
.ag-topnav-icon{color:#6b7280;cursor:pointer;font-size:1rem;transition:color .15s}
.ag-topnav-icon:hover{color:#ae131a}
.ag-topnav-user{display:flex;align-items:center;gap:12px;padding-left:20px;border-left:1px solid #e5e7eb}
.ag-topnav-user-name{font-size:0.75rem;font-weight:700;color:#1a1c1c}
.ag-topnav-user-role{font-size:0.62rem;color:#9ca3af}
.ag-avatar{width:36px;height:36px;border-radius:9999px;background:linear-gradient(135deg,#ae131a,#d2312f);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;border:2px solid #e5e7eb;flex-shrink:0}

.ag-main{margin-left:256px;padding-top:64px;min-height:100vh}
.ag-main-inner{padding:32px}

.ag-stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:20px;margin-bottom:32px}
.ag-stat{background:#fff;padding:20px;border-radius:8px;box-shadow:0 8px 24px -4px rgba(26,28,28,.06);transition:transform .2s}
.ag-stat:hover{transform:translateY(-4px)}
.ag-stat .stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.ag-stat .icon-box{padding:8px;border-radius:6px;display:flex}
.ag-stat .icon-box i{font-size:1.1rem}
.ag-stat .chip{font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em}
.ag-stat .val{font-size:1.875rem;font-weight:900;color:#1a1c1c;line-height:1}
.ag-stat .lbl{font-size:0.72rem;color:#9ca3af;margin-top:4px}

.ag-dashboard-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-bottom:32px}
.ag-map-card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.06);position:relative;min-height:450px;display:flex;flex-direction:column}
.ag-map-header{padding:14px 20px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.ag-map-header h4{font-size:0.82rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a1c1c}
.ag-map-legend{position:absolute;top:66px;left:12px;z-index:400;background:rgba(255,255,255,0.97);padding:12px 14px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);border:1px solid #f0f0f0}
.ag-map-legend h5{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a1c1c;margin-bottom:8px}
.ag-legend-item{display:flex;align-items:center;gap:8px;font-size:0.73rem;color:#6b7280;margin-bottom:5px}
.ag-legend-dot{width:10px;height:10px;border-radius:9999px;flex-shrink:0;border:2px solid rgba(255,255,255,.7);box-shadow:0 0 0 1px rgba(0,0,0,.1)}
.ag-map-export-btns{display:flex;gap:6px}
.ag-export-btn{padding:5px 11px;border-radius:6px;font-size:0.72rem;font-weight:700;cursor:pointer;border:1px solid #e5e7eb;background:#f9f9f9;color:#6b7280;transition:all .15s}
.ag-export-btn:hover{background:#ae131a;color:#fff;border-color:#ae131a}
#ag-map{flex:1;min-height:400px;width:100%}

.ag-right-col{display:flex;flex-direction:column;gap:20px}
.ag-panel{background:#fff;padding:22px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.06);border:1px solid #f0f0f0}
.ag-panel h4{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1a1c1c;margin-bottom:20px}
.ag-donut-wrap{display:flex;align-items:center;justify-content:center;position:relative;padding:8px 0}
.ag-donut-center{position:absolute;display:flex;flex-direction:column;align-items:center}
.ag-donut-center .pct{font-size:1.5rem;font-weight:900;color:#1a1c1c}
.ag-donut-center .lbl{font-size:0.6rem;color:#9ca3af;text-transform:uppercase}
.ag-cat-list{display:flex;flex-direction:column;gap:14px}
.ag-cat-item{display:flex;align-items:center;justify-content:space-between}
.ag-cat-item-left{display:flex;align-items:center;gap:10px}
.ag-cat-item-left i{color:#9ca3af;font-size:0.95rem;width:18px;text-align:center}
.ag-cat-item-left span{font-size:0.875rem;color:#6b7280}
.ag-cat-count{font-size:0.875rem;font-weight:700;color:#1a1c1c}

.ag-table-card{background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.06);border:1px solid #f0f0f0;overflow:hidden;margin-bottom:32px}
.ag-table-hdr{padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
.ag-table-hdr h3{font-size:1rem;font-weight:900;color:#1a1c1c}
.ag-table-hdr h3 span{color:#ae131a;font-weight:400}
.ag-table-hdr-btns{display:flex;gap:8px}
.ag-table-hdr-btn{padding:6px 12px;font-size:0.68rem;font-weight:700;border:1px solid #e5e7eb;border-radius:4px;color:#6b7280;background:#fff;cursor:pointer;text-transform:uppercase;letter-spacing:0.05em}
.ag-table-hdr-btn:hover{background:#f9f9f9}

.ag-filter-bar{padding:12px 24px;border-bottom:1px solid #f0f0f0;display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fafafa}
.ag-search-wrap{position:relative;display:flex;align-items:center}
.ag-search-wrap i{position:absolute;left:10px;color:#9ca3af;font-size:0.8rem}
.ag-search-input{padding:7px 12px 7px 30px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;font-size:0.82rem;outline:none;min-width:180px;font-family:'Work Sans',sans-serif}
.ag-search-input:focus{border-color:#ae131a}
.ag-filter-select{padding:7px 10px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;font-size:0.82rem;outline:none;color:#374151;font-family:'Work Sans',sans-serif}
.ag-filter-select:focus{border-color:#ae131a}
.ag-filter-btn{padding:7px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:0.82rem;cursor:pointer;background:#fff;color:#6b7280;font-family:'Work Sans',sans-serif}
.ag-filter-btn.active{background:#ae131a;color:#fff;border-color:#ae131a}

.ag-table{width:100%;border-collapse:collapse;font-size:0.85rem}
.ag-table thead{background:#fafafa}
.ag-table thead th{padding:12px 20px;text-align:left;font-size:0.62rem;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;font-weight:700;white-space:nowrap}
.ag-table tbody tr{border-bottom:1px solid #f9f9f9;transition:background .1s}
.ag-table tbody tr:hover{background:rgba(249,249,249,.8)}
.ag-table tbody td{padding:12px 20px;vertical-align:middle}
.ag-status-select{border:none;border-radius:6px;padding:5px 8px;font-size:0.75rem;font-weight:700;cursor:pointer;outline:none;font-family:'Work Sans',sans-serif}
.ag-action-btn{width:30px;height:30px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.8rem;color:#6b7280;transition:all .15s}
.ag-action-btn:hover{background:#ae131a;color:#fff;border-color:#ae131a}
.ag-pag-bar{padding:14px 24px;background:#fafafa;display:flex;justify-content:space-between;align-items:center;font-size:0.78rem;color:#9ca3af}
.ag-page-btn{width:32px;height:32px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;cursor:pointer;font-size:0.8rem;color:#6b7280;display:flex;align-items:center;justify-content:center}
.ag-page-btn:hover,.ag-page-btn.active{background:#ae131a;color:#fff;border-color:#ae131a}
.ag-page-btn:disabled{opacity:0.4;cursor:not-allowed}
.ag-empty{text-align:center;padding:48px;color:#9ca3af;font-size:0.9rem}
.ag-empty i{font-size:2rem;display:block;margin-bottom:12px}

.cat-badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:0.68rem;font-weight:700;background:#f3f3f3;color:#374151}
.cat-trash{background:#fef3c7;color:#92400e}
.cat-lighting{background:#fffbeb;color:#b45309}
.cat-roads{background:#f0fdf4;color:#166534}
.cat-noise{background:#eff6ff;color:#1e40af}
.cat-other{background:#f9f9f9;color:#6b7280}
.priority-badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:0.72rem;font-weight:700}
.priority-urgente{background:#fee2e2;color:#991b1b}
.priority-normale{background:#dbeafe;color:#1e40af}
.priority-faible{background:#f3e8ff;color:#6b21a8}
.status-badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:0.72rem;font-weight:700}
.conf-badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:0.7rem;font-weight:600}
.conf-high{background:#dcfce7;color:#166534}
.conf-med{background:#fef9c3;color:#854d0e}
.conf-low{background:#fee2e2;color:#991b1b}
.service-badge{display:inline-block;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:0.78rem;color:#6b7280}

.ag-dup-card{background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.06);margin-bottom:24px;overflow:hidden}
.ag-card-hdr-blue{padding:14px 20px;background:linear-gradient(90deg,#1a237e,#283593);color:#fff;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:0.85rem}
.ag-card-hdr-green{padding:14px 20px;background:linear-gradient(90deg,#1b5e20,#2e7d32);color:#fff;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:0.85rem}

.ag-card{background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.06);margin-bottom:24px;overflow:hidden}
.ag-card-body{padding:20px}

.ag-footer{margin-left:256px;padding:16px 32px;text-align:center;font-size:0.75rem;color:#9ca3af;border-top:1px solid #f0f0f0;background:#fff}

.ag-toast-container{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.ag-toast{display:flex;align-items:center;gap:10px;background:#1a1c1c;color:#fff;padding:12px 18px;border-radius:8px;font-size:0.83rem;box-shadow:0 4px 16px rgba(0,0,0,.2);animation:slideIn .3s ease}
.ag-toast.success{background:#166534}
.ag-toast.error{background:#991b1b}
.ticon{font-size:1rem}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}

.ag-modal-hdr{padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
.ag-modal-hdr .title{font-weight:700;font-size:1rem}
.ag-close-btn{background:none;border:1px solid #e5e7eb;border-radius:6px;width:32px;height:32px;cursor:pointer;color:#6b7280;font-size:0.9rem}
.ag-close-btn:hover{background:#ae131a;color:#fff;border-color:#ae131a}
.det-label{font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;margin-bottom:4px}
.det-value{font-size:0.9rem;color:#1a1c1c}

.skeleton-box{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
.table-skeleton{height:200px;width:100%}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.mini-progress{height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden}
.mini-progress .bar{height:100%;border-radius:2px}
.leaflet-container{font-family:'Work Sans',sans-serif!important}

.ag-mobile-nav{display:none}
.ag-mob-btn{display:none}
.ag-mob-badge{display:none}
@media(max-width:768px){
  .ag-sidebar{display:none}
  .ag-topnav{left:0}
  .ag-main{margin-left:0}
  .ag-footer{margin-left:0}
  .ag-stats-grid{grid-template-columns:repeat(2,1fr)}
  .ag-dashboard-grid{grid-template-columns:1fr}
  .ag-mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:200;background:#fff;border-top:1px solid #e5e7eb;padding:8px 0;justify-content:space-around}
  .ag-mob-btn{display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;color:#9ca3af;font-size:0.6rem;cursor:pointer;padding:4px 8px;position:relative}
  .ag-mob-btn i{font-size:1.2rem}
  .ag-mob-btn.active{color:#ae131a}
  .ag-mob-badge{display:block;position:absolute;top:0;right:4px;background:#ae131a;color:#fff;border-radius:8px;padding:1px 5px;font-size:0.55rem;font-weight:700}
}

`



export default function AgentDashboardPage() {

  const { t, lang, setLang } = useI18n()

  const navigate = useNavigate()



  const CAT: Record<string, { label: string; cls: string }> = {

    lighting: { label: `💡 ${t('lighting')}`, cls: 'cat-lighting' },

    trash: { label: `🗑️ ${t('trash')}`, cls: 'cat-trash' },

    roads: { label: `🛣️ ${t('roads')}`, cls: 'cat-roads' },

    noise: { label: `🔊 ${t('noise')}`, cls: 'cat-noise' },

    other: { label: `📌 ${t('other')}`, cls: 'cat-other' },

  }

  const STATUS: Record<string, { label: string; cls: string }> = {

    pending: { label: t('status_pending'), cls: 'status-pending' },

    in_progress: { label: t('status_in_progress'), cls: 'status-in_progress' },

    resolved: { label: t('status_resolved'), cls: 'status-resolved' },

    rejected: { label: t('status_rejected'), cls: 'status-rejected' },

  }

  const PRIORITY: Record<string, { label: string; cls: string }> = {

    urgente: { label: `🔴 ${t('urgent')}`, cls: 'priority-urgente' },

    normale: { label: `🔵 ${t('normal')}`, cls: 'priority-normale' },

    faible: { label: `🟣 ${t('low')}`, cls: 'priority-faible' },

  }

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

  const [showExplainModal, setShowExplainModal] = useState(false)

  const [reClsCat, setReClsCat] = useState('')

  const [reClsPrio, setReClsPrio] = useState('')

  const [reClsSaving, setReClsSaving] = useState(false)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'services' | 'forum' | 'evenements' | 'construction' | 'stats' | 'demandes' | 'profile' | 'citizens' | 'actualites' | 'config'>('dashboard')

  const [agentCitizens, setAgentCitizens] = useState<any[]>([])

  const [loadingCitizens, setLoadingCitizens] = useState(false)

  const [citizenSearch, setCitizenSearch] = useState('')

  const [selectedCitizen, setSelectedCitizen] = useState<any | null>(null)

  const [enlargedCitizenImage, setEnlargedCitizenImage] = useState<string | null>(null)

  const [allEvenements, setAllEvenements] = useState<any[]>([])

  const [loadingEvenements, setLoadingEvenements] = useState(false)

  const [allConstructions, setAllConstructions] = useState<any[]>([])

  const [loadingConstructions, setLoadingConstructions] = useState(false)

  const [constructionStats, setConstructionStats] = useState<any | null>(null)

  const [constructionDetail, setConstructionDetail] = useState<any | null>(null)

  const [constructionSearch, setConstructionSearch] = useState('')

  const [constructionFilter, setConstructionFilter] = useState<string>('all')

  const [evStatusFilter, setEvStatusFilter] = useState('')

  const [evTypeFilter, setEvTypeFilter] = useState('')

  const [evSearch, setEvSearch] = useState('')

  const [evDetail, setEvDetail] = useState<any | null>(null)

  const [evSaving, setEvSaving] = useState(false)

  const [usersMode, setUsersMode] = useState<'unverified' | 'agents' | 'all'>('unverified')

  const [resetPwdResult, setResetPwdResult] = useState<{ name: string; password: string } | null>(null)

  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)



  // ── News Management ──

  const [allAgents, setAllAgents] = useState<any[]>([])

  const [loadingAgents, setLoadingAgents] = useState(false)

  const [articleImage, setArticleImage] = useState<File | null>(null)



  async function fetchAgents() {

    setLoadingAgents(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/verify-citizens/?type=agent'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) {

        const data = await res.json()

        setAllAgents(Array.isArray(data) ? data : (data.results || []))

      }

    } catch (e) { console.error(e) }

    finally { setLoadingAgents(false) }

  }



  async function handleAssignAgent(recId: number, agentId: number) {

    try {

      const res = await fetch(`/api/reclamations/${recId}/assign_agent/`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

        body: JSON.stringify({ agent_id: agentId })

      })

      if (res.ok) {

        showToast('Agent affecté avec succès')

        fetchReclamations()

        setDetailRec(null)

      } else {

        const err = await res.json()

        showToast(err.detail || 'Erreur lors de l\'affectation', 'error')

      }

    } catch (e) { showToast('Erreur réseau', 'error') }

  }

  const [allArticles, setAllArticles] = useState<any[]>([])

  const [loadingArticles, setLoadingArticles] = useState(false)

  const [showAddArticleModal, setShowAddArticleModal] = useState(false)

  const [editingArticle, setEditingArticle] = useState<any | null>(null)

  const [articleForm, setArticleForm] = useState({ title: '', content: '', is_published: true })



  // ── Config / Settings ──

  const [globalSettings, setGlobalSettings] = useState({ site_name: 'Kelibia Smart City', maintenance_mode: false, contact_email: 'webmaster@commune-kelibia.tn' })

  const [configSaving, setConfigSaving] = useState(false)



  const [managedUsers, setManagedUsers] = useState<any[]>([])

  const [loadingUsers, setLoadingUsers] = useState(false)

  const [selectedUser, setSelectedUser] = useState<any>(null)

  const [servicesSummary, setServicesSummary] = useState<any>(null)

  const [allCategories, setAllCategories] = useState<any[]>([])

  const [allServices, setAllServices] = useState<any[]>([])

  const [loadingServicesTab, setLoadingServicesTab] = useState(false)

  const [userSearch, setUserSearch] = useState('')

  const [showAddUserModal, setShowAddUserModal] = useState(false)

  const [showAddServiceModal, setShowAddServiceModal] = useState(false)

  const [editingService, setEditingService] = useState<any | null>(null)

  const [editServiceSaving, setEditServiceSaving] = useState(false)



  // Service editing extras

  const [serviceReqs, setServiceReqs] = useState<any[]>([])

  const [servicePdfAr, setServicePdfAr] = useState<File | null>(null)

  const [servicePdfFr, setServicePdfFr] = useState<File | null>(null)

  const [magicServiceText, setMagicServiceText] = useState('')



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

  const [forumTopicSelected, setForumTopicSelected] = useState<any | null>(null)

  const [forumReplyText, setForumReplyText] = useState('')

  const [postingForumReply, setPostingForumReply] = useState(false)



  const [mlStats, setMlStats] = useState<any | null>(null)

  const [mlLoading, setMlLoading] = useState(false)

  const [mlError, setMlError] = useState<string | null>(null)



  // ── Profile Tab State ──

  const [editingProfile, setEditingProfile] = useState(false)

  const [profileSaving, setProfileSaving] = useState(false)

  const [profileSaveError, setProfileSaveError] = useState<string | null>(null)

  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false)

  const [profileForm, setProfileForm] = useState({

    first_name: '', last_name: '', phone: '', address: '', city: '', governorate: '', place_of_birth: ''

  })



  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)



  const mapRef = useRef<HTMLDivElement>(null)

  const leafletMap = useRef<any>(null)

  const markersLayer = useRef<any>(null)

  async function fetchArticles() {

    setLoadingArticles(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/news/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) setAllArticles(await res.json())

    } catch (e) { console.error(e) }

    finally { setLoadingArticles(false) }

  }



  async function handleSaveArticle() {

    const method = editingArticle ? 'PUT' : 'POST'

    const url = editingArticle ? `/api/news/${editingArticle.id}/` : '/api/news/'



    // Use FormData for Multipart/Image upload

    const fd = new FormData()

    fd.append('title', articleForm.title)

    fd.append('content', articleForm.content)

    fd.append('is_published', String(articleForm.is_published))

    if (articleImage) fd.append('image', articleImage)



    try {

      const res = await fetch(url, {

        method,

        headers: { Authorization: `Bearer ${access}` }, // Don't set Content-Type, fetch handles boundary

        body: fd

      })

      if (res.ok) {

        showToast(editingArticle ? 'Article mis à jour' : 'Article créé')

        setShowAddArticleModal(false)

        setArticleImage(null)

        fetchArticles()

      }

    } catch (e) { showToast('Erreur lors de la sauvegarde', 'error') }

  }



  async function deleteArticle(id: number) {

    if (!window.confirm('Supprimer cet article ?')) return

    try {

      const res = await fetch(`/api/news/${id}/`, {

        method: 'DELETE',

        headers: { Authorization: `Bearer ${access}` }

      })

      if (res.ok) {

        showToast('Article supprimé')

        fetchArticles()

      }

    } catch (e) { showToast('Erreur lors de la suppression', 'error') }

  }



  async function fetchConfig() {

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/config/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) setGlobalSettings(await res.json())

    } catch (e) { console.error(e) }

  }



  async function handleSaveConfig() {

    setConfigSaving(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/config/'), {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

        body: JSON.stringify(globalSettings)

      })

      if (res.ok) showToast('Configuration enregistrée avec succès !')

      else showToast('Erreur lors de l\'enregistrement', 'error')

    } catch { showToast('Erreur réseau', 'error') }

    finally { setConfigSaving(false) }

  }



  useEffect(() => {

    if (!access) { navigate('/login'); return }

    fetchUserInfo()

    fetchAgents()

    fetchConfig()

  }, [])



  async function fetchUserInfo() {

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })

      if (!res.ok) throw new Error()

      const u: UserInfo = await res.json()

      if (u.user_type !== 'agent' && u.user_type !== 'supervisor' && !u.is_staff && !u.is_superuser) { navigate('/dashboard'); return }

      setUser(u)

      setProfileForm({

        first_name: u.first_name || '',

        last_name: u.last_name || '',

        phone: (u as any).phone || '',

        address: (u as any).address || '',

        city: u.city || '',

        governorate: (u as any).governorate || '',

        place_of_birth: (u as any).place_of_birth || '',

      })

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

      const res = await fetch(resolveBackendUrl('/api/supervisor/services-summary/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) setServicesSummary(await res.json())

    } catch (e) { console.error(e) }

  }



  async function fetchCategoriesAndServices() {

    setLoadingServicesTab(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/services/categories/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) {

        const cats = await res.json()

        setAllCategories(cats)

        // Flatten services for easy listing

        const svcs: any[] = []

        cats.forEach((c: any) => {

          (c.services || []).forEach((s: any) => svcs.push({ ...s, category_name: c.name_fr, category_id: c.id }))

        })

        setAllServices(svcs)

      }

    } catch (e) { console.error(e) }

    finally { setLoadingServicesTab(false) }

  }



  async function fetchMlStats() {

    setMlLoading(true); setMlError(null)

    try {

      const res = await fetch(resolveBackendUrl('/api/reclamations/ml_stats/'), { headers: { Authorization: `Bearer ${access}` } })

      if (!res.ok) { setMlError(`Erreur ${res.status} — Stats IA indisponibles.`); return }

      setMlStats(await res.json())

    } catch { setMlError('Erreur réseau — Stats IA indisponibles.') }

    finally { setMlLoading(false) }

  }



  async function handleProfileSave() {

    setProfileSaving(true); setProfileSaveError(null); setProfileSaveSuccess(false)

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/me/'), {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

        body: JSON.stringify(profileForm),

      })

      if (res.ok) {

        const updated = await res.json()

        setUser(updated)

        setEditingProfile(false)

        setProfileSaveSuccess(true)

        setTimeout(() => setProfileSaveSuccess(false), 3000)

        showToast('Profil mis à jour !')

      } else {

        const err = await res.json()

        setProfileSaveError(err.error || 'Erreur lors de la sauvegarde.')

      }

    } catch { setProfileSaveError('Erreur réseau.') }

    finally { setProfileSaving(false) }

  }



  async function deleteService(serviceId: number) {

    if (!window.confirm(t('delete_user_confirm'))) return

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

      const res = await fetch(resolveBackendUrl('/api/supervisor/manage-orders/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) setAllDemandes(await res.json())

    } catch (e) { console.error(e) }

    finally { setLoadingDemandes(false) }

  }



  async function saveDemandStatus(order: any, newStatus: string) {

    setDemandeSaving(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/supervisor/manage-orders/'), {

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

      const res = await fetch(resolveBackendUrl('/api/evenements/demande/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) {

        const data = await res.json()

        setAllEvenements(Array.isArray(data) ? data : (data.results || []))

      }

    } catch (e) { console.error(e) }

    finally { setLoadingEvenements(false) }

  }



  async function fetchConstructions() {

    setLoadingConstructions(true)

    try {

      const [listRes, statsRes] = await Promise.all([

        fetch(resolveBackendUrl('/api/construction/demandes/'), { headers: { Authorization: `Bearer ${access}` } }),

        fetch(resolveBackendUrl('/api/construction/demandes/stats/'), { headers: { Authorization: `Bearer ${access}` } }),

      ])

      if (listRes.ok) {

        const data = await listRes.json()

        setAllConstructions(Array.isArray(data) ? data : (data.results || []))

      }

      if (statsRes.ok) setConstructionStats(await statsRes.json())

    } catch (e) { console.error(e) }

    finally { setLoadingConstructions(false) }

  }



  async function updateConstructionStatus(id: number, status: string, commentaire?: string, priorite?: string) {

    const fd = new FormData()

    fd.append('status', status)

    if (commentaire) fd.append('commentaire_agent', commentaire)

    if (priorite) fd.append('priorite', priorite)

    try {

      const res = await fetch(`/api/construction/demandes/${id}/update-status/`, {

        method: 'PATCH', headers: { Authorization: `Bearer ${access}` }, body: fd,

      })

      if (res.ok) {

        const updated = await res.json()

        setAllConstructions(prev => prev.map(c => c.id === id ? updated : c))

        if (constructionDetail?.id === id) setConstructionDetail(updated)

        showToast('Statut mis à jour ✓')

      }

    } catch (e) { console.error(e) }

  }



  async function fetchTopics() {

    setLoadingTopics(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/forum/topics/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) setAllTopics(await res.json())



      const sRes = await fetch(resolveBackendUrl('/api/forum/topics/stats/'), { headers: { Authorization: `Bearer ${access}` } })

      if (sRes.ok) setForumStats(await sRes.json())

    } catch (e) { console.error(e) }

    finally { setLoadingTopics(false) }

  }



  async function handleTopicAction(id: number, action: 'pin' | 'resolve' | 'delete') {

    try {

      const isDelete = action === 'delete'

      if (isDelete && !window.confirm(t('delete_user_confirm'))) return



      const res = await fetch(`/api/forum/topics/${id}/${isDelete ? '' : action + '/'}`, {

        method: isDelete ? 'DELETE' : 'POST',

        headers: { Authorization: `Bearer ${access}` }

      })

      if (res.ok) {

        showToast(isDelete ? t('topic_deleted_success') : t('action_success'))

        if (isDelete) {

          setAllTopics(prev => prev.filter(t => t.id !== id))

          if (forumTopicSelected?.id === id) setForumTopicSelected(null)

        } else fetchTopics()

      }

    } catch { showToast(t('error_msg'), 'error') }

  }



  async function fetchTopicDetail(id: number) {

    try {

      const res = await fetch(`/api/forum/topics/${id}/`, { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) setForumTopicSelected(await res.json())

    } catch { showToast(t('reclamations_error'), 'error') }

  }



  async function postForumReply() {

    if (!forumTopicSelected || !forumReplyText.trim()) return

    setPostingForumReply(true)

    try {

      const res = await fetch(`/api/forum/topics/${forumTopicSelected.id}/reply/`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

        body: JSON.stringify({ content: forumReplyText })

      })

      if (res.ok) {

        const nr = await res.json()

        setForumTopicSelected((p: any) => ({ ...p, replies: [...(p.replies || []), nr] }))

        setForumReplyText('')

        showToast(t('reply_sent_success'))

        setAllTopics(prev => prev.map(t => t.id === forumTopicSelected.id ? { ...t, replies_count: (t.replies_count || 0) + 1 } : t))

      }

    } catch { showToast(t('error_msg'), 'error') }

    finally { setPostingForumReply(false) }

  }



  async function toggleForumTopicVote(id: number) {

    try {

      const res = await fetch(`/api/forum/topics/${id}/vote/`, {

        method: 'POST',

        headers: { Authorization: `Bearer ${access}` }

      })

      if (res.ok) {

        const data = await res.json()

        if (forumTopicSelected?.id === id) {

          setForumTopicSelected((p: any) => ({ ...p, votes_count: data.votes_count, has_voted: data.voted }))

        }

      }

    } catch { }

  }



  async function toggleForumReplyVote(id: number) {

    try {

      const res = await fetch(`/api/forum/replies/${id}/vote/`, {

        method: 'POST',

        headers: { Authorization: `Bearer ${access}` }

      })

      if (res.ok) {

        const data = await res.json()

        if (forumTopicSelected) {

          const updatedReplies = forumTopicSelected.replies.map((r: any) =>

            r.id === id ? { ...r, votes_count: data.votes_count, has_voted: data.voted } : r

          )

          setForumTopicSelected({ ...forumTopicSelected, replies: updatedReplies })

        }

      }

    } catch { }

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

        showToast(t('status_updated_success'), 'success')

      } else {

        showToast(t('status_update_error'), 'error')

      }

    } catch { showToast(t('error_msg'), 'error') }

    finally { setEvSaving(false) }

  }



  async function fetchManagedUsers(mode: 'unverified' | 'agents' | 'all') {

    setLoadingUsers(true)

    try {

      const res = await fetch(`/api/accounts/verify-citizens/?mode=${mode}`, { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) {

        const data = await res.json()

        // Sort by date_joined ascending (Oldest first) for chronological processing

        data.sort((a: any, b: any) => new Date(a.date_joined).getTime() - new Date(b.date_joined).getTime())

        setManagedUsers(data)

      }

    } catch (e) { console.error(e) }

    finally { setLoadingUsers(false) }

  }



  async function handleToggleUserStatus(userId: number, action: 'verify' | 'toggle_active' | 'delete' | 'promote_to_agent' | 'promote_to_supervisor' | 'demote_to_citizen' | 'reset_password') {

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/verify-citizens/'), {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

        body: JSON.stringify({ user_id: userId, action })

      })

      if (res.ok) {

        const data = await res.json()

        showToast(data.message || 'Action réussie !')

        if (action === 'verify') {

          if (usersMode === 'unverified') setManagedUsers(prev => prev.filter(u => u.id !== userId))

          else setManagedUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: true, cin_front: null, cin_back: null } : u))

          if (selectedUser?.id === userId) setSelectedUser((p: any) => p ? { ...p, is_verified: true, cin_front: null, cin_back: null } : null)

        } else {

          setManagedUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: data.is_active } : u))

          if (selectedUser?.id === userId) setSelectedUser((p: any) => p ? { ...p, is_active: data.is_active } : null)

        }

      }

    } catch (e) { showToast('Erreur lors de l\'action.', 'error') }

  }



  async function handleActivateAsd(userId: number) {

    if (!window.confirm(t('activate_asd_btn') + " ?")) return

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/verify-citizens/'), {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

        body: JSON.stringify({ user_id: userId, action: 'activate_asd' })

      })

      if (res.ok) {

        const data = await res.json()

        showToast(data.message || 'ASD Activé !')

        setManagedUsers(prev => prev.map(u => u.id === userId ? { ...u, has_active_asd: true, asd_expiration: data.asd_expiration } : u))

      } else {

        showToast('Erreur lors de l’activation ASD.', 'error')

      }

    } catch { showToast('Erreur réseau.', 'error') }

  }





  async function fetchAgentCitizens() {

    setLoadingCitizens(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/agent-citizens/'), { headers: { Authorization: `Bearer ${access}` } })

      if (res.ok) setAgentCitizens(await res.json())

    } catch (e) { console.error(e) }

    finally { setLoadingCitizens(false) }

  }



  async function handleAgentCitizenAction(citizenId: number, action: 'verify' | 'toggle_active') {

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/agent-citizens/'), {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

        body: JSON.stringify({ user_id: citizenId, action }),

      })

      if (res.ok) {

        const data = await res.json()

        showToast(data.message || 'Action réussie !')

        if (action === 'verify') {

          setAgentCitizens(prev => prev.filter(c => c.id !== citizenId))

          if (selectedCitizen?.id === citizenId) setSelectedCitizen(null)

        } else {

          setAgentCitizens(prev => prev.map(c => c.id === citizenId ? { ...c, is_active: data.is_active } : c))

          if (selectedCitizen?.id === citizenId) setSelectedCitizen((p: any) => p ? { ...p, is_active: data.is_active } : null)

        }

      } else {

        const err = await res.json()

        showToast(err.error || 'Erreur.', 'error')

      }

    } catch { showToast('Erreur réseau.', 'error') }

  }



  async function fetchReclamations() {

    setLoading(true); setRecError(false)

    try {

      const res = await fetch(resolveBackendUrl('/api/reclamations/'), { headers: { Authorization: `Bearer ${access}` } })

      if (!res.ok) throw new Error()

      const data = await res.json()

      setAllRecs(Array.isArray(data) ? data : (data.results || []))

    } catch { setRecError(true) }

    finally { setLoading(false) }

  }

  useEffect(() => { applyFilters() }, [allRecs, search, filterStatus, filterCategory, filterPriority, urgentOnly])



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



    const statusWeights: Record<string, number> = { resolved: 3, rejected: 2, pending: 1, in_progress: 1 }

    const priorityWeights: Record<string, number> = { urgente: 1, normale: 2, faible: 3 }

    filtered.sort((a, b) => {

      const sa = statusWeights[a.status] || 1

      const sb = statusWeights[b.status] || 1

      if (sa !== sb) return sa - sb



      // Sort by Priority (Urgent first)

      const wa = priorityWeights[a.priority] || 2

      const wb = priorityWeights[b.priority] || 2

      if (wa !== wb) return wa - wb



      // Sort by Date (Oldest first within same priority)

      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

    })



    setFilteredRecs(filtered)

    setCurrentPage(1)

  }



  const total = allRecs.length

  const pending = allRecs.filter(r => r.status === 'pending').length

  const inprog = allRecs.filter(r => r.status === 'in_progress').length

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



    // If the DOM container already has a map (e.g. from a previous crash/unmount failure)

    if (mapRef.current && (mapRef.current as any)._leaflet_id) {

      // We must not call L.map() again on this container if it's already initialized.

      return

    }



    const m = L.map(mapRef.current).setView([36.8467, 11.1047], 13)

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(m)

    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 19 })

    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '© OpenTopoMap', maxZoom: 17 })

    markersLayer.current = L.layerGroup().addTo(m)

    // ── Couches SIG GeoJSON (Agent uniquement) ────────────────────────────
    const sigOverlays: Record<string, any> = {}

    const loadGeoJSON = (url: string, style: any, onEachFeature?: (f: any, layer: any) => void) => {
      const layer = L.geoJSON(null, { style, onEachFeature })
      fetch(url)
        .then(r => r.json())
        .then(data => layer.addData(data))
        .catch(() => {/* fichier absent — silencieux */})
      return layer
    }

    // Routes — couleur selon état
    const routesStyle = (feature: any) => {
      const etat = feature?.properties?.etat
      const color = etat === 'bonne' ? '#2e7d32' : etat === 'dégradée' ? '#e65100' : etat === 'travaux' ? '#f9a825' : '#757575'
      const weight = feature?.properties?.type === 'principale' ? 4 : 2
      return { color, weight, opacity: 0.85 }
    }
    const routesPopup = (feature: any, layer: any) => {
      if (feature.properties) {
        layer.bindPopup(
          `<b>🛣️ ${feature.properties.nom}</b><br/>
           État : <b style="color:${routesStyle(feature).color}">${feature.properties.etat}</b><br/>
           Type : ${feature.properties.type}`
        )
      }
    }
    sigOverlays['🛣️ Routes'] = loadGeoJSON('/layers/routes.geojson', routesStyle, routesPopup)

    // Drainage — bleu
    const drainageStyle = (feature: any) => {
      const etat = feature?.properties?.etat
      const color = etat === 'obstrué' ? '#b71c1c' : etat === 'risque' ? '#ff6f00' : '#0277bd'
      const isZone = feature?.geometry?.type === 'Polygon'
      return isZone
        ? { color: '#ff6f00', weight: 1, fillColor: '#fff3e0', fillOpacity: 0.4 }
        : { color, weight: 2, opacity: 0.8, dashArray: '5,4' }
    }
    const drainagePopup = (feature: any, layer: any) => {
      if (feature.properties) {
        layer.bindPopup(
          `<b>🚰 ${feature.properties.nom}</b><br/>
           Type : ${feature.properties.type}<br/>
           État : <b>${feature.properties.etat}</b>
           ${feature.properties.diametre_mm ? `<br/>Ø ${feature.properties.diametre_mm} mm` : ''}`
        )
      }
    }
    sigOverlays['🚰 Drainage / Réseau eau'] = loadGeoJSON('/layers/drainage.geojson', drainageStyle, drainagePopup)

    // Zones vertes — vert
    const zonesVertesStyle = () => ({ color: '#2e7d32', weight: 1.5, fillColor: '#a5d6a7', fillOpacity: 0.45 })
    const zonesVertesPopup = (feature: any, layer: any) => {
      if (feature.properties) {
        layer.bindPopup(
          `<b>🌳 ${feature.properties.nom}</b><br/>
           Type : ${feature.properties.type}<br/>
           Surface : ${feature.properties.superficie_m2?.toLocaleString()} m²<br/>
           Équipements : ${feature.properties.equipements}`
        )
      }
    }
    sigOverlays['🌳 Zones vertes'] = loadGeoJSON('/layers/zones_vertes.geojson', zonesVertesStyle, zonesVertesPopup)

    // Zones industrielles — orange/gris
    const industrielStyle = () => ({ color: '#5d4037', weight: 1.5, fillColor: '#ffccbc', fillOpacity: 0.5 })
    const industrielPopup = (feature: any, layer: any) => {
      if (feature.properties) {
        layer.bindPopup(
          `<b>🏭 ${feature.properties.nom}</b><br/>
           Activité : ${feature.properties.activite}<br/>
           Entreprises : ${feature.properties.nb_entreprises}<br/>
           Impact : <span style="color:#b71c1c">${feature.properties.impact}</span>`
        )
      }
    }
    sigOverlays['🏭 Zones industrielles'] = loadGeoJSON('/layers/industriel.geojson', industrielStyle, industrielPopup)

    L.control.layers(
      { '🗺️ OpenStreetMap': osm, '🛰️ Satellite (Esri)': sat, '🏔️ Topographique': topo },
      { '📍 Signalements': markersLayer.current, ...sigOverlays },
      { position: 'topright', collapsed: true }
    ).addTo(m)

    // ── Légende ───────────────────────────────────────────────────────────
    const legend = L.control({ position: 'bottomleft' })
    legend.onAdd = function () {
      const div = L.DomUtil.create('div')
      div.style.cssText = 'background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.15);font-size:12px;min-width:180px;'
      div.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;color:#1a3a5c;border-bottom:1px solid #eee;padding-bottom:4px;">📋 Légende</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Signalements</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:12px;height:12px;border-radius:50%;background:#e65100;display:inline-block;"></span> En attente</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:12px;height:12px;border-radius:50%;background:#1565c0;display:inline-block;"></span> En cours</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:12px;height:12px;border-radius:50%;background:#1b5e20;display:inline-block;"></span> Résolu</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="width:12px;height:12px;border-radius:50%;background:#757575;display:inline-block;"></span> Rejeté</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Routes</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:20px;height:3px;background:#2e7d32;display:inline-block;"></span> Bonne</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:20px;height:3px;background:#e65100;display:inline-block;"></span> Dégradée</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="width:20px;height:3px;background:#f9a825;display:inline-block;"></span> Travaux</div>
        <div style="font-weight:600;font-size:11px;color:#555;margin-bottom:4px;">Couches SIG</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:18px;height:8px;background:#a5d6a7;border:1px solid #2e7d32;display:inline-block;border-radius:2px;"></span> Zones vertes</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:18px;height:8px;background:#ffccbc;border:1px solid #5d4037;display:inline-block;border-radius:2px;"></span> Industriel</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="width:20px;height:3px;background:#0277bd;border-top:2px dashed #0277bd;display:inline-block;"></span> Drainage</div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:18px;height:8px;background:#fff3e0;border:1px solid #ff6f00;display:inline-block;border-radius:2px;"></span> Zone inondable</div>`
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

        markersLayer.current = null

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

    if (!window.confirm(t('delete_user_confirm'))) return

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

      if (reClsCat) body.category = reClsCat

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

  const handleExportGeoJSON = async () => {
    try {
      const res = await fetch(resolveBackendUrl('/api/reclamations/geojson/?has_coords=true'), {
        headers: { Authorization: `Bearer ${access}` }
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reclamations_kelibia_${new Date().toISOString().slice(0, 10)}.geojson`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export GeoJSON failed', e)
    }
  }

  const handleExportCSV = () => {
    const rows = [
      ['id', 'titre', 'categorie', 'statut', 'priorite', 'citoyen', 'latitude', 'longitude', 'date'],
      ...allRecs.map(r => [
        r.id, r.title, r.category, r.status, r.priority,
        r.citizen_name || '', r.latitude ?? '', r.longitude ?? '',
        r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''
      ])
    ]
    const csv = rows.map(row => row.map(String).map(v => `"${v.toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reclamations_kelibia_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (

    <div className="agent-page">

      <style>{CSS}</style>

      {/* ── SIDEBAR ── */}
      <aside className="ag-sidebar">

        {/* Brand */}
        <div className="ag-sidebar-brand">
          <img src={logo} alt="Logo" />
          <div>
            <div className="ag-brand-name">Kelibia Smart City</div>
            <div className="ag-brand-sub">Municipal Agent Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="ag-sidebar-nav">

          <a className={`ag-nav-item${activeTab === 'dashboard' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('dashboard') }}>
            <i className="fas fa-chart-pie"></i>
            <span>Dashboard</span>
            {pending > 0 && <span className="ag-badge">{pending}</span>}
          </a>

          <a className={`ag-nav-item${activeTab === 'evenements' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('evenements'); fetchEvenements() }}>
            <i className="fas fa-calendar-alt"></i>
            <span>{t('nav_events_mgmt')}</span>
            {allEvenements.filter((ev: any) => ev.status === 'pending').length > 0 && <span className="ag-badge">{allEvenements.filter((ev: any) => ev.status === 'pending').length}</span>}
          </a>

          <a className={`ag-nav-item${activeTab === 'construction' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('construction'); fetchConstructions() }}>
            <i className="fas fa-hard-hat"></i>
            <span>Permis de construire</span>
            {allConstructions.filter((c: any) => c.status === 'pending').length > 0 && <span className="ag-badge">{allConstructions.filter((c: any) => c.status === 'pending').length}</span>}
          </a>

          <a className={`ag-nav-item${activeTab === 'stats' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('stats'); if (!mlStats && !mlLoading) fetchMlStats() }}>
            <i className="fas fa-robot"></i>
            <span>{t('nav_stats_ia')}</span>
          </a>

          <a className={`ag-nav-item${activeTab === 'profile' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('profile'); fetchDemandes(); fetchTopics(); }}>
            <i className="fas fa-user-circle"></i>
            <span>{t('nav_profile')}</span>
          </a>

          {(user?.user_type === 'supervisor' || user?.is_superuser || user?.is_staff) && (<>
            <div className="ag-divider"></div>
            <div className="ag-sec-title">{t('nav_admin_staff')}</div>

            <a className={`ag-nav-item${activeTab === 'users' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('users'); fetchManagedUsers(usersMode) }}>
              <i className="fas fa-users-cog"></i>
              <span>{t('nav_managed_users')}</span>
              {managedUsers.filter(u => !u.is_verified).length > 0 && <span className="ag-badge">{managedUsers.filter(u => !u.is_verified).length}</span>}
            </a>

            <a className={`ag-nav-item${activeTab === 'demandes' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('demandes'); fetchDemandes() }}>
              <i className="fas fa-folder-open"></i>
              <span>{t('nav_demandes_citoyens')}</span>
              {allDemandes.filter(d => d.status === 'pending').length > 0 && <span className="ag-badge">{allDemandes.filter(d => d.status === 'pending').length}</span>}
            </a>

            <a className={`ag-nav-item${activeTab === 'forum' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('forum'); fetchTopics(); fetchMlStats(); }}>
              <i className="fas fa-comments"></i>
              <span>{t('nav_forum_moderation')}</span>
            </a>

            <a className={`ag-nav-item${activeTab === 'actualites' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('actualites'); fetchArticles(); }}>
              <i className="fas fa-newspaper"></i>
              <span>{lang === 'ar' ? 'إدارة الأخبار' : 'Gérer Actualités'}</span>
            </a>

            {(user?.user_type === 'supervisor' || user?.is_superuser) && (
              <a className={`ag-nav-item${activeTab === 'config' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('config'); }}>
                <i className="fas fa-cogs"></i>
                <span>Configuration</span>
              </a>
            )}
          </>)}

        </nav>

        {/* Bottom actions */}
        <div className="ag-sidebar-bottom">
          <button className="ag-new-report-btn" onClick={() => navigate('/reclamation-form')}>
            <i className="fas fa-plus"></i>
            <span>{lang === 'ar' ? 'تقرير جديد' : 'Nouveau Rapport'}</span>
          </button>
          <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); clearTokens(); navigate('/login') }}>
            <i className="fas fa-sign-out-alt"></i>
            <span>{t('logout')}</span>
          </a>
        </div>

      </aside>

      {/* ── TOP NAV ── */}
      <header className="ag-topnav">

        <div className="ag-topnav-search">
          <i className="fas fa-search"></i>
          <input type="text" placeholder={t('search_signalement')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="ag-topnav-right">
          <div className="ag-lang-toggle">
            <button className={`ag-lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`ag-lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>AR</button>
          </div>
          <div className="ag-topnav-icons">
            <i className="fas fa-bell ag-topnav-icon"></i>
          </div>
          <div className="ag-topnav-user">
            <div>
              <div className="ag-topnav-user-name">{fullName}</div>
              <div className="ag-topnav-user-role">{getRoleLabel(user, t)}</div>
            </div>
            <div className="ag-avatar">{inits}</div>
          </div>
        </div>

      </header>

      {/* ── MAIN ── */}
      <div className="ag-main">
        <div className="ag-main-inner">
          <>

            {activeTab === 'dashboard' ? (

              <>

                {/* ── Dashboard Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                  <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#1a1c1c', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      Tableau de Bord <span style={{ color: '#ae131a' }}>/</span> <span style={{ fontWeight: 300 }}>لوحة القيادة</span>
                    </h1>
                    <p style={{ color: '#9ca3af', marginTop: 4, fontSize: '0.9rem' }}>{lang === 'ar' ? 'الإدارة الحضرية الذكية لقليبية' : 'Gestion urbaine intelligente de Kélibia'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6b7280' }}>
                      {new Date().toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="ag-stats-grid">
                  {([
                    { val: total,    chip: 'Total',    lbl: 'Rapports totaux',        icon: 'fa-list-alt',   iconBg: '#f3f3f3', iconColor: '#6b7280', chipColor: '#6b7280' },
                    { val: pending,  chip: 'Attente',  lbl: "En attente d'examen",    icon: 'fa-clock',      iconBg: '#fff7ed', iconColor: '#ea580c', chipColor: '#ea580c' },
                    { val: inprog,   chip: 'Cours',    lbl: 'Interventions actives',  icon: 'fa-tools',      iconBg: '#eff6ff', iconColor: '#2563eb', chipColor: '#2563eb' },
                    { val: resolved, chip: 'Résolu',   lbl: 'Problèmes réglés',       icon: 'fa-check-circle', iconBg: '#f0fdf4', iconColor: '#16a34a', chipColor: '#16a34a', accent: true },
                    { val: dupCount, chip: 'Doublons', lbl: 'Signalements répétés',   icon: 'fa-copy',       iconBg: '#fef2f2', iconColor: '#dc2626', chipColor: '#dc2626', onClick: () => setShowDupPanel((p: boolean) => !p) },
                  ] as Array<{ val: number; chip: string; lbl: string; icon: string; iconBg: string; iconColor: string; chipColor: string; accent?: boolean; onClick?: () => void }>).map((s, i) => (
                    <div key={i} className="ag-stat" style={{ cursor: s.onClick ? 'pointer' : 'default', borderBottom: s.accent ? '2px solid #ae131a' : undefined }} onClick={s.onClick}>
                      <div className="stat-top">
                        <div className="icon-box" style={{ background: s.iconBg }}><i className={`fas ${s.icon}`} style={{ color: s.iconColor }}></i></div>
                        <span className="chip" style={{ color: s.chipColor }}>{s.chip}</span>
                      </div>
                      <div className="val">{loading ? '—' : s.val}</div>
                      <div className="lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* ── Duplicates Panel ── */}
                {showDupPanel && (
                  <div className="ag-dup-card">
                    <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#4a148c,#6a1b9a)' }}>
                      <span><i className="fas fa-copy me-2"></i>{t('potential_duplicates')}</span>
                      <button onClick={() => setShowDupPanel(false)} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 6, fontSize: '.78rem', padding: '4px 10px', cursor: 'pointer' }}>
                        <i className="fas fa-times me-1"></i> Fermer
                      </button>
                    </div>
                    <div style={{ padding: 16 }}>
                      {dupGroups.length === 0
                        ? <div style={{ textAlign: 'center', padding: 30, color: '#888' }}><i className="fas fa-check-circle" style={{ color: '#16a34a', fontSize: '2rem', display: 'block', marginBottom: 10 }}></i>{t('no_duplicates')}.</div>
                        : dupGroups.map((grp: Reclamation[], gi: number) => (
                          <div key={gi} style={{ background: '#f9f0ff', border: '1px solid #e1bee7', borderRadius: 8, padding: '12px 16px', marginBottom: 10 }}>
                            <div style={{ fontSize: '.78rem', color: '#6a1b9a', fontWeight: 700, marginBottom: 8 }}><i className="fas fa-copy me-1"></i>{grp.length} {t('similar_reports')}</div>
                            {grp.map((r: Reclamation) => (
                              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ede7f6', fontSize: '.8rem' }}>
                                <span><strong>#{r.id}</strong> — {r.title}</span>
                                <span style={{ color: '#888' }}>{STATUS[r.status]?.label || r.status}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* ── Map + Right Column ── */}
                <div className="ag-dashboard-grid">

                  {/* Map */}
                  <div className="ag-map-card">
                    <div className="ag-map-header">
                      <h4><i className="fas fa-map-marked-alt" style={{ marginRight: 8, color: '#ae131a' }}></i>{t('map_title_realtime')}</h4>
                      <div className="ag-map-export-btns">
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginRight: 8 }}>{allRecs.length} {t('signalements_short')}</span>
                        <button className="ag-export-btn" onClick={handleExportGeoJSON} title="Exporter pour QGIS">
                          <i className="fas fa-download" style={{ marginRight: 4 }}></i>GeoJSON
                        </button>
                        <button className="ag-export-btn" onClick={handleExportCSV} title="Exporter en CSV">
                          <i className="fas fa-table" style={{ marginRight: 4 }}></i>CSV
                        </button>
                      </div>
                    </div>
                    <div className="ag-map-legend">
                      <h5>Répartition des incidents</h5>
                      <div className="ag-legend-item"><span className="ag-legend-dot" style={{ background: '#f97316' }}></span><span>En attente ({pending})</span></div>
                      <div className="ag-legend-item"><span className="ag-legend-dot" style={{ background: '#3b82f6' }}></span><span>En cours ({inprog})</span></div>
                      <div className="ag-legend-item"><span className="ag-legend-dot" style={{ background: '#22c55e' }}></span><span>Résolu ({resolved})</span></div>
                      <div className="ag-legend-item"><span className="ag-legend-dot" style={{ background: '#ef4444' }}></span><span>Rejeté ({rejected})</span></div>
                    </div>
                    <div id="ag-map" ref={mapRef}></div>
                  </div>

                  {/* Right column */}
                  <div className="ag-right-col">

                    {/* Donut — Taux de résolution */}
                    <div className="ag-panel">
                      <h4>Taux de Résolution</h4>
                      {(() => {
                        const rate = total > 0 ? resolved / total : 0;
                        const circ = 351.86;
                        const offset = circ * (1 - rate);
                        const pct = Math.round(rate * 100);
                        return (
                          <>
                            <div className="ag-donut-wrap">
                              <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f3f3f3" strokeWidth="12" />
                                <circle cx="64" cy="64" r="56" fill="transparent" stroke="#ae131a" strokeWidth="12"
                                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                              </svg>
                              <div className="ag-donut-center">
                                <span className="pct">{pct}%</span>
                                <span className="lbl">Mensuel</span>
                              </div>
                            </div>
                            <div style={{ marginTop: 20 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6 }}>
                                <span>Moyenne mensuelle</span>
                                <span style={{ fontWeight: 700, color: '#1a1c1c' }}>{pct}%</span>
                              </div>
                              <div style={{ height: 4, background: '#f3f3f3', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#ae131a', width: `${pct}%`, borderRadius: 2 }}></div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Categories */}
                    <div className="ag-panel">
                      <h4>Catégories</h4>
                      <div className="ag-cat-list">
                        {([
                          { key: 'trash',    icon: 'fa-trash',      label: lang === 'ar' ? 'النظافة' : 'Déchets / Propreté' },
                          { key: 'lighting', icon: 'fa-lightbulb',  label: lang === 'ar' ? 'الإنارة' : 'Éclairage public' },
                          { key: 'roads',    icon: 'fa-road',       label: lang === 'ar' ? 'الطرق' : 'Voirie / Routes' },
                          { key: 'noise',    icon: 'fa-volume-up',  label: lang === 'ar' ? 'الضوضاء' : 'Nuisances sonores' },
                          { key: 'other',    icon: 'fa-ellipsis-h', label: lang === 'ar' ? 'أخرى' : 'Autres' },
                        ] as Array<{ key: string; icon: string; label: string }>).map(cat => (
                          <div key={cat.key} className="ag-cat-item">
                            <div className="ag-cat-item-left">
                              <i className={`fas ${cat.icon}`}></i>
                              <span>{cat.label}</span>
                            </div>
                            <span className="ag-cat-count">{catCounts[cat.key] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* ── Reclamations Table ── */}
                <div className="ag-table-card">
                  <div className="ag-table-hdr">
                    <h3>Rapports Récents <span>/ بلاغات حديثة</span></h3>
                    <div className="ag-table-hdr-btns">
                      <button className="ag-table-hdr-btn" onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterPriority(''); setSearch(''); setUrgentOnly(false); }}>Filtrer</button>
                      <button className="ag-table-hdr-btn" onClick={handleExportGeoJSON}>GeoJSON</button>
                      <button className="ag-table-hdr-btn" onClick={handleExportCSV}>CSV</button>
                      <button className="ag-table-hdr-btn" onClick={fetchReclamations}><i className="fas fa-sync-alt"></i></button>
                    </div>
                  </div>

                  <div className="ag-filter-bar">
                    <div className="ag-search-wrap"><i className="fas fa-search"></i><input className="ag-search-input" placeholder={t('search_signalement')} value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="ag-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="">{t('all_statuses')}</option><option value="pending">{t('status_pending')}</option>
                      <option value="in_progress">{t('status_in_progress')}</option><option value="resolved">{t('status_resolved')}</option>
                      <option value="rejected">{t('status_rejected')}</option>
                    </select>
                    <select className="ag-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                      <option value="">{t('all_categories')}</option><option value="lighting">{t('lighting')}</option>
                      <option value="trash">{t('trash')}</option><option value="roads">{t('roads')}</option>
                      <option value="noise">{t('noise')}</option><option value="other">{t('other')}</option>
                    </select>
                    <select className="ag-filter-select" value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setUrgentOnly(false) }}>
                      <option value="">{t('all_priorities')}</option><option value="urgente">🔴 {t('urgent')}</option>
                      <option value="normale">🔵 {t('normal')}</option><option value="faible">🟣 {t('low')}</option>
                    </select>
                    <button className={`ag-filter-btn${urgentOnly ? ' active' : ''}`} onClick={() => { setUrgentOnly((u: boolean) => !u); setFilterPriority(urgentOnly ? '' : 'urgente') }}>
                      <i className="fas fa-fire" style={{ marginRight: 4 }}></i>{t('urgent_only')}
                    </button>
                    <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#9ca3af' }}>{filteredRecs.length} {t('results_count')}</span>
                  </div>

                  {loading && <div style={{ padding: 24 }}><div className="skeleton-box table-skeleton"></div></div>}
                  {!loading && recError && (
                    <div className="ag-empty">
                      <i className="fas fa-exclamation-triangle" style={{ color: '#dc2626' }}></i>
                      <p>{t('reclamations_error')}</p>
                      <button onClick={fetchReclamations} style={{ background: '#ae131a', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: '.83rem', marginTop: 8 }}>{t('retry')}</button>
                    </div>
                  )}
                  {!loading && !recError && filteredRecs.length === 0 && <div className="ag-empty"><i className="fas fa-inbox"></i><p>{t('no_reclamations_found')}</p></div>}

                  {!loading && !recError && filteredRecs.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ag-table">
                        <thead>
                          <tr>
                            <th>ID</th><th>Titre</th><th>{t('citizen_label')}</th>
                            <th>Catégorie</th><th>Priorité</th><th>{t('ai_confidence')}</th>
                            <th>{t('service_label')}</th><th>Statut</th><th>Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRecs.map((r: Reclamation) => {
                            const cat = CAT[r.category] || CAT.other;
                            const prio = PRIORITY[r.priority] || PRIORITY.normale;
                            const svc = r.service_responsable || '—';
                            const statusBg: Record<string, string> = { pending: '#fff7ed', in_progress: '#eff6ff', resolved: '#f0fdf4', rejected: '#fef2f2' };
                            const statusClr: Record<string, string> = { pending: '#c2410c', in_progress: '#1d4ed8', resolved: '#15803d', rejected: '#dc2626' };
                            return (
                              <tr key={r.id}>
                                <td style={{ color: '#9ca3af', fontSize: '.74rem', fontFamily: 'monospace' }}>#{r.id}</td>
                                <td>
                                  <div style={{ fontWeight: 700, color: '#1a1c1c', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                                  <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: 2 }}>
                                    {r.agent_name ? <span style={{ color: '#ae131a' }}><i className="fas fa-id-badge" style={{ marginRight: 4 }}></i>Assigné: {r.agent_name}</span> : <span>—</span>}
                                  </div>
                                </td>
                                <td style={{ fontSize: '.8rem', color: '#6b7280' }}>{r.citizen_name || '—'}</td>
                                <td><span className={`cat-badge cat-${r.category}`}>{cat.label}</span></td>
                                <td><span className={`priority-badge priority-${r.priority}`}>{prio.label}</span></td>
                                <td>{(() => {
                                  const cc = r.confidence?.category;
                                  if (cc === undefined) return <span className="conf-badge conf-med">🤖 —</span>;
                                  if (cc >= 0.80) return <span className="conf-badge conf-high">🤖 {Math.round(cc * 100)}%</span>;
                                  if (cc >= 0.60) return <span className="conf-badge conf-med">⚠️ {Math.round(cc * 100)}%</span>;
                                  return <span className="conf-badge conf-low">❌ {Math.round(cc * 100)}%</span>;
                                })()}</td>
                                <td><span className="service-badge" title={svc}>{svc}</span></td>
                                <td>
                                  <QSSelect rec={r} onUpdate={quickUpdateStatus} />
                                </td>
                                <td style={{ whiteSpace: 'nowrap', color: '#9ca3af', fontSize: '.78rem' }}>{formatDate(r.created_at)}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                    <button className="ag-action-btn" onClick={() => { setDetailRec(r); setDetailStatus(r.status) }} title="Voir détail"><i className="fas fa-eye"></i></button>
                                    {(user?.is_superuser || user?.is_staff || user?.user_type === 'supervisor') && (
                                      <button className="ag-action-btn" style={{ color: '#dc2626' }} onClick={() => deleteReclamation(r.id)} title="Supprimer"><i className="fas fa-trash"></i></button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {totalPages > 1 && (
                        <div className="ag-pag-bar">
                          <span>Affichage de {pageRecs.length} sur {filteredRecs.length} rapports</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="ag-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p: number) => p - 1)}><i className="fas fa-chevron-left"></i></button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const p = Math.max(1, currentPage - 2) + i; return p > totalPages ? null : <button key={p} className={`ag-page-btn${p === currentPage ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>; })}
                            <button className="ag-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p: number) => p + 1)}><i className="fas fa-chevron-right"></i></button>
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

                  <span className="fw-bold"><i className="fas fa-users-cog me-2"></i>{t('user_management')}</span>

                  <div className="btn-group btn-group-sm bg-white bg-opacity-10 p-1 rounded">

                    <button onClick={() => { setUsersMode('unverified'); fetchManagedUsers('unverified') }} className={`btn btn-sm ${usersMode === 'unverified' ? 'btn-light' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}>{t('pending_verification')}</button>

                    {(user?.user_type === 'supervisor' || user?.is_superuser) && (
                      <button onClick={() => { setUsersMode('agents'); fetchManagedUsers('agents') }} className={`btn btn-sm ${usersMode === 'agents' ? 'btn-warning' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}><i className="fas fa-user-tie me-1"></i>{t('role_agent')}</button>
                    )}

                    <button onClick={() => { setUsersMode('all'); fetchManagedUsers('all') }} className={`btn btn-sm ${usersMode === 'all' ? 'btn-light' : 'btn-outline-light border-0'}`} style={{ fontSize: '11px', fontWeight: 600 }}>{t('all_label')}</button>

                  </div>

                  {(user?.user_type === 'supervisor' || user?.is_superuser) && (
                    <button className="btn btn-sm btn-light ms-2" onClick={() => setShowAddUserModal(true)} style={{ fontSize: '11px', fontWeight: 600 }}><i className="fas fa-user-plus me-1"></i>{t('add_agent')}</button>
                  )}
                </div>



                <div className="ag-filter-bar bg-white border-bottom px-3 py-2 d-flex align-items-center gap-3">

                  <div className="ag-search-wrap flex-grow-1" style={{ maxWidth: '400px' }}>

                    <i className="fas fa-search"></i>

                    <input

                      className="ag-search-input"

                      placeholder="Rechercher par Nom, Email ou CIN..."

                      value={userSearch}

                      onChange={e => setUserSearch(e.target.value)}

                    />

                  </div>

                  <div className="text-muted small">

                    {managedUsers.filter(u => {

                      const q = userSearch.toLowerCase()

                      return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cin?.toLowerCase().includes(q)

                    }).length} {t('results_count')}

                  </div>

                </div>



                <div className="ag-card-body p-0" style={{ minHeight: '400px' }}>

                  {loadingUsers ? (

                    <div className="p-4"><div className="skeleton-box table-skeleton" style={{ height: '350px' }}></div></div>

                  ) : managedUsers.length === 0 ? (

                    <div className="text-center p-5 text-muted"><i className="fas fa-users fa-3x mb-3 opacity-25"></i><p>{t('no_users_found')}</p></div>

                  ) : (

                    <div style={{ overflowX: 'auto' }}>

                      <table className="ag-table shadow-sm">

                        <thead>

                          <tr>

                            <th>{t('user_label')}</th>

                            <th>{t('role')}</th>

                            <th>{t('status_label')}</th>

                            <th>{t('actions_label')}</th>

                          </tr>

                        </thead>

                        <tbody>

                          {managedUsers.filter(u => {
                            const q = userSearch.toLowerCase()
                            const matches = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.cin?.toLowerCase().includes(q)
                            const isSupervisor = user?.user_type === 'supervisor' || user?.is_superuser
                            if (!isSupervisor && u.user_type !== 'citizen') return false
                            return matches
                          }).map(u => (

                            <tr key={u.id} className="ag-row-clickable" onClick={() => setSelectedUser(u)}

                              style={{

                                borderLeft: u.is_verified ? 'none' : '4px solid #ff9800',

                                background: u.has_active_asd ? '#f0f7ff' : 'inherit'

                              }}>

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

                                  {u.user_type === 'citizen' ? t('role_citizen') : u.user_type === 'agent' ? t('role_agent') : t('role_supervisor')}

                                </span>

                              </td>

                              <td>

                                <div className="d-flex flex-column gap-1">

                                  {u.is_verified ? <span className="badge bg-success" style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '10px' }}><i className="fas fa-check-circle me-1"></i>{t('verified_label')}</span>

                                    : <span className="badge bg-warning" style={{ background: '#fff3e0', color: '#e65100', fontSize: '10px' }}><i className="fas fa-clock me-1"></i>{t('pending_verification')}</span>}

                                  {u.is_active ? <span className="badge bg-info" style={{ background: '#e1f5fe', color: '#0288d1', fontSize: '10px' }}><i className="fas fa-user-check me-1"></i>{t('active_label')}</span>

                                    : <span className="badge bg-danger" style={{ background: '#ffebee', color: '#c62828', fontSize: '10px' }}><i className="fas fa-user-slash me-1"></i>{t('blocked_label')}</span>}

                                  {u.has_active_asd ? (

                                    <span className="badge bg-primary" style={{ background: '#e3f2fd', color: '#0d47a1', fontSize: '10px' }}>

                                      <i className="fas fa-id-card me-1"></i> ASD: {formatDate(u.asd_expiration)}

                                    </span>

                                  ) : (

                                    <span className="badge bg-secondary" style={{ background: '#f5f5f5', color: '#888', fontSize: '10px' }}>

                                      <i className="fas fa-id-card me-1"></i> ASD: Off

                                    </span>

                                  )}

                                </div>

                              </td>

                              <td>

                                <div className="d-flex gap-2">

                                  {!u.is_verified && (

                                    <button className="btn btn-sm btn-success" title={t('approve')} onClick={(e) => { e.stopPropagation(); handleToggleUserStatus(u.id, 'verify') }}><i className="fas fa-check"></i></button>

                                  )}

                                  {u.user_type === 'citizen' && !u.has_active_asd && (

                                    <button className="btn btn-sm btn-primary" title={t('activate_asd_btn')} onClick={(e) => { e.stopPropagation(); handleActivateAsd(u.id) }}>

                                      <i className="fas fa-id-card"></i>

                                    </button>

                                  )}

                                  <button className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-danger'}`} title={u.is_active ? t('block_user') : t('unblock_user')} onClick={() => handleToggleUserStatus(u.id, 'toggle_active')}>

                                    <i className={`fas ${u.is_active ? 'fa-user-slash' : 'fa-user-check'}`}></i>

                                  </button>

                                  {u.user_type === 'citizen' && (

                                    <button className="btn btn-sm btn-outline-info" title={t('promote_agent')} onClick={(e) => { e.stopPropagation(); if (window.confirm(`Êtes-vous sûr de vouloir promouvoir "${u.full_name}" en Agent ? Il recevra des privilèges de modération.`)) handleToggleUserStatus(u.id, 'promote_to_agent') }}><i className="fas fa-briefcase"></i></button>

                                  )}

                                  {user?.is_superuser && u.user_type !== 'supervisor' && (

                                    <button className="btn btn-sm btn-outline-warning" title={t('promote_supervisor')} onClick={(e) => { e.stopPropagation(); if (window.confirm(`Êtes-vous sûr de vouloir promouvoir "${u.full_name}" en Superviseur ? Il aura des accès administratifs complets.`)) handleToggleUserStatus(u.id, 'promote_to_supervisor') }}><i className="fas fa-crown"></i></button>

                                  )}

                                  {user?.is_superuser && (u.user_type === 'agent' || u.user_type === 'supervisor') && (

                                    <button className="btn btn-sm btn-outline-secondary" title={t('demote_citizen')}

                                      onClick={(e) => { e.stopPropagation(); if (window.confirm(`Rétrograder "${u.full_name}" en Citoyen ? Il perdra ses droits d'agent.`)) handleToggleUserStatus(u.id, 'demote_to_citizen') }}>

                                      <i className="fas fa-user-minus"></i>

                                    </button>

                                  )}

                                  {user?.is_superuser && (u.user_type === 'agent' || u.user_type === 'supervisor') && (

                                    <button className="btn btn-sm btn-outline-info" title={t('reset_pwd')}

                                      onClick={async (e) => {

                                        e.stopPropagation()

                                        if (!window.confirm(`Générer un nouveau mot de passe pour "${u.full_name}" ?`)) return

                                        try {

                                          const res = await fetch(resolveBackendUrl('/api/accounts/verify-citizens/'), {

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

                                  <button className="btn btn-sm btn-outline-danger" title={t('delete_label')} onClick={(e) => { e.stopPropagation(); if (window.confirm('Supprimer cet utilisateur ?')) handleToggleUserStatus(u.id, 'delete') }}><i className="fas fa-trash"></i></button>

                                  {(u.cin_front || u.cin_back) && (

                                    <button type="button" className="btn btn-sm btn-outline-primary" title={t('view_cin')} onClick={() => setSelectedUser(u)}><i className="fas fa-id-card"></i></button>

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

                  <span className="fw-bold"><i className="fas fa-file-invoice me-2"></i>{t('service_management')}</span>

                  <div className="d-flex gap-2">

                    <button className="btn btn-sm btn-light" style={{ fontSize: '11px', fontWeight: 600 }} onClick={() => setShowAddServiceModal(true)}><i className="fas fa-plus me-1"></i>{t('add_service')}</button>

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

                                  <button className="btn btn-sm btn-outline-danger" title={t('delete_label')} onClick={() => deleteService(s.id)}><i className="fas fa-trash"></i></button>

                                </div>

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  )}



                  {/* Summary Section below table */}

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
                        <div className="col-md-4">
                           <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #0288d1' }}>
                              <div className="text-muted small fw-bold">💧 EAU / LUMIÈRE / ÉGOUTS</div>
                              <div className="h4 mt-2 mb-0 text-primary">{servicesSummary?.eau || 0} en attente</div>
                           </div>
                        </div>

                        <div className="col-md-4">
                           <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #388e3c' }}>
                              <div className="text-muted small fw-bold">💰 ARGENT & IMPÔTS</div>
                              <div className="h4 mt-2 mb-0 text-primary">{servicesSummary?.impots || 0} en attente</div>
                           </div>
                        </div>

                        <div className="col-md-4">
                           <div className="p-3 border rounded bg-white shadow-sm" style={{ borderLeft: '4px solid #7b1fa2' }}>
                              <div className="text-muted small fw-bold">🏪 BOUTIQUES & COMMERCES</div>
                              <div className="h4 mt-2 mb-0 text-primary">{servicesSummary?.commerce || 0} en attente</div>
                           </div>
                        </div>

                     </div >

                  </div >

               </div >

            </div >

          ) : activeTab === 'demandes' ? (

    <div className="ag-demandes-wrap">

      <div className="ag-card animate__animated animate__fadeIn">

        <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#004968,#006d94)', height: '50px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <span className="fw-bold"><i className="fas fa-folder-open me-2"></i>{t('admin_demandes_title')}</span>

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

                  { lbl: t('all_label'), val: allDemandes.length, color: '#006d94', bg: '#e1f3fb' },

                  { lbl: t('status_pending'), val: statusCounts.pending, color: '#e65100', bg: '#fff3e0' },

                  { lbl: t('status_in_progress'), val: statusCounts.in_progress, color: '#1565c0', bg: '#e3f2fd' },

                  { lbl: t('status_resolved'), val: statusCounts.approved, color: '#2e7d32', bg: '#e8f5e9' },

                  { lbl: t('status_rejected'), val: statusCounts.rejected, color: '#b71c1c', bg: '#ffebee' },

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
                  const typeLabels: Record<string, string> = { residence: `🏠 ${t('residence_cert')}`, livret: `📘 ${t('nav_managed_users')}`, naissance: `👶 ${t('birth_cert')}`, mariage: `💍 ${t('mariage_cert')}`, deces: `⚰️ ${t('deces_cert')}`, eau: `💧 Eau, Lumière & Égouts`, impots: `💰 Argent & Impôts`, commerce: `🏪 Boutiques & Commerces`, transfert: `🚑 ${lang === 'ar' ? 'نقل جثة' : 'Transfert Corps'}`, legalisation: `✒️ ${lang === 'ar' ? 'تعريف بالإمضاء' : 'Légalisation'}`, goudronnage: `🛤️ ${lang === 'ar' ? 'تعبيد طريق' : 'Goudronnage'}`, bien: `🏢 ${lang === 'ar' ? 'تسجيل عقار' : 'Bien Immo'}`, mutation: `🔄 ${lang === 'ar' ? 'تحيين ملكية' : 'Mutation'}`, vocation: `🏗️ ${lang === 'ar' ? 'تغيير صبغة' : 'Vocation'}` }

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

            <input className="ag-search-input" placeholder={t('placeholder_search_user')} value={demandeSearchQ} onChange={e => setDemandeSearchQ(e.target.value)} style={{ width: 220 }} />

          </div>

          <select className="ag-filter-select" value={demandeTypeFilter} onChange={e => setDemandeTypeFilter(e.target.value)}>

            <option value="">{t('demande_all_types')}</option>

            <option value="residence">🏠 {t('residence_cert')}</option>

            <option value="livret">📘 {t('nav_managed_users')}</option>

            <option value="naissance">👶 {t('birth_cert')}</option>

            <option value="mariage">💍 {t('mariage_cert')}</option>

            <option value="deces">⚰️ {t('deces_cert')}</option>
                  <option value="eau">💧 Eau, Lumière &amp; Égouts</option>
                  <option value="impots">💰 Argent &amp; Impôts</option>
                  <option value="commerce">🏪 Boutiques &amp; Commerces</option>
                  <option value="transfert">🚑 {lang === 'ar' ? 'رخصة نقل جثة' : 'Transfert de Corps'}</option>
                  <option value="legalisation">✒️ {lang === 'ar' ? 'تعريف بالإمضاء' : 'Légalisation Signature'}</option>
                  <option value="goudronnage">🛤️ {lang === 'ar' ? 'تعبيد طريق' : 'Goudronnage Street'}</option>
                  <option value="bien">🏢 {lang === 'ar' ? 'تسجيل عقار' : 'Bien Immobilier'}</option>
                  <option value="mutation">🔄 {lang === 'ar' ? 'تحيين ملكية' : 'Mutation Propriété'}</option>
                  <option value="vocation">🏗️ {lang === 'ar' ? 'تغيير صبغة' : 'Vocation Change'}</option>

                </select >

    <select className="ag-filter-select" value={demandeStatusFilter} onChange={e => setDemandeStatusFilter(e.target.value)}>

      <option value="">{t('demande_all_statuses')}</option>

      <option value="pending">⏳ {t('status_pending')}</option>

      <option value="in_progress">🔄 {t('status_in_progress')}</option>

      <option value="approved">✅ {t('status_resolved')}</option>

      <option value="rejected">❌ {t('status_rejected')}</option>

    </select>

  {
    (demandeSearchQ || demandeTypeFilter || demandeStatusFilter) && (

      <button className="ag-filter-btn" onClick={() => { setDemandeSearchQ(''); setDemandeTypeFilter(''); setDemandeStatusFilter('') }}>

        <i className="fas fa-times"></i> {t('cancel_label')}

      </button>

    )
  }

              </div >



  {
    loadingDemandes?(

                <div className = "ag-spinner-wrap" ><div className="spinner-border" style={{ color: '#006d94' }} role="status"></div><div className="mt-2" style={{ fontSize: '.82rem', color: '#888' }}>{t('loading')}</div></div>

              ) : (() => {

    const q = demandeSearchQ.toLowerCase()
    const typeLabelsMap: Record<string, string> = { residence: `🏠 ${t('residence_cert')}`, livret: `📘 ${t('nav_managed_users')}`, naissance: `👶 ${t('birth_cert')}`, mariage: `💍 ${t('mariage_cert')}`, deces: `⚰️ ${t('deces_cert')}`, eau: `💧 Eau, Lumière & Égouts`, impots: `💰 Argent & Impôts`, commerce: `🏪 Boutiques & Commerces`, transfert: `🚑 ${lang === 'ar' ? 'نقل جثة' : 'Transfert Corps'}`, legalisation: `✒️ ${lang === 'ar' ? 'تعريف بالإمضاء' : 'Légalisation'}`, goudronnage: `🛤️ ${lang === 'ar' ? 'تعبيد طريق' : 'Goudronnage'}`, bien: `🏢 ${lang === 'ar' ? 'تسجيل عقار' : 'Bien Immo'}`, mutation: `🔄 ${lang === 'ar' ? 'تحيين ملكية' : 'Mutation'}`, vocation: `🏗️ ${lang === 'ar' ? 'تغيير صبغة' : 'Vocation'}`, raccordement: `🔌 ${lang === 'ar' ? 'ربط بالشبكة' : 'Raccordement'}`, evenement: `🎉 ${lang === 'ar' ? 'ترخيص تظاهرة' : 'Événement'}`, construction: `🏗️ ${lang === 'ar' ? 'رخصة بناء' : 'Construction'}` }

    const filtered = allDemandes.filter((d: any) => {

      if (demandeTypeFilter && d.type !== demandeTypeFilter) return false

      if (demandeStatusFilter && d.status !== demandeStatusFilter) return false

      if (q && !d.citizen_name?.toLowerCase().includes(q) && !d.citizen_email?.toLowerCase().includes(q) && !d.type_label?.toLowerCase().includes(q)) return false

      return true

    })

    if (filtered.length === 0) return (

      <div className="ag-empty"><i className="fas fa-folder-open d-block"></i><p>{t('no_results')}</p></div>

    )

    return (

      <div style={{ overflowX: 'auto' }}>

        <table className="ag-table">

          <thead>

            <tr>

              <th>{t('id_label')}</th>

              <th>{t('demande_type')}</th>

              <th>{t('demande_citizen')}</th>

              <th>{t('demande_details')}</th>

              <th>{t('demande_status')}</th>

              <th>{t('demande_payment')}</th>

              <th>{t('demande_date')}</th>

              <th>{t('actions_label')}</th>

            </tr>

          </thead>

          <tbody>

            {filtered.map((d: any) => {

              const stMap: Record<string, { cls: string; icon: string; label: string }> = {

                pending: { cls: 'status-pending', icon: 'fa-clock', label: t('status_pending') },

                in_progress: { cls: 'status-in_progress', icon: 'fa-spinner', label: t('status_in_progress') },

                approved: { cls: 'status-resolved', icon: 'fa-check-circle', label: t('status_resolved') },

                validated: { cls: 'status-resolved', icon: 'fa-check-circle', label: t('status_validated') },

                rejected: { cls: 'status-rejected', icon: 'fa-times-circle', label: t('status_rejected') },

              }

              const st = stMap[d.status] || { cls: 'status-pending', icon: 'fa-question', label: d.status }

              // Build a short summary of key fields

              let summary = ''

              if (d.type === 'residence') summary = d.adresse ? `📍 ${String(d.adresse).slice(0, 40)}` : ''

              else if (d.type === 'livret') summary = d.nom_chef ? `👤 ${d.nom_chef} ${d.prenom_chef}` : ''

              else if (d.type === 'naissance') summary = d.prenom_fr ? `👶 ${d.prenom_fr} ${d.nom_fr}` : ''
              else if (d.type === 'mariage') summary = d.epoux ? `💍 ${d.epoux} & ${d.epouse}` : ''
              else if (d.type === 'deces') summary = d.nom_defunt ? `⚰️ ${d.nom_defunt} (${d.date_deces})` : ''
              else if (d.type === 'eau') summary = d.service_type_label ? `💧 ${String(d.service_type_label).slice(0, 35)}` : ''
              else if (d.type === 'impots') summary = d.service_type_label ? `💰 ${String(d.service_type_label).slice(0, 35)}` : ''
              else if (d.type === 'commerce') summary = d.nom_commerce ? `🏪 ${d.nom_commerce}` : ''
              else if (d.type === 'transfert') summary = d.nom_defunt ? `🚑 ${d.nom_defunt} → ${d.lieu_inhumation}` : ''
              else if (d.type === 'legalisation') summary = d.type_document ? `✒️ ${d.type_document} (${d.nombre_copies} ex.)` : ''
              else if (d.type === 'goudronnage') summary = d.localisation_rue ? `🛤️ ${d.localisation_rue}` : ''
              else if (d.type === 'bien') summary = d.type_bien ? `🏢 ${d.type_bien} (${d.surface} m²)` : ''
              else if (d.type === 'mutation') summary = d.type_mutation ? `🔄 ${d.type_mutation.toUpperCase()}: ${d.nouveau_proprio}` : ''
              else if (d.type === 'vocation') summary = d.vocation_nouvelle ? `🏗️ ${d.vocation_actuelle} → ${d.vocation_nouvelle}` : ''
              else if (d.type === 'raccordement') summary = d.reseau ? `🔌 ${d.reseau} @ ${d.adresse}` : ''
              else if (d.type === 'evenement') summary = d.titre ? `🎉 ${d.titre} (${d.date})` : ''

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

                      ? <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', fontSize: '.7rem' }}>💳 {t('paid_label')}</span>

                      : <span className="badge" style={{ background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', fontSize: '.7rem' }}>⏳ {t('status_pending')}</span>}

                  </td>

                  <td style={{ whiteSpace: 'nowrap', color: '#888', fontSize: '.78rem' }}>{formatDate(d.created_at)}</td>

                  <td>

                    <button className="ag-action-btn" onClick={() => { setDemandeDetail(d); setDemandeNewStatus(d.status) }} title={t('view_details')}>

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

  })()
}



{/* ── Detail Modal */ }

{
  demandeDetail && (() => {
    const typeLabelsMap: Record<string, string> = { residence: `🏠 ${t('residence_cert')}`, livret: `📘 ${t('nav_managed_users')}`, naissance: `👶 ${t('birth_cert')}`, mariage: `💍 ${t('mariage_cert')}`, deces: `⚰️ ${t('deces_cert')}`, eau: `💧 Eau, Lumière & Égouts`, impots: `💰 Argent & Impôts`, commerce: `🏪 Boutiques & Commerces`, transfert: `🚑 ${lang === 'ar' ? 'نقل جثة' : 'Transfert Corps'}`, legalisation: `✒️ ${lang === 'ar' ? 'تعريف بالإمضاء' : 'Légalisation'}`, goudronnage: `🛤️ ${lang === 'ar' ? 'تعبيد طريق' : 'Goudronnage'}`, bien: `🏢 ${lang === 'ar' ? 'تسجيل عقار' : 'Bien Immo'}`, mutation: `🔄 ${lang === 'ar' ? 'تحيين ملكية' : 'Mutation'}`, vocation: `🏗️ ${lang === 'ar' ? 'تغيير صبغة' : 'Vocation'}`, raccordement: `🔌 ${lang === 'ar' ? 'ربط بالشبكة' : 'Raccordement'}`, evenement: `🎉 ${lang === 'ar' ? 'ترخيص تظاهرة' : 'Événement'}`, construction: `🏗️ ${lang === 'ar' ? 'رخصة بناء' : 'Construction'}` }

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

              <div style={{ fontSize: '.72rem', color: '#1565c0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{t('demande_citizen')}</div>

              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>{demandeDetail.citizen_name}</div>

              <div style={{ fontSize: '.82rem', color: '#555', marginTop: 2 }}>{demandeDetail.citizen_email}</div>

              {demandeDetail.telephone && <div style={{ fontSize: '.82rem', color: '#555', marginTop: 2 }}><i className="fas fa-phone me-1"></i>{demandeDetail.telephone}</div>}

            </div>



            {/* Type-specific details */}

            <div className="row g-3 mb-3">

              {demandeDetail.type === 'residence' && (<>

                <div className="col-12"><div className="det-label">{t('adresse_actuelle')}</div><div className="det-value">{demandeDetail.adresse || '—'}</div></div>

                {demandeDetail.motif && <div className="col-12"><div className="det-label">{t('motif')}</div><div className="det-value">{demandeDetail.motif}</div></div>}

                {demandeDetail.profession && <div className="col-6"><div className="det-label">{t('profession')}</div><div className="det-value">{demandeDetail.profession}</div></div>}

              </>)}

              {demandeDetail.type === 'livret' && (<>

                <div className="col-6"><div className="det-label">{t('user_label')}</div><div className="det-value">{demandeDetail.nom_chef} {demandeDetail.prenom_chef}</div></div>

                {demandeDetail.motif && <div className="col-6"><div className="det-label">{t('motif')}</div><div className="det-value">{demandeDetail.motif}</div></div>}

                {demandeDetail.etat_livret && <div className="col-6"><div className="det-label">{t('event_status')}</div><div className="det-value">{demandeDetail.etat_livret}</div></div>}

              </>)}

              {demandeDetail.type === 'naissance' && (<>

                <div className="col-6"><div className="det-label">{t('place_of_birth')}</div><div className="det-value">{demandeDetail.lieu_naissance_fr}</div></div>

                {demandeDetail.sexe && <div className="col-6"><div className="det-label">{t('gender')}</div><div className="det-value">{demandeDetail.sexe}</div></div>}

              </>)}
              {demandeDetail.type === 'eau' && (<>
                <div className="col-12"><div className="det-label">Type de service</div><div className="det-value">{demandeDetail.service_type_label || demandeDetail.service_type}</div></div>
                {demandeDetail.adresse && <div className="col-12"><div className="det-label">Adresse</div><div className="det-value">{demandeDetail.adresse}</div></div>}
                {demandeDetail.description && <div className="col-12"><div className="det-label">Description</div><div className="det-value">{demandeDetail.description}</div></div>}
              </>)}
              {demandeDetail.type === 'impots' && (<>
                <div className="col-12"><div className="det-label">Type de service</div><div className="det-value">{demandeDetail.service_type_label || demandeDetail.service_type}</div></div>
                {demandeDetail.adresse_bien && <div className="col-12"><div className="det-label">Adresse du bien</div><div className="det-value">{demandeDetail.adresse_bien}</div></div>}
                {demandeDetail.description && <div className="col-12"><div className="det-label">Description</div><div className="det-value">{demandeDetail.description}</div></div>}
              </>)}
              {demandeDetail.type === 'commerce' && (<>
                <div className="col-12"><div className="det-label">Type de service</div><div className="det-value">{demandeDetail.service_type_label || demandeDetail.service_type}</div></div>
                {demandeDetail.nom_commerce && <div className="col-6"><div className="det-label">Nom du commerce</div><div className="det-value">{demandeDetail.nom_commerce}</div></div>}
                {demandeDetail.adresse_commerce && <div className="col-6"><div className="det-label">Adresse</div><div className="det-value">{demandeDetail.adresse_commerce}</div></div>}
                {demandeDetail.description && <div className="col-12"><div className="det-label">Description</div><div className="det-value">{demandeDetail.description}</div></div>}
              </>)}

              {demandeDetail.type === 'transfert' && (<>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'المتوفي' : 'Défunt'}</div><div className="det-value">{demandeDetail.nom_defunt}</div></div>

                <div className="col-6"><div className="det-label">{t('deces_date')}</div><div className="det-value">{demandeDetail.date_deces}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'مكان الوفاة' : 'Lieu décès'}</div><div className="det-value">{demandeDetail.lieu_deces}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'الوجهة' : 'Destination'}</div><div className="det-value">{demandeDetail.lieu_inhumation}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'تاريخ النقل' : 'Date de transfert'}</div><div className="det-value">{demandeDetail.date_transfert || '—'}</div></div>

              </>)}

              {demandeDetail.type === 'legalisation' && (<>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'نوع الوثيقة' : 'Type de document'}</div><div className="det-value">{demandeDetail.type_document}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'عدد النسخ' : 'Nombre de copies'}</div><div className="det-value">{demandeDetail.nombre_copies}</div></div>
                {demandeDetail.motif && <div className="col-12"><div className="det-label">{t('motif')}</div><div className="det-value">{demandeDetail.motif}</div></div>}
                
                {/* Documents photos for the agent */}
                <div className="col-12 mt-3">
                  <div className="det-label mb-2"><i className="fas fa-id-card me-1"></i>Pièces d'identité (Photos)</div>
                  <div className="row g-2">
                    {demandeDetail.cin_recto && (
                      <div className="col-6">
                        <div className="small text-muted mb-1 text-center">Recto</div>
                        <a href={demandeDetail.cin_recto} target="_blank" rel="noreferrer">
                          <img src={demandeDetail.cin_recto} alt="CIN Recto" style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #ccc' }} />
                        </a>
                      </div>
                    )}
                    {demandeDetail.cin_verso && (
                      <div className="col-6">
                        <div className="small text-muted mb-1 text-center">Verso</div>
                        <a href={demandeDetail.cin_verso} target="_blank" rel="noreferrer">
                          <img src={demandeDetail.cin_verso} alt="CIN Verso" style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #ccc' }} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>)}

              {demandeDetail.type === 'goudronnage' && (<>

                <div className="col-12"><div className="det-label">{lang === 'ar' ? 'الموقع المطلوب تعبيده' : 'Localisation de la rue'}</div><div className="det-value">{demandeDetail.localisation_rue}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'إحداثيات الموقع' : 'Coordonnées'}</div><div className="det-value">{demandeDetail.latitude ? `${demandeDetail.latitude}, ${demandeDetail.longitude}` : 'Non spécifié'}</div></div>

                {demandeDetail.adresse_residence && <div className="col-6"><div className="det-label">{lang === 'ar' ? 'عنوان السكن' : 'Adresse Demandeur'}</div><div className="det-value">{demandeDetail.adresse_residence}</div></div>}

              </>)}

              {demandeDetail.type === 'bien' && (<>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'نوع العقار' : 'Type de bien'}</div><div className="det-value">{demandeDetail.type_bien}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'المساحة' : 'Surface'}</div><div className="det-value">{demandeDetail.surface} m²</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'رقم الرسم العقاري' : 'Titre Foncier'}</div><div className="det-value">{demandeDetail.num_titre_foncier}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'الإحداثيات' : 'Coordonnées GPS'}</div><div className="det-value">{demandeDetail.latitude ? `${demandeDetail.latitude}, ${demandeDetail.longitude}` : 'Manual'}</div></div>

                <div className="col-12"><div className="det-label">{lang === 'ar' ? 'العنوان' : 'Adresse'}</div><div className="det-value">{demandeDetail.adresse}</div></div>

              </>)}

              {demandeDetail.type === 'mutation' && (<>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'نوع العملية' : 'Type de mutation'}</div><div className="det-value">{demandeDetail.type_mutation?.toUpperCase()}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'رقم الرسم العقاري' : 'Titre Foncier'}</div><div className="det-value">{demandeDetail.num_titre_foncier}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'المالك السابق' : 'Ancien propriétaire'}</div><div className="det-value">{demandeDetail.ancien_proprio}</div></div>

                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'المالك الجديد' : 'Nouveau propriétaire'}</div><div className="det-value">{demandeDetail.nouveau_proprio}</div></div>

                <div className="col-12"><div className="det-label">{lang === 'ar' ? 'عنوان العقار' : 'Adresse du bien'}</div><div className="det-value">{demandeDetail.adresse_bien}</div></div>

                <div className="col-12"><div className="det-label">{lang === 'ar' ? 'الموقع' : 'Localisation'}</div><div className="det-value">{demandeDetail.latitude ? `${demandeDetail.latitude}, ${demandeDetail.longitude}` : '—'}</div></div>

              </>)}

              {demandeDetail.type === 'vocation' && (<>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'الصبغة الأصلية' : 'Vocation Actuelle'}</div><div className="det-value">{demandeDetail.vocation_actuelle?.toUpperCase()}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'الصبغة المطلوبة' : 'Nouvelle Vocation'}</div><div className="det-value">{demandeDetail.vocation_nouvelle?.toUpperCase()}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'رقم الرسم العقاري' : 'Titre Foncier'}</div><div className="det-value">{demandeDetail.num_titre_foncier}</div></div>
                <div className="col-12"><div className="det-label">{lang === 'ar' ? 'الهدف / المبررات' : 'Justification'}</div><div className="det-value">{demandeDetail.motif}</div></div>
                <div className="col-12"><div className="det-label">{lang === 'ar' ? 'العنوان' : 'Adresse Bien'}</div><div className="det-value">{demandeDetail.adresse_bien}</div></div>
                <div className="col-12"><div className="det-label">{lang === 'ar' ? 'الموقع' : 'Localisation'}</div><div className="det-value">{demandeDetail.latitude ? `${demandeDetail.latitude}, ${demandeDetail.longitude}` : '—'}</div></div>
              </>)}

              {demandeDetail.type === 'mariage' && (<>
                <div className="col-6"><div className="det-label">Époux</div><div className="det-value">{demandeDetail.epoux}</div></div>
                <div className="col-6"><div className="det-label">Épouse</div><div className="det-value">{demandeDetail.epouse}</div></div>
                <div className="col-6"><div className="det-label">Date mariage</div><div className="det-value">{demandeDetail.date_mariage}</div></div>
                <div className="col-6"><div className="det-label">Régime</div><div className="det-value">{demandeDetail.regime}</div></div>
              </>)}

              {demandeDetail.type === 'deces' && (<>
                <div className="col-6"><div className="det-label">Défunt</div><div className="det-value">{demandeDetail.nom_defunt}</div></div>
                <div className="col-6"><div className="det-label">Date décès</div><div className="det-value">{demandeDetail.date_deces}</div></div>
                <div className="col-6"><div className="det-label">Lieu décès</div><div className="det-value">{demandeDetail.lieu_deces}</div></div>
              </>)}

              {demandeDetail.type === 'raccordement' && (<>
                <div className="col-6"><div className="det-label">Type réseau</div><div className="det-value">{demandeDetail.reseau}</div></div>
                <div className="col-6"><div className="det-label">Adresse raccordement</div><div className="det-value">{demandeDetail.adresse}</div></div>
              </>)}

              {demandeDetail.type === 'evenement' && (<>
                <div className="col-12"><div className="det-label">Titre événement</div><div className="det-value">{demandeDetail.titre}</div></div>
                <div className="col-12"><div className="det-label">Lieu</div><div className="det-value">{demandeDetail.lieu}</div></div>
                <div className="col-12"><div className="det-label">Dates</div><div className="det-value">{demandeDetail.date}</div></div>
              </>)}



              <div className="col-6"><div className="det-label">{t('demande_payment')}</div><div className="det-value">{demandeDetail.is_paid ? `✅ ${t('paid_label')}` : `⏳ ${t('status_pending')}`}</div></div>

              <div className="col-6"><div className="det-label">{t('demande_date')}</div><div className="det-value">{formatDate(demandeDetail.created_at)}</div></div>

            </div>



            {/* Comment preview */}

            {demandeDetail.commentaire_agent && (

              <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>

                <div className="det-label">{t('event_comment_citizen')}</div>

                <div style={{ fontSize: '.85rem', color: '#444' }}>{demandeDetail.commentaire_agent}</div>

              </div>

            )}



            <hr />

            {/* Status update */}



            {/* Agent Assignment (Supervisor only) */}

            {(user?.user_type === 'supervisor' || user?.is_superuser || user?.is_staff) && demandeDetail.type === 'reclamation' && (

              <div className="mb-3">

                <label className="det-label mb-2"><i className="fas fa-user-tag me-1"></i>Affecter à un agent</label>

                <div className="d-flex gap-2">

                  <select className="form-select form-select-sm"

                    value={demandeDetail.agent || ''}

                    onChange={(e) => handleAssignAgent(demandeDetail.id, parseInt(e.target.value))}

                  >

                    <option value="">Choisir un agent...</option>

                    {allAgents.map(a => (

                      <option key={a.id} value={a.id}>{a.full_name}</option>

                    ))}

                  </select>

                </div>

              </div>

            )}



            <div className="d-flex gap-2 justify-content-end">

              <button className="btn btn-secondary btn-sm" onClick={() => setDemandeDetail(null)}>{t('close')}</button>

              <button

                className="btn btn-primary btn-sm"

                disabled={demandeSaving || demandeNewStatus === demandeDetail.status}

                onClick={() => saveDemandStatus(demandeDetail, demandeNewStatus)}>

                {demandeSaving ? <><i className="fas fa-spinner fa-spin me-1"></i>{t('processing')}</> : <><i className="fas fa-save me-1"></i>{t('profile_save')}</>}

              </button>

            </div>

          </div>

        </div>

      </div>

    )

  })()
}

              </div >

            </div >

          ) : activeTab === 'forum' ? (

  /* ── FORUM MANAGEMENT TAB ─────────────────────────────────── */

  <div className="ag-card animate__animated animate__fadeIn">

    <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#311b92,#4527a0)' }}>

      <span><i className="fas fa-comments me-2"></i>{t('admin_forum_title')}</span>

      <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.78rem' }} onClick={fetchTopics}>

        <i className="fas fa-sync-alt me-1"></i>{t('refresh')}

      </button>

    </div>



    {/* Forum Stats Strip */}

    {!loadingTopics && forumStats && (

      <div className="d-flex flex-wrap gap-2 p-3 border-bottom" style={{ background: '#f8f9fa' }}>

        {[

          { lbl: t('total_topics'), val: forumStats.total_topics, color: '#311b92', bg: '#ede7f6' },

          { lbl: t('total_replies'), val: forumStats.total_replies, color: '#006064', bg: '#e0f7fa' },

          { lbl: t('active_members'), val: forumStats.active_members, color: '#c62828', bg: '#ffebee' },

          { lbl: t('pinned'), val: forumStats.pinned_topics, color: '#f57f17', bg: '#fff8e1' },

          { lbl: t('resolved'), val: forumStats.resolved_topics, color: '#2e7d32', bg: '#e8f5e9' },

        ].map(s => (

          <div key={s.lbl} className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"

            style={{ background: s.bg, border: `1px solid ${s.color}33` }}>

            <span className="fw-bold" style={{ color: s.color, fontSize: '1.1rem' }}>{s.val}</span>

            <span style={{ color: s.color, fontSize: '.78rem' }}>{s.lbl}</span>

          </div>

        ))}

        <button className="btn btn-primary btn-sm ms-auto rounded-pill px-3" onClick={() => navigate('/forum')}>

          <i className="fas fa-external-link-alt me-1"></i> {t('external_link_forum')}

        </button>

      </div>

    )}



    {/* Filters */}

    <div className="ag-filter-bar">

      <div className="ag-search-wrap">

        <i className="fas fa-search"></i>

        <input className="ag-search-input" placeholder={t('placeholder_search_topic')} value={forumSearch} onChange={e => setForumSearch(e.target.value)} />

      </div>

    </div>



    {loadingTopics ? (

      <div className="ag-spinner-wrap"><div className="spinner-border text-primary"></div></div>

    ) : (() => {

      const filtered = allTopics.filter(t =>

        !forumSearch || t.title.toLowerCase().includes(forumSearch.toLowerCase()) ||

        t.author_name?.toLowerCase().includes(forumSearch.toLowerCase())

      )

      if (filtered.length === 0) return <div className="ag-empty">{t('forum_empty')}</div>

      return (

        <div className="table-responsive">

          <table className="ag-table shadow-sm">

            <thead>

              <tr>

                <th>{t('forum_subject')}</th>

                <th>{t('forum_author')}</th>

                <th>{t('table_stats')}</th>

                <th>{t('forum_state')}</th>

                <th>{t('table_actions')}</th>

              </tr>

            </thead>

            <tbody>

              {filtered.map(tp => (

                <tr key={tp.id}>

                  <td style={{ maxWidth: 250 }}>

                    <div className="fw-bold text-dark text-truncate" title={tp.title}>{tp.title}</div>

                    <div className="small text-muted text-truncate">{tp.content?.slice(0, 60)}...</div>

                    <div className="mt-1">

                      {tp.tags?.map((tg: any) => (

                        <span key={tg.id} className="badge bg-light text-dark border me-1" style={{ fontSize: '10px' }}>{tg.name}</span>

                      ))}

                    </div>

                  </td>

                  <td>

                    <div className="small fw-bold text-primary">{tp.author_name}</div>

                    <div className="text-muted" style={{ fontSize: '10px' }}>{formatDate(tp.created_at)}</div>

                  </td>

                  <td>

                    <div className="small"><i className="fas fa-eye text-muted me-1"></i>{tp.views}</div>

                    <div className="small"><i className="fas fa-comment text-muted me-1"></i>{tp.replies_count}</div>

                  </td>

                  <td>

                    <div className="d-flex flex-column gap-1">

                      {tp.is_pinned && <span className="badge bg-warning text-dark" style={{ fontSize: '10px' }}><i className="fas fa-thumbtack me-1"></i>{t('forum_pinned')}</span>}

                      {tp.is_resolved && <span className="badge bg-success" style={{ fontSize: '10px' }}><i className="fas fa-check me-1"></i>{t('forum_resolved')}</span>}

                      {!tp.is_pinned && !tp.is_resolved && <span className="text-muted small">{t('forum_normal')}</span>}

                    </div>

                  </td>

                  <td>

                    <div className="d-flex gap-1">

                      <button className="btn btn-sm btn-outline-primary" onClick={() => fetchTopicDetail(tp.id)} title={t('forum_reply_chat')}>

                        <i className="fas fa-comment-dots"></i>

                      </button>

                      <button className={`btn btn-sm ${tp.is_pinned ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => handleTopicAction(tp.id, 'pin')} title={t('pin_topic')}>

                        <i className="fas fa-thumbtack"></i>

                      </button>

                      <button className={`btn btn-sm ${tp.is_resolved ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleTopicAction(tp.id, 'resolve')} title={t('mark_resolved')}>

                        <i className="fas fa-check"></i>

                      </button>

                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleTopicAction(tp.id, 'delete')} title={t('delete_label')}>

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

      <span><i className="fas fa-calendar-alt me-2"></i>{t('admin_events_title')}</span>

      <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.78rem' }} onClick={fetchEvenements}>

        <i className="fas fa-sync-alt me-1"></i>{t('refresh')}

      </button>

    </div>



    {/* Stats strip */}

    {!loadingEvenements && allEvenements.length > 0 && (() => {

      const ev_pending = allEvenements.filter((e: any) => e.status === 'pending').length

      const ev_inprog = allEvenements.filter((e: any) => e.status === 'in_progress').length

      const ev_approved = allEvenements.filter((e: any) => e.status === 'approved').length

      const ev_rejected = allEvenements.filter((e: any) => e.status === 'rejected').length

      const ev_conflict = allEvenements.filter((e: any) => e.has_conflict).length

      return (

        <div className="d-flex flex-wrap gap-2 p-3 border-bottom" style={{ background: '#f8f9fa' }}>

          {[

            { lbl: t('all_label'), val: allEvenements.length, color: '#1565c0', bg: '#e3f2fd' },

            { lbl: t('status_pending'), val: ev_pending, color: '#e65100', bg: '#fff3e0' },

            { lbl: t('status_in_progress'), val: ev_inprog, color: '#0288d1', bg: '#e1f5fe' },

            { lbl: t('status_validated'), val: ev_approved, color: '#2e7d32', bg: '#e8f5e9' },

            { lbl: t('status_rejected'), val: ev_rejected, color: '#b71c1c', bg: '#ffebee' },

            { lbl: `⚠️ ${t('event_conflict')}`, val: ev_conflict, color: '#f57f17', bg: '#fff8e1' },

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

        <input className="ag-search-input" placeholder={t('placeholder_search_topic')} value={evSearch} onChange={e => setEvSearch(e.target.value)} />

      </div>

      <select className="ag-filter-select" value={evStatusFilter} onChange={e => setEvStatusFilter(e.target.value)}>

        <option value="">{t('all_statuses')}</option>

        <option value="pending">{t('status_pending')}</option>

        <option value="in_progress">{t('status_in_progress')}</option>

        <option value="approved">{t('status_validated')}</option>

        <option value="rejected">{t('status_rejected')}</option>

      </select>

      <select className="ag-filter-select" value={evTypeFilter} onChange={e => setEvTypeFilter(e.target.value)}>

        <option value="">{t('all_categories')}</option>

        <option value="fete_familiale">{t('category_other')}</option>

        {/* Better: I should use actual keys but let's keep it simple with t calls */}

      </select>

    </div>



    {loadingEvenements ? (

      <div className="ag-spinner-wrap"><div className="spinner-border spinner-border-sm me-2"></div>{t('loading')}</div>

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

        <div className="ag-empty"><i className="fas fa-calendar-times d-block"></i>{t('no_results')}</div>

      )

      return (

        <div className="table-responsive">

          <table className="ag-table">

            <thead><tr>

              <th>{t('event_label')}</th><th>{t('event_type')}</th><th>{t('event_place')}</th><th>{t('event_date')}</th><th>{t('event_organizer')}</th><th>{t('event_status')}</th><th>{t('event_conflict')}</th><th>{t('actions_label')}</th>

            </tr></thead>

            <tbody>

              {filtered.map((ev: any) => {

                const sc: Record<string, string> = {

                  pending: 'status-pending', in_progress: 'status-in_progress',

                  approved: 'status-resolved', rejected: 'status-rejected',

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

                      <span className="text-muted">{ev.heure_debut?.slice(0, 5)} — {ev.heure_fin?.slice(0, 5)}</span>

                    </td>

                    <td style={{ fontSize: '.8rem' }}>{ev.nom_organisateur}</td>

                    <td><span className={`status-badge ${sc[ev.status] || 'bg-secondary'}`}>{ev.status_display}</span></td>

                    <td>

                      {ev.has_conflict ? (

                        <span className="badge rounded-pill px-2" style={{ background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', fontSize: '.7rem' }}>

                          <i className="fas fa-exclamation-triangle me-1"></i>

                          {ev.conflict_with_title ? `≈ ${ev.conflict_with_title.slice(0, 20)}` : t('event_conflict_detected')}

                        </span>

                      ) : (

                        <span className="text-muted" style={{ fontSize: '.75rem' }}>—</span>

                      )}

                    </td>

                    <td>

                      <button className="ag-action-btn" onClick={() => { setEvDetail(ev) }} title={t('event_treat')}>

                        <i className="fas fa-eye"></i> {t('event_treat')}

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

) : activeTab === 'construction' ? (

  /* ── CONSTRUCTION TAB ─────────────────────────────────────────── */

  <div className="ag-card animate__animated animate__fadeIn">

    <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(135deg,#e65100,#f57f17)' }}>

      <span><i className="fas fa-hard-hat me-2"></i>Permis de Construire — Gestion des dossiers</span>

      <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.78rem' }} onClick={fetchConstructions}>

        <i className="fas fa-sync-alt me-1"></i>Actualiser

      </button>

    </div>

    <div className="p-4">

      {/* Stats cards */}

      {constructionStats && (

        <div className="row g-3 mb-4">

          {[

            { lbl: 'Total', val: constructionStats.total, color: '#1a237e', bg: '#e8eaf6' },

            { lbl: 'En attente', val: constructionStats.pending, color: '#e65100', bg: '#fff3e0' },

            { lbl: 'En instruction', val: constructionStats.en_cours, color: '#1565c0', bg: '#e3f2fd' },

            { lbl: 'Permis délivrés', val: constructionStats.permis_delivre, color: '#2e7d32', bg: '#e8f5e9' },

            { lbl: 'Rejetés', val: constructionStats.rejet, color: '#c62828', bg: '#ffebee' },

          ].map(s => (

            <div className="col-6 col-md-4 col-lg-2" key={s.lbl}>

              <div className="text-center p-3 rounded-3" style={{ background: s.bg }}>

                <div className="fw-bold" style={{ fontSize: '1.5rem', color: s.color }}>{s.val}</div>

                <div style={{ fontSize: '.73rem', color: s.color, fontWeight: 600 }}>{s.lbl}</div>

              </div>

            </div>

          ))}

        </div>

      )}



      {/* Filters */}

      <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">

        <div className="ag-search-wrap flex-grow-1">

          <i className="fas fa-search"></i>

          <input className="ag-search-input" placeholder="Rechercher par nom, adresse..." value={constructionSearch} onChange={e => setConstructionSearch(e.target.value)} />

        </div>

        {['all', 'pending', 'en_cours_instruction', 'permis_delivre', 'rejet_definitif', 'changes_requested'].map(f => (

          <button key={f} className={`btn btn-sm rounded-pill ${constructionFilter === f ? 'btn-warning' : 'btn-outline-secondary'}`}

            onClick={() => setConstructionFilter(f)} style={{ fontSize: '.75rem' }}>

            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'en_cours_instruction' ? 'En instruction' : f === 'permis_delivre' ? 'Permis délivré' : f === 'rejet_definitif' ? 'Rejeté' : 'Modif. demandées'}

          </button>

        ))}

      </div>



      {/* List */}

      {loadingConstructions ? (

        <div className="text-center py-4"><div className="spinner-border text-warning"></div></div>

      ) : (

        <div className="d-flex flex-column gap-2">

          {allConstructions

            .filter(c => constructionFilter === 'all' || c.status === constructionFilter)

            .filter(c => !constructionSearch || c.nom_proprietaire?.toLowerCase().includes(constructionSearch.toLowerCase()) || c.adresse_terrain?.toLowerCase().includes(constructionSearch.toLowerCase()))

            .map(c => {

              const statusColors: Record<string, string> = {

                pending: '#ff9800', en_cours_instruction: '#1565c0', favorable: '#00897b',

                defavorable: '#c62828', changes_requested: '#f57f17',

                permis_delivre: '#2e7d32', rejet_definitif: '#424242',

              }

              const color = statusColors[c.status] || '#666'

              return (

                <div key={c.id} className="p-3 rounded-3 border d-flex align-items-start gap-3 flex-wrap"

                  style={{ background: constructionDetail?.id === c.id ? '#fff8e1' : '#fff', cursor: 'pointer', borderColor: '#e9ecef' }}

                  onClick={() => setConstructionDetail(constructionDetail?.id === c.id ? null : c)}>

                  <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"

                    style={{ width: 40, height: 40, background: '#fff3e0', fontSize: '1.2rem' }}>

                    🏗️

                  </div>

                  <div className="flex-grow-1 min-w-0">

                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">

                      <span className="fw-bold" style={{ fontSize: '.9rem' }}>{c.nom_proprietaire}</span>

                      <span className="badge rounded-pill text-white" style={{ background: color, fontSize: '.7rem' }}>{c.status_display}</span>

                    </div>

                    <div style={{ fontSize: '.8rem', color: '#777' }}>

                      <span className="me-3"><i className="fas fa-tools me-1 text-warning"></i>{c.type_travaux_display}</span>

                      <span className="me-3"><i className="fas fa-map-marker-alt me-1 text-danger"></i>{c.adresse_terrain}</span>

                      <span><i className="fas fa-expand me-1 text-success"></i>{c.surface_construite} m² — {c.nombre_etages} étage{c.nombre_etages > 1 ? 's' : ''}</span>

                    </div>

                  </div>

                  <i className={`fas fa-chevron-${constructionDetail?.id === c.id ? 'up' : 'down'} text-muted`}></i>

                </div>

              )

            })}

          {allConstructions.filter(c => constructionFilter === 'all' || c.status === constructionFilter).length === 0 && (

            <div className="text-center text-muted py-4"><i className="fas fa-hard-hat fa-2x opacity-25 mb-2 d-block"></i>Aucun dossier trouvé</div>

          )}

        </div>

      )}



      {/* Detail panel */}

      {constructionDetail && (

        <div className="mt-4 p-4 rounded-3 border" style={{ background: '#fffde7', borderColor: '#f9a825' }}>

          <div className="d-flex align-items-center gap-2 mb-3">

            <span className="fw-bold fs-6">🏗️ Dossier #{constructionDetail.id} — {constructionDetail.nom_proprietaire}</span>

            <span className="ms-auto badge bg-secondary rounded-pill" style={{ fontSize: '.72rem' }}>CIN: {constructionDetail.cin_proprietaire}</span>

          </div>

          <div className="row g-2 mb-3" style={{ fontSize: '.83rem' }}>

            <div className="col-md-4"><strong>Type :</strong> {constructionDetail.type_travaux_display}</div>

            <div className="col-md-4"><strong>Usage :</strong> {constructionDetail.usage_batiment_display}</div>

            <div className="col-md-4"><strong>Surface :</strong> {constructionDetail.surface_construite} m²</div>

            <div className="col-md-4"><strong>Étages :</strong> {constructionDetail.nombre_etages}</div>

            <div className="col-md-4"><strong>Début prévu :</strong> {constructionDetail.date_debut_prevue}</div>

            <div className="col-md-4"><strong>Durée :</strong> {constructionDetail.duree_travaux_mois} mois</div>

            <div className="col-md-6"><strong>Adresse :</strong> {constructionDetail.adresse_terrain}</div>

            <div className="col-md-6"><strong>Tél. propriétaire :</strong> {constructionDetail.telephone_proprietaire}</div>

            {constructionDetail.cout_estime && <div className="col-md-4"><strong>Coût estimé :</strong> {constructionDetail.cout_estime} DT</div>}

            {constructionDetail.nom_entrepreneur && <div className="col-md-4"><strong>Entrepreneur :</strong> {constructionDetail.nom_entrepreneur}</div>}

          </div>

          {constructionDetail.commentaire_agent && (

            <div className="mb-3 p-2 rounded-3 bg-white border" style={{ fontSize: '.83rem' }}>

              <strong>Commentaire précédent :</strong> {constructionDetail.commentaire_agent}

            </div>

          )}

          {/* Action buttons */}

          <div className="d-flex gap-2 flex-wrap mt-2">

            {[

              { s: 'en_cours_instruction', label: '🔍 Mettre en instruction', cls: 'btn-primary' },

              { s: 'favorable', label: '👍 Avis favorable', cls: 'btn-info text-white' },

              { s: 'permis_delivre', label: '✅ Délivrer le permis', cls: 'btn-success' },

              { s: 'changes_requested', label: '✏️ Demander modifications', cls: 'btn-warning' },

              { s: 'defavorable', label: '👎 Avis défavorable', cls: 'btn-danger' },

              { s: 'rejet_definitif', label: '🚫 Rejet définitif', cls: 'btn-dark' },

            ].map(btn => (

              <button key={btn.s} className={`btn btn-sm rounded-pill ${btn.cls}`}

                style={{ fontSize: '.78rem' }}

                onClick={() => {

                  const comment = btn.s === 'changes_requested' || btn.s === 'defavorable' || btn.s === 'rejet_definitif'

                    ? prompt('Commentaire pour le citoyen (optionnel) :') ?? ''

                    : ''

                  updateConstructionStatus(constructionDetail.id, btn.s, comment)

                }}>

                {btn.label}

              </button>

            ))}

          </div>

        </div>

      )}

    </div>

  </div>



) : activeTab === 'stats' ? (

  /* ── STATISTIQUES IA TAB ──────────────────────────────────────── */

  <div className="ag-card animate__animated animate__fadeIn" style={{ overflow: 'visible' }}>

    <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(135deg,#1a237e,#283593)' }}>

      <span><i className="fas fa-brain me-2"></i>{t('stats_ia_title')} — {t('stats_ia_subtitle')}</span>

      <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.78rem' }} onClick={fetchMlStats}>

        <i className="fas fa-sync-alt me-1"></i>{t('stats_ia_recalculate')}

      </button>

    </div>

    <div style={{ padding: '24px 22px' }}>

      {mlLoading && (

        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#1a237e' }}>

          <div className="spinner-border" style={{ width: '2.5rem', height: '2.5rem' }} role="status"></div>

          <p className="mt-3" style={{ fontSize: '.9rem', color: '#555' }}>{t('stats_ia_loading')}</p>

          <p style={{ fontSize: '.77rem', color: '#aaa' }}>{t('stats_ia_training')}</p>

        </div>

      )}

      {!mlLoading && mlError && (

        <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: 24, textAlign: 'center' }}>

          <i className="fas fa-exclamation-triangle" style={{ color: '#b71c1c', fontSize: '2rem', display: 'block', marginBottom: 12 }}></i>

          <p style={{ color: '#b71c1c', fontWeight: 600, marginBottom: 12 }}>{mlError}</p>

          <button onClick={fetchMlStats} style={{ background: '#1a237e', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontSize: '.85rem' }}>

            <i className="fas fa-redo me-1"></i>{t('retry')}

          </button>

        </div>

      )}

      {!mlLoading && !mlStats && !mlError && (

        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>

          <i className="fas fa-robot" style={{ fontSize: '3rem', opacity: .3, display: 'block', marginBottom: 12 }}></i>

          <p>{t('no_results')}</p>

        </div>

      )}

      {!mlLoading && mlStats && (() => {

        const CAT_LABELS: Record<string, string> = {

          lighting: `💡 ${t('category_lighting')}`,

          trash: `🗑️ ${t('category_trash')}`,

          roads: `🛣️ ${t('category_roads')}`,

          noise: `🔊 ${t('category_noise')}`,

          other: `📌 ${t('category_other')}`

        }

        const PRI_LABELS: Record<string, string> = {

          urgente: `🔴 ${t('priority_urgente')}`,

          normale: `🔵 ${t('priority_normale')}`,

          faible: `🟣 ${t('priority_faible')}`

        }

        const LMAP_CAT: Record<string, string> = { lighting: '💡', trash: '🗑️', roads: '🛣️', noise: '🔊', other: '📌' }

        const LMAP_PRI: Record<string, string> = { urgente: '🔴', normale: '🔵', faible: '🟣' }

        return (

          <>

            {/* Accuracy summary cards */}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>

              {[

                { label: t('stats_ia_precision_cat'), value: Math.round(mlStats.category.accuracy * 100) + '%', bg: '#e8f5e9', color: mlStats.category.accuracy >= 0.85 ? '#2e7d32' : '#f57f17', sub: `${mlStats.n_samples} ${t('stats_ia_samples')}` },

                { label: t('stats_ia_precision_pri'), value: Math.round(mlStats.priority.accuracy * 100) + '%', bg: '#e3f2fd', color: mlStats.priority.accuracy >= 0.85 ? '#1565c0' : '#f57f17', sub: 'TF-IDF + LinearSVC' },

                { label: t('stats_ia_samples'), value: mlStats.n_samples, bg: '#f3e5f5', color: '#6a1b9a', sub: t('stats_ia_annotated') },

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

              <i className="fas fa-table"></i>{t('stats_ia_table1')}

            </div>

            <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 12, lineHeight: 1.5 }}>

              <b>{t('stats_ia_precision')}</b> {t('ml_stats_precision_def')} &nbsp;|&nbsp;

              <b>{t('stats_ia_recall')}</b> {t('ml_stats_recall_def')} &nbsp;|&nbsp;

              <b>{t('stats_ia_f1')}</b> {t('ml_stats_f1_def')} &nbsp;|&nbsp; <b>{t('stats_ia_support')}</b> {t('ml_stats_support_def')}

            </p>

            <div className="ag-card" style={{ marginBottom: 22 }}>

              <div style={{ overflowX: 'auto', padding: '4px 0' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>

                  <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('category_label')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_precision')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_recall')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_f1')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_support')}</th></tr></thead>

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

                      <td style={{ padding: '8px 12px' }}>{t('average')}</td>

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

              <i className="fas fa-th"></i>{t('stats_ia_table2')}

            </div>

            <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 12, lineHeight: 1.5 }}>

              {t('stats_ia_cm_desc')} <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '0 4px', borderRadius: 4 }}>{t('stats_ia_cm_legend').split('.')[0]}</span> <span style={{ background: '#fce4ec', color: '#b71c1c', padding: '0 4px', borderRadius: 4 }}>{t('stats_ia_cm_legend').split('.')[1]}</span>

            </p>

            <div className="ag-card" style={{ marginBottom: 22 }}>

              <div style={{ overflowX: 'auto', padding: '4px 0' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>

                  <thead><tr style={{ background: '#f5f5f5' }}>

                    <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0', fontSize: '.72rem' }}>{lang === 'ar' ? 'حقيقي ↓ / متوقع ←' : 'Réel ↓ / Prédit →'}</th>

                    {mlStats.category.labels.map((l: string) => <th key={l} style={{ textAlign: 'center', minWidth: 46, padding: 7, fontSize: '.8rem', borderBottom: '2px solid #e0e0e0', fontWeight: 700, color: '#333' }}>{LMAP_CAT[l] || l}</th>)}

                  </tr></thead>

                  <tbody>

                    {mlStats.category.confusion_matrix.map((row: number[], i: number) => (

                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>

                        <td style={{ padding: '8px 12px', color: '#444' }}><strong style={{ fontSize: '.8rem' }}>{CAT_LABELS[mlStats.category.labels[i]] || mlStats.category.labels[i]}</strong></td>

                        {row.map((val: any, j: number) => (

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

              <i className="fas fa-star"></i>{t('stats_ia_table3')}

            </div>

            <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 12, lineHeight: 1.5 }}>{t('ml_stats_feat_desc')}</p>

            <div className="ag-card" style={{ marginBottom: 22 }}>

              <div style={{ overflowX: 'auto', padding: '4px 0' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>

                  <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('category_label')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_mots_cles')}</th></tr></thead>

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

              <i className="fas fa-flag"></i>{t('stats_ia_table4')}

            </div>

            <div className="ag-card" style={{ marginBottom: 22 }}>

              <div style={{ overflowX: 'auto', padding: '4px 0' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>

                  <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('priority_label')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_precision')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_recall')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_f1')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_support')}</th></tr></thead>

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

                      <td style={{ padding: '8px 12px' }}>{t('stats_ia_average')}</td>

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

              <i className="fas fa-th"></i>{t('stats_ia_table4b')}

            </div>

            <div className="ag-card" style={{ marginBottom: 22 }}>

              <div style={{ overflowX: 'auto', padding: '4px 0' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>

                  <thead><tr style={{ background: '#f5f5f5' }}>

                    <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0', fontSize: '.72rem' }}>{lang === 'ar' ? 'حقيقي ↓ / متوقع ←' : 'Réel ↓ / Prédit →'}</th>

                    {mlStats.priority.labels.map((l: string) => <th key={l} style={{ textAlign: 'center', minWidth: 46, padding: 7, fontSize: '.8rem', borderBottom: '2px solid #e0e0e0', fontWeight: 700, color: '#333' }}>{LMAP_PRI[l] || l}</th>)}

                  </tr></thead>

                  <tbody>

                    {mlStats.priority.confusion_matrix.map((row: number[], i: number) => (

                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>

                        <td style={{ padding: '8px 12px', color: '#444' }}><strong style={{ fontSize: '.8rem' }}>{PRI_LABELS[mlStats.priority.labels[i]] || mlStats.priority.labels[i]}</strong></td>

                        {row.map((val: any, j: number) => (

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

              {t('stats_ia_model_trained')} · {mlStats.n_samples} {t('stats_ia_samples')}

            </div>

          </>

        )

      })()}

    </div>

  </div>

) : activeTab === 'citizens' ? (

  /* ── VÉRIFICATION CITOYENS (agents) ────────────────────────── */

  <div className="ag-card animate__animated animate__fadeIn">

    <div className="ag-card-hdr-green" style={{ background: 'linear-gradient(90deg,#1b5e20,#388e3c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, minHeight: '50px', padding: '8px 16px' }}>

      <span className="fw-bold"><i className="fas fa-user-check me-2"></i>Vérification des Comptes Citoyens</span>

      <div className="d-flex align-items-center gap-2">

        <span className="badge bg-warning text-dark" style={{ fontSize: '11px' }}>{agentCitizens.length} en attente</span>

        <button className="btn btn-sm btn-light" onClick={fetchAgentCitizens}><i className="fas fa-sync-alt"></i></button>

      </div>

    </div>



    {/* Search bar */}

    <div className="ag-filter-bar bg-white border-bottom px-3 py-2 d-flex align-items-center gap-3">

      <div className="ag-search-wrap flex-grow-1" style={{ maxWidth: '400px' }}>

        <i className="fas fa-search"></i>

        <input

          className="ag-search-input"

          placeholder="Rechercher par Nom, Email ou CIN..."

          value={citizenSearch}

          onChange={e => setCitizenSearch(e.target.value)}

        />

      </div>

      <div className="text-muted small">

        {agentCitizens.filter(c => {

          const q = citizenSearch.toLowerCase()

          return !q || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.cin?.toLowerCase().includes(q)

        }).length} résultat(s)

      </div>

    </div>



    <div className="ag-card-body p-0" style={{ minHeight: '400px' }}>

      {loadingCitizens ? (

        <div className="p-4"><div className="skeleton-box table-skeleton" style={{ height: '350px' }}></div></div>

      ) : agentCitizens.length === 0 ? (

        <div className="text-center p-5 text-muted">

          <i className="fas fa-check-circle fa-3x mb-3" style={{ color: '#2e7d32', opacity: .4 }}></i>

          <p className="fw-bold">Aucun compte en attente de vérification.</p>

          <p className="small">Tous les citoyens inscrits ont été vérifiés.</p>

        </div>

      ) : (

        <div style={{ overflowX: 'auto' }}>

          <table className="ag-table shadow-sm">

            <thead>

              <tr>

                <th>Citoyen</th>

                <th>CIN / Téléphone</th>

                <th>Ville</th>

                <th>Inscrit le</th>

                <th>Statut</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {agentCitizens.filter(c => {

                const q = citizenSearch.toLowerCase()

                return !q || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.cin?.toLowerCase().includes(q)

              }).map(c => (

                <tr key={c.id}

                  onClick={() => setSelectedCitizen(c)}

                  style={{ cursor: 'pointer', borderLeft: '4px solid #ff9800' }}>

                  <td>

                    <div className="d-flex align-items-center gap-2">

                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>

                        {c.full_name?.charAt(0) || 'C'}

                      </div>

                      <div>

                        <div className="fw-bold text-dark" style={{ fontSize: '.85rem' }}>{c.full_name}</div>

                        <div className="text-muted" style={{ fontSize: '11px' }}>{c.email}</div>

                      </div>

                    </div>

                  </td>

                  <td>

                    <div className="fw-bold" style={{ fontSize: '.82rem' }}>{c.cin}</div>

                    <div className="text-muted" style={{ fontSize: '11px' }}>{c.phone}</div>

                  </td>

                  <td style={{ fontSize: '.82rem' }}>{c.city}, {c.governorate}</td>

                  <td style={{ fontSize: '.78rem', color: '#888' }}>{formatDate(c.date_joined)}</td>

                  <td>

                    {c.is_active

                      ? <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '10px' }}><i className="fas fa-user-check me-1"></i>Actif</span>

                      : <span className="badge" style={{ background: '#ffebee', color: '#c62828', fontSize: '10px' }}><i className="fas fa-user-slash me-1"></i>Bloqué</span>

                    }

                    {(c.cin_front || c.cin_back) && (

                      <span className="badge ms-1" style={{ background: '#fff3e0', color: '#e65100', fontSize: '10px' }}><i className="fas fa-id-card me-1"></i>CIN disponible</span>

                    )}

                  </td>

                  <td>

                    <div className="d-flex gap-2">

                      <button

                        className="btn btn-sm btn-success"

                        title="Vérifier ce compte"

                        onClick={e => { e.stopPropagation(); if (window.confirm(`Vérifier le compte de "${c.full_name}" ?`)) handleAgentCitizenAction(c.id, 'verify') }}

                      >

                        <i className="fas fa-check me-1"></i> Vérifier

                      </button>

                      <button

                        className={`btn btn-sm ${c.is_active ? 'btn-outline-danger' : 'btn-danger'}`}

                        title={c.is_active ? 'Bloquer' : 'Débloquer'}

                        onClick={e => { e.stopPropagation(); handleAgentCitizenAction(c.id, 'toggle_active') }}

                      >

                        <i className={`fas ${c.is_active ? 'fa-user-slash' : 'fa-user-check'}`}></i>

                      </button>

                      {(c.cin_front || c.cin_back) && (

                        <button

                          className="btn btn-sm btn-outline-primary"

                          title="Voir CIN"

                          onClick={e => { e.stopPropagation(); setSelectedCitizen(c) }}

                        >

                          <i className="fas fa-id-card"></i>

                        </button>

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



    {/* ── Citizen Detail / CIN Modal ── */}

    {selectedCitizen && (

      <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.55)' }} onClick={() => setSelectedCitizen(null)}>

        <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>

          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14, overflow: 'hidden' }}>

            <div className="ag-modal-hdr" style={{ background: 'linear-gradient(90deg,#1b5e20,#388e3c)' }}>

              <span className="title"><i className="fas fa-user-check me-2"></i>Fiche Citoyen — {selectedCitizen.full_name}</span>

              <button className="ag-close-btn" onClick={() => setSelectedCitizen(null)}><i className="fas fa-times"></i></button>

            </div>

            <div className="modal-body p-4">

              <div className="row g-3 mb-4">

                <div className="col-md-6">

                  <div className="p-3 border rounded bg-light">

                    <div className="det-label">Nom complet</div>

                    <div className="det-value">{selectedCitizen.full_name}</div>

                  </div>

                </div>

                <div className="col-md-6">

                  <div className="p-3 border rounded bg-light">

                    <div className="det-label">Email</div>

                    <div className="det-value">{selectedCitizen.email}</div>

                  </div>

                </div>

                <div className="col-md-4">

                  <div className="p-3 border rounded bg-light">

                    <div className="det-label">CIN</div>

                    <div className="det-value fw-bold">{selectedCitizen.cin}</div>

                  </div>

                </div>

                <div className="col-md-4">

                  <div className="p-3 border rounded bg-light">

                    <div className="det-label">Téléphone</div>

                    <div className="det-value">{selectedCitizen.phone}</div>

                  </div>

                </div>

                <div className="col-md-4">

                  <div className="p-3 border rounded bg-light">

                    <div className="det-label">Date de naissance</div>

                    <div className="det-value">{selectedCitizen.date_of_birth ? formatDate(selectedCitizen.date_of_birth) : '—'}</div>

                  </div>

                </div>

                <div className="col-md-6">

                  <div className="p-3 border rounded bg-light">

                    <div className="det-label">Ville / Gouvernorat</div>

                    <div className="det-value">{selectedCitizen.city}, {selectedCitizen.governorate}</div>

                  </div>

                </div>

                <div className="col-md-6">

                  <div className="p-3 border rounded bg-light">

                    <div className="det-label">Lieu de naissance</div>

                    <div className="det-value">{selectedCitizen.place_of_birth || '—'}</div>

                  </div>

                </div>

              </div>



              {/* CIN Images */}

              {(selectedCitizen.cin_front || selectedCitizen.cin_back) && (

                <>

                  <hr />

                  <div className="fw-bold mb-3" style={{ color: '#1b5e20' }}><i className="fas fa-id-card me-2"></i>Photos du CIN</div>

                  <div className="row g-3">

                    {selectedCitizen.cin_front && (

                      <div className="col-md-6">

                        <div className="text-center">

                          <div className="text-muted small fw-bold mb-2">RECTO</div>

                          <img

                            src={selectedCitizen.cin_front}

                            alt="CIN Recto"

                            style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, border: '2px solid #e0e0e0', cursor: 'zoom-in', background: '#f5f5f5' }}

                            onClick={() => setEnlargedCitizenImage(selectedCitizen.cin_front)}

                          />

                        </div>

                      </div>

                    )}

                    {selectedCitizen.cin_back && (

                      <div className="col-md-6">

                        <div className="text-center">

                          <div className="text-muted small fw-bold mb-2">VERSO</div>

                          <img

                            src={selectedCitizen.cin_back}

                            alt="CIN Verso"

                            style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, border: '2px solid #e0e0e0', cursor: 'zoom-in', background: '#f5f5f5' }}

                            onClick={() => setEnlargedCitizenImage(selectedCitizen.cin_back)}

                          />

                        </div>

                      </div>

                    )}

                  </div>

                </>

              )}

              {!selectedCitizen.cin_front && !selectedCitizen.cin_back && (

                <div className="alert alert-warning mt-3" style={{ fontSize: '.83rem' }}>

                  <i className="fas fa-exclamation-triangle me-2"></i>Aucune photo de CIN disponible (déjà vérifiées ou non soumises).

                </div>

              )}

            </div>

            <div className="modal-footer border-top bg-light">

              <button className="btn btn-success px-4" onClick={() => { if (window.confirm(`Vérifier le compte de "${selectedCitizen.full_name}" ?`)) { handleAgentCitizenAction(selectedCitizen.id, 'verify'); } }}>

                <i className="fas fa-check-circle me-2"></i>Confirmer la vérification

              </button>

              <button className="btn btn-outline-secondary" onClick={() => setSelectedCitizen(null)}>Fermer</button>

            </div>

          </div>

        </div>

      </div>

    )}



    {/* Enlarged image overlay */}

    {enlargedCitizenImage && (

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}

        onClick={() => setEnlargedCitizenImage(null)}>

        <img src={enlargedCitizenImage} alt="CIN agrandi" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,.5)' }} />

      </div>

    )}

  </div>

) : activeTab === 'profile' ? (

  <div className="animate__animated animate__fadeIn">

    {/* ── PROFILE CONTENT ── */}

    <div className="ag-card">

      <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(135deg, #1a3a5c, #1565c0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        <span><i className="fas fa-user-circle me-2"></i>{t('profile_personal_info')}</span>

        {!editingProfile ? (

          <button className="btn btn-sm btn-light rounded-pill px-3" style={{ fontSize: '.75rem', fontWeight: 600 }} onClick={() => setEditingProfile(true)}>

            <i className="fas fa-pencil-alt me-1"></i>{t('profile_edit')}

          </button>

        ) : (

          <div className="d-flex gap-2">

            <button className="btn btn-sm btn-success rounded-pill px-3" style={{ fontSize: '.75rem', fontWeight: 600 }} onClick={handleProfileSave} disabled={profileSaving}>

              {profileSaving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-save me-1"></i>{t('profile_save')}</>}

            </button>

            <button className="btn btn-sm btn-outline-light rounded-pill px-3" style={{ fontSize: '.75rem', fontWeight: 600 }} onClick={() => setEditingProfile(false)}>{t('profile_cancel')}</button>

          </div>

        )

        }

      </div>

      <div style={{ padding: '24px 28px' }}>

        {profileSaveSuccess && <div className="alert alert-success py-2 mb-3" style={{ fontSize: '.85rem' }}><i className="fas fa-check-circle me-2"></i>{t('profile_success')}</div>}

        {profileSaveError && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '.85rem' }}><i className="fas fa-exclamation-triangle me-2"></i>{t('profile_error')}</div>}



        <div className="row g-4">

          <div className="col-md-3 text-center border-end">

            <div className="ag-profile-av" style={{ width: 100, height: 100, fontSize: '2.5rem', marginBottom: 15, background: 'var(--green-mid)', margin: '0 auto' }}>{inits}</div>

            <h5 className="mb-1 fw-bold">{fullName}</h5>

            <p className="text-muted small mb-3">{user?.email}</p>

            <span className="badge-role" style={{ background: '#e3f2fd', color: '#1565c0', borderColor: '#1565c0' }}>{getRoleLabel(user, t)}</span>

          </div>

          <div className="col-md-9">

            <div className="row g-3">

              {([

                { lbl: t('first_name'), val: profileForm.first_name, key: 'first_name', icon: 'fa-user' },

                { lbl: t('last_name'), val: profileForm.last_name, key: 'last_name', icon: 'fa-user' },

                { lbl: t('phone_label'), val: profileForm.phone, key: 'phone', icon: 'fa-phone' },

                { lbl: t('city_label'), val: profileForm.city, key: 'city', icon: 'fa-city' },

                { lbl: t('governorate_label'), val: profileForm.governorate, key: 'governorate', icon: 'fa-map-marker-alt' },

                { lbl: t('place_of_birth'), val: profileForm.place_of_birth, key: 'place_of_birth', icon: 'fa-birthday-cake' },

              ] as any[]).map(f => (

                <div key={f.key} className="col-md-6">

                  <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>

                    <i className={`fas ${f.icon} me-1 text-primary opacity-50`}></i>{f.lbl}

                  </label>

                  {editingProfile ? (

                    <input type="text" className="form-control form-control-sm shadow-sm" value={f.val} onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ borderRadius: 8 }} />

                  ) : (

                    <div className="p-2 border-bottom fw-bold" style={{ fontSize: '.9rem', color: '#333' }}>{f.val || '—'}</div>

                  )}

                </div>

              ))}

              <div className="col-12">

                <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>

                  <i className="fas fa-map-pin me-1 text-primary opacity-50"></i>{t('address_label')}

                </label>

                {editingProfile ? (

                  <input type="text" className="form-control form-control-sm shadow-sm" value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} style={{ borderRadius: 8 }} />

                ) : (

                  <div className="p-2 border-bottom fw-bold" style={{ fontSize: '.9rem', color: '#333' }}>{profileForm.address || '—'}</div>

                )}

              </div>

              <div className="col-md-6">

                <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>

                  <i className="fas fa-id-card me-1 text-primary opacity-50"></i>{t('cin_label')}

                </label>

                <div className="p-2 border-bottom text-muted" style={{ fontSize: '.9rem' }}>{(user as any)?.cin || '—'}</div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>



    {/* ── SECTION MES DOSSIERS ── */}

    <div className="mb-4 d-flex align-items-center gap-3 mt-5">

      <div className="rounded-3 p-2 shadow-sm d-flex align-items-center justify-content-center"

        style={{ background: 'linear-gradient(135deg,#2e7d32,#43a047)', color: '#fff', width: 38, height: 38 }}>

        <i className="fas fa-folder-open"></i>

      </div>

      <div>

        <h5 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>{t('profile_dossiers_title')}</h5>

        <p className="text-muted small mb-0">{t('profile_dossiers_desc')}</p>

      </div>

    </div>

    <div className="row g-3">

      {[

        { lbl: t('profile_signalements_pending'), val: pending, icon: 'fa-clock', color: '#e65100', bg: '#fff3e0', action: 'dashboard' },

        { lbl: t('profile_signalements_inprog'), val: inprog, icon: 'fa-tasks', color: '#1565c0', bg: '#e3f2fd', action: 'dashboard' },

        { lbl: t('profile_demandes_admin'), val: allDemandes.length, icon: 'fa-users', color: '#2e7d32', bg: '#e8f5e9', action: 'demandes' },

        { lbl: t('nav_forum_moderation'), val: allTopics.length, icon: 'fa-comments', color: '#6a1b9a', bg: '#f3e5f5', action: 'forum' },

      ].map(c => (

        <div key={c.lbl} className="col-6 col-md-3">

          <div className="ag-card" style={{ cursor: 'pointer', borderLeft: `4px solid ${c.color}`, height: '100%' }} onClick={() => { setActiveTab(c.action as any); if (c.action === 'demandes') fetchDemandes(); if (c.action === 'forum') fetchTopics() }}>

            <div className="ag-card-body d-flex align-items-center gap-2">

              <div className="icon-box" style={{ background: c.bg, width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>

                <i className={`fas ${c.icon}`} style={{ color: c.color, fontSize: '1rem' }}></i>

              </div>

              <div className="overflow-hidden">

                <div className="h5 mb-0 fw-bold">{c.val}</div>

                <div className="text-muted text-truncate" style={{ fontSize: '.7rem' }}>{c.lbl}</div>

              </div>

            </div>

          </div>

        </div>

      ))}

    </div>

  </div>

) : activeTab === 'actualites' ? (

  <div className="ag-card animate__animated animate__fadeIn">

    <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', borderBottom: 'none' }}>

      <div className="d-flex align-items-center gap-2">

        <div className="ag-icon-box" style={{ background: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          <i className="fas fa-newspaper" style={{ fontSize: 16 }}></i>

        </div>

        <span className="fw-bold">{lang === 'ar' ? 'إدارة الأخبار' : 'Gestion des Actualités'}</span>

      </div>

      <button className="btn btn-sm btn-light rounded-pill px-3 fw-bold" onClick={() => { setEditingArticle(null); setArticleForm({ title: '', content: '', is_published: true }); setShowAddArticleModal(true); }}>

        <i className="fas fa-plus me-1"></i> {lang === 'ar' ? 'إضافة خبر' : 'Nouveau'}

      </button>

    </div>

    <div className="ag-card-body p-0">

      {loadingArticles ? (

        <div className="p-4 text-center"><div className="spinner-border text-primary"></div></div>

      ) : (

        <div className="table-responsive">

          <table className="ag-table align-middle">

            <thead>

              <tr>

                <th className="ps-4">Contenu</th>

                <th className="text-center">Statut</th>

                <th>Publié le</th>

                <th className="text-end pe-4">Actions</th>

              </tr>

            </thead>

            <tbody>

              {allArticles.map((art: any) => (

                <tr key={art.id} className="ag-row-hover">

                  <td className="ps-4 py-3">

                    <div className="fw-bold text-dark">{art.title}</div>

                    <div className="text-muted small text-truncate" style={{ maxWidth: 300 }}>{art.content}</div>

                  </td>

                  <td className="text-center">

                    {art.is_published ? (

                      <span className="badge bg-success-soft text-success rounded-pill px-3 py-2"><i className="fas fa-check-circle me-1"></i>En ligne</span>

                    ) : (

                      <span className="badge bg-warning-soft text-warning rounded-pill px-3 py-2"><i className="fas fa-clock me-1"></i>Brouillon</span>

                    )}

                  </td>

                  <td>

                    <div className="text-muted small"><i className="far fa-calendar-alt me-1"></i>{formatDate(art.created_at)}</div>

                  </td>

                  <td className="text-end pe-4">

                    <div className="d-flex justify-content-end gap-2">

                      <button className="ag-btn-icon" onClick={() => { setEditingArticle(art); setArticleForm({ title: art.title, content: art.content, is_published: art.is_published }); setShowAddArticleModal(true); }}>

                        <i className="fas fa-edit"></i>

                      </button>

                      <button className="ag-btn-icon text-danger" onClick={() => deleteArticle(art.id)}>

                        <i className="fas fa-trash"></i>

                      </button>

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

) : activeTab === 'config' ? (

  <div className="ag-card animate__animated animate__fadeIn">

    <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(135deg, #334155 0%, #475569 100%)', borderBottom: 'none' }}>

      <div className="d-flex align-items-center gap-2">

        <div className="ag-icon-box" style={{ background: 'rgba(255,255,255,0.15)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          <i className="fas fa-cogs" style={{ fontSize: 16 }}></i>

        </div>

        <span className="fw-bold">Configuration du Portail</span>

      </div>

    </div>

    <div className="ag-card-body p-4 bg-light bg-opacity-10">

      <div className="row g-4">

        <div className="col-md-7">

          <div className="p-4 bg-white rounded-4 shadow-sm border">

            <h6 className="fw-bold mb-4 text-primary"><i className="fas fa-globe me-2"></i>Paramètres Généraux</h6>

            <div className="mb-4">

              <label className="det-label mb-2">Nom de la Plateforme Smart City</label>

              <input className="form-control form-control-lg border-2" value={globalSettings.site_name} onChange={e => setGlobalSettings({ ...globalSettings, site_name: e.target.value })} />

            </div>

            <div className="mb-4">

              <label className="det-label mb-2">Email Administrative Contact</label>

              <input className="form-control border-2" value={globalSettings.contact_email} onChange={e => setGlobalSettings({ ...globalSettings, contact_email: e.target.value })} />

            </div>

          </div>

        </div>

        <div className="col-md-5">

          <div className="p-4 bg-white rounded-4 shadow-sm border h-100">

            <h6 className="fw-bold mb-4 text-danger"><i className="fas fa-exclamation-triangle me-2"></i>Contrôles Système</h6>

            <div className="form-check form-switch custom-switch py-2">

              <input className="form-check-input" type="checkbox" id="maintSwitch" checked={globalSettings.maintenance_mode} onChange={e => setGlobalSettings({ ...globalSettings, maintenance_mode: e.target.checked })} />

              <label className="form-check-label fw-bold ms-2" htmlFor="maintSwitch">Mode Maintenance</label>

              <p className="text-muted small mt-2 mb-0">Suspend l'accès citoyen pour les interventions techniques prévues.</p>

            </div>

            <hr className="my-4" />

            <div className="d-grid pt-2">

              <button className="btn btn-primary btn-lg rounded-pill shadow-sm" onClick={handleSaveConfig} disabled={configSaving}>

                {configSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}

                {lang === 'ar' ? 'حفظ التغييرات' : 'Enregistrer'}

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

) : null}

{/* Article Add/Edit Modal */ }

{
  showAddArticleModal && (

    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>

      <div className="modal-dialog">

        <div className="modal-content">

          <div className="modal-header">

            <h5 className="modal-title">{editingArticle ? 'Modifier l\'article' : 'Ajouter un article'}</h5>

            <button type="button" className="btn-close" onClick={() => setShowAddArticleModal(false)}></button>

          </div>

          <div className="modal-body">

            <div className="mb-3">

              <label className="form-label">Titre</label>

              <input className="form-control" value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} />

            </div>

            <div className="mb-3">

              <label className="form-label">Image de couverture</label>

              <input type="file" className="form-control" onChange={e => setArticleImage(e.target.files?.[0] || null)} />

            </div>

            <div className="mb-3">

              <label className="form-label">Contenu</label>

              <textarea className="form-control" rows={5} value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })}></textarea>

            </div>

            <div className="form-check">

              <input className="form-check-input" type="checkbox" checked={articleForm.is_published} onChange={e => setArticleForm({ ...articleForm, is_published: e.target.checked })} />

              <label className="form-check-label">Publier immédiatement</label>

            </div>

          </div>

          <div className="modal-footer">

            <button className="btn btn-secondary" onClick={() => setShowAddArticleModal(false)}>Annuler</button>

            <button className="btn btn-primary" onClick={handleSaveArticle}>Enregistrer</button>

          </div>

        </div>

      </div>

    </div>

  )
}



{
  activeTab === 'evenements' && evDetail && (

    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>

      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>

        <div className="ag-modal-hdr" style={{ background: 'linear-gradient(90deg,#1a3a5c,#6f42c1)', borderRadius: '16px 16px 0 0' }}>

          <span className="title"><i className="fas fa-calendar-alt me-2"></i>{evDetail.titre_evenement}</span>

          <button className="ag-close-btn" onClick={() => setEvDetail(null)}><i className="fas fa-times"></i></button>

        </div>

        <div className="p-4">

          <div className="row g-3 mb-3">

            <div className="col-6">

              <div className="det-label">{t('event_type')}</div>

              <div className="det-value">{evDetail.type_evenement_display}</div>

            </div>

            <div className="col-6">

              <div className="det-label">{t('event_organizer')}</div>

              <div className="det-value">{evDetail.nom_organisateur} — {evDetail.telephone_organisateur}</div>

            </div>

            <div className="col-6">

              <div className="det-label">{t('event_place')}</div>

              <div className="det-value">{evDetail.lieu_type_display} — {evDetail.lieu_details}</div>

            </div>

            <div className="col-6">

              <div className="det-label">{t('event_dates')}</div>

              <div className="det-value">{evDetail.date_debut} → {evDetail.date_fin}</div>

              <div className="det-value" style={{ fontSize: '.83rem', color: '#777' }}>{evDetail.heure_debut?.slice(0, 5)} — {evDetail.heure_fin?.slice(0, 5)}</div>

            </div>

            <div className="col-6">

              <div className="det-label">{t('event_participants')}</div>

              <div className="det-value">{evDetail.nombre_participants}</div>

            </div>

            <div className="col-6">

              <div className="det-label">{t('event_cin_organizer')}</div>

              <div className="det-value">{evDetail.cin_organisateur}</div>

            </div>

            <div className="col-12">

              <div className="det-label">{t('event_description')}</div>

              <div className="det-value" style={{ lineHeight: 1.7, fontSize: '.88rem' }}>{evDetail.description}</div>

            </div>

            {evDetail.has_conflict && (

              <div className="col-12">

                <div className="p-3 rounded-3 d-flex gap-2 align-items-start" style={{ background: '#fff8e1', border: '1px solid #ffe082', fontSize: '.85rem', color: '#e65100' }}>

                  <i className="fas fa-exclamation-triangle mt-1"></i>

                  <div>

                    <strong>{t('event_conflict_detected')}</strong> — {t('event_conflict_detected_long')}

                    {evDetail.conflict_with_title && <span> {t('event_conflict_with')} <em>« {evDetail.conflict_with_title} »</em></span>}

                  </div>

                </div>

              </div>

            )}

          </div>



          {/* Documents Section */}

          <div className="mb-3">

            <div className="det-label mb-2">{t('event_docs')}</div>

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



          <hr />

          <div className="mb-3">

            <label className="det-label mb-2">{t('event_comment_label')}</label>

            <textarea className="form-control mt-1" rows={3} id="ev-detail-comment"

              defaultValue={evDetail.commentaire_agent}

              placeholder={t('event_comment_placeholder')} />

          </div>



          <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">

            <span className="text-muted small">{t('event_current_status')} :</span>

            {(() => {

              const cfg: Record<string, { cls: string; icon: string }> = {

                pending: { cls: 'bg-warning text-dark', icon: 'fa-hourglass-half' },

                in_progress: { cls: 'bg-info text-white', icon: 'fa-spinner' },

                approved: { cls: 'bg-success text-white', icon: 'fa-check-circle' },

                rejected: { cls: 'bg-danger text-white', icon: 'fa-times-circle' },

                changes_requested: { cls: 'bg-warning text-dark', icon: 'fa-edit' },

              }

              const c = cfg[evDetail.status] || { cls: 'bg-secondary text-white', icon: 'fa-question' }

              return (

                <span className={`badge rounded-pill px-3 py-2 ${c.cls}`} style={{ fontSize: '.8rem' }}>

                  <i className={`fas ${c.icon} me-1`}></i>{evDetail.status_display}

                </span>

              )

            })()}

          </div>



          <div className="d-flex gap-2 flex-wrap mt-2">

            <button className="btn btn-success rounded-pill px-4 fw-bold flex-fill" disabled={evSaving}

              onClick={() => {

                const txt = document.getElementById('ev-detail-comment') as HTMLTextAreaElement

                handleEvStatus(evDetail.id, 'approved', txt?.value || '')

              }}

              title={t('event_approve_btn_title')}>

              {evSaving

                ? <span className="spinner-border spinner-border-sm"></span>

                : <><i className="fas fa-check-circle me-2"></i>{t('event_approve_btn')}</>

              }

            </button>

            <button className="btn btn-warning rounded-pill px-4 fw-bold flex-fill text-dark" disabled={evSaving}

              onClick={() => {

                const txt = document.getElementById('ev-detail-comment') as HTMLTextAreaElement

                if (!txt?.value?.trim()) { txt?.focus(); showToast('Merci d\'indiquer une raison.', 'warning'); return; }

                handleEvStatus(evDetail.id, 'changes_requested', txt.value)

              }}

              title={t('event_modify_btn_title')}>

              {evSaving

                ? <span className="spinner-border spinner-border-sm"></span>

                : <><i className="fas fa-edit me-2"></i>{t('event_modify_btn')}</>

              }

            </button>

            <button className="btn btn-danger rounded-pill px-4 fw-bold flex-fill" disabled={evSaving}

              onClick={() => {

                const txt = document.getElementById('ev-detail-comment') as HTMLTextAreaElement

                handleEvStatus(evDetail.id, 'rejected', txt?.value || '')

              }}

              title={t('event_reject_btn_title')}>

              {evSaving

                ? <span className="spinner-border spinner-border-sm"></span>

                : <><i className="fas fa-times-circle me-2"></i>{t('event_reject_btn')}</>

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

              title={t('event_process_btn_title')}>

              <i className="fas fa-spinner me-2"></i>{t('event_process_btn')}

            </button>

            <button className="btn btn-link text-muted text-decoration-none" onClick={() => setEvDetail(null)}>

              {t('event_close_btn')}

            </button>

          </div>

        </div>

      </div>

    </div>

  )
}



<div className="ag-toast-container">

  {toasts.map(t => <div key={t.id} className={`ag-toast ${t.type}`}><i className={`fas fa-${t.type === 'success' ? 'check-circle' : 'exclamation-circle'} ticon`}></i><span>{t.msg}</span></div>)}

</div>

{
  detailRec && (

    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}

      onClick={e => { if (e.target === e.currentTarget) setDetailRec(null) }}>

      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>

        <div className="ag-modal-hdr"><div className="title"><i className="fas fa-file-alt me-2"></i>{t('reclamation_detail_title')}</div><button className="ag-close-btn" onClick={() => setDetailRec(null)}><i className="fas fa-times"></i></button></div>

        <div style={{ padding: 24 }}>

          <div className="row g-3">

            <div className="col-md-8">

              <div className="mb-3"><div className="det-label">{t('reclamation_title_label')}</div><div className="det-value">{detailRec.title}</div></div>

              <div className="mb-3"><div className="det-label">{t('reclamation_description_label')}</div><div className="det-value" style={{ lineHeight: 1.6 }}>{detailRec.description || '—'}</div></div>

              <div className="row g-2 mb-3">

                <div className="col-6"><div className="det-label">Catégorie</div><div className="det-value"><span className={`cat-badge ${(CAT[detailRec.category] || CAT.other).cls}`}>{(CAT[detailRec.category] || CAT.other).label}</span></div></div>

                <div className="col-6"><div className="det-label">Statut actuel</div><div className="det-value"><span className={`status-badge ${(STATUS[detailRec.status] || STATUS.pending).cls}`}>{(STATUS[detailRec.status] || STATUS.pending).label}</span></div></div>

              </div>

              <div className="row g-2 mb-3">

                <div className="col-6">

                  <div className="det-label">{t('reclamation_priority_label')}</div>

                  <div className="det-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

                    <span className={`priority-badge ${(PRIORITY[detailRec.priority] || PRIORITY.normale).cls}`}>{(PRIORITY[detailRec.priority] || PRIORITY.normale).label}</span>

                    {detailRec.confidence?.priority !== undefined && (

                      <span className={`conf-badge ${detailRec.confidence.priority >= 0.80 ? 'conf-high' : detailRec.confidence.priority >= 0.60 ? 'conf-med' : 'conf-low'}`}>

                        🤖 {Math.round(detailRec.confidence.priority * 100)}%

                      </span>

                    )}

                    <button

                      onClick={() => setShowExplainModal(true)}

                      title="Voir l'explication LIME + SHAP de la priorité IA"

                      style={{

                        background: 'linear-gradient(135deg,#1565c0,#1a3a5c)',

                        color: '#fff', border: 'none', borderRadius: '6px',

                        padding: '3px 10px', fontSize: '0.72rem', cursor: 'pointer',

                        display: 'inline-flex', alignItems: 'center', gap: '4px',

                        fontWeight: 600, whiteSpace: 'nowrap',

                      }}

                    >

                      🔍 Expliquer l'IA

                    </button>

                  </div>

                </div>

                <div className="col-6"><div className="det-label">Service responsable</div><div className="det-value" style={{ fontSize: '.82rem' }}>{detailRec.service_responsable || '—'}</div></div>

              </div>

              <div className="row g-2 mb-3">

                <div className="col-6"><div className="det-label">Citoyen</div><div className="det-value">{detailRec.citizen_name || '—'}</div></div>

                <div className="col-6"><div className="det-label">Date de signalement</div><div className="det-value">{formatDate(detailRec.created_at)}</div></div>

              </div>

              {detailRec.image && <div><div className="det-label mb-2">{t('reclamation_photo_label')}</div><img src={detailRec.image} style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }} alt="Photo" /></div>}

              {/* ── Manual reclassify panel ─────────────────────── */}

              {(detailRec.confidence?.category !== undefined && detailRec.confidence.category < 0.60) || true ? (

                <div className="reclassify-box">

                  <div className="rc-title"><i className="fas fa-robot me-1"></i>Correction manuelle de la classification IA</div>

                  {detailRec.confidence?.category !== undefined && detailRec.confidence.category < 0.60 && (

                    <div style={{ fontSize: '.75rem', color: '#b71c1c', marginBottom: 8, background: '#fce4ec', padding: '4px 8px', borderRadius: 6 }}>

                      ⚠️ {t('reclassify_low_conf')} ({Math.round(detailRec.confidence.category * 100)}%) — {t('admin_check_classification')}

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

                    {reClsSaving ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('registration_in_progress')}</> : <><i className="fas fa-edit me-1"></i>Appliquer la correction</>}

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

                {detailSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('registration_in_progress')}</> : <><i className="fas fa-save me-2"></i>{t('save_label')}</>}

              </button>

              <div style={{ height: 180, marginTop: 14, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                <span style={{ color: '#aaa', fontSize: '.8rem' }}><i className="fas fa-map-pin me-1"></i>Pas de coordonnées</span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  )
}



{/* ── PRIORITY EXPLANATION MODAL (LIME + SHAP) ── */ }

{
  showExplainModal && detailRec && (

    <PriorityExplanationModal

      reclamationId={detailRec.id}

      reclamationTitle={detailRec.title}

      token={getAccessToken() || ''}

      onClose={() => setShowExplainModal(false)}

    />

  )
}

{/* ── CITIZEN VERIFICATION MODAL ── */ }

{
  selectedUser && (

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

                        <div onClick={() => setEnlargedImage(selectedUser.cin_back)} style={{ cursor: 'zoom-in' }}>

                          <img src={selectedUser.cin_back} className="rounded shadow-sm scale-on-hover" style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="Back CIN" />

                        </div>

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

  )
}



{/* MODAL: RESET PASSWORD RESULT */ }

{
  resetPwdResult && (

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

  )
}



{/* MODAL: IMAGE ZOOM VIEWER */ }

{
  enlargedImage && (

    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}

      onClick={() => setEnlargedImage(null)}>

      <button style={{ position: 'absolute', top: 20, right: 20, background: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', zIndex: 5001 }}>

        <i className="fas fa-times text-dark"></i>

      </button>

      <img src={enlargedImage} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, boxShadow: '0 0 30px rgba(0,0,0,.5)', objectFit: 'contain' }} alt="Zoomed" />

    </div>

  )
}



{/* ── FORUM TOPIC DETAIL / CHAT MODAL ── */ }

{
  forumTopicSelected && (() => {

    const t = forumTopicSelected

    const authName = (u: any) => u ? (`${u.first_name} ${u.last_name}`.trim() || u.email) : 'Chargement...'

    const isOfficial = (u: any) => u?.user_type === 'agent' || u?.user_type === 'supervisor' || u?.is_staff || u?.is_superuser



    return (

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}

        onClick={e => e.target === e.currentTarget && setForumTopicSelected(null)}>

        <div className="animate__animated animate__fadeInUp" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 70px rgba(0,0,0,.35)', overflow: 'hidden' }}>



          {/* Header */}

          <div className="p-4 text-white d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg,#311b92,#5e35b1)', flexShrink: 0 }}>

            <div className="d-flex align-items-center gap-3">

              <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>

                <i className="fas fa-comments"></i>

              </div>

              <div>

                <h5 className="mb-0 fw-bold">{t.title}</h5>

                <div className="small opacity-75">{t.replies?.length || 0} intervention(s) · {t.views} vues</div>

              </div>

            </div>

            <button className="bg-transparent border-0 text-white opacity-50" onClick={() => setForumTopicSelected(null)} style={{ transition: 'all .2s', cursor: 'pointer', fontSize: '1.5rem' }}>

              <i className="fas fa-times"></i>

            </button>

          </div>



          {/* Chat Body */}

          <div className="flex-fill p-4 overflow-auto bg-light" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>



            {/* Original Post */}

            <div className="d-flex gap-3">

              <div className="flex-shrink-0" style={{ width: 44, height: 44, background: '#ede7f6', borderRadius: '50%', color: '#311b92', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>

                {initials(authName(t.author))}

              </div>

              <div style={{ flex: 1 }}>

                <div className="p-3 bg-white shadow-sm" style={{ borderRadius: '0 18px 18px 18px', borderLeft: '4px solid #311b92' }}>

                  <div className="d-flex justify-content-between align-items-center mb-2">

                    <span className="fw-bold" style={{ color: '#311b92', fontSize: '.9rem' }}>{authName(t.author)} <span className="ms-1 badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: '9px' }}>AUTEUR</span></span>

                    <span className="text-muted small">{formatDate(t.created_at)}</span>

                  </div>

                  <div style={{ fontSize: '.95rem', color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{t.content}</div>

                  <div className="mt-3 d-flex align-items-center gap-3 border-top pt-2">

                    <button className={`btn btn-sm p-0 border-0 ${t.has_voted ? 'text-danger' : 'text-muted'}`} onClick={() => toggleForumTopicVote(t.id)}>

                      <i className={`${t.has_voted ? 'fas' : 'far'} fa-heart me-1`}></i> {t.votes_count} <span className="small">Réactions</span>

                    </button>

                  </div>

                </div>

              </div>

            </div>



            {/* Replies separator */}

            <div className="d-flex align-items-center gap-3">

              <div style={{ flex: 1, height: 1, background: '#dee2e6' }}></div>

              <div className="small fw-bold text-muted text-uppercase" style={{ letterSpacing: 1 }}>Réponses</div>

              <div style={{ flex: 1, height: 1, background: '#dee2e6' }}></div>

            </div>



            {/* Replies mapping */}

            {(t.replies || []).length === 0 ? (

              <div className="text-center py-5">

                <div className="opacity-25" style={{ fontSize: '3rem' }}><i className="fas fa-comment-slash"></i></div>

                <div className="text-muted mt-2 small">Aucune réponse pour le moment sur ce sujet.</div>

              </div>

            ) : t.replies.map((r: any) => {

              const agent = isOfficial(r.author)

              return (

                <div key={r.id} className={`d-flex gap-3 ${agent ? 'flex-row-reverse' : ''}`}>

                  <div className="flex-shrink-0" style={{ width: 40, height: 40, background: agent ? '#4527a0' : '#cfd8dc', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '.9rem', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>

                    {initials(authName(r.author))}

                  </div>

                  <div style={{ flex: 1, maxWidth: '85%' }}>

                    <div className={`p-3 shadow-sm ${agent ? 'bg-indigo-light text-end' : 'bg-white'}`} style={{

                      borderRadius: agent ? '18px 0 18px 18px' : '0 18px 18px 18px',

                      background: agent ? '#f5f7ff' : '#fff',

                      borderLeft: agent ? 'none' : '3px solid #dee2e6',

                      borderRight: agent ? '3px solid #311b92' : 'none',

                    }}>

                      <div className={`d-flex justify-content-between align-items-center mb-1 ${agent ? 'flex-row-reverse' : ''}`}>

                        <span className="fw-bold" style={{ fontSize: '.85rem', color: agent ? '#311b92' : '#555' }}>

                          {authName(r.author)} {agent && <span className="badge bg-primary ms-1" style={{ fontSize: '9px' }}>OFFICIEL</span>}

                        </span>

                        <span className="text-muted" style={{ fontSize: '10px' }}>{formatDate(r.created_at)}</span>

                      </div>

                      <div style={{ fontSize: '.9rem', color: '#444', lineHeight: 1.5 }}>{r.content}</div>

                      <div className={`mt-2 d-flex align-items-center ${agent ? 'justify-content-end' : ''}`}>

                        <button className={`btn btn-sm p-0 border-0 ${r.has_voted ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '11px' }} onClick={() => toggleForumReplyVote(r.id)}>

                          <i className={`${r.has_voted ? 'fas' : 'far'} fa-heart me-1`}></i> {r.votes_count || 0}

                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )

            })}

          </div>



          {/* Footer / Input */}

          <div className="p-4 bg-white border-top shadow-sm" style={{ flexShrink: 0 }}>

            <div className="d-flex align-items-center gap-3">

              <div style={{ flex: 1, position: 'relative' }}>

                <textarea

                  className="form-control border-0 bg-light rounded-4 px-4 py-3"

                  rows={1}

                  placeholder="Écrivez une réponse officielle..."

                  style={{ resize: 'none', fontSize: '.95rem', minHeight: '56px', maxHeight: '150px' }}

                  value={forumReplyText}

                  onChange={e => setForumReplyText(e.target.value)}

                  onKeyDown={e => {

                    if (e.key === 'Enter' && !e.shiftKey) {

                      e.preventDefault(); postForumReply();

                    }

                  }}

                />

              </div>

              <button

                className={`btn btn-primary rounded-circle d-flex align-items-center justify-content-center ${!forumReplyText.trim() || postingForumReply ? 'disabled' : ''}`}

                style={{ width: 52, height: 52, fontSize: '1.2rem', transition: 'all .2s' }}

                onClick={postForumReply}

                disabled={!forumReplyText.trim() || postingForumReply}

              >

                {postingForumReply ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}

              </button>

            </div>

            <div className="text-muted mt-2 ms-2 small d-flex align-items-center gap-1">

              <i className="fas fa-info-circle"></i>

              <span>Votre réponse sera identifiée comme un commentaire <strong>officiel</strong> de la mairie.</span>

            </div>

          </div>

        </div>

      </div>

    )

  })()
}



{/* MODAL: ADD USER (AGENT/SUPERVISOR) */ }

{
  showAddUserModal && (

    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

      <div className="bg-white rounded-3 shadow-lg overflow-hidden" style={{ width: '100%', maxWidth: '450px' }}>

        <div className="p-3 bg-dark text-white d-flex justify-content-between align-items-center">

          <h6 className="mb-0 fw-bold"><i className="fas fa-user-plus me-2"></i>{t('add_collaborator')}</h6>

          <button className="btn-close btn-close-white" onClick={() => setShowAddUserModal(false)}></button>

        </div>

        <form className="p-4" onSubmit={async (e) => {

          e.preventDefault();

          const fd = new FormData(e.currentTarget);

          const data = Object.fromEntries(fd.entries());

          try {

            const res = await fetch(resolveBackendUrl('/api/accounts/admin-create/'), {

              method: 'POST',

              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },

              body: JSON.stringify(data)

            });

            if (res.ok) { showToast(t('user_created_success')); setShowAddUserModal(false); fetchManagedUsers('all') }

            else { const err = await res.json(); showToast(err.error || t('error_msg'), 'error') }

          } catch { showToast(t('error_msg'), 'error') }

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

          <div className="d-grid"><button className="btn btn-dark" type="submit">{t('create_account_btn')}</button></div>

        </form>

      </div>

    </div>

  )
}



{/* MODAL: ADD SERVICE */ }

{
  showAddServiceModal && (

    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

      <div className="bg-white rounded-3 shadow-lg overflow-hidden animate__animated animate__zoomIn" style={{ width: '100%', maxWidth: '650px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>

        <div className="p-3 text-white d-flex justify-content-between align-items-center" style={{ background: editingService ? 'linear-gradient(90deg,#003366,#004080)' : 'linear-gradient(90deg,#1e3c72,#2a5298)' }}>

          <h6 className="mb-0 fw-bold"><i className={`fas ${editingService ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>{editingService ? `${t('edit_label')} : ${lang === 'ar' ? (editingService.name_ar || editingService.name_fr) : editingService.name_fr}` : t('new_municipal_service')}</h6>

          <button className="btn-close btn-close-white" onClick={() => { setShowAddServiceModal(false); setEditingService(null); setServiceReqs([]); setServicePdfAr(null); setServicePdfFr(null); setMagicServiceText(''); }}></button>

        </div>



        {/* Assistant de Saisie Rapide (Magic Input) */}

        <div className="p-3 border-bottom" style={{ background: '#f0f4f8' }}>

          <div className="d-flex gap-2 align-items-end">

            <div className="flex-fill">

              <label className="small fw-bold text-primary mb-1"><i className="fas fa-magic me-1"></i>{t('magic_input_label')}</label>

              <textarea

                className="form-control form-control-sm"

                rows={2}

                placeholder="Ex: Demande de parking, 3 jours, catégorie Urbanisme, papiers: CIN, Photo, Certificat"

                value={magicServiceText}

                onChange={e => setMagicServiceText(e.target.value)}

              />

            </div>

            <button type="button" className="btn btn-primary btn-sm px-3 shadow-sm" style={{ height: '38px', fontWeight: 700 }}

              onClick={() => {

                const text = magicServiceText.trim(); if (!text) return;



                // 1. Détection du Nom (premier segment avant la virgule)

                const parts = text.split(',').map(p => p.trim());

                const name = parts[0].replace(/Nom:\s*/i, '').trim();



                // 2. Détection du Délai (recherche de chiffres suivis d'unités de temps)

                const delayMatch = text.match(/([0-9]+\s*(?:jours?|semaines?|mois?|heures?|h|hr))/i);

                const delay = delayMatch ? delayMatch[1] : '';



                // 3. Détection de la Catégorie par mots-clés

                const catKeywords: Record<string, string[]> = {

                  'Urbanisme': ['construction', 'batir', 'bâtir', 'permis', 'plan', 'terrain', 'propriétaire', 'proprietaire', 'titre bleu', 'étage', 'logement'],

                  'Etat Civil': ['naissance', 'mariage', 'décès', 'deces', 'extrait', 'cin', 'famille', 'divorce'],

                  'Finance': ['taxe', 'impôt', 'fiscal', 'paiement', 'redevance'],

                  'Environnement': ['déchet', 'jardin', 'nettoyage', 'arbre', 'hygiène', 'propreté'],

                  'Affaires Sociales': ['aide', 'handicap', 'social', 'souk', 'commerce'],

                };



                let foundCat = allCategories.find(c => text.toLowerCase().includes(c.name_fr.toLowerCase()));

                if (!foundCat) {

                  for (const [catName, kwds] of Object.entries(catKeywords)) {

                    if (kwds.some(k => text.toLowerCase().includes(k))) {

                      foundCat = allCategories.find(c =>

                        c.name_fr.toLowerCase() === catName.toLowerCase() ||

                        c.name_fr.toLowerCase().includes(catName.toLowerCase())

                      );

                      if (foundCat) break;

                    }

                  }

                }

                const catId = foundCat ? foundCat.id.toString() : '';



                // 4. Détection des Documents Requis

                let reqs: any[] = [];

                // Recherche après des termes comme "documents", "papiers", " requis", "pièces"

                const reqMatch = text.match(/(?:papiers?|documents?|pièces?|requis?)(?:\s+requis)?\s*[:\-]?\s*(.+)$/i);

                const reqPart = reqMatch ? reqMatch[1] : '';



                if (reqPart) {

                  reqs = reqPart.split(/,|et|;/).map(r => r.trim()).filter(Boolean)

                    .map(r => ({ name_fr: r, name_ar: r, is_mandatory: true }));

                }



                const form = document.getElementById('service-form') as HTMLFormElement;

                if (form) {

                  const nameFrInput = form.querySelector('[name=name_fr]') as HTMLInputElement;

                  const nameArInput = form.querySelector('[name=name_ar]') as HTMLInputElement;

                  const delayInput = form.querySelector('[name=processing_time]') as HTMLInputElement;

                  const catSelect = form.querySelector('[name=category]') as HTMLSelectElement;



                  if (nameFrInput) nameFrInput.value = name;

                  if (nameArInput) nameArInput.value = name;

                  if (delayInput) delayInput.value = delay;

                  if (catId && catSelect) catSelect.value = catId;

                  if (reqs.length > 0) setServiceReqs(reqs);



                  showToast(t('magic_filling_done'));

                }

              }}>  {t('fill_button')}</button>

          </div>

        </div>



        <form id="service-form" className="p-4 overflow-auto" style={{ flex: 1 }} onSubmit={async (e) => {

          e.preventDefault();

          setEditServiceSaving(true)

          const formData = new FormData(e.currentTarget);



          // The backend expects requirements as a nested list. 

          // Depending on the backend setup, we might need a single JSON field or multiple.

          // Let's assume we can send a JSON string for the requirements if parsed correctly or just use traditional POST.

          // Actually, for multipart/form-data, DRF nested serializers can be tricky. 

          // We'll append each field manually to be safe.



          try {

            const url = editingService ? `/api/services/list/${editingService.id}/` : '/api/services/list/';

            const method = editingService ? 'PATCH' : 'POST';



            // If we have requirements, we need to handle them. 

            // Since we're using Multipart, we can't easily nest. 

            // We will send the requirements as a JSON string and the backend will need to handles it.

            // Actually, a better way for files + nested is to send everything as nested but DRF requires JSON for that.

            // We will use the common pattern: send files if any, and other data.



            // Create a clean FormData for submission

            const finalFd = new FormData();

            finalFd.append('category', formData.get('category') as string);

            finalFd.append('name_fr', formData.get('name_fr') as string);

            finalFd.append('name_ar', formData.get('name_ar') as string);

            finalFd.append('processing_time', formData.get('processing_time') as string);

            finalFd.append('description_fr', formData.get('description_fr') as string);

            finalFd.append('description_ar', formData.get('description_ar') as string);



            if (servicePdfAr) finalFd.append('form_pdf_ar', servicePdfAr);

            if (servicePdfFr) finalFd.append('form_pdf_fr', servicePdfFr);



            // Send requirements as structured data if needed. 

            // But await, our backend update() expects requirements as a list.

            // DRF can parse requirements[0]name_fr etc.

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

                <option value="">{t('category_placeholder')}</option>

                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}

              </select>

            </div>

            <div className="col-md-6">

              <label className="form-label small fw-bold">Délai de traitement</label>

              <input className="form-control" name="processing_time" placeholder={t('processing_delay_placeholder')} defaultValue={editingService?.processing_time || ''} />

            </div>



            <div className="col-md-6">

              <label className="form-label small fw-bold">Nom du service (FR)</label>

              <input className="form-control" name="name_fr" required defaultValue={editingService?.name_fr || ''} />

            </div>

            <div className="col-md-6">

              <label className="form-label small fw-bold" dir="rtl">اسم الخدمة (عربي)</label>

              <input className="form-control" name="name_ar" dir="rtl" required defaultValue={editingService?.name_ar || ''} />

            </div>



            <div className="col-md-6">

              <label className="form-label small fw-bold">Description (FR)</label>

              <textarea className="form-control" name="description_fr" rows={2} defaultValue={editingService?.description_fr || ''}></textarea>

            </div>

            <div className="col-md-6">

              <label className="form-label small fw-bold" dir="rtl">وصف الخدمة (عربي)</label>

              <textarea className="form-control" name="description_ar" rows={2} dir="rtl" defaultValue={editingService?.description_ar || ''}></textarea>

            </div>



            {/* Requirements Section */}

            <div className="col-12 mt-3">

              <div className="d-flex justify-content-between align-items-center bg-light p-2 border rounded">

                <span className="fw-bold small text-primary"><i className="fas fa-file-alt me-2"></i>Documents Requis (Papers)</span>

                <button type="button" className="btn btn-sm btn-primary" onClick={() => setServiceReqs([...serviceReqs, { name_fr: '', name_ar: '', is_mandatory: true }])}>

                  <i className="fas fa-plus me-1"></i> {t('add_label')}

                </button>

              </div>

              <div className="mt-2 border rounded p-2 bg-white" style={{ maxHeight: '200px', overflowY: 'auto' }}>

                {serviceReqs.length === 0 ? <div className="text-center text-muted small py-3">{t('no_doc_configured')}</div> :

                  serviceReqs.map((req, idx) => (

                    <div key={idx} className="p-2 border-bottom d-flex gap-2 align-items-center">

                      <input className="form-control form-control-sm" placeholder="Nom FR" value={req.name_fr} onChange={e => { const n = [...serviceReqs]; n[idx].name_fr = e.target.value; setServiceReqs(n); }} />

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

            <button className="btn btn-light px-4 fw-bold" type="button" onClick={() => { setShowAddServiceModal(false); setEditingService(null); setServiceReqs([]); }}> {t('cancel_label')}</button>

            <button className="btn btn-primary px-4 fw-bold shadow" type="submit" disabled={editServiceSaving}>

              {editServiceSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}

              {editingService ? t('update_label') : t('save_service')}

            </button>

          </div>

        </form>

      </div>

    </div>

  )
}

          </>

        </div>

      </div>

    </div>

  )

}



function QSSelect({ rec, onUpdate }: { rec: Reclamation; onUpdate: (id: number, ns: string, os: string, cb: (ok: boolean) => void) => void }) {

  const { t } = useI18n()

  const [val, setVal] = useState(rec.status)

  const [dis, setDis] = useState(false)

  return (

    <select className="ag-status-select" value={val} disabled={dis}

      onChange={e => {

        const ns = e.target.value, os = val; setDis(true)

        onUpdate(rec.id, ns, os, ok => { if (ok) setVal(ns); else setVal(os); setDis(false) })

      }}>

      <option value="pending">{t('status_pending_full')}</option>

      <option value="in_progress">{t('status_in_progress_full')}</option>

      <option value="resolved">{t('status_resolved_full')}</option>

      <option value="rejected">{t('status_rejected_full')}</option>

    </select>

  )

}





