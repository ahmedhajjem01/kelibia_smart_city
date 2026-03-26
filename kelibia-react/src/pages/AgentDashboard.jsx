import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import TopBar from '../components/layout/TopBar'
import MainNavbar from '../components/layout/MainNavbar'
import Sidebar from '../components/layout/Sidebar'
import PageFooter from '../components/layout/PageFooter'
import LeafletMap from '../components/map/LeafletMap'
import { ToastContainer, showToast } from '../components/common/Toast'
import apiClient, { API_BASE } from '../api/axios'

/* ── Constants ── */
const CAT = {
  lighting: { label: '💡 Éclairage',  cls: 'cat-lighting' },
  trash:    { label: '🗑️ Déchets',    cls: 'cat-trash'    },
  roads:    { label: '🛣️ Voirie',      cls: 'cat-roads'    },
  noise:    { label: '🔊 Nuisances',  cls: 'cat-noise'    },
  other:    { label: '📌 Autre',       cls: 'cat-other'    },
}
const STATUS = {
  pending:     { label: 'En attente',  cls: 'status-pending'     },
  in_progress: { label: 'En cours',   cls: 'status-in_progress' },
  resolved:    { label: 'Résolue',    cls: 'status-resolved'    },
  rejected:    { label: 'Rejetée',    cls: 'status-rejected'    },
}
const PRIORITY = {
  urgente: { label: '🔴 Urgente', cls: 'priority-urgente' },
  normale: { label: '🔵 Normale', cls: 'priority-normale' },
  faible:  { label: '🟣 Faible',  cls: 'priority-faible'  },
}
const PAGE_SIZE = 10

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function detectDuplicates(recs) {
  const groups = {}
  recs.forEach(r => {
    const key = r.title.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40)
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  })
  const groups2 = {}
  recs.forEach(r => {
    const key2 = `${r.category}__${r.citizen_email || r.citizen || ''}`
    if (!groups2[key2]) groups2[key2] = []
    groups2[key2].push(r)
  })
  const dupSet = new Set()
  Object.values(groups).forEach(arr => { if (arr.length > 1) arr.forEach(r => dupSet.add(r.id)) })
  Object.values(groups2).forEach(arr => { if (arr.length > 2) arr.forEach(r => dupSet.add(r.id)) })
  return {
    count: dupSet.size,
    groups: Object.values(groups).filter(a => a.length > 1),
    groups2: Object.values(groups2).filter(a => a.length > 2),
  }
}

