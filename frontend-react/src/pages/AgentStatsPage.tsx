import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

type UserInfo = {
  first_name: string; last_name: string; email: string
  user_type?: string; is_staff?: boolean; is_superuser?: boolean; city?: string
}

type MlStats = {
  n_samples: number
  category: {
    labels: string[]; accuracy: number
    confusion_matrix: number[][]
    report: { label: string; precision: number; recall: number; f1: number; support: number }[]
    top_features: Record<string, { word: string; score: number }[]>
  }
  priority: {
    labels: string[]; accuracy: number
    confusion_matrix: number[][]
    report: { label: string; precision: number; recall: number; f1: number; support: number }[]
  }
}

function initials(name: string) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getRoleLabel(u: UserInfo | null) {
  if (!u) return 'Chargement...'
  if (u.is_superuser || u.user_type === 'supervisor') return 'Superviseur'
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
.ag-hero{background:linear-gradient(135deg,#1a237e 0%,#283593 100%);color:#fff;padding:22px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
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
.ag-main{flex:1;padding:24px 28px;overflow-x:hidden}
.ag-card{background:#fff;border-radius:10px;box-shadow:var(--card-shadow);margin-bottom:22px;overflow:hidden}
.ag-footer{background:var(--sidebar-bg);color:rgba(255,255,255,.5);text-align:center;font-size:.75rem;padding:14px}
.ag-footer span{color:#43a047}
.ag-spinner-wrap{text-align:center;padding:60px 20px;color:#1565c0}
/* ML stats */
.ml-stats-panel{background:#fff;border-radius:12px;box-shadow:0 2px 14px rgba(0,0,0,.1);margin-bottom:24px;overflow:hidden}
.ml-stats-hdr{background:linear-gradient(135deg,#1a237e,#283593);color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center}
.ml-stats-hdr h4{margin:0;font-size:1.1rem;font-weight:700}
.ml-acc-bar{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}
.ml-acc-card{flex:1;min-width:200px;border-radius:12px;padding:20px 22px;text-align:center}
.ml-table{width:100%;border-collapse:collapse;font-size:.83rem}
.ml-table th{background:#f5f5f5;padding:9px 12px;text-align:left;font-weight:700;color:#333;border-bottom:2px solid #e0e0e0}
.ml-table td{padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#444}
.ml-table tr:hover td{background:#fafafa}
.ml-acc-pill{display:inline-block;padding:4px 14px;border-radius:14px;font-weight:700;font-size:1.6rem}
.cm-cell{text-align:center;min-width:46px;padding:7px!important;font-size:.8rem}
.cm-diag{background:#e8f5e9;color:#1b5e20;font-weight:700}
.cm-off{background:#fce4ec;color:#b71c1c}
.feat-word{display:inline-block;padding:3px 8px;background:#e3f2fd;border-radius:8px;font-size:.76rem;color:#1565c0;margin:2px}
.section-title{font-size:1rem;font-weight:700;color:#1a237e;margin:28px 0 8px;display:flex;align-items:center;gap:8px;border-bottom:2px solid #e8eaf6;padding-bottom:8px}
.section-desc{font-size:.76rem;color:#888;margin-bottom:12px;line-height:1.5}
.back-btn{display:inline-flex;align-items:center;gap:7px;background:#1a237e;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:.85rem;cursor:pointer;text-decoration:none;transition:background .2s}
.back-btn:hover{background:#283593;color:#fff}
@media(max-width:768px){.ag-sidebar{display:none}.ag-main{padding:16px}}
`

export default function AgentStatsPage() {
  const { lang, setLang } = useI18n()
  const navigate = useNavigate()
  const access = getAccessToken()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [mlStats, setMlStats] = useState<MlStats | null>(null)
  const [mlLoading, setMlLoading] = useState(true)
  const [mlError, setMlError] = useState<string | null>(null)
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
    fetchMlStats()
  }, [])

  async function fetchUserInfo() {
    try {
      const res = await fetch('/api/accounts/me/', { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) throw new Error()
      const u: UserInfo = await res.json()
      if (u.user_type !== 'agent' && !u.is_staff && !u.is_superuser) { navigate('/dashboard'); return }
      setUser(u)
    } catch { setUser(null) }
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
          <div className="greeting"><i className="fas fa-brain me-2"></i>Statistiques IA — Classificateur NLP</div>
          <div className="sub">Performance du modèle TF-IDF + LinearSVC pour la classification des signalements.</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge-role"><i className="fas fa-id-badge me-1"></i>{getRoleLabel(user)}</span>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/40px-Flag_of_Tunisia.svg.png" height="22" style={{ borderRadius: 3 }} alt="Tunisie" />
        </div>
      </div>
      <div className="ag-breadcrumb">
        <a href="#" onClick={e => { e.preventDefault(); navigate('/agent-dashboard') }}><i className="fas fa-home me-1"></i>Accueil</a>
        <span className="mx-2 text-muted">/</span>
        <a href="#" onClick={e => { e.preventDefault(); navigate('/agent-dashboard') }}>Espace Agent</a>
        <span className="mx-2 text-muted">/</span>
        <span>Statistiques IA</span>
      </div>

      <div className="ag-body">
        <div className="ag-sidebar">
          <div className="ag-sec-title">NAVIGATION</div>
          <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); navigate('/agent-dashboard') }}><i className="fas fa-tachometer-alt"></i> Tableau de bord</a>
          <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); navigate('/agent-reclamations') }}><i className="fas fa-bullhorn"></i> Signalements</a>
          <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); navigate('/agent-dashboard') }}><i className="fas fa-map-marked-alt"></i> Carte SIG</a>
          <a className="ag-nav-item" href="#"><i className="fas fa-newspaper"></i> Actualités</a>
          <a className="ag-nav-item active" href="#"><i className="fas fa-brain"></i> Stats IA</a>
          <div className="ag-divider"></div>
          <div className="ag-sec-title">COMPTE</div>
          <a className="ag-nav-item" href="#"><i className="fas fa-user-circle"></i> Mon Profil</a>
          {(user?.user_type === 'supervisor' || user?.is_superuser) && (
            <a className="ag-nav-item" href="/admin/" style={{ color: '#ff6d00' }}>
              <i className="fas fa-cog"></i> <strong>Panel Django Admin</strong>
            </a>
          )}
          <a className="ag-nav-item" href="#" onClick={e => { e.preventDefault(); clearTokens(); navigate('/login') }}><i className="fas fa-sign-out-alt"></i> Déconnexion</a>
        </div>

        <div className="ag-main">
          <div style={{ marginBottom: 20 }}>
            <button className="back-btn" onClick={() => navigate('/agent-dashboard')}>
              <i className="fas fa-arrow-left"></i> Retour au tableau de bord
            </button>
          </div>

          {mlLoading && (
            <div className="ag-spinner-wrap">
              <div className="spinner-border" style={{ color: '#1a237e', width: '2.5rem', height: '2.5rem' }} role="status"></div>
              <p className="mt-3" style={{ fontSize: '.9rem', color: '#555' }}>Calcul des statistiques IA en cours…</p>
              <p style={{ fontSize: '.77rem', color: '#aaa' }}>Première ouverture : entraînement du modèle en mémoire (~5s)</p>
            </div>
          )}

          {!mlLoading && mlError && (
            <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: 24, textAlign: 'center' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#b71c1c', fontSize: '2rem', display: 'block', marginBottom: 12 }}></i>
              <p style={{ color: '#b71c1c', fontWeight: 600, marginBottom: 12 }}>{mlError}</p>
              <button onClick={fetchMlStats} style={{ background: '#1a237e', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontSize: '.85rem' }}>
                <i className="fas fa-redo me-1"></i> Réessayer
              </button>
            </div>
          )}

          {!mlLoading && mlStats && (
            <>
              {/* ── Accuracy summary cards */}
              <div className="ml-acc-bar">
                <div className="ml-acc-card" style={{ background: '#e8f5e9' }}>
                  <div style={{ fontSize: '.82rem', color: '#555', marginBottom: 6 }}>Précision — Classification Catégorie</div>
                  <div className="ml-acc-pill" style={{ background: mlStats.category.accuracy >= 0.85 ? '#2e7d32' : '#f57f17', color: '#fff' }}>
                    {Math.round(mlStats.category.accuracy * 100)}%
                  </div>
                  <div style={{ fontSize: '.73rem', color: '#888', marginTop: 6 }}>{mlStats.n_samples} exemples d'entraînement</div>
                </div>
                <div className="ml-acc-card" style={{ background: '#e3f2fd' }}>
                  <div style={{ fontSize: '.82rem', color: '#555', marginBottom: 6 }}>Précision — Classification Priorité</div>
                  <div className="ml-acc-pill" style={{ background: mlStats.priority.accuracy >= 0.85 ? '#1565c0' : '#f57f17', color: '#fff' }}>
                    {Math.round(mlStats.priority.accuracy * 100)}%
                  </div>
                  <div style={{ fontSize: '.73rem', color: '#888', marginTop: 6 }}>TF-IDF + LinearSVC (NLP)</div>
                </div>
                <div className="ml-acc-card" style={{ background: '#f3e5f5' }}>
                  <div style={{ fontSize: '.82rem', color: '#555', marginBottom: 6 }}>Échantillons d'entraînement</div>
                  <div className="ml-acc-pill" style={{ background: '#6a1b9a', color: '#fff' }}>
                    {mlStats.n_samples}
                  </div>
                  <div style={{ fontSize: '.73rem', color: '#888', marginTop: 6 }}>Données annotées manuellement</div>
                </div>
              </div>

              {/* ── TABLE 1: Classification Report — Category */}
              <div className="section-title"><i className="fas fa-table"></i>Tableau 1 — Rapport de classification (Catégorie)</div>
              <p className="section-desc">
                <b>Précision</b> = sur tout ce que le modèle a prédit "voirie", combien était vraiment voirie &nbsp;|&nbsp;
                <b>Rappel</b> = sur toutes les vraies "voirie", combien le modèle a trouvé &nbsp;|&nbsp;
                <b>F1</b> = moyenne harmonique précision/rappel &nbsp;|&nbsp;
                <b>Support</b> = nombre d'exemples de test
              </p>
              <div className="ag-card">
                <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                  <table className="ml-table">
                    <thead><tr><th>Catégorie</th><th>Précision</th><th>Rappel</th><th>F1-Score</th><th>Support</th></tr></thead>
                    <tbody>
                      {mlStats.category.report.map(row => {
                        const labels: Record<string,string> = { lighting:'💡 Éclairage', trash:'🗑️ Déchets', roads:'🛣️ Voirie', noise:'🔊 Nuisances', other:'📌 Autre' }
                        const f1Color = row.f1 >= 0.85 ? '#2e7d32' : row.f1 >= 0.65 ? '#f57f17' : '#c62828'
                        return (
                          <tr key={row.label}>
                            <td><strong>{labels[row.label] || row.label}</strong></td>
                            <td>{Math.round(row.precision * 100)}%</td>
                            <td>{Math.round(row.recall * 100)}%</td>
                            <td><span style={{ color: f1Color, fontWeight: 700 }}>{Math.round(row.f1 * 100)}%</span></td>
                            <td style={{ color: '#888' }}>{row.support}</td>
                          </tr>
                        )
                      })}
                      <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
                        <td>Moyenne</td>
                        <td>{Math.round(mlStats.category.report.reduce((s,r) => s+r.precision,0)/mlStats.category.report.length*100)}%</td>
                        <td>{Math.round(mlStats.category.report.reduce((s,r) => s+r.recall,0)/mlStats.category.report.length*100)}%</td>
                        <td style={{ color: '#1565c0' }}>{Math.round(mlStats.category.report.reduce((s,r) => s+r.f1,0)/mlStats.category.report.length*100)}%</td>
                        <td style={{ color: '#888' }}>{mlStats.n_samples}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── TABLE 2: Confusion Matrix — Category */}
              <div className="section-title"><i className="fas fa-th"></i>Tableau 2 — Matrice de confusion (Catégorie)</div>
              <p className="section-desc">
                Lignes = catégorie <b>réelle</b>, Colonnes = catégorie <b>prédite</b>.
                Cases <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '0 4px', borderRadius: 4 }}>vertes</span> = prédictions correctes.
                Cases <span style={{ background: '#fce4ec', color: '#b71c1c', padding: '0 4px', borderRadius: 4 }}>rouges</span> = erreurs du modèle.
              </p>
              <div className="ag-card">
                <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                  <table className="ml-table">
                    <thead>
                      <tr>
                        <th style={{ fontSize: '.72rem' }}>Réel ↓ / Prédit →</th>
                        {mlStats.category.labels.map(l => {
                          const lmap: Record<string,string> = { lighting:'💡', trash:'🗑️', roads:'🛣️', noise:'🔊', other:'📌' }
                          return <th key={l} className="cm-cell">{lmap[l]||l}</th>
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {mlStats.category.confusion_matrix.map((row, i) => {
                        const lmap: Record<string,string> = { lighting:'💡 Éclairage', trash:'🗑️ Déchets', roads:'🛣️ Voirie', noise:'🔊 Nuisances', other:'📌 Autre' }
                        return (
                          <tr key={i}>
                            <td><strong style={{ fontSize: '.8rem' }}>{lmap[mlStats.category.labels[i]]||mlStats.category.labels[i]}</strong></td>
                            {row.map((val, j) => (
                              <td key={j} className={`cm-cell ${i===j ? 'cm-diag' : val > 0 ? 'cm-off' : ''}`}>{val}</td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── TABLE 3: Top NLP features */}
              <div className="section-title"><i className="fas fa-star"></i>Tableau 3 — Mots les plus importants par catégorie (NLP)</div>
              <p className="section-desc">
                Les mots qui ont le plus de poids dans la décision du modèle TF-IDF + SVM.
                Plus le score est élevé, plus le mot est discriminatif pour cette catégorie.
              </p>
              <div className="ag-card">
                <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                  <table className="ml-table">
                    <thead><tr><th>Catégorie</th><th>Mots-clés discriminatifs (NLP)</th></tr></thead>
                    <tbody>
                      {Object.entries(mlStats.category.top_features).map(([cat, words]) => {
                        const lmap: Record<string,string> = { lighting:'💡 Éclairage', trash:'🗑️ Déchets', roads:'🛣️ Voirie', noise:'🔊 Nuisances', other:'📌 Autre' }
                        return (
                          <tr key={cat}>
                            <td><strong>{lmap[cat]||cat}</strong></td>
                            <td>{words.map((w, i) => (
                              <span key={i} className="feat-word" title={`Score: ${w.score}`}>{w.word}</span>
                            ))}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── TABLE 4: Classification Report — Priority */}
              <div className="section-title"><i className="fas fa-flag"></i>Tableau 4 — Rapport de classification (Priorité)</div>
              <p className="section-desc">
                Précision/Rappel/F1 pour chaque niveau de priorité : <b>Urgente</b>, <b>Normale</b>, <b>Faible</b>.
              </p>
              <div className="ag-card">
                <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                  <table className="ml-table">
                    <thead><tr><th>Priorité</th><th>Précision</th><th>Rappel</th><th>F1-Score</th><th>Support</th></tr></thead>
                    <tbody>
                      {mlStats.priority.report.map(row => {
                        const labels: Record<string,string> = { urgente:'🔴 Urgente', normale:'🔵 Normale', faible:'🟣 Faible' }
                        const f1Color = row.f1 >= 0.85 ? '#2e7d32' : row.f1 >= 0.65 ? '#f57f17' : '#c62828'
                        return (
                          <tr key={row.label}>
                            <td><strong>{labels[row.label]||row.label}</strong></td>
                            <td>{Math.round(row.precision*100)}%</td>
                            <td>{Math.round(row.recall*100)}%</td>
                            <td><span style={{ color: f1Color, fontWeight: 700 }}>{Math.round(row.f1*100)}%</span></td>
                            <td style={{ color: '#888' }}>{row.support}</td>
                          </tr>
                        )
                      })}
                      <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
                        <td>Moyenne</td>
                        <td>{Math.round(mlStats.priority.report.reduce((s,r) => s+r.precision,0)/mlStats.priority.report.length*100)}%</td>
                        <td>{Math.round(mlStats.priority.report.reduce((s,r) => s+r.recall,0)/mlStats.priority.report.length*100)}%</td>
                        <td style={{ color: '#1565c0' }}>{Math.round(mlStats.priority.report.reduce((s,r) => s+r.f1,0)/mlStats.priority.report.length*100)}%</td>
                        <td style={{ color: '#888' }}>{mlStats.n_samples}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── TABLE 4b: Confusion Matrix — Priority */}
              <div className="section-title"><i className="fas fa-th"></i>Tableau 4b — Matrice de confusion (Priorité)</div>
              <p className="section-desc">
                Lignes = priorité <b>réelle</b>, Colonnes = priorité <b>prédite</b>.
                Cases <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '0 4px', borderRadius: 4 }}>vertes</span> = correct.
                Cases <span style={{ background: '#fce4ec', color: '#b71c1c', padding: '0 4px', borderRadius: 4 }}>rouges</span> = erreurs.
              </p>
              <div className="ag-card">
                <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                  <table className="ml-table">
                    <thead>
                      <tr>
                        <th style={{ fontSize: '.72rem' }}>Réel ↓ / Prédit →</th>
                        {mlStats.priority.labels.map(l => {
                          const lmap: Record<string,string> = { urgente:'🔴', normale:'🔵', faible:'🟣' }
                          return <th key={l} className="cm-cell">{lmap[l]||l}</th>
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {mlStats.priority.confusion_matrix.map((row, i) => {
                        const lmap: Record<string,string> = { urgente:'🔴 Urgente', normale:'🔵 Normale', faible:'🟣 Faible' }
                        return (
                          <tr key={i}>
                            <td><strong style={{ fontSize: '.8rem' }}>{lmap[mlStats.priority.labels[i]]||mlStats.priority.labels[i]}</strong></td>
                            {row.map((val, j) => (
                              <td key={j} className={`cm-cell ${i===j ? 'cm-diag' : val > 0 ? 'cm-off' : ''}`}>{val}</td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ textAlign: 'center', padding: '10px 0 24px', color: '#aaa', fontSize: '.76rem' }}>
                <i className="fas fa-info-circle me-1"></i>
                Modèle entraîné en mémoire au démarrage · TF-IDF (n-grammes 1–2) + LinearSVC · {mlStats.n_samples} exemples
              </div>
            </>
          )}
        </div>
      </div>

      <div className="ag-footer">© 2025 <span>Commune de Kélibia</span> — Espace Agent Kelibia Smart City &nbsp;|&nbsp; Tous droits réservés</div>
    </div>
  )
}
