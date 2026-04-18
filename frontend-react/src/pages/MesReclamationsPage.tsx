import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

interface Reclamation {
  id: number
  title: string
  description: string
  category: string
  status: string
  priority: string
  created_at: string
  latitude: number | null
  longitude: number | null
}

const CSS = `
.mrs-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
.mrs-title { font-size:1.15rem; font-weight:900; color:#1a1c1c; font-family:'Public Sans',sans-serif; text-transform:uppercase; letter-spacing:.5px; display:flex; align-items:center; gap:10px; }
.mrs-title::before { content:''; display:inline-block; width:4px; height:20px; background:#d4aa8d; border-radius:2px; }
.mrs-subtitle { font-size:.75rem; color:#6b7280; margin-top:4px; margin-left:14px; }
.mrs-new-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; background:linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%); color:#fff; font-weight:700; font-size:.78rem; text-transform:uppercase; letter-spacing:.8px; border:none; cursor:pointer; text-decoration:none; transition:filter .2s; }
.mrs-new-btn:hover { filter:brightness(1.1); color:#fff; }
.mrs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:16px; }
.mrs-card { background:#fff; border:1px solid #eeeeee; border-top:3px solid #d4aa8d; display:flex; flex-direction:column; transition:box-shadow .2s; }
.mrs-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.08); }
.mrs-card-body { padding:18px 18px 12px; flex:1; }
.mrs-card-meta { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
.mrs-date { font-size:.68rem; color:#9ca3af; font-weight:600; }
.mrs-card-title { font-size:.88rem; font-weight:800; color:#1a1c1c; font-family:'Public Sans',sans-serif; margin-bottom:6px; line-height:1.35; }
.mrs-card-desc { font-size:.75rem; color:#6b7280; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.5rem; }
.mrs-card-cat { font-size:.68rem; color:#9ca3af; font-weight:600; display:flex; align-items:center; gap:5px; margin-top:10px; padding-top:10px; border-top:1px solid #f3f4f6; }
.mrs-card-footer { padding:10px 18px; border-top:1px solid #f3f4f6; }
.mrs-detail-btn { background:none; border:none; cursor:pointer; font-size:.75rem; font-weight:700; color:#d4aa8d; text-transform:uppercase; letter-spacing:.5px; display:flex; align-items:center; gap:5px; padding:0; font-family:'Public Sans',sans-serif; }
.mrs-detail-btn:hover { color:#b87a50; }
.mrs-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:2px; font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.3px; }
.mrs-badge-pending   { background:#fef3c7; color:#92400e; }
.mrs-badge-progress  { background:#dbeafe; color:#1e40af; }
.mrs-badge-resolved  { background:#d1fae5; color:#065f46; }
.mrs-badge-rejected  { background:#fee2e2; color:#991b1b; }
.mrs-badge-urgente   { background:#fee2e2; color:#991b1b; }
.mrs-badge-normale   { background:#dbeafe; color:#1e40af; }
.mrs-badge-faible    { background:#f3f4f6; color:#6b7280; border:1px solid #e5e7eb; }
.mrs-empty { text-align:center; padding:60px 20px; background:#f9fafb; border:1px solid #eeeeee; }
.mrs-empty-icon { font-size:2.5rem; color:#d1d5db; margin-bottom:16px; }
.mrs-empty-title { font-size:.9rem; font-weight:800; color:#374151; font-family:'Public Sans',sans-serif; margin-bottom:6px; }
.mrs-empty-sub { font-size:.78rem; color:#9ca3af; margin-bottom:18px; }
.mrs-empty-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 22px; background:#E6F4F7; color:#0F4C5C; border:1px solid #B5DDE5; font-weight:700; font-size:.78rem; text-decoration:none; text-transform:uppercase; letter-spacing:.5px; transition:background .2s; }
.mrs-empty-btn:hover { background:#B5DDE5; color:#0F4C5C; }
.mrs-loading { text-align:center; padding:60px 20px; }
.mrs-spinner { width:32px; height:32px; border:3px solid #e5e7eb; border-top-color:#d4aa8d; border-radius:50%; animation:spin .7s linear infinite; margin:0 auto 14px; }
@keyframes spin { to { transform:rotate(360deg); } }
.mrs-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1050; display:flex; align-items:center; justify-content:center; padding:16px; }
.mrs-modal { background:#fff; width:100%; max-width:480px; }
.mrs-modal-hdr { background:linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%); color:#fff; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; }
.mrs-modal-hdr-title { font-size:.9rem; font-weight:800; font-family:'Public Sans',sans-serif; }
.mrs-modal-close { background:none; border:none; color:#fff; cursor:pointer; font-size:1rem; opacity:.8; }
.mrs-modal-close:hover { opacity:1; }
.mrs-modal-body { padding:20px; }
.mrs-modal-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px; }
.mrs-det-label { font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px; color:#9ca3af; margin-bottom:5px; }
.mrs-det-value { font-size:.82rem; color:#1a1c1c; }
.mrs-modal-footer { padding:12px 20px; border-top:1px solid #f3f4f6; display:flex; justify-content:flex-end; }
.mrs-close-btn { padding:8px 20px; background:#f3f4f6; color:#374151; border:none; cursor:pointer; font-weight:700; font-size:.78rem; text-transform:uppercase; transition:background .2s; }
.mrs-close-btn:hover { background:#e5e7eb; }
`