export default function AgentDashboard() {
  const { user } = useAuth()
  const { t }    = useLang()

  const [allRecs, setAllRecs]           = useState([])
  const [filtered, setFiltered]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(false)
  const [currentPage, setCurrentPage]   = useState(1)
  const [urgentOnly, setUrgentOnly]     = useState(false)
  const [showDups, setShowDups]         = useState(false)
  const [dupData, setDupData]           = useState({ count: 0, groups: [], groups2: [] })

  // Filters
  const [search, setSearch]       = useState('')
  const [fStatus, setFStatus]     = useState('')
  const [fCategory, setFCategory] = useState('')
  const [fPriority, setFPriority] = useState('')

  // Detail modal
  const [detailRec, setDetailRec]         = useState(null)
  const [detailStatus, setDetailStatus]   = useState('')
  const [savingDetail, setSavingDetail]   = useState(false)

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : ''
  const initials = fullName
    ? fullName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  /* ── Fetch reclamations ── */
  async function fetchReclamations() {
    setLoading(true)
    setError(false)
    try {
      const res  = await apiClient.get('/api/reclamations/')
      const data = res.data
      const list = Array.isArray(data) ? data : (data.results || [])
      setAllRecs(list)
      setDupData(detectDuplicates(list))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReclamations() }, [])

  /* ── Apply filters whenever inputs change ── */
  useEffect(() => {
    const s  = search.toLowerCase()
    const result = allRecs.filter(r => {
      const mS  = !s       || r.title.toLowerCase().includes(s) || (r.citizen_name||'').toLowerCase().includes(s) || (r.description||'').toLowerCase().includes(s)
      const mSt = !fStatus   || r.status   === fStatus
      const mC  = !fCategory || r.category === fCategory
      const mP  = !fPriority || r.priority === fPriority
      const mU  = !urgentOnly || r.priority === 'urgente'
      return mS && mSt && mC && mP && mU
    })
    setFiltered(result)
    setCurrentPage(1)
  }, [allRecs, search, fStatus, fCategory, fPriority, urgentOnly])

  /* ── Stats ── */
  const total    = allRecs.length
  const pending  = allRecs.filter(r => r.status === 'pending').length
  const inProg   = allRecs.filter(r => r.status === 'in_progress').length
  const resolved = allRecs.filter(r => r.status === 'resolved').length
  const rejected = allRecs.filter(r => r.status === 'rejected').length

  const pct = v => total > 0 ? Math.round(v / total * 100) : 0

  /* ── Category breakdown ── */
  const catCounts = {}
  allRecs.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1 })
  const catBreakdown = Object.entries(catCounts).sort((a,b) => b[1]-a[1])

  /* ── Pagination ── */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageSlice  = filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE)

  /* ── Quick status update ── */
  async function quickUpdate(id, newStatus, revertFn) {
    try {
      const res = await apiClient.post(`/api/reclamations/${id}/update_status/`, { status: newStatus })
      if (res.status === 200 || res.status === 201) {
        setAllRecs(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
        showToast(`Statut mis à jour → ${STATUS[newStatus]?.label || newStatus}`)
      } else {
        revertFn()
        showToast('Erreur lors de la mise à jour.', 'error')
      }
    } catch {
      revertFn()
      showToast('Erreur réseau.', 'error')
    }
  }

  /* ── Open detail modal ── */
  function openDetail(r) {
    setDetailRec(r)
    setDetailStatus(r.status)
  }
  function closeDetail() { setDetailRec(null) }

  async function saveDetailStatus() {
    if (!detailRec) return
    setSavingDetail(true)
    try {
      const res = await apiClient.post(`/api/reclamations/${detailRec.id}/update_status/`, { status: detailStatus })
      if (res.status === 200 || res.status === 201) {
        setAllRecs(prev => prev.map(r => r.id === detailRec.id ? { ...r, status: detailStatus } : r))
        closeDetail()
        showToast('Statut enregistré avec succès !')
      } else {
        showToast('Erreur lors de l\'enregistrement.', 'error')
      }
    } catch {
      showToast('Erreur réseau.', 'error')
    } finally {
      setSavingDetail(false)
    }
  }

  /* ── Prevent body scroll when detail modal open ── */
  useEffect(() => {
    document.body.style.overflow = detailRec ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [detailRec])

  /* ── Toggle urgent filter ── */
  function toggleUrgent() {
    const next = !urgentOnly
    setUrgentOnly(next)
    if (next) setFPriority('urgente')
    else setFPriority('')
  }

  return (
    <>
      <TopBar />
      <MainNavbar />

      {/* HERO STRIP */}
      <div className="hero-strip" style={{ padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="greeting">
            <i className="fas fa-shield-alt me-2"></i>
            <span>{t('agent_welcome')}</span>{' '}
            <strong>{user?.first_name || fullName || 'Agent'}</strong>
          </div>
          <div className="sub">Gérez les signalements des citoyens et assurez le suivi des interventions.</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge-role">
            <i className="fas fa-id-badge me-1"></i>Agent Municipal
          </span>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/40px-Flag_of_Tunisia.svg.png"
            height="22" style={{ borderRadius: '3px' }} alt="Tunisie"
          />
        </div>
      </div>

      {/* BREADCRUMB */}
      <div className="breadcrumb-bar">
        <a href="#"><i className="fas fa-home me-1"></i>Accueil</a>
        <span className="mx-2 text-muted">/</span>
        <span>Espace Agent</span>
        <span className="mx-2 text-muted">/</span>
        <span>Gestion des Signalements</span>
      </div>

      {/* PAGE BODY */}
      <div className="page-body">

        <Sidebar variant="agent" pendingCount={pending} />

        {/* MAIN CONTENT */}
        <div className="main-content">

          {/* STAT CARDS */}
          <div className="row g-3 mb-4">
            {[
              { id: 'total',    val: total,    label: 'Total',        color: '#2e7d32', bg: '#e8f5e9', icon: 'fa-list-check'    },
              { id: 'pending',  val: pending,  label: 'En attente',   color: '#e65100', bg: '#fff3e0', icon: 'fa-clock'         },
              { id: 'inprog',   val: inProg,   label: 'En cours',     color: '#1565c0', bg: '#e3f2fd', icon: 'fa-tools'         },
              { id: 'resolved', val: resolved, label: 'Résolus',      color: '#1b5e20', bg: '#e8f5e9', icon: 'fa-check-circle'  },
              { id: 'rejected', val: rejected, label: 'Rejetés',      color: '#b71c1c', bg: '#ffebee', icon: 'fa-times-circle'  },
              { id: 'dups',     val: dupData.count, label: 'Doublons', color: '#6a1b9a', bg: '#f3e5f5', icon: 'fa-copy', onClick: () => setShowDups(v => !v) },
            ].map(s => (
              <div className="col-6 col-md-2" key={s.id}>
                <div
                  className="stat-card"
                  style={{ borderLeftColor: s.color, cursor: s.onClick ? 'pointer' : undefined }}
                  onClick={s.onClick}
                >
                  <div className="icon-box" style={{ background: s.bg }}>
                    <i className={`fas ${s.icon}`} style={{ color: s.color }}></i>
                  </div>
                  <div>
                    <div className="stat-val">{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DUPLICATES PANEL */}
          {showDups && (
            <div className="content-card mb-4" style={{ borderLeft: '4px solid #6a1b9a' }}>
              <div className="card-header-blue" style={{ background: 'linear-gradient(90deg,#4a148c,#6a1b9a)' }}>
                <span><i className="fas fa-copy me-2"></i>Signalements potentiellement en double</span>
                <button
                  onClick={() => setShowDups(false)}
                  style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: '6px', fontSize: '.78rem', padding: '4px 10px', cursor: 'pointer' }}
                >
                  <i className="fas fa-times me-1"></i> Fermer
                </button>
              </div>
              <div className="card-body-custom">
                {dupData.groups.length === 0 && dupData.groups2.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                    <i className="fas fa-check-circle" style={{ color: '#2e7d32', fontSize: '2rem', display: 'block', marginBottom: '10px' }}></i>
                    Aucun doublon détecté.
                  </div>
                ) : (
                  (() => {
                    const seen = new Set()
                    return [...dupData.groups, ...dupData.groups2].filter(arr => {
                      const key = arr.map(r => r.id).sort().join(',')
                      if (seen.has(key)) return false
                      seen.add(key); return true
                    }).map((arr, i) => (
                      <div key={i} style={{ background: '#f9f0ff', border: '1px solid #e1bee7', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '.78rem', color: '#6a1b9a', fontWeight: 700, marginBottom: '8px' }}>
                          <i className="fas fa-copy me-1"></i> {arr.length} signalements similaires
                        </div>
                        {arr.map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #ede7f6', fontSize: '.8rem' }}>
                            <span><strong>#{r.id}</strong> — {r.title}</span>
                            <span style={{ color: '#888' }}>{STATUS[r.status]?.label || r.status}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  })()
                )}
              </div>
            </div>
          )}

          {/* MAP CARD */}
          <div className="content-card mb-4" id="mapCard">
            <div className="card-header-blue">
              <span><i className="fas fa-map-marked-alt me-2"></i>Carte des Signalements — Kélibia</span>
              <span style={{ fontSize: '.75rem', opacity: '.7' }}>{allRecs.length} signalement(s)</span>
            </div>
            <LeafletMap reclamations={allRecs} height="380px" />
          </div>

          {/* RECLAMATIONS TABLE CARD */}
          <div className="content-card" id="reclamationsCard">
            <div className="card-header-blue">
              <span><i className="fas fa-bullhorn me-2"></i>Gestion des Signalements</span>
              <button
                onClick={fetchReclamations}
                style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: '6px', fontSize: '.78rem', padding: '4px 10px', cursor: 'pointer' }}
              >
                <i className="fas fa-sync-alt me-1"></i> Actualiser
              </button>
            </div>

            {/* Filter bar */}
            <div className="filter-bar">
              <div className="search-wrap">
                <i className="fas fa-search"></i>
                <input
                  type="text" className="search-input" placeholder="Rechercher..."
                  value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="filter-select" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolus</option>
                <option value="rejected">Rejetés</option>
              </select>
              <select className="filter-select" value={fCategory} onChange={e => setFCategory(e.target.value)}>
                <option value="">Toutes catégories</option>
                <option value="lighting">Éclairage</option>
                <option value="trash">Déchets</option>
                <option value="roads">Voirie</option>
                <option value="noise">Nuisances</option>
                <option value="other">Autre</option>
              </select>
              <select className="filter-select" value={fPriority} onChange={e => { setFPriority(e.target.value); setUrgentOnly(e.target.value === 'urgente') }}>
                <option value="">Toutes priorités</option>
                <option value="urgente">🔴 Urgente</option>
                <option value="normale">🔵 Normale</option>
                <option value="faible">🟣 Faible</option>
              </select>
              <button className={`filter-btn${urgentOnly ? ' active' : ''}`} onClick={toggleUrgent}>
                <i className="fas fa-fire"></i> Urgents seulement
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#888' }}>{filtered.length} résultat(s)</span>
            </div>

            {/* Loading */}
            {loading && (
              <div className="spinner-custom">
                <div className="spinner-border" style={{ color: '#1565c0', width: '2rem', height: '2rem' }} role="status"></div>
                <div className="mt-2" style={{ fontSize: '.82rem', color: '#888' }}>Chargement des signalements...</div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="empty-state">
                <i className="fas fa-exclamation-triangle d-block" style={{ color: '#e53935' }}></i>
                <p>Erreur lors du chargement.</p>
                <button onClick={fetchReclamations} style={{ background: '#1565c0', color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 16px', cursor: 'pointer', fontSize: '.83rem' }}>
                  <i className="fas fa-redo me-1"></i> Réessayer
                </button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && filtered.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="rec-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Titre</th>
                      <th>Citoyen</th>
                      <th>Catégorie</th>
                      <th>Priorité</th>
                      <th>Service</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.map(r => {
                      const cat   = CAT[r.category]   || CAT.other
                      const prio  = PRIORITY[r.priority] || PRIORITY.normale
                      const svc   = r.service_responsable || '—'
                      return (
                        <tr key={r.id}>
                          <td style={{ color: '#aaa', fontSize: '.74rem' }}>#{r.id}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#1a1a2e', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                            <div style={{ fontSize: '.7rem', color: '#aaa', marginTop: '1px' }}>{(r.description||'').slice(0,40)}{r.description&&r.description.length>40?'…':''}</div>
                          </td>
                          <td style={{ fontSize: '.8rem', color: '#444' }}>{r.citizen_name || '—'}</td>
                          <td><span className={`cat-badge ${cat.cls}`}>{cat.label}</span></td>
                          <td><span className={`priority-badge ${prio.cls}`}>{prio.label}</span></td>
                          <td><span className="service-badge" title={svc}>{svc}</span></td>
                          <td>
                            <StatusSelect
                              recId={r.id}
                              current={r.status}
                              onUpdate={(newStatus, revertFn) => quickUpdate(r.id, newStatus, revertFn)}
                            />
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: '#888', fontSize: '.78rem' }}>{formatDate(r.created_at)}</td>
                          <td>
                            <button className="action-btn" onClick={() => openDetail(r)} title="Voir détail">
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-inbox d-block"></i>
                <p>Aucun signalement trouvé.</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="pagination-bar">
                <span>Page {currentPage} / {totalPages} — {filtered.length} signalement(s)</span>
                <div className="d-flex gap-2">
                  <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const from = Math.max(1, currentPage - 2)
                    const p = from + i
                    if (p > totalPages) return null
                    return (
                      <button key={p} className={`page-btn${p === currentPage ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    )
                  })}
                  <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

          </div>{/* /reclamations card */}

        </div>{/* /main-content */}

        {/* RIGHT COLUMN */}
        <div style={{ width: '240px', minWidth: '240px', padding: '24px 16px 24px 0', flexShrink: 0 }}>

          {/* Agent Profile */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-name">{fullName || 'Chargement...'}</div>
              <div className="profile-email">{user?.email || '...'}</div>
            </div>
            <div className="profile-body">
              <div className="profile-row">
                <span className="lbl">Rôle</span>
                <span className="val" style={{ color: '#1565c0' }}>Agent Municipal</span>
              </div>
              <div className="profile-row">
                <span className="lbl">Ville</span>
                <span className="val">{user?.city || 'Kélibia'}</span>
              </div>
              <div className="profile-row">
                <span className="lbl">Dossiers</span>
                <span className="val">{inProg}</span>
              </div>
            </div>
          </div>

          {/* Progress mini card */}
          <div className="content-card">
            <div className="card-header-green">
              <span><i className="fas fa-chart-pie me-2"></i>Avancement</span>
            </div>
            <div className="card-body-custom">
              {[
                { label: 'En attente', color: '#e65100', val: pending,  pctVal: pct(pending)  },
                { label: 'En cours',   color: '#1565c0', val: inProg,   pctVal: pct(inProg)   },
                { label: 'Résolus',    color: '#1b5e20', val: resolved, pctVal: pct(resolved) },
              ].map(item => (
                <div className="mb-3" key={item.label}>
                  <div className="d-flex justify-content-between" style={{ fontSize: '.78rem', marginBottom: '3px' }}>
                    <span style={{ color: item.color }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.pctVal}%</span>
                  </div>
                  <div className="mini-progress">
                    <div className="bar" style={{ background: item.color, width: `${item.pctVal}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="content-card">
            <div className="card-header-orange">
              <span><i className="fas fa-layer-group me-2"></i>Par catégorie</span>
            </div>
            <div className="card-body-custom">
              {catBreakdown.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '.8rem', textAlign: 'center' }}>Chargement...</div>
              ) : catBreakdown.map(([k, v]) => {
                const cat   = CAT[k] || CAT.other
                const pctV  = Math.round(v / total * 100)
                return (
                  <div className="mb-2" key={k}>
                    <div className="d-flex justify-content-between" style={{ fontSize: '.76rem', marginBottom: '2px' }}>
                      <span>{cat.label}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                    <div className="mini-progress">
                      <div className="bar" style={{ background: '#1565c0', width: `${pctV}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>{/* /right column */}

      </div>{/* /page-body */}

      <PageFooter />

      {/* ════ DETAIL MODAL ════ */}
      {detailRec && (
        <div
          className="modal fade show d-block"
          style={{ background: 'rgba(0,0,0,.5)', zIndex: 1050 }}
          onClick={e => { if (e.target === e.currentTarget) closeDetail() }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header-blue">
                <div className="modal-title-custom">
                  <i className="fas fa-file-alt me-2"></i> Détail du Signalement
                </div>
                <button type="button" className="btn-close-custom" onClick={closeDetail}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <div className="detail-label">Titre</div>
                      <div className="detail-value">{detailRec.title}</div>
                    </div>
                    <div className="mb-3">
                      <div className="detail-label">Description</div>
                      <div className="detail-value" style={{ lineHeight: '1.6' }}>{detailRec.description || '—'}</div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="detail-label">Catégorie</div>
                        <div className="detail-value">
                          <span className={`cat-badge ${(CAT[detailRec.category]||CAT.other).cls}`}>
                            {(CAT[detailRec.category]||CAT.other).label}
                          </span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="detail-label">Statut actuel</div>
                        <div className="detail-value">
                          <span className={`status-badge ${(STATUS[detailRec.status]||STATUS.pending).cls}`}>
                            {(STATUS[detailRec.status]||STATUS.pending).label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="detail-label">Priorité (IA)</div>
                        <div className="detail-value">
                          <span className={`priority-badge ${(PRIORITY[detailRec.priority]||PRIORITY.normale).cls}`}>
                            {(PRIORITY[detailRec.priority]||PRIORITY.normale).label}
                          </span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="detail-label">Service responsable</div>
                        <div className="detail-value" style={{ fontSize: '.82rem' }}>{detailRec.service_responsable || '—'}</div>
                      </div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="detail-label">Citoyen</div>
                        <div className="detail-value">{detailRec.citizen_name || '—'}</div>
                      </div>
                      <div className="col-6">
                        <div className="detail-label">Date de signalement</div>
                        <div className="detail-value">{formatDate(detailRec.created_at)}</div>
                      </div>
                    </div>
                    {detailRec.image && (
                      <div>
                        <div className="detail-label mb-2">Photo jointe</div>
                        <img
                          src={detailRec.image.startsWith('http') ? detailRec.image : `${API_BASE}${detailRec.image}`}
                          style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }} alt="Photo"
                        />
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <div className="detail-label mb-2">Changer le statut</div>
                    <select className="form-select mb-3" value={detailStatus} onChange={e => setDetailStatus(e.target.value)}>
                      <option value="pending">⏳ En attente</option>
                      <option value="in_progress">🔧 En cours</option>
                      <option value="resolved">✅ Résolue</option>
                      <option value="rejected">❌ Rejetée</option>
                    </select>
                    <button className="btn btn-primary w-100" onClick={saveDetailStatus} disabled={savingDetail}>
                      {savingDetail
                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Enregistrement...</>
                        : <><i className="fas fa-save me-2"></i>Enregistrer</>}
                    </button>
                    {detailRec.latitude && detailRec.longitude ? (
                      <div style={{ marginTop: '14px', fontSize: '.78rem', background: '#f0faf2', border: '1px solid #a5d6a7', borderRadius: '6px', padding: '8px 10px', color: '#1b5e20' }}>
                        <i className="fas fa-map-pin me-1"></i>
                        Lat: {parseFloat(detailRec.latitude).toFixed(5)}  •  Lng: {parseFloat(detailRec.longitude).toFixed(5)}
                      </div>
                    ) : (
                      <div style={{ marginTop: '14px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#aaa', fontSize: '.8rem' }}><i className="fas fa-map-pin me-1"></i>Pas de coordonnées</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  )
}

/* ── StatusSelect sub-component ── */
function StatusSelect({ recId, current, onUpdate }) {
  const [value, setValue] = useState(current)
  const [disabled, setDisabled] = useState(false)

  async function handleChange(e) {
    const newVal = e.target.value
    const prev = value
    setValue(newVal)
    setDisabled(true)
    await onUpdate(newVal, () => setValue(prev))
    setDisabled(false)
  }

  return (
    <select className="status-select" value={value} onChange={handleChange} disabled={disabled}>
      <option value="pending">⏳ En attente</option>
      <option value="in_progress">🔧 En cours</option>
      <option value="resolved">✅ Résolue</option>
      <option value="rejected">❌ Rejetée</option>
    </select>
  )
}
