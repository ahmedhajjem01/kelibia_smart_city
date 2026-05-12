import { resolveBackendUrl } from '../lib/backendUrl'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import PriorityExplanationModal from '../components/PriorityExplanationModal'
import logo from '../assets/logo.png'
import smartCityLogo from '../assets/smart_city_logo.png'
import L from 'leaflet'








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
.ag-brand-name{font-family:'Public Sans',sans-serif;font-size:1.4rem;font-weight:900;color:#ae131a;line-height:1.2}
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
.ag-map-card{background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.06);position:relative;min-height:450px;display:flex;flex-direction:column}
.ag-map-header{padding:14px 20px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;border-radius:12px 12px 0 0;overflow:hidden}
.ag-map-header h4{font-size:0.82rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a1c1c}
.ag-map-legend{position:absolute;top:66px;left:12px;z-index:400;background:rgba(255,255,255,0.97);padding:12px 14px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);border:1px solid #f0f0f0}
.ag-map-legend h5{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a1c1c;margin-bottom:8px}
.ag-legend-item{display:flex;align-items:center;gap:8px;font-size:0.73rem;color:#6b7280;margin-bottom:5px}
.ag-legend-dot{width:10px;height:10px;border-radius:9999px;flex-shrink:0;border:2px solid rgba(255,255,255,.7);box-shadow:0 0 0 1px rgba(0,0,0,.1)}
#ag-map{flex:1;min-height:400px;width:100%;border-radius:0 0 12px 12px;overflow:hidden}

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
.ag-mob-hamburger{display:none}
/* Mobile sidebar overlay */
.ag-mob-sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500}
.ag-mob-sidebar-drawer{position:fixed;left:0;top:0;height:100vh;width:272px;background:#f3f3f3;border-right:1px solid #e8e8e8;display:flex;flex-direction:column;padding:20px 14px;z-index:501;overflow-y:auto;transform:translateX(-100%);transition:transform .25s cubic-bezier(.4,0,.2,1)}
.ag-mob-sidebar-overlay.open{display:block}
.ag-mob-sidebar-overlay.open .ag-mob-sidebar-drawer{transform:translateX(0)}
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
  .ag-mob-hamburger{display:flex;align-items:center;justify-content:center;background:none;border:none;color:#ae131a;font-size:1.3rem;cursor:pointer;padding:0 8px;margin-right:8px}
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

  const [mapStatusFilter, setMapStatusFilter] = useState<string[]>(['pending', 'in_progress', 'resolved', 'rejected'])

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
  const [extraImages, setExtraImages] = useState<FileList | null>(null)



  async function fetchAgents() {

    setLoadingAgents(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/verify-citizens/?type=agent'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

  const [explainText, setExplainText] = useState('')

  const [explainResult, setExplainResult] = useState<any | null>(null)

  const [explainLoading, setExplainLoading] = useState(false)

  const [explainError, setExplainError] = useState('')



  // ── Profile Tab State ──

  const [editingProfile, setEditingProfile] = useState(false)

  const [profileSaving, setProfileSaving] = useState(false)

  const [profileSaveError, setProfileSaveError] = useState<string | null>(null)

  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false)

  const [profileForm, setProfileForm] = useState({

    first_name: '', last_name: '', phone: '', address: '', city: '', governorate: '', place_of_birth: ''

  })



  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [showLegend, setShowLegend] = useState(false)

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)



  const mapRef = useRef<HTMLDivElement>(null)

  const leafletMap = useRef<any>(null)

  const maskLayerRef = useRef<any>(null)

  const [showMask, setShowMask] = useState(false)

  const markersLayer = useRef<any>(null)

  const kelibiaRingRef = useRef<number[][] | null>(null)

  // Load municipality polygon once
  useEffect(() => {
    fetch('/layers/limite_kelibia_v2.geojson')
      .then(r => r.json())
      .then(gj => { kelibiaRingRef.current = gj.features[0].geometry.coordinates[0] })
      .catch(() => {})
  }, [])

  function insideKelibia(lat: number, lng: number): boolean {
    const ring = kelibiaRingRef.current
    if (!ring) return true // allow if ring not loaded yet
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1]
      const xj = ring[j][0], yj = ring[j][1]
      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi))
        inside = !inside
    }
    return inside
  }

  async function fetchArticles() {

    setLoadingArticles(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/news/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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
    if (extraImages) {
      Array.from(extraImages).forEach(file => {
        fd.append('extra_images', file)
      })
    }



    try {

      const res = await fetch(url, {

        method,

        headers: { Authorization: `Bearer ${getAccessToken()}` }, // Don't set Content-Type, fetch handles boundary

        body: fd

      })

      if (res.ok) {

        showToast(editingArticle ? 'Article mis à jour' : 'Article créé')

        setShowAddArticleModal(false)

        setArticleImage(null)
        setExtraImages(null)

        fetchArticles()

      }

    } catch (e) { showToast('Erreur lors de la sauvegarde', 'error') }

  }



  async function deleteArticle(id: number) {

    if (!window.confirm('Supprimer cet article ?')) return

    try {

      const res = await fetch(`/api/news/${id}/`, {

        method: 'DELETE',

        headers: { Authorization: `Bearer ${getAccessToken()}` }

      })

      if (res.ok) {

        showToast('Article supprimé')

        fetchArticles()

      }

    } catch (e) { showToast('Erreur lors de la suppression', 'error') }

  }



  async function fetchConfig() {

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/config/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

      if (res.ok) setGlobalSettings(await res.json())

    } catch (e) { console.error(e) }

  }



  async function handleSaveConfig() {

    setConfigSaving(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/config/'), {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

      const res = await fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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

      const res = await fetch(resolveBackendUrl('/api/supervisor/services-summary/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

      if (res.ok) setServicesSummary(await res.json())

    } catch (e) { console.error(e) }

  }



  async function fetchCategoriesAndServices() {

    setLoadingServicesTab(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/services/categories/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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

      const res = await fetch(resolveBackendUrl('/api/reclamations/ml_stats/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

      if (!res.ok) { setMlError(`Erreur ${res.status} — Stats IA indisponibles.`); return }

      setMlStats(await res.json())

    } catch { setMlError('Erreur réseau — Stats IA indisponibles.') }

    finally { setMlLoading(false) }

  }

  async function fetchExplain() {
    if (!explainText.trim()) return
    setExplainLoading(true); setExplainError(''); setExplainResult(null)
    try {
      const res = await fetch(resolveBackendUrl('/api/reclamations/explain_text/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ title: '', description: explainText }),
      })
      const data = await res.json()
      if (!res.ok) setExplainError(data.error || `Erreur ${res.status}`)
      else setExplainResult(data)
    } catch { setExplainError('Erreur réseau') }
    finally { setExplainLoading(false) }
  }



  async function handleProfileSave() {

    setProfileSaving(true); setProfileSaveError(null); setProfileSaveSuccess(false)

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/me/'), {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

        headers: { Authorization: `Bearer ${getAccessToken()}` }

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

      const res = await fetch(resolveBackendUrl('/api/supervisor/manage-orders/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

      if (res.ok) setAllDemandes(await res.json())

    } catch (e) { console.error(e) }

    finally { setLoadingDemandes(false) }

  }



  async function saveDemandStatus(order: any, newStatus: string) {

    setDemandeSaving(true)

    try {

      const res = await fetch(resolveBackendUrl('/api/supervisor/manage-orders/'), {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

      const res = await fetch(resolveBackendUrl('/api/evenements/demande/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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

        fetch(resolveBackendUrl('/api/construction/demandes/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } }),

        fetch(resolveBackendUrl('/api/construction/demandes/stats/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } }),

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

        method: 'PATCH', headers: { Authorization: `Bearer ${getAccessToken()}` }, body: fd,

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

      const res = await fetch(resolveBackendUrl('/api/forum/topics/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

      if (res.ok) setAllTopics(await res.json())



      const sRes = await fetch(resolveBackendUrl('/api/forum/topics/stats/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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

        headers: { Authorization: `Bearer ${getAccessToken()}` }

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

      const res = await fetch(`/api/forum/topics/${id}/`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })

      if (res.ok) setForumTopicSelected(await res.json())

    } catch { showToast(t('reclamations_error'), 'error') }

  }



  async function postForumReply() {

    if (!forumTopicSelected || !forumReplyText.trim()) return

    setPostingForumReply(true)

    try {

      const res = await fetch(`/api/forum/topics/${forumTopicSelected.id}/reply/`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

        headers: { Authorization: `Bearer ${getAccessToken()}` }

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

        headers: { Authorization: `Bearer ${getAccessToken()}` }

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

        headers: { Authorization: `Bearer ${getAccessToken()}` },

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

      const res = await fetch(`/api/accounts/verify-citizens/?mode=${mode}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

      const res = await fetch(resolveBackendUrl('/api/accounts/agent-citizens/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

      if (res.ok) setAgentCitizens(await res.json())

    } catch (e) { console.error(e) }

    finally { setLoadingCitizens(false) }

  }



  async function handleAgentCitizenAction(citizenId: number, action: 'verify' | 'toggle_active') {

    try {

      const res = await fetch(resolveBackendUrl('/api/accounts/agent-citizens/'), {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

      const res = await fetch(resolveBackendUrl('/api/reclamations/'), { headers: { Authorization: `Bearer ${getAccessToken()}` } })

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

    allRecs.filter(r => r.status !== 'resolved' && r.status !== 'rejected').forEach(r => {

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

    if (!L) return



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



    const m = L.map(mapRef.current, { minZoom: 8, worldCopyJump: false, maxBoundsViscosity: 1.0 }).setView([36.8467, 11.1047], 13)
    m.setMaxBounds([[27.0, -10.0], [40.0, 18.0]])

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap France', maxZoom: 19 }).addTo(m)

    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 19 })

    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '© OpenTopoMap', maxZoom: 17 })

    markersLayer.current = L.layerGroup().addTo(m)

    // ── Couches SIG GeoJSON — données réelles QGIS/WGS84 (Agent uniquement) ──
    const sigOverlays: Record<string, any> = {}

    const loadGeoJSON = (url: string, style: any, onEachFeature?: (f: any, layer: any) => void) => {
      const layer = L.geoJSON(null, { style, onEachFeature })
      fetch(url)
        .then(r => r.json())
        .then(data => layer.addData(data))
        .catch(() => {/* fichier absent — silencieux */})
      return layer
    }

    // 1. Limite municipale — contour de la commune
    sigOverlays['🏛️ Limite communale'] = loadGeoJSON(
      '/layers/limite_kelibia_v2.geojson',
      () => ({ color: '#1a237e', weight: 3, fill: false, dashArray: '8,4', opacity: 0.9 }),
      (feature, layer) => layer.bindPopup(`<div style="font-size:12px;margin:-14px -20px -14px -20px;border-radius:8px;overflow:hidden;"><div style="background:#0ea5e9;color:#fff;padding:8px 12px;font-weight:700;">🏛️ ${feature.properties?.name || 'Kelibia'}</div><div style="padding:8px 12px;">Limite de la commune</div></div>`)
    )

    // 2. Routes OSM — couleur selon type de voie (propriété OSM: highway)
    const routeColor = (type: string) => {
      if (type === 'primary' || type === 'secondary_link') return '#c62828'
      if (type === 'secondary' || type === 'tertiary' || type === 'tertiary_link') return '#e65100'
      if (type === 'residential' || type === 'unclassified') return '#546e7a'
      if (type === 'service') return '#78909c'
      return '#b0bec5'
    }
    const routeWeight = (type: string) => {
      if (type === 'primary' || type === 'secondary_link') return 4
      if (type === 'secondary' || type === 'tertiary' || type === 'tertiary_link') return 3
      return 1.5
    }
    sigOverlays['🛣️ Routes'] = loadGeoJSON(
      '/layers/routes_lignes.geojson',
      (f: any) => ({ color: routeColor(f?.properties?.highway || ''), weight: routeWeight(f?.properties?.highway || ''), opacity: 0.85 }),
      (feature, layer) => {
        const p = feature.properties || {}
        const nom = p['name:fr'] || p.name || p.ref || '(sans nom)'
        layer.bindPopup(`<div style="font-size:12px;margin:-14px -20px -14px -20px;border-radius:8px;overflow:hidden;"><div style="background:#0ea5e9;color:#fff;padding:8px 12px;font-weight:700;">🛣️ ${nom}</div><div style="padding:8px 12px;">Type : <b>${p.highway || '—'}</b></div></div>`)
      }
    )

    // 3. Espaces verts (union : Agriculture + Espaces verts + Forêts)
    const espacesVertsLayer = L.layerGroup()
    const espacesVertsStyle = () => ({ color: '#2e7d32', weight: 1.5, fillColor: '#a5d6a7', fillOpacity: 0.55 })
    const loadIntoGroup = (url: string, popupFn: (p: any) => string) => {
      const layer = L.geoJSON(null, {
        style: espacesVertsStyle,
        onEachFeature: (feature, layer) => layer.bindPopup(popupFn(feature.properties || {}))
      })
      fetch(url).then(r => r.json()).then(data => { layer.addData(data); espacesVertsLayer.addLayer(layer) }).catch(() => {})
    }
    loadIntoGroup('/layers/zones_vertes_complet.geojson', p => {
      const icon = p.icon || '🌿'
      const nom = p.nom || p['name:fr'] || p.name || 'Espace vert'
      const type = p.type || p.landuse || p.natural || p.leisure || '—'
      return `<div style="font-size:12px;margin:-14px -20px -14px -20px;border-radius:8px;overflow:hidden;"><div style="background:#0ea5e9;color:#fff;padding:8px 12px;font-weight:700;">${icon} ${nom}</div><div style="padding:8px 12px;">Type : <b>${type}</b></div></div>`
    })
    sigOverlays['🌿 Espaces verts'] = espacesVertsLayer
    espacesVertsLayer.addTo(m)

    // 4. Zones urbaines — résidentiel, commercial, construction
    const zoneUrbaineColor = (usage: string) => {
      if (usage === 'residential') return '#ffe0b2'
      if (usage === 'commercial') return '#e1bee7'
      if (usage === 'construction') return '#fff9c4'
      return '#f5f5f5'
    }
    sigOverlays['🏘️ Zones urbaines'] = loadGeoJSON(
      '/layers/zones_urbaines_polygones.geojson',
      (f: any) => ({ color: '#6d4c41', weight: 1.5, fillColor: zoneUrbaineColor(f?.properties?.usage_sol || ''), fillOpacity: 0.5 }),
      (feature, layer) => {
        const p = feature.properties || {}
        layer.bindPopup(`<div style="font-size:12px;margin:-14px -20px -14px -20px;border-radius:8px;overflow:hidden;"><div style="background:#0ea5e9;color:#fff;padding:8px 12px;font-weight:700;">🏘️ ${p.nom || 'Zone urbaine'}</div><div style="padding:8px 12px;">Usage : <b>${p.usage_sol || '—'}</b></div></div>`)
      }
    )

    // 7. Oueds (cours d'eau) — lignes bleues
    sigOverlays['💧 Oueds (cours d\'eau)'] = loadGeoJSON(
      '/layers/oueds_lignes.geojson',
      () => ({ color: '#0277bd', weight: 2, opacity: 0.85, dashArray: '6,3' }),
      (feature, layer) => {
        const p = feature.properties || {}
        layer.bindPopup(`<div style="font-size:12px;margin:-14px -20px -14px -20px;border-radius:8px;overflow:hidden;"><div style="background:#0ea5e9;color:#fff;padding:8px 12px;font-weight:700;">💧 ${p.nom || 'Cours d\'eau'}</div><div style="padding:8px 12px;">Type : ${p.type || p.waterway || 'stream'}</div></div>`)
      }
    )

    L.control.layers(
      { '🗺️ OpenStreetMap': osm, '🛰️ Satellite (Esri)': sat, '🏔️ Topographique': topo },
      { '📍 Signalements': markersLayer.current, ...sigOverlays },
      { position: 'topright', collapsed: true }
    ).addTo(m)

    // Legend is rendered as a React overlay (see JSX below), not as a Leaflet control

    // Mask layer — greys everything outside the commune boundary
    const kelibiaCoords = [[11.0645414,36.8670169],[11.0656036,36.8678238],[11.0663223,36.8683731],[11.0666455,36.8687452],[11.0671619,36.8691477],[11.0661842,36.8699597],[11.0652857,36.8704384],[11.0653541,36.8704867],[11.0654935,36.8706069],[11.0677037,36.8721174],[11.0683179,36.8723899],[11.0669875,36.8744498],[11.0687042,36.8747244],[11.0672021,36.8757543],[11.0674596,36.8762693],[11.0682321,36.8763723],[11.0687471,36.8767842],[11.0710216,36.8765096],[11.071837,36.8766126],[11.0725236,36.8770245],[11.0730386,36.8776768],[11.0732317,36.8778398],[11.0730708,36.8782089],[11.0734141,36.8784663],[11.0732961,36.8787152],[11.0733605,36.8791872],[11.0733927,36.8796592],[11.073457,36.8800883],[11.073457,36.8804488],[11.0733497,36.880732],[11.073339,36.8811096],[11.0733819,36.8812726],[11.0732854,36.8814185],[11.0741544,36.8815129],[11.0752273,36.8813069],[11.0755921,36.8811525],[11.0767079,36.8811181],[11.0774589,36.8809808],[11.0785532,36.8806204],[11.0792613,36.8804831],[11.0801411,36.8803286],[11.0808921,36.8803286],[11.0813213,36.8805517],[11.0820294,36.8803801],[11.0826731,36.8805517],[11.0832739,36.8805517],[11.0836601,36.8806032],[11.0845185,36.8803629],[11.0850334,36.8802771],[11.085527,36.8797107],[11.0862994,36.8789555],[11.0869217,36.8781659],[11.087426,36.8774708],[11.0876942,36.8762006],[11.0882199,36.8745356],[11.0885954,36.8732826],[11.0887885,36.8725444],[11.08881,36.8720466],[11.0887778,36.8698494],[11.0885994,36.8683935],[11.0882775,36.86696],[11.0883097,36.8658099],[11.0884278,36.8651403],[11.088578,36.8643507],[11.0888328,36.8637605],[11.0893907,36.8639236],[11.0921507,36.8647949],[11.0922687,36.8645588],[11.0924672,36.8641489],[11.0925557,36.8640202],[11.0927112,36.8639022],[11.0931082,36.8636253],[11.0934971,36.8633678],[11.0936554,36.8631918],[11.0939933,36.8629086],[11.0942374,36.8627047],[11.0943823,36.862621],[11.0946049,36.8626275],[11.0946988,36.8626296],[11.0949107,36.8624987],[11.0954042,36.8621167],[11.0958789,36.8617154],[11.0962464,36.8614922],[11.0964583,36.8612969],[11.0968311,36.860975],[11.0970323,36.8607819],[11.0973407,36.8605201],[11.0978691,36.8602046],[11.0982232,36.8600651],[11.0986631,36.8600394],[11.0991861,36.8598634],[11.0995992,36.8597711],[11.1002749,36.8594787],[11.0994573,36.8570267],[11.0993321,36.8562224],[11.0992107,36.8557465],[11.0998829,36.8551132],[11.1017359,36.8558253],[11.1032066,36.8566013],[11.1047003,36.8534628],[11.105768,36.8535783],[11.1062372,36.8531446],[11.1070484,36.8535064],[11.1077395,36.8539811],[11.1093731,36.8544809],[11.1101858,36.8535771],[11.1105372,36.8532661],[11.1107357,36.8531889],[11.1108322,36.853146],[11.1112399,36.8536911],[11.1122377,36.855026],[11.1125542,36.8554639],[11.1124255,36.8557128],[11.1124201,36.8558158],[11.1127956,36.856082],[11.1130746,36.8562923],[11.1134447,36.8564425],[11.1136003,36.8559661],[11.1142977,36.8563052],[11.1146946,36.8560734],[11.1154885,36.8553179],[11.1161431,36.8557085],[11.1166848,36.8551676],[11.1172427,36.8553265],[11.1177684,36.8545968],[11.1180581,36.8548458],[11.11838,36.8544938],[11.1194958,36.8547771],[11.1206169,36.8540731],[11.1220331,36.8558416],[11.1235406,36.8573696],[11.1242218,36.858168],[11.1247315,36.857889],[11.1257453,36.8580306],[11.1271454,36.8573096],[11.1289099,36.8572798],[11.1295584,36.8572688],[11.1296606,36.8570742],[11.1300889,36.8560531],[11.1298108,36.8557206],[11.1298177,36.8553238],[11.12944,36.8549699],[11.128717,36.8550245],[11.1281374,36.8549322],[11.1279492,36.8548406],[11.1279134,36.8548232],[11.1272692,36.8541029],[11.1268942,36.8534548],[11.126376,36.8524139],[11.1262853,36.8521079],[11.126022,36.8512201],[11.12594,36.8507218],[11.1259758,36.8504294],[11.1260397,36.8502504],[11.1260544,36.8501669],[11.1259678,36.8499731],[11.1259361,36.8497748],[11.1260155,36.8495614],[11.1261236,36.8493738],[11.1261406,36.8493287],[11.1261958,36.8492794],[11.1262511,36.8491699],[11.1263163,36.8491207],[11.1263163,36.8490584],[11.1263214,36.8490202],[11.1264268,36.8489439],[11.1264648,36.8488677],[11.1264189,36.8488403],[11.1263562,36.848845],[11.126316,36.8488577],[11.1262871,36.8488085],[11.1262662,36.8487946],[11.1262043,36.8488436],[11.1261139,36.848918],[11.1260812,36.848924],[11.1260649,36.8489049],[11.1261289,36.8488255],[11.126144,36.8487944],[11.1261151,36.8487864],[11.12608,36.8488155],[11.1260523,36.8488034],[11.1260222,36.8488095],[11.126026,36.8488527],[11.1259243,36.848969],[11.125876,36.8489565],[11.1258551,36.8489115],[11.1258117,36.8488865],[11.1257385,36.848915],[11.1257059,36.8488718],[11.1256971,36.8487854],[11.125613,36.848713],[11.1255029,36.8486649],[11.1252444,36.8486133],[11.1249755,36.8485812],[11.124933,36.848565],[11.1248305,36.848526],[11.1247101,36.8484099],[11.1246862,36.8482404],[11.1242477,36.8476162],[11.1240956,36.8472848],[11.1240269,36.8470302],[11.1239744,36.8466027],[11.1240106,36.8465172],[11.1240676,36.8464402],[11.1245065,36.846434],[11.1246299,36.8464121],[11.1246559,36.8463412],[11.1245706,36.8463208],[11.1243531,36.8462818],[11.1241962,36.8462725],[11.1241584,36.8462101],[11.1242694,36.8461322],[11.1241525,36.8460609],[11.1238646,36.8460024],[11.1238187,36.8458197],[11.1240883,36.8455685],[11.1243864,36.8447924],[11.1240469,36.8442494],[11.1232614,36.8441437],[11.122559,36.8440784],[11.122416,36.8440136],[11.1223141,36.8439466],[11.1221094,36.8437483],[11.1219034,36.8435294],[11.1217975,36.8433894],[11.1217338,36.8432128],[11.1220213,36.8428926],[11.122055,36.8427927],[11.1220001,36.842643],[11.1215672,36.8422632],[11.1216948,36.8420765],[11.1219259,36.841769],[11.1219804,36.841509],[11.1219378,36.8411437],[11.1218393,36.8407956],[11.1216886,36.8405248],[11.1215593,36.840269],[11.1215003,36.8400084],[11.1214976,36.839781],[11.121441,36.8395191],[11.1213402,36.839318],[11.1210545,36.8389378],[11.1200494,36.8381914],[11.1196211,36.8366791],[11.1191882,36.8358393],[11.1165595,36.8333589],[11.1163774,36.8330964],[11.1162846,36.8330687],[11.1162898,36.8331393],[11.1164034,36.8333398],[11.1163814,36.8334208],[11.1163478,36.8334955],[11.1160016,36.8336237],[11.1159442,36.8335491],[11.1157409,36.8332847],[11.1156968,36.8332862],[11.1156152,36.833201],[11.1155498,36.8330933],[11.1151919,36.8327787],[11.1143342,36.8320725],[11.1141385,36.8320076],[11.1137402,36.8319138],[11.1134389,36.8318843],[11.1128758,36.8318969],[11.108647,36.8322297],[11.1075833,36.8323325],[11.1074207,36.8323646],[11.1073873,36.8324084],[11.1073851,36.832463],[11.1074032,36.8325027],[11.1074471,36.8325356],[11.1076045,36.8325128],[11.1076747,36.8325236],[11.107811,36.8325341],[11.1087715,36.8324496],[11.1088501,36.8324857],[11.1088911,36.8329437],[11.1088735,36.8329726],[11.1082986,36.8333685],[11.1082492,36.833393],[11.1082299,36.8334205],[11.1082396,36.83345],[11.1082709,36.8334811],[11.108299,36.8334974],[11.1083281,36.8334912],[11.1083888,36.8334352],[11.1084414,36.8333756],[11.1085205,36.833304],[11.1090516,36.8330027],[11.1090966,36.8329644],[11.1091195,36.8329033],[11.1091087,36.832838],[11.1096058,36.8328032],[11.1095823,36.8325354],[11.1109146,36.8324327],[11.1116069,36.8323854],[11.1117356,36.8323346],[11.1132576,36.8322292],[11.1139492,36.8324482],[11.1143503,36.8328119],[11.1135719,36.8333898],[11.1131571,36.8330387],[11.1129223,36.8332216],[11.1131285,36.8333779],[11.1130685,36.8334228],[11.1128602,36.8332679],[11.1128057,36.8333099],[11.1130165,36.833466],[11.1129937,36.8334882],[11.1130538,36.8335422],[11.1129962,36.8335957],[11.113425,36.8338983],[11.1134553,36.8338717],[11.1135596,36.8339488],[11.1134821,36.8341373],[11.113308,36.8345289],[11.1132039,36.8347445],[11.11197,36.8349304],[11.1117347,36.8339923],[11.111068,36.8341153],[11.1111601,36.8345398],[11.1106435,36.8346232],[11.1106647,36.8347043],[11.1106295,36.8347115],[11.1106222,36.8347129],[11.1105413,36.8347293],[11.110655,36.8354148],[11.1101846,36.8354862],[11.1099901,36.8346566],[11.1100715,36.8346414],[11.1099685,36.8341794],[11.1097496,36.8342031],[11.1097251,36.8341371],[11.109685,36.8338563],[11.109687,36.8338083],[11.1096703,36.8337821],[11.1096249,36.8337657],[11.1095847,36.8337726],[11.1095436,36.8338042],[11.1095283,36.8338323],[11.10955,36.8339095],[11.1095205,36.8339194],[11.1095122,36.8339341],[11.1095105,36.8339775],[11.1097401,36.8349138],[11.1099046,36.8355228],[11.1099569,36.8355627],[11.1101258,36.8362703],[11.1100639,36.8363379],[11.1093031,36.8367028],[11.1086722,36.8369444],[11.1083724,36.8370447],[11.1081132,36.8371131],[11.1078054,36.8371373],[11.1072827,36.8371759],[11.106758,36.8371934],[11.1065677,36.8371688],[11.1063401,36.8370738],[11.1062259,36.8371331],[11.1060472,36.837153],[11.1057366,36.8371514],[11.1055619,36.837225],[11.1052743,36.8372266],[11.1052524,36.83727],[11.1050344,36.8372329],[11.104801,36.8371683],[11.1045283,36.8371384],[11.1043903,36.8371063],[11.1041027,36.8369904],[11.103985,36.8369599],[11.1038439,36.8369534],[11.1035243,36.8368824],[11.1034157,36.836834],[11.1031513,36.8366942],[11.1030383,36.8366468],[11.1029305,36.8366329],[11.102791,36.8366329],[11.1020287,36.8364473],[11.1013825,36.8363534],[11.1013388,36.8363271],[11.1012915,36.8363169],[11.1011712,36.8363227],[11.1009729,36.8362938],[11.1008572,36.8362785],[11.1007372,36.8362903],[11.1005825,36.8363366],[11.1000823,36.83644],[11.0998418,36.8364897],[11.099639,36.836505],[11.0991735,36.8364878],[11.0991025,36.8364648],[11.0990752,36.8364241],[11.0988451,36.8363936],[11.0987738,36.836417],[11.0975305,36.8359911],[11.0962973,36.8350118],[11.0958643,36.8346541],[11.095529,36.8342776],[11.0948287,36.8337943],[11.0947609,36.8337738],[11.0943935,36.8334882],[11.0940678,36.833275],[11.0936582,36.8330597],[11.0928649,36.8326009],[11.0926886,36.8324799],[11.092377,36.8323162],[11.0921996,36.8322424],[11.0920733,36.8322185],[11.091811,36.8321833],[11.0915954,36.8321873],[11.0909984,36.8321648],[11.0907036,36.8321417],[11.0898663,36.8320496],[11.0896451,36.8320224],[11.0894325,36.8319657],[11.0892363,36.8318947],[11.0890661,36.8318006],[11.0880297,36.8314339],[11.0874466,36.8311978],[11.0871658,36.8310746],[11.0868824,36.8309381],[11.0866432,36.8308005],[11.0864015,36.8306185],[11.0854352,36.8299839],[11.0851278,36.8297815],[11.0849743,36.8296516],[11.0848193,36.8294916],[11.0845906,36.8292625],[11.0843748,36.8291026],[11.0840689,36.8288859],[11.0836669,36.8286561],[11.0832499,36.8283215],[11.082887,36.8280368],[11.0827497,36.8279386],[11.0825768,36.8278484],[11.081755,36.8274617],[11.0789393,36.8259401],[11.0770717,36.8247406],[11.076352,36.8243419],[11.0759765,36.8241183],[11.0757567,36.8239203],[11.0751156,36.8236894],[11.0746485,36.8235281],[11.0734945,36.8228609],[11.0727481,36.8224321],[11.072423,36.8221608],[11.0721665,36.8219995],[11.0718689,36.8219005],[11.0716216,36.8216659],[11.0711545,36.82138],[11.0705775,36.8210941],[11.0703165,36.8209254],[11.0701837,36.8208045],[11.0694739,36.8205222],[11.0690388,36.8202363],[11.0685488,36.8200236],[11.0683245,36.8198843],[11.0680451,36.819734],[11.06772,36.8195287],[11.0671384,36.8191695],[11.0666118,36.8187956],[11.0661813,36.8184033],[11.0656089,36.8180441],[11.064977,36.8176738],[11.0643313,36.8173585],[11.0637497,36.8170799],[11.0630353,36.8167866],[11.0626278,36.8166436],[11.062234,36.8165337],[11.0618445,36.8164019],[11.0610239,36.8160843],[11.0606091,36.8159435],[11.0603115,36.8158388],[11.0601431,36.8157543],[11.0600455,36.8157053],[11.0598065,36.8155934],[11.0596442,36.8154742],[11.0593922,36.8153286],[11.0591408,36.8151833],[11.0586221,36.8149866],[11.0580905,36.8147747],[11.0572716,36.8143572],[11.0564254,36.8139175],[11.0561856,36.8138311],[11.0559981,36.8137287],[11.0557221,36.8135243],[11.0550894,36.8130989],[11.0548171,36.812999],[11.0546621,36.8128992],[11.0543448,36.8126387],[11.053741,36.8121738],[11.0529423,36.8115169],[11.0524927,36.8112047],[11.0522551,36.8109571],[11.0518799,36.8107274],[11.0511675,36.8102437],[11.05064,36.809879],[11.0497995,36.8090626],[11.0495949,36.808925],[11.0492693,36.8086228],[11.0487327,36.8082401],[11.048115,36.8077419],[11.0477363,36.8075723],[11.0473665,36.8072185],[11.0471456,36.8070055],[11.0469878,36.806973],[11.0467037,36.8067997],[11.0464242,36.8065795],[11.0461446,36.8063448],[11.0459057,36.8061391],[11.0457118,36.8060127],[11.0455765,36.8058936],[11.0454458,36.8057564],[11.045324,36.8056481],[11.0451527,36.8055109],[11.0449272,36.8052907],[11.044562,36.8049947],[11.0443862,36.8047997],[11.0442058,36.8046084],[11.0439353,36.8043051],[11.0436512,36.8040235],[11.0434754,36.8037744],[11.0433401,36.8036336],[11.0431868,36.8034459],[11.04302,36.8031679],[11.0428351,36.8029368],[11.0426502,36.8026191],[11.0423887,36.8022978],[11.042106,36.8020576],[11.0418084,36.8019132],[11.0414973,36.8017832],[11.0411501,36.8016352],[11.040866,36.8015124],[11.0405324,36.8013283],[11.040343,36.8011911],[11.0399868,36.8009853],[11.0396531,36.8007687],[11.0393014,36.8004727],[11.038801,36.7999961],[11.0386071,36.7997361],[11.0383411,36.7995664],[11.0378073,36.7992234],[11.0364971,36.7985498],[11.0358879,36.7982541],[11.0354608,36.7980569],[11.0349995,36.7978271],[11.0341653,36.7973546],[11.0339266,36.7971785],[11.0338032,36.7970518],[11.0335511,36.7968499],[11.0332037,36.7966211],[11.0325814,36.797117],[11.0327424,36.7976454],[11.0327263,36.7980921],[11.0323669,36.7989556],[11.0320825,36.7993937],[11.0314603,36.8000122],[11.0308165,36.8006737],[11.0305698,36.8012064],[11.0297705,36.8019323],[11.028998,36.8024778],[11.0284884,36.8026625],[11.0279412,36.8018292],[11.0272331,36.8013481],[11.0266645,36.8010388],[11.025436,36.8007124],[11.0244758,36.8003559],[11.0239125,36.8000208],[11.0231079,36.7992219],[11.0206563,36.7968679],[11.0200716,36.797233],[11.0188646,36.7980879],[11.0176952,36.798715],[11.0166759,36.7991961],[11.0152812,36.7993765],[11.0145194,36.7996858],[11.0131998,36.8004676],[11.0126955,36.8010088],[11.0125882,36.8014813],[11.0120518,36.8019967],[11.0103566,36.8037406],[11.0086186,36.8051752],[11.0062462,36.806334],[11.006349,36.8070771],[11.0068148,36.8101201],[11.0070509,36.8118552],[11.0071367,36.8134013],[11.0070616,36.8158149],[11.007008,36.8178247],[11.0067934,36.8192848],[11.007008,36.8208823],[11.0072547,36.8219902],[11.007641,36.8233042],[11.0076195,36.8242361],[11.0078663,36.8251249],[11.0088426,36.8264303],[11.0109669,36.8292299],[11.0114068,36.8304322],[11.0112888,36.8323214],[11.0114068,36.8328968],[11.0141426,36.8360997],[11.0147435,36.8373362],[11.0143894,36.8395773],[11.0140246,36.8420244],[11.0136169,36.8446003],[11.0130483,36.8477684],[11.0139066,36.8500607],[11.0144001,36.8506273],[11.0156661,36.8515202],[11.0159558,36.8521812],[11.0158378,36.8524817],[11.0155159,36.8531771],[11.0151941,36.8542502],[11.0148829,36.8555894],[11.0145289,36.8566711],[11.0142499,36.8576583],[11.0135418,36.8585597],[11.0119218,36.8612036],[11.011911,36.8617787],[11.0114819,36.8622423],[11.0106558,36.8624054],[11.0102481,36.863444],[11.0107738,36.8638131],[11.0107201,36.8640964],[11.0101193,36.8647831],[11.0091108,36.8656758],[11.0088211,36.8662079],[11.0083276,36.8664139],[11.0076946,36.8673238],[11.0073084,36.8674439],[11.0055596,36.867607],[11.0047978,36.8675126],[11.004079,36.8676414],[11.0036606,36.8676585],[11.0030919,36.8676843],[11.0022122,36.8682508],[11.0016865,36.8684911],[11.0015255,36.8687229],[11.0008925,36.8694868],[11.0003883,36.8699502],[10.9994656,36.8706283],[10.9984893,36.8712205],[10.9978563,36.871272],[10.9968263,36.8718042],[10.996719,36.8721904],[10.9963435,36.8723535],[10.9959251,36.8725165],[10.9957534,36.8728341],[10.9947127,36.8735894],[10.9942514,36.8741816],[10.9941763,36.8748167],[10.9925562,36.8756063],[10.992364,36.875792],[10.9926608,36.8783842],[10.9938249,36.8789807],[10.9961101,36.8787747],[10.9982184,36.8796458],[10.9992322,36.8801307],[10.9999672,36.8804783],[11.0005251,36.8807185],[11.0011581,36.8813793],[11.0014317,36.8816754],[11.0022685,36.8831086],[11.0029283,36.8837007],[11.0039207,36.8839453],[11.0050687,36.8839796],[11.0053745,36.8840826],[11.0062543,36.8842714],[11.0074183,36.8847219],[11.009151,36.8853912],[11.0100737,36.8857345],[11.0113397,36.8862279],[11.0121873,36.8863609],[11.0136089,36.8870045],[11.014258,36.8863609],[11.0149607,36.8855371],[11.0159478,36.8844816],[11.0165271,36.8843615],[11.0173372,36.8842842],[11.0178736,36.8842027],[11.018237,36.8839807],[11.0185991,36.8838519],[11.0187292,36.8839517],[11.0187614,36.8841308],[11.0187399,36.8851863],[11.0183644,36.8860788],[11.0186005,36.8869026],[11.0185039,36.8874432],[11.0196841,36.8886875],[11.0200274,36.8892624],[11.0194802,36.889331],[11.0198611,36.8898287],[11.0202688,36.8903607],[11.0208428,36.8904208],[11.0221517,36.8904465],[11.0229456,36.8904165],[11.0237986,36.8902148],[11.0250056,36.889936],[11.0255796,36.8898802],[11.0262823,36.8897257],[11.027264,36.8894898],[11.0278702,36.8891294],[11.0283369,36.8891079],[11.0287714,36.8892366],[11.0291523,36.8891036],[11.0298014,36.8885544],[11.0305685,36.887795],[11.0314697,36.8873488],[11.0329074,36.8869798],[11.0335189,36.8865422],[11.0353857,36.8847315],[11.0361582,36.8837876],[11.0366839,36.8835215],[11.0380036,36.8824488],[11.0406214,36.8842252],[11.0422415,36.8854996],[11.0448472,36.8871761],[11.0452979,36.886687],[11.0455258,36.8864832],[11.0461816,36.8860327],[11.0462997,36.8858932],[11.0466604,36.8854738],[11.0469447,36.8852904],[11.0472974,36.8850909],[11.0485071,36.8843979],[11.0487244,36.8842585],[11.0489819,36.8840761],[11.0498362,36.8834604],[11.050384,36.883048],[11.0506931,36.8828559],[11.0513342,36.8825513],[11.0518652,36.8822617],[11.0521844,36.8820385],[11.0526029,36.8817232],[11.0534987,36.8810109],[11.0537991,36.8807105],[11.0538635,36.8805303],[11.0540378,36.8796936],[11.0542336,36.8793867],[11.0541559,36.8793503],[11.0538823,36.8792838],[11.0534236,36.8792065],[11.0529274,36.87911],[11.0523561,36.8790392],[11.0519457,36.8788826],[11.0511679,36.8785371],[11.0505134,36.8781187],[11.0503713,36.8782174],[11.0501191,36.8784964],[11.0499475,36.878565],[11.0497892,36.87858],[11.0496336,36.8785457],[11.0494995,36.8784298],[11.049572,36.8780973],[11.0494727,36.8777454],[11.0493064,36.8775909],[11.048939,36.8776103],[11.0488639,36.8773013],[11.0491964,36.8767864],[11.0492608,36.8765975],[11.0496015,36.876295],[11.0500226,36.8759324],[11.0504061,36.875735],[11.0508111,36.8755913],[11.0512752,36.8755355],[11.0516265,36.8756127],[11.0518357,36.8754582],[11.0519269,36.8753424],[11.0519699,36.8751557],[11.0520905,36.874866],[11.0522729,36.8746944],[11.0526672,36.8745163],[11.0531071,36.8747781],[11.0537508,36.8745463],[11.0540083,36.8743876],[11.0542766,36.8739627],[11.0544858,36.8730766],[11.054231,36.8728749],[11.0545555,36.8728534],[11.0554245,36.8720595],[11.0565028,36.8709523],[11.0570097,36.870742],[11.0576025,36.8699696],[11.058088,36.870197],[11.0581443,36.8700597],[11.058611,36.8698837],[11.0591233,36.8692915],[11.0594666,36.8687336],[11.0603464,36.8684675],[11.0606897,36.867798],[11.0608399,36.8676779],[11.0612798,36.8674118],[11.0627604,36.8657552],[11.0645414,36.8670169]]
    const kelibiaLatLngs: [number, number][] = kelibiaCoords.map(([lng, lat]) => [lat, lng])
    const worldBounds: [number, number][] = [[-90,-180],[-90,180],[90,180],[90,-180]]
    maskLayerRef.current = L.polygon(
      [worldBounds, [...kelibiaLatLngs].reverse()],
      { fillColor: '#888888', fillOpacity: 0.55, color: 'transparent', weight: 0, interactive: false }
    )

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
    if (!leafletMap.current || !maskLayerRef.current) return
    if (showMask) {
      maskLayerRef.current.addTo(leafletMap.current)
    } else {
      maskLayerRef.current.remove()
    }
  }, [showMask])

  useEffect(() => {

    if (!L || !leafletMap.current || !markersLayer.current) return

    markersLayer.current.clearLayers()

    const BLT = 36.8467, BLG = 11.1047

    const mapRecs = allRecs.filter(r =>
      mapStatusFilter.includes(r.status) &&
      r.latitude != null && r.longitude != null &&
      insideKelibia(r.latitude!, r.longitude!)
    )

    mapRecs.forEach(r => {

      const lat = r.latitude!

      const lng = r.longitude!

      const cm: Record<string, string> = { pending: '#e65100', in_progress: '#1565c0', resolved: '#1b5e20', rejected: '#757575' }

      const color = cm[r.status] || '#888'

      const cat = CAT[r.category] || CAT.other

      const icon = L.divIcon({

        className: '',

        html: `<div style="background:${color};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);">${cat.label.split(' ')[0]}</div>`,

        iconSize: [30, 30], iconAnchor: [15, 15],

      })

      const mk = L.marker([lat, lng], { icon }).addTo(markersLayer.current)

      const prio = PRIORITY[r.priority] || PRIORITY.normale

      const pc: Record<string, string> = { urgente: '#b71c1c', normale: '#1565c0', faible: '#6a1b9a' }

      const prioColor = pc[r.priority] || '#1565c0'

      mk.bindPopup(`<div style="min-width:220px;font-size:13px;border-radius:8px;overflow:hidden;margin:-14px -20px -14px -20px;">
        <div style="background:#0ea5e9;padding:10px 14px;margin-bottom:10px;">
          <strong style="color:#fff;font-size:13px;display:block;">${r.title}</strong>
          <span style="color:rgba(255,255,255,.85);font-size:11px;">${cat.label}</span>
        </div>
        <div style="padding:0 14px 12px 14px;">
          <div style="font-size:11px;color:#555;margin-bottom:3px;">👤 ${r.citizen_name || '—'}</div>
          <div style="font-size:11px;color:#555;margin-bottom:3px;">📅 ${formatDate(r.created_at)}</div>
          <div style="font-size:11px;color:#555;margin-bottom:8px;">🏢 ${r.service_responsable || '—'}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            <span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}44;">${STATUS[r.status]?.label || r.status}</span>
            <span style="padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;background:${prioColor}18;color:${prioColor};border:1px solid ${prioColor}33;">${prio.label}</span>
          </div>
        </div>
      </div>`)

    })

  }, [allRecs, activeTab, mapStatusFilter])



  function showToast(msg: string, type = 'success') {

    const id = Date.now()

    setToasts(t => [...t, { id, msg, type }])

    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)

  }



  async function quickUpdateStatus(id: number, newStatus: string, _old: string, cb: (ok: boolean) => void) {

    try {

      const res = await fetch(`/api/reclamations/${id}/update_status/`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

        body: JSON.stringify({ status: newStatus }),

      })

      if (res.ok) {

        showToast(`Statut mis à jour → ${STATUS[newStatus]?.label || newStatus}`);

        cb(true);
        fetchReclamations()

      }

      else { showToast('Erreur lors de la mise à jour.', 'error'); cb(false) }

    } catch { showToast('Erreur réseau.', 'error'); cb(false) }

  }



  async function deleteReclamation(id: number) {

    if (!window.confirm(t('delete_user_confirm'))) return

    try {

      const res = await fetch(`/api/reclamations/${id}/`, {

        method: 'DELETE',

        headers: { Authorization: `Bearer ${getAccessToken()}` }

      })

      if (res.ok) {

        showToast('Réclamation supprimée !')

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

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

        body: JSON.stringify({ status: detailStatus }),

      })

      if (res.ok) { showToast('Statut enregistré !'); setDetailRec(null); fetchReclamations() }

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

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

      <style>{CSS}</style>

      {/* ── SIDEBAR ── */}
      <aside className="ag-sidebar">

        {/* Brand */}
        <div className="ag-sidebar-brand">
          <img src={smartCityLogo} alt="Logo" style={{ width: 50, height: 50 }} />
          <div>
            <div className="ag-brand-name">{lang === 'ar' ? 'بوابة المدينة الذكية' : 'Smart City Portal'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="ag-sidebar-nav">

          <a className={`ag-nav-item${activeTab === 'dashboard' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('dashboard') }}>
            <i className="fas fa-chart-pie"></i>
            <span>{t('dashboard')}</span>
            {pending > 0 && <span className="ag-badge">{pending}</span>}
          </a>

          <a className={`ag-nav-item${activeTab === 'evenements' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('evenements'); fetchEvenements() }}>
            <i className="fas fa-calendar-alt"></i>
            <span>{t('nav_events_mgmt')}</span>
            {allEvenements.filter((ev: any) => ev.status === 'pending').length > 0 && <span className="ag-badge">{allEvenements.filter((ev: any) => ev.status === 'pending').length}</span>}
          </a>

          <a className={`ag-nav-item${activeTab === 'construction' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('construction'); fetchConstructions() }}>
            <i className="fas fa-hard-hat"></i>
            <span>{t('permis_construire')}</span>
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

          <div className="ag-divider"></div>
          <div className="ag-sec-title">{t('nav_admin_staff')}</div>

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

          {(user?.user_type === 'supervisor' || user?.is_superuser || user?.is_staff) && (<>
            <a className={`ag-nav-item${activeTab === 'users' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('users'); fetchManagedUsers(usersMode) }}>
              <i className="fas fa-users-cog"></i>
              <span>{t('nav_managed_users')}</span>
              {managedUsers.filter(u => !u.is_verified).length > 0 && <span className="ag-badge">{managedUsers.filter(u => !u.is_verified).length}</span>}
            </a>

            {(user?.user_type === 'supervisor' || user?.is_superuser) && (
              <a className={`ag-nav-item${activeTab === 'config' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveTab('config'); }}>
                <i className="fas fa-cogs"></i>
                <span>{t('configuration')}</span>
              </a>
            )}
          </>)}

        </nav>

        {/* Bottom actions */}
        <div className="ag-sidebar-bottom">

          <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); clearTokens(); navigate('/login') }}>
            <i className="fas fa-sign-out-alt"></i>
            <span>{t('logout')}</span>
          </a>
        </div>

      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      <div className={`ag-mob-sidebar-overlay${mobileSidebarOpen ? ' open' : ''}`} onClick={() => setMobileSidebarOpen(false)}>
        <div className="ag-mob-sidebar-drawer" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div className="ag-sidebar-brand" style={{ margin: 0, padding: 0 }}>
              <img src={smartCityLogo} alt="Logo" style={{ width: 38, height: 38 }} />
              <div className="ag-brand-name" style={{ fontSize: '0.85rem' }}>{lang === 'ar' ? 'بوابة المدينة الذكية' : 'Smart City Portal'}</div>
            </div>
            <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer', padding: 4 }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          {/* Nav items */}
          <nav className="ag-sidebar-nav">
            {[
              { tab: 'dashboard', icon: 'fa-chart-pie', label: t('dashboard'), badge: pending > 0 ? pending : null, fetch: null },
              { tab: 'evenements', icon: 'fa-calendar-alt', label: t('nav_events_mgmt'), badge: allEvenements.filter((ev: any) => ev.status === 'pending').length || null, fetch: fetchEvenements },
              { tab: 'construction', icon: 'fa-hard-hat', label: t('permis_construire'), badge: allConstructions.filter((c: any) => c.status === 'pending').length || null, fetch: fetchConstructions },
              { tab: 'stats', icon: 'fa-robot', label: t('nav_stats_ia'), badge: null, fetch: () => { if (!mlStats && !mlLoading) fetchMlStats() } },
              { tab: 'profile', icon: 'fa-user-circle', label: t('nav_profile'), badge: null, fetch: () => { fetchDemandes(); fetchTopics() } },
              { tab: 'demandes', icon: 'fa-folder-open', label: t('nav_demandes_citoyens'), badge: allDemandes.filter(d => d.status === 'pending').length || null, fetch: fetchDemandes },
              { tab: 'forum', icon: 'fa-comments', label: t('nav_forum_moderation'), badge: null, fetch: () => { fetchTopics(); fetchMlStats() } },
              { tab: 'actualites', icon: 'fa-newspaper', label: lang === 'ar' ? 'إدارة الأخبار' : 'Gérer Actualités', badge: null, fetch: fetchArticles },
            ].map(({ tab, icon, label, badge, fetch }) => (
              <a key={tab} className={`ag-nav-item${activeTab === tab ? ' active' : ''}`} href="#"
                onClick={e => { e.preventDefault(); setActiveTab(tab as any); fetch && fetch(); setMobileSidebarOpen(false) }}>
                <i className={`fas ${icon}`}></i>
                <span>{label}</span>
                {badge ? <span className="ag-badge">{badge}</span> : null}
              </a>
            ))}
            {(user?.user_type === 'supervisor' || user?.is_superuser || user?.is_staff) && (
              <a className={`ag-nav-item${activeTab === 'users' ? ' active' : ''}`} href="#"
                onClick={e => { e.preventDefault(); setActiveTab('users'); fetchManagedUsers(usersMode); setMobileSidebarOpen(false) }}>
                <i className="fas fa-users-cog"></i>
                <span>{t('nav_managed_users')}</span>
                {managedUsers.filter(u => !u.is_verified).length > 0 && <span className="ag-badge">{managedUsers.filter(u => !u.is_verified).length}</span>}
              </a>
            )}
          </nav>
          {/* Bottom logout */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); clearTokens(); navigate('/login') }}>
              <i className="fas fa-sign-out-alt"></i>
              <span>{t('logout')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── TOP NAV ── */}
      <header className="ag-topnav">

        {/* Hamburger — visible only on mobile */}
        <button className="ag-mob-hamburger" onClick={() => setMobileSidebarOpen(true)} aria-label="Menu">
          <i className="fas fa-bars"></i>
        </button>

        <div className="ag-topnav-search" style={{ visibility: 'hidden' }}>
          {/* Removed by user request */}
        </div>

        <div className="ag-topnav-right">
          <div className="ag-lang-toggle">
            <button className={`ag-lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`ag-lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>AR</button>
          </div>
          <div className="ag-topnav-icons">
            <i className="fas fa-bell ag-topnav-icon"></i>
            <button 
              className="btn btn-link text-danger p-0 ms-3" 
              onClick={() => { clearTokens(); navigate('/login') }}
              title={t('logout')}
              style={{ textDecoration: 'none' }}
            >
              <i className="fas fa-sign-out-alt fa-lg"></i>
            </button>
          </div>
          <div className="ag-topnav-user">
            <div>
              <div className="ag-topnav-user-name">{fullName}</div>
              <div className="ag-topnav-user-role">{getRoleLabel(user, t)}</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>
                <i className="fas fa-id-card me-1"></i>{user?.cin} <span className="mx-1">|</span> <i className="fas fa-phone me-1"></i>{user?.phone}
              </div>
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
                      {lang === 'ar' ? 'لوحة القيادة' : 'Tableau de Bord'}
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
                    { val: dupCount, chip: 'Doublons', lbl: 'Réclamations répétées',   icon: 'fa-copy',       iconBg: '#fef2f2', iconColor: '#dc2626', chipColor: '#dc2626', onClick: () => setShowDupPanel((p: boolean) => !p) },
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
                    <div className="ag-map-header" style={{ flexWrap: 'nowrap', gap: 8, alignItems: 'center' }}>
                      <h4 style={{ marginRight: 'auto' }}><i className="fas fa-map-marked-alt" style={{ marginRight: 8, color: '#ae131a' }}></i>{t('map_title_realtime')}</h4>
                      <button
                        onClick={() => setShowMask(m => !m)}
                        title="Masquer hors commune"
                        style={{
                          padding: '3px 10px', fontSize: '.68rem', fontWeight: 700,
                          background: showMask ? '#1a237e' : '#e8e8e8',
                          color: showMask ? '#fff' : '#1a1c1c',
                          border: '1px solid ' + (showMask ? '#1a237e' : '#ccc'),
                          borderRadius: 3, cursor: 'pointer', letterSpacing: '.3px',
                          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                        }}
                      >
                        <i className="fas fa-mask" style={{ fontSize: '.65rem' }}></i>
                        {showMask ? 'Masque ON' : 'Masque OFF'}
                      </button>
                      {/* Status filter toggles + export buttons — all on one row */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {([
                          { key: 'pending',     label: 'En attente',  color: '#e65100', bg: '#fff7ed' },
                          { key: 'in_progress', label: 'En cours',    color: '#1565c0', bg: '#eff6ff' },
                          { key: 'resolved',    label: 'Résolu',      color: '#15803d', bg: '#f0fdf4' },
                          { key: 'rejected',    label: 'Rejeté',      color: '#757575', bg: '#f5f5f5' },
                        ] as { key: string; label: string; color: string; bg: string }[]).map(s => {
                          const active = mapStatusFilter.includes(s.key)
                          return (
                            <button
                              key={s.key}
                              onClick={() => setMapStatusFilter(prev =>
                                active ? prev.filter(x => x !== s.key) : [...prev, s.key]
                              )}
                              style={{
                                padding: '3px 10px', borderRadius: 20, fontSize: '0.71rem',
                                fontWeight: 700, border: `1.5px solid ${s.color}`,
                                background: active ? s.bg : '#f3f4f6',
                                color: active ? s.color : '#9ca3af',
                                cursor: 'pointer', transition: 'all .15s',
                                opacity: active ? 1 : 0.5,
                              }}
                            >
                              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: active ? s.color : '#ccc', marginRight: 5, verticalAlign: 'middle' }}></span>
                              {s.label}
                            </button>
                          )
                        })}
                        {/* Divider */}
                        <span style={{ width: 1, height: 18, background: '#e5e7eb', display: 'inline-block', margin: '0 4px' }}></span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{allRecs.length} {t('signalements_short')}</span>
                        <span style={{ width: 1, height: 18, background: '#e5e7eb', display: 'inline-block', margin: '0 4px' }}></span>
                        {/* Legend toggle button */}
                        <button
                          onClick={() => setShowLegend(p => !p)}
                          title="Afficher / masquer la légende"
                          style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: '0.71rem',
                            fontWeight: 700, border: '1.5px solid #6b7280',
                            background: showLegend ? '#f3f4f6' : '#fff',
                            color: showLegend ? '#374151' : '#6b7280',
                            cursor: 'pointer', transition: 'all .15s',
                          }}
                        >
                          <i className="fas fa-map-legend me-1" style={{ fontSize: '0.68rem' }}></i>
                          <i className="fas fa-list me-1" style={{ fontSize: '0.68rem' }}></i>
                          Légende
                        </button>
                      </div>
                    </div>
                    {/* Map container — position relative so legend overlay works */}
                    <div style={{ position: 'relative' }}>
                      <div id="ag-map" ref={mapRef}></div>
                      {/* React legend overlay */}
                      {showLegend && (
                        <div style={{
                          position: 'absolute', bottom: 12, left: 12, zIndex: 400,
                          background: '#fff', padding: '10px 14px', borderRadius: 8,
                          boxShadow: '0 2px 10px rgba(0,0,0,.15)', fontSize: 12, minWidth: 185,
                          border: '1px solid #f0f0f0',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, color: '#ae131a', borderBottom: '1px solid #eee', paddingBottom: 4, flex: 1 }}>📋 Légende</span>
                            <button onClick={() => setShowLegend(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: '0 0 0 8px', lineHeight: 1 }}>✕</button>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 11, color: '#555', marginBottom: 4 }}>Signalements</div>
                          {[
                            { color: '#e65100', label: 'En attente' },
                            { color: '#1565c0', label: 'En cours' },
                            { color: '#1b5e20', label: 'Résolu' },
                            { color: '#757575', label: 'Rejeté' },
                          ].map(({ color, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }}></span>
                              <span>{label}</span>
                            </div>
                          ))}
                          <div style={{ fontWeight: 600, fontSize: 11, color: '#555', margin: '8px 0 4px' }}>Couches SIG</div>
                          {[
                            { style: { width: 20, height: 3, borderTop: '3px dashed #1a237e', display: 'inline-block' }, label: 'Limite communale' },
                            { style: { width: 20, height: 3, background: '#c62828', display: 'inline-block' }, label: 'Route principale' },
                            { style: { width: 20, height: 3, background: '#e65100', display: 'inline-block' }, label: 'Route secondaire / tertiaire' },
                            { style: { width: 20, height: 3, background: '#546e7a', display: 'inline-block' }, label: 'Route locale' },
                            { style: { width: 18, height: 8, background: '#a5d6a7', border: '1px solid #2e7d32', display: 'inline-block', borderRadius: 2 }, label: 'Espaces verts' },
                            { style: { width: 18, height: 8, background: '#ffe0b2', border: '1px solid #6d4c41', display: 'inline-block', borderRadius: 2 }, label: 'Zones urbaines' },
                            { style: { width: 20, height: 3, borderTop: '2px dashed #0277bd', display: 'inline-block' }, label: 'Oueds' },
                          ].map(({ style, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={style as React.CSSProperties}></span>
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

                                      <i className="fas fa-id-card me-1"></i> ASD: Inactif

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

                                  {user?.is_superuser && (
                                    <button className="btn btn-sm btn-outline-info" title={t('reset_pwd')}
                                      onClick={async (e) => {

                                        e.stopPropagation()

                                        if (!window.confirm(`Générer un nouveau mot de passe pour "${u.full_name}" ?`)) return

                                        try {

                                          const res = await fetch(resolveBackendUrl('/api/accounts/verify-citizens/'), {

                                            method: 'POST',

                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

          const EXCLUDE_TYPES: string[] = []
          allDemandes.forEach((d: any) => {
            if (!d || EXCLUDE_TYPES.includes(d.type)) return
            typeCounts[d.type] = (typeCounts[d.type] || 0) + 1

            let s = String(d.status || 'pending').toLowerCase()
            
            // Comprehensive mapping
            if (['validated', 'processed', 'ready', 'signed', 'completed', 'permis_delivre', 'delivre', 'traite', 'favorable', 'approuvée', 'validé'].some(st => s.includes(st))) {
              s = 'approved'
            } else if (['en_cours', 'instruction', 'programmee', 'envoye', 'en cours'].some(st => s.includes(st))) {
              s = 'in_progress'
            } else if (['rejete', 'refusee', 'defavorable', 'rejet', 'rejected', 'rejetée', 'refusée'].some(st => s.includes(st))) {
              s = 'rejected'
            } else {
              s = 'pending'
            }

            statusCounts[s as keyof typeof statusCounts]++
          })

          return (

            <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', padding: '12px 16px' }}>

              <div className="d-flex flex-wrap gap-2 mb-2">

                {[

                  { lbl: t('all_label'), val: Object.values(statusCounts).reduce((a, b) => a + b, 0), color: '#006d94', bg: '#e1f3fb' },

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
                  const typeLabels: Record<string, string> = { residence: `🏠 ${t('residence_cert')}`, livret: `📘 ${t('nav_managed_users')}`, naissance: `👶 ${t('birth_cert')}`, mariage: `💍 ${t('mariage_cert')}`, deces: `⚰️ ${t('deces_cert')}`, mariage_extrait: `📜 ${t('mariage_cert')} (Acte)`, deces_extrait: `📜 ${t('deces_cert')} (Acte)`, eau: `💧 Eau, Lumière & Égouts`, impots: `💰 Argent & Impôts`, commerce: `🏪 Boutiques & Commerces`, transfert: `🚑 ${lang === 'ar' ? 'نقل جثة' : 'Transfert Corps'}`, legalisation: `✒️ ${lang === 'ar' ? 'تعريف بالإمضاء' : 'Légalisation'}`, goudronnage: `🛤️ ${lang === 'ar' ? 'تعبيد طريق' : 'Goudronnage'}`, bien: `🏢 ${lang === 'ar' ? 'تسجيل عقار' : 'Bien Immo'}`, mutation: `🔄 ${lang === 'ar' ? 'تحيين ملكية' : 'Mutation'}`, vocation: `🏗️ ${lang === 'ar' ? 'تغيير صبغة' : 'Vocation'}`, raccordement: `🔌 ${lang === 'ar' ? 'ربط بالشبكة' : 'Raccordement'}`, evenement: `🎉 ${lang === 'ar' ? 'ترخيص تظاهرة' : 'Événement'}`, construction: `🏗️ ${lang === 'ar' ? 'رخصة بناء' : 'Construction'}` }

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
            <option value="naissance">👶 {t('birth_cert')}</option>
            <option value="mariage">💍 {t('mariage_cert')}</option>
            <option value="deces">⚰️ {t('deces_cert')}</option>
            <option value="mariage_extrait">📜 {t('mariage_cert')} (Acte)</option>
            <option value="deces_extrait">📜 {t('deces_cert')} (Acte)</option>
            <option value="eau">💧 Eau, Lumière &amp; Égouts</option>
            <option value="impots">💰 Argent &amp; Impôts</option>
            <option value="commerce">🏪 Boutiques &amp; Commerces</option>
            <option value="construction">🏗️ Construction</option>
            <option value="transfert">🚑 {lang === 'ar' ? 'رخصة نقل جثة' : 'Transfert de Corps'}</option>
            <option value="bien">🏢 {lang === 'ar' ? 'تسجيل عقار' : 'Bien Immobilier'}</option>
            <option value="mutation">🔄 {lang === 'ar' ? 'تحيين ملكية' : 'Mutation Propriété'}</option>
            <option value="raccordement">🔌 {lang === 'ar' ? 'ربط بالشبكة' : 'Raccordement'}</option>
            <option value="evenement">🎉 {lang === 'ar' ? 'ترخيص تظاهرة' : 'Événement'}</option>
            <option value="vocation">🏗️ {lang === 'ar' ? 'تغيير صبغة' : 'Vocation'}</option>
            <option value="goudronnage">🛤️ {lang === 'ar' ? 'تعبيد طريق' : 'Goudronnage'}</option>
            <option value="legalisation">✒️ {lang === 'ar' ? 'تعريف بالإمضاء' : 'Légalisation'}</option>

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
    const typeLabelsMap: Record<string, string> = { residence: `🏠 ${t('residence_cert')}`, livret: `📘 ${t('nav_managed_users')}`, naissance: `👶 ${t('birth_cert')}`, mariage: `💍 ${t('mariage_cert')}`, deces: `⚰️ ${t('deces_cert')}`, mariage_extrait: `📜 ${t('mariage_cert')} (Acte)`, deces_extrait: `📜 ${t('deces_cert')} (Acte)`, eau: `💧 Eau, Lumière & Égouts`, impots: `💰 Argent & Impôts`, commerce: `🏪 Boutiques & Commerces`, transfert: `🚑 ${lang === 'ar' ? 'نقل جثة' : 'Transfert Corps'}`, legalisation: `✒️ ${lang === 'ar' ? 'تعريف بالإمضاء' : 'Légalisation'}`, goudronnage: `🛤️ ${lang === 'ar' ? 'تعبيد طريق' : 'Goudronnage'}`, bien: `🏢 ${lang === 'ar' ? 'تسجيل عقار' : 'Bien Immo'}`, mutation: `🔄 ${lang === 'ar' ? 'تحيين ملكية' : 'Mutation'}`, vocation: `🏗️ ${lang === 'ar' ? 'تغيير صبغة' : 'Vocation'}`, raccordement: `🔌 ${lang === 'ar' ? 'ربط بالشبكة' : 'Raccordement'}`, evenement: `🎉 ${lang === 'ar' ? 'ترخيص تظاهرة' : 'Événement'}`, construction: `🏗️ ${lang === 'ar' ? 'رخصة بناء' : 'Construction'}` }

    const EXCLUDE_TYPES: string[] = []
    const filtered = allDemandes.filter((d: any) => {
      if (!d || EXCLUDE_TYPES.includes(d.type)) return false

      if (demandeTypeFilter && d.type !== demandeTypeFilter) return false

      if (demandeStatusFilter) {
        let s = String(d.status || 'pending').toLowerCase()
        let mapped = 'pending'
        if (['validated', 'processed', 'ready', 'signed', 'completed', 'permis_delivre', 'delivre', 'traite', 'favorable', 'approuvée', 'validé'].some(st => s.includes(st))) mapped = 'approved'
        else if (['en_cours', 'instruction', 'programmee', 'envoye', 'en cours'].some(st => s.includes(st))) mapped = 'in_progress'
        else if (['rejete', 'refusee', 'defavorable', 'rejet', 'rejected', 'rejetée', 'refusée'].some(st => s.includes(st))) mapped = 'rejected'
        
        if (mapped !== demandeStatusFilter) return false
      }

      if (q && !d.citizen_name?.toLowerCase().includes(q) && !d.citizen_email?.toLowerCase().includes(q) && !String(d.type_label || '').toLowerCase().includes(q)) return false

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
              else if (d.type === 'mariage' || d.type === 'mariage_extrait') summary = d.epoux ? `💍 ${d.epoux} & ${d.epouse}` : ''
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

              {(demandeDetail.type === 'mariage' || demandeDetail.type === 'mariage_extrait') && (<>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'الزوج' : 'Époux'}</div><div className="det-value">{demandeDetail.epoux}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'الزوجة' : 'Épouse'}</div><div className="det-value">{demandeDetail.epouse}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'تاريخ الزواج' : 'Date mariage'}</div><div className="det-value">{demandeDetail.date_mariage}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'نظام الأملاك' : 'Régime'}</div><div className="det-value">{demandeDetail.regime}</div></div>
              </>)}

              {(demandeDetail.type === 'deces' || demandeDetail.type === 'deces_extrait') && (<>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'المتوفى' : 'Défunt'}</div><div className="det-value">{demandeDetail.nom_defunt}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'تاريخ الوفاة' : 'Date décès'}</div><div className="det-value">{demandeDetail.date_deces}</div></div>
                <div className="col-6"><div className="det-label">{lang === 'ar' ? 'مكان الوفاة' : 'Lieu décès'}</div><div className="det-value">{demandeDetail.lieu_deces}</div></div>
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
            <div className="mb-3">
              <label className="det-label mb-2">
                <i className="fas fa-exchange-alt me-1"></i>{t('status_label')}
              </label>
              <select
                className="form-select form-select-sm"
                value={demandeNewStatus}
                onChange={e => setDemandeNewStatus(e.target.value)}
              >
                <option value="pending">{t('status_pending')}</option>
                <option value="in_progress">{t('status_in_progress')}</option>
                <option value="approved">{t('status_approved')}</option>
                <option value="resolved">{t('status_resolved')}</option>
                <option value="rejected">{t('status_rejected')}</option>
              </select>
            </div>



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

    <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' }}>

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

                { label: t('stats_ia_precision_cat'), value: Math.round(mlStats.category.accuracy * 100) + '%', bg: '#e8f5e9', color: mlStats.category.accuracy >= 0.85 ? '#2e7d32' : '#f57f17', sub: 'TF-IDF + LinearSVC' },

                { label: t('stats_ia_precision_pri'), value: Math.round(mlStats.priority.accuracy * 100) + '%', bg: '#e0f2fe', color: mlStats.priority.accuracy >= 0.85 ? '#0369a1' : '#f57f17', sub: 'TF-IDF + LinearSVC' },

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

              <b>{t('stats_ia_f1')}</b> {t('ml_stats_f1_def')}

            </p>

            <div className="ag-card" style={{ marginBottom: 22 }}>

              <div style={{ overflowX: 'auto', padding: '4px 0' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>

                  <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('category_label')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_precision')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_recall')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_f1')}</th></tr></thead>

                  <tbody>

                    {mlStats.category.report.map((row: any) => {

                      const f1Color = row.f1 >= 0.85 ? '#2e7d32' : row.f1 >= 0.65 ? '#f57f17' : '#c62828'

                      return (

                        <tr key={row.label} style={{ borderBottom: '1px solid #f0f0f0' }}>

                          <td style={{ padding: '8px 12px', color: '#444' }}><strong>{CAT_LABELS[row.label] || row.label}</strong></td>

                          <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.precision * 100)}%</td>

                          <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.recall * 100)}%</td>

                          <td style={{ padding: '8px 12px', color: '#444' }}><span style={{ color: f1Color, fontWeight: 700 }}>{Math.round(row.f1 * 100)}%</span></td>

                        </tr>

                      )

                    })}

                    <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>

                      <td style={{ padding: '8px 12px' }}>{t('average')}</td>

                      <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.category.report.reduce((s: number, r: any) => s + r.precision, 0) / mlStats.category.report.length * 100)}%</td>

                      <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.category.report.reduce((s: number, r: any) => s + r.recall, 0) / mlStats.category.report.length * 100)}%</td>

                      <td style={{ padding: '8px 12px', color: '#0369a1' }}>{Math.round(mlStats.category.report.reduce((s: number, r: any) => s + r.f1, 0) / mlStats.category.report.length * 100)}%</td>

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



            {/* SHAP — Global Feature Importance */}
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#5c6bc0', margin: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>
              <i className="fas fa-chart-bar"></i> SHAP — Importance Globale des Mots par Catégorie
            </div>
            <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
              Pour les modèles linéaires (TF-IDF + LinearSVC), les <strong>valeurs SHAP</strong> correspondent aux coefficients du classifieur.
              Une barre <span style={{ display:'inline-block', width:10, height:10, background:'#5c6bc0', borderRadius:2, verticalAlign:'middle' }}></span> <strong style={{color:'#5c6bc0'}}>bleue</strong> signifie que le mot <em>pousse vers cette catégorie</em> ; <span style={{ display:'inline-block', width:10, height:10, background:'#ef5350', borderRadius:2, verticalAlign:'middle' }}></span> <strong style={{color:'#ef5350'}}>rouge</strong> = pousse ailleurs.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14, marginBottom: 28 }}>
              {Object.entries(mlStats.category.top_features).map(([cat, words]: [string, any]) => {
                const maxScore = Math.max(...words.map((w: any) => Math.abs(w.score)), 0.001)
                const catColors: Record<string,string> = { lighting:'#f57f17', trash:'#2e7d32', roads:'#6a1b9a', noise:'#b71c1c', other:'#0277bd' }
                const catBg: Record<string,string> = { lighting:'#fff8e1', trash:'#e8f5e9', roads:'#f3e5f5', noise:'#fce4ec', other:'#e3f2fd' }
                return (
                  <div key={cat} style={{ background: catBg[cat] || '#f8fafc', borderRadius: 10, border: `1px solid ${catColors[cat] || '#e0e0e0'}22`, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '.82rem', color: catColors[cat] || '#333', marginBottom: 10 }}>{CAT_LABELS[cat] || cat}</div>
                    {words.slice(0, 7).map((w: any, i: number) => (
                      <div key={i} style={{ marginBottom: 7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 3 }}>
                          <span style={{ color: '#444', fontWeight: 500 }}>{w.word}</span>
                          <span style={{ color: '#999', fontFamily: 'monospace' }}>{w.score > 0 ? '+' : ''}{w.score.toFixed(3)}</span>
                        </div>
                        <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(Math.abs(w.score) / maxScore * 100).toFixed(0)}%`, background: w.score >= 0 ? '#5c6bc0' : '#ef5350', borderRadius: 3, transition: 'width .4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>



            {/* TABLE 4 — Priority Classification Report */}

            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a237e', margin: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>

              <i className="fas fa-flag"></i>{t('stats_ia_table4')}

            </div>

            <div className="ag-card" style={{ marginBottom: 22 }}>

              <div style={{ overflowX: 'auto', padding: '4px 0' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>

                  <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('priority_label')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_precision')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_recall')}</th><th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #e0e0e0' }}>{t('stats_ia_f1')}</th></tr></thead>

                  <tbody>

                    {mlStats.priority.report.map((row: any) => {

                      const f1Color = row.f1 >= 0.85 ? '#2e7d32' : row.f1 >= 0.65 ? '#f57f17' : '#c62828'

                      return (

                        <tr key={row.label} style={{ borderBottom: '1px solid #f0f0f0' }}>

                          <td style={{ padding: '8px 12px', color: '#444' }}><strong>{PRI_LABELS[row.label] || row.label}</strong></td>

                          <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.precision * 100)}%</td>

                          <td style={{ padding: '8px 12px', color: '#444' }}>{Math.round(row.recall * 100)}%</td>

                          <td style={{ padding: '8px 12px', color: '#444' }}><span style={{ color: f1Color, fontWeight: 700 }}>{Math.round(row.f1 * 100)}%</span></td>

                        </tr>

                      )

                    })}

                    <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>

                      <td style={{ padding: '8px 12px' }}>{t('stats_ia_average')}</td>

                      <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.priority.report.reduce((s: number, r: any) => s + r.precision, 0) / mlStats.priority.report.length * 100)}%</td>

                      <td style={{ padding: '8px 12px' }}>{Math.round(mlStats.priority.report.reduce((s: number, r: any) => s + r.recall, 0) / mlStats.priority.report.length * 100)}%</td>

                      <td style={{ padding: '8px 12px', color: '#0369a1' }}>{Math.round(mlStats.priority.report.reduce((s: number, r: any) => s + r.f1, 0) / mlStats.priority.report.length * 100)}%</td>

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

              {t('stats_ia_model_trained')}

            </div>

            {/* ── LIME + SHAP Live Demo ─────────────────────────── */}
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#5c6bc0', margin: '32px 0 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #e8eaf6', paddingBottom: 8 }}>
              <i className="fas fa-flask"></i> LIME + SHAP — Démo en Direct
            </div>
            <p style={{ fontSize: '.76rem', color: '#888', marginBottom: 14, lineHeight: 1.6 }}>
              Entrez une description de réclamation pour voir comment l'IA explique sa décision de priorité mot par mot.
              <strong> LIME</strong> approxime l'influence locale de chaque mot. <strong>SHAP</strong> utilise les poids du modèle linéaire.
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <textarea
                value={explainText}
                onChange={e => setExplainText(e.target.value)}
                placeholder="Ex: La rue est inondée depuis 3 jours, danger immédiat pour les piétons..."
                rows={3}
                style={{ flex: 1, borderRadius: 10, border: '1px solid #e0e0e0', padding: '10px 14px', fontSize: '.83rem', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) fetchExplain() }}
              />
              <button
                onClick={fetchExplain}
                disabled={explainLoading || !explainText.trim()}
                style={{ alignSelf: 'flex-end', background: '#5c6bc0', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '.83rem', cursor: 'pointer', whiteSpace: 'nowrap', opacity: (!explainText.trim() || explainLoading) ? 0.6 : 1 }}>
                {explainLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Analyse…</> : <><i className="fas fa-magic me-2"></i>Analyser</>}
              </button>
            </div>
            {explainError && (
              <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 8, padding: '10px 14px', fontSize: '.82rem', color: '#b71c1c', marginBottom: 14 }}>
                <i className="fas fa-exclamation-triangle me-2"></i>{explainError}
              </div>
            )}
            {explainResult && (() => {
              const priColors: Record<string,{bg:string,color:string}> = {
                urgente: { bg:'#fff1f2', color:'#be123c' },
                normale: { bg:'#eff6ff', color:'#1d4ed8' },
                faible:  { bg:'#f0fdf4', color:'#166534' },
              }
              const priStyle = priColors[explainResult.predicted_priority] || priColors.normale
              const probs: Record<string,number> = explainResult.probabilities || {}
              const shap: any[] = explainResult.shap || []
              const lime: any[] = explainResult.lime || []
              const maxShap = Math.max(...shap.map((w: any) => Math.abs(w.shap_value)), 0.001)
              const maxLime = Math.max(...lime.map((w: any) => Math.abs(w.score)), 0.001)
              return (
                <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e8eaf6', padding: '20px 22px', marginBottom: 8 }}>
                  {/* Prediction */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.78rem', color: '#555' }}>Priorité prédite :</span>
                    <span style={{ background: priStyle.bg, color: priStyle.color, fontWeight: 700, padding: '4px 14px', borderRadius: 20, fontSize: '.85rem' }}>
                      {explainResult.predicted_priority === 'urgente' ? '🔴' : explainResult.predicted_priority === 'normale' ? '🔵' : '🟣'} {explainResult.predicted_priority}
                    </span>
                    <span style={{ fontSize: '.76rem', color: '#999' }}>Confiance : {Math.round((explainResult.confidence || 0) * 100)}%</span>
                  </div>
                  {/* Probability bars */}
                  {Object.keys(probs).length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Probabilités par classe</div>
                      {Object.entries(probs).sort((a,b) => b[1]-a[1]).map(([lbl, val]: [string, any]) => (
                        <div key={lbl} style={{ marginBottom: 7 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 3 }}>
                            <span style={{ color: '#444', fontWeight: 500 }}>{lbl === 'urgente' ? '🔴' : lbl === 'normale' ? '🔵' : '🟣'} {lbl}</span>
                            <span style={{ color: '#777' }}>{Math.round(val * 100)}%</span>
                          </div>
                          <div style={{ height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(val * 100).toFixed(0)}%`, background: lbl === 'urgente' ? '#be123c' : lbl === 'normale' ? '#1d4ed8' : '#166534', borderRadius: 4, transition: 'width .5s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                    {/* SHAP */}
                    {shap.length > 0 && (
                      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8eaf6', padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#5c6bc0', marginBottom: 4 }}><i className="fas fa-puzzle-piece me-2"></i>SHAP — Mots influents</div>
                        <p style={{ fontSize: '.7rem', color: '#aaa', marginBottom: 10 }}>Contribution de chaque mot au score de priorité (modèle linéaire)</p>
                        {shap.slice(0, 10).map((w: any, i: number) => (
                          <div key={i} style={{ marginBottom: 7 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 3 }}>
                              <span style={{ color: w.direction === 'for' ? '#be123c' : '#166534', fontWeight: 600 }}>{w.word}</span>
                              <span style={{ color: '#999', fontFamily: 'monospace' }}>{w.shap_value > 0 ? '+' : ''}{w.shap_value.toFixed(4)}</span>
                            </div>
                            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(Math.abs(w.shap_value) / maxShap * 100).toFixed(0)}%`, background: w.direction === 'for' ? '#be123c' : '#166534', borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                        {shap.length === 0 && <p style={{ fontSize: '.75rem', color: '#aaa' }}>Aucun résultat SHAP</p>}
                      </div>
                    )}
                    {/* LIME */}
                    {lime.length > 0 && (
                      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8eaf6', padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#0277bd', marginBottom: 4 }}><i className="fas fa-lemon me-2"></i>LIME — Explication Locale</div>
                        <p style={{ fontSize: '.7rem', color: '#aaa', marginBottom: 10 }}>Perturbation locale du texte pour mesurer l'importance des mots</p>
                        {lime.slice(0, 10).map((w: any, i: number) => (
                          <div key={i} style={{ marginBottom: 7 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 3 }}>
                              <span style={{ color: w.direction === 'for' ? '#be123c' : '#166534', fontWeight: 600 }}>{w.word}</span>
                              <span style={{ color: '#999', fontFamily: 'monospace' }}>{w.score > 0 ? '+' : ''}{w.score.toFixed(4)}</span>
                            </div>
                            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(Math.abs(w.score) / maxLime * 100).toFixed(0)}%`, background: w.direction === 'for' ? '#f57f17' : '#0277bd', borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                        {lime.length === 0 && <p style={{ fontSize: '.75rem', color: '#aaa' }}>LIME non disponible (package non installé)</p>}
                      </div>
                    )}
                    {shap.length === 0 && lime.length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#aaa', fontSize: '.82rem', padding: '20px 0' }}>
                        <i className="fas fa-info-circle me-2"></i>
                        {(explainResult.errors || []).join(' · ') || 'LIME/SHAP non disponibles sur ce serveur (packages ML requis).'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

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

      <div className="ag-card-hdr-blue" style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

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

              <label className="det-label mb-2">Email de Contact Administratif</label>

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

        <div className="ag-modal-hdr" style={{ background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', borderRadius: '16px 16px 0 0' }}>

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

                        background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',

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

                <div className="col-6"><div className="det-label">Date de la réclamation</div><div className="det-value">{formatDate(detailRec.created_at)}</div></div>

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

        <div className="p-3 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', color: '#fff' }}>

          <h6 className="mb-0 fw-bold"><i className="fas fa-key me-2"></i>Mot de passe réinitialisé</h6>

          <button className="btn-close btn-close-white" onClick={() => setResetPwdResult(null)}></button>

        </div>

        <div className="p-4 text-center">

          <div className="mb-3 text-muted small">Nouveau mot de passe temporaire pour</div>

          <div className="fw-bold mb-3" style={{ fontSize: '1rem', color: '#1a1a2e' }}>{resetPwdResult.name}</div>

          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">

            <code className="px-4 py-2 rounded-3 fw-bold" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '1.15rem', letterSpacing: 2, border: '2px dashed #0ea5e9' }}>

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

              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },

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

              headers: { Authorization: `Bearer ${getAccessToken()}` },

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