export default function MesReclamationsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [selectedRec, setSelectedRec] = useState<Reclamation | null>(null)

  useEffect(() => { fetchReclamations() }, [])

  async function fetchReclamations() {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    try {
      const userRes = await fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      if (userRes.ok) setUser(await userRes.json())
      const res = await fetch('/api/reclamations/', { headers: { Authorization: `Bearer ${access}` } })
      if (res.ok) setReclamations(await res.json())
      else setError(t('retrieval_error'))
    } catch { setError(t('error_msg')) }
    finally { setLoading(false) }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending:     ['mrs-badge mrs-badge-pending',  t('status_pending')],
      in_progress: ['mrs-badge mrs-badge-progress', t('status_in_progress')],
      resolved:    ['mrs-badge mrs-badge-resolved', t('status_resolved')],
      rejected:    ['mrs-badge mrs-badge-rejected', t('status_rejected')],
    }
    const [cls, label] = map[s] ?? ['mrs-badge mrs-badge-pending', s]
    return <span className={cls}>{label}</span>
  }

  const priorityBadge = (p: string) => {
    const map: Record<string, [string, string]> = {
      urgente: ['mrs-badge mrs-badge-urgente', `🔥 ${t('priority_urgente')}`],
      normale: ['mrs-badge mrs-badge-normale', t('priority_normale')],
      faible:  ['mrs-badge mrs-badge-faible',  t('priority_faible')],
    }
    const [cls, label] = map[p] ?? ['mrs-badge', p]
    return <span className={cls}>{label}</span>
  }

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: t('my_reclamations') }]}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="mrs-header">
        <div>
          <div className="mrs-title"><i className="fas fa-bullhorn"></i>{t('my_reclamations')}</div>
          <div className="mrs-subtitle">{t('reclamations_subtitle')}</div>
        </div>
        <Link to="/nouvelle-reclamation" className="mrs-new-btn">
          <i className="fas fa-plus-circle"></i>{t('new_reclamation')}
        </Link>
      </div>

      {loading ? (
        <div className="mrs-loading">
          <div className="mrs-spinner"></div>
          <p style={{ fontSize: '.78rem', color: '#9ca3af' }}>{t('loading')}</p>
        </div>
      ) : error ? (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '14px 18px', fontSize: '.82rem', fontWeight: 600 }}>
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </div>
      ) : reclamations.length === 0 ? (
        <div className="mrs-empty">
          <div className="mrs-empty-icon"><i className="fas fa-folder-open"></i></div>
          <div className="mrs-empty-title">{t('no_declarations')}</div>
          <div className="mrs-empty-sub">{t('no_reclamations_msg')}</div>
          <Link to="/nouvelle-reclamation" className="mrs-empty-btn">
            <i className="fas fa-plus-circle"></i>{t('submit_first_reclamation')}
          </Link>
        </div>
      ) : (
        <div className="mrs-grid">
          {reclamations.map((rec) => (
            <div key={rec.id} className="mrs-card">
              <div className="mrs-card-body">
                <div className="mrs-card-meta">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {statusBadge(rec.status)}
                    {priorityBadge(rec.priority)}
                  </div>
                  <span className="mrs-date">{new Date(rec.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mrs-card-title">{rec.title}</div>
                <div className="mrs-card-desc">{rec.description}</div>
                <div className="mrs-card-cat">
                  <i className="fas fa-tag"></i>{t(`category_${rec.category}`)}
                </div>
              </div>
              <div className="mrs-card-footer">
                <button className="mrs-detail-btn" onClick={() => setSelectedRec(rec)}>
                  {t('details_and_tracking')} <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRec && (
        <div className="mrs-modal-overlay" onClick={() => setSelectedRec(null)}>
          <div className="mrs-modal" onClick={e => e.stopPropagation()}>
            <div className="mrs-modal-hdr">
              <div className="mrs-modal-hdr-title">
                <i className="fas fa-file-alt me-2"></i>{selectedRec.title}
              </div>
              <button className="mrs-modal-close" onClick={() => setSelectedRec(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="mrs-modal-body">
              <div>
                <div className="mrs-det-label">{t('description_label')}</div>
                <div className="mrs-det-value">{selectedRec.description}</div>
              </div>
              <div className="mrs-modal-row">
                <div>
                  <div className="mrs-det-label">{t('status_label')}</div>
                  {statusBadge(selectedRec.status)}
                </div>
                <div>
                  <div className="mrs-det-label">{t('priority_label')}</div>
                  {priorityBadge(selectedRec.priority)}
                </div>
                <div>
                  <div className="mrs-det-label">{t('category_label')}</div>
                  <div className="mrs-det-value">{t(`category_${selectedRec.category}`)}</div>
                </div>
                <div>
                  <div className="mrs-det-label">{t('demande_date')}</div>
                  <div className="mrs-det-value">{new Date(selectedRec.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <div className="mrs-modal-footer">
              <button className="mrs-close-btn" onClick={() => setSelectedRec(null)}>
                <i className="fas fa-times me-2"></i>{t('event_close_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
