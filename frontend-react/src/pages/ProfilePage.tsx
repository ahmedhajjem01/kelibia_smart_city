import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type UserInfo = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  first_name_ar?: string
  last_name_ar?: string
  cin: string
  phone?: string
  address?: string
  governorate?: string
  city?: string
  date_of_birth?: string
  place_of_birth?: string
  user_type?: string
  is_verified: boolean
  is_staff?: boolean
  is_superuser?: boolean
  date_joined?: string
}

type StatCard = {
  key: string
  icon: string
  color: string
  label: string
  labelAr: string
  route: string
  total: number | null
  pending: number | null
  approved: number | null
}

function initials(u: UserInfo | null) {
  if (!u) return '?'
  return ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || u.email?.[0]?.toUpperCase() || '?'
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return iso }
}

const CSS = `
.pf-wrap { max-width:900px; margin:0 auto; }
.pf-card { background:#fff; border:1px solid #eeeeee; margin-bottom:16px; }
.pf-card-top { background:linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%); height:72px; }
.pf-card-body { padding:0 24px 24px; }
.pf-avatar-row { display:flex; align-items:flex-end; gap:18px; margin-top:-40px; margin-bottom:18px; }
.pf-avatar { width:76px; height:76px; border-radius:50%; background:#d4aa8d; color:#fff; font-size:1.7rem; font-weight:900; display:flex; align-items:center; justify-content:center; border:4px solid #fff; flex-shrink:0; font-family:'Public Sans',sans-serif; }
.pf-name { font-size:1rem; font-weight:900; color:#1a1c1c; font-family:'Public Sans',sans-serif; margin-bottom:4px; }
.pf-name-ar { font-size:.85rem; color:#6b7280; font-family:'Cairo',sans-serif; direction:rtl; }
.pf-badges { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.pf-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.3px; }
.pf-badge-verified   { background:#d1fae5; color:#065f46; }
.pf-badge-unverified { background:#fef3c7; color:#92400e; }
.pf-badge-citizen    { background:#dbeafe; color:#1e40af; }
.pf-badge-agent      { background:#ede9fe; color:#5b21b6; }
.pf-edit-btn { margin-left:auto; padding-bottom:4px; }
.pf-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; border:none; cursor:pointer; font-family:'Public Sans',sans-serif; transition:filter .15s; }
.pf-btn-primary { background:linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%); color:#fff; }
.pf-btn-primary:hover { filter:brightness(1.1); }
.pf-btn-secondary { background:#f3f4f6; color:#374151; border:1px solid #e5e7eb; }
.pf-btn-secondary:hover { background:#e5e7eb; }
.pf-btn-success { background:#d1fae5; color:#065f46; border:1px solid #a7f3d0; }
.pf-btn-success:hover { background:#a7f3d0; }
.pf-divider { border:none; border-top:1px solid #f3f4f6; margin:18px 0; }
.pf-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.pf-field { display:flex; flex-direction:column; gap:5px; }
.pf-field-full { grid-column:1/-1; }
.pf-label { font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px; color:#9ca3af; display:flex; align-items:center; gap:5px; }
.pf-value { font-size:.85rem; color:#1a1c1c; padding:9px 12px; background:#f9fafb; border:1px solid #f3f4f6; }
.pf-input { font-size:.85rem; color:#1a1c1c; padding:9px 12px; background:#fff; border:1px solid #e5e7eb; outline:none; font-family:inherit; transition:border .15s; width:100%; }
.pf-input:focus { border-color:#d4aa8d; }
.pf-readonly { opacity:.6; cursor:default; display:flex; align-items:center; gap:8px; }
.pf-feedback-ok  { background:#d1fae5; color:#065f46; padding:10px 14px; font-size:.8rem; font-weight:600; margin-bottom:14px; border-left:3px solid #065f46; }
.pf-feedback-err { background:#fee2e2; color:#991b1b; padding:10px 14px; font-size:.8rem; font-weight:600; margin-bottom:14px; border-left:3px solid #C44536; }
.pf-section-hdr { display:flex; align-items:center; gap:10px; margin-bottom:14px; margin-top:8px; }
.pf-section-hdr-bar { width:4px; height:20px; background:#d4aa8d; }
.pf-section-hdr-title { font-size:.85rem; font-weight:900; color:#1a1c1c; font-family:'Public Sans',sans-serif; text-transform:uppercase; letter-spacing:.5px; }
.pf-stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; margin-bottom:16px; }
.pf-stat-card { background:#fff; border:1px solid #eeeeee; border-left:3px solid #d4aa8d; display:flex; align-items:center; gap:14px; padding:14px 16px; transition:box-shadow .2s; }
.pf-stat-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.07); }
.pf-stat-icon { width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; }
.pf-stat-label { font-size:.75rem; font-weight:800; color:#1a1c1c; font-family:'Public Sans',sans-serif; }
.pf-stat-label-ar { font-size:.65rem; color:#9ca3af; font-family:'Cairo',sans-serif; direction:rtl; }
.pf-stat-count { font-size:1.4rem; font-weight:900; color:#d4aa8d; font-family:'Public Sans',sans-serif; margin-left:auto; }
.pf-stat-sub { font-size:.62rem; color:#9ca3af; margin-top:2px; }
.pf-stat-link { display:inline-flex; align-items:center; gap:4px; font-size:.68rem; font-weight:700; color:#d4aa8d; text-decoration:none; text-transform:uppercase; letter-spacing:.3px; margin-top:4px; }
.pf-stat-link:hover { color:#b87a50; }
.pf-quick { background:#fff; border:1px solid #eeeeee; padding:16px 20px; }
.pf-quick-title { font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; margin-bottom:10px; }
.pf-quick-btns { display:flex; gap:8px; flex-wrap:wrap; }
.pf-quick-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; background:#E6F4F7; color:#0F4C5C; border:1px solid #B5DDE5; font-size:.72rem; font-weight:700; text-transform:uppercase; text-decoration:none; transition:background .15s; }
.pf-quick-btn:hover { background:#B5DDE5; color:#0F4C5C; }
.pf-footer-links { display:flex; gap:16px; margin-top:14px; flex-wrap:wrap; }
.pf-footer-link { font-size:.72rem; color:#9ca3af; text-decoration:none; display:flex; align-items:center; gap:5px; }
.pf-footer-link:hover { color:#d4aa8d; }
.pf-loading { display:flex; align-items:center; justify-content:center; gap:12px; padding:60px 0; }
.pf-spinner { width:28px; height:28px; border:3px solid #e5e7eb; border-top-color:#d4aa8d; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
@media(max-width:600px){ .pf-grid { grid-template-columns:1fr; } .pf-avatar-row { flex-wrap:wrap; } }
`

export default function ProfilePage() {
  useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', address: '', city: '', governorate: '', place_of_birth: '' })
  const [stats, setStats] = useState<StatCard[]>([
    { key: 'reclamations', icon: 'fa-bullhorn',        color: '#C44536', label: 'Signalements',           labelAr: 'الشكاوى',        route: '/mes-reclamations', total: null, pending: null, approved: null },
    { key: 'evenements',   icon: 'fa-calendar-check',  color: '#d4aa8d', label: 'Événements',              labelAr: 'التظاهرات',      route: '/mes-evenements',   total: null, pending: null, approved: null },
    { key: 'residences',   icon: 'fa-home',             color: '#d4aa8d', label: 'Attestations résidence',  labelAr: 'شهادات الإقامة', route: '/mes-residences',   total: null, pending: null, approved: null },
    { key: 'naissances',   icon: 'fa-baby',             color: '#065f46', label: 'Déclarations naissance',  labelAr: 'تصاريح الولادة', route: '/mes-naissances',   total: null, pending: null, approved: null },
    { key: 'deces',        icon: 'fa-cross',            color: '#6b7280', label: 'Déclarations décès',      labelAr: 'تصاريح الوفاة',  route: '/mes-deces',        total: null, pending: null, approved: null },
    { key: 'mariages',     icon: 'fa-ring',             color: '#d4aa8d', label: 'Demandes mariage',         labelAr: 'طلبات الزواج',   route: '/mes-mariages',     total: null, pending: null, approved: null },
  ])

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data)
          setEditForm({ first_name: data.first_name || '', last_name: data.last_name || '', phone: data.phone || '', address: data.address || '', city: data.city || '', governorate: data.governorate || '', place_of_birth: data.place_of_birth || '' })
        }
      }).catch(console.error).finally(() => setLoading(false))
  }, [navigate])

  useEffect(() => {
    const access = getAccessToken()
    if (!access) return
    const h = { Authorization: `Bearer ${access}` }
    const endpoints: Record<string, string> = {
      reclamations: resolveBackendUrl('/api/reclamations/'),
      evenements:   resolveBackendUrl('/api/evenements/demande/'),
      residences:   resolveBackendUrl('/api/residence/demande/'),
      naissances:   resolveBackendUrl('/extrait-naissance/api/declaration/'),
      deces:        resolveBackendUrl('/extrait-deces/api/declaration/'),
      mariages:     resolveBackendUrl('/extrait-mariage/demandes/'),
    }
    Promise.allSettled(Object.entries(endpoints).map(([key, url]) =>
      fetch(url, { headers: h }).then(r => r.ok ? r.json() : null).then(data => ({ key, data }))
    )).then(results => {
      setStats(prev => prev.map(card => {
        const result = results.find(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{key: string; data: unknown}>).value?.key === card.key)
        if (!result || result.status !== 'fulfilled') return card
        const raw = (result as PromiseFulfilledResult<{key: string; data: unknown}>).value.data
        if (!raw) return card
        const items: Record<string, string>[] = Array.isArray(raw) ? raw : ((raw as {results?: unknown[]}).results || [])
        return { ...card, total: items.length, pending: items.filter(i => ['pending','en_attente','soumis'].includes(i.status||i.statut||'')).length, approved: items.filter(i => ['approved','resolved','approuve','signe'].includes(i.status||i.statut||'')).length }
      }))
    })
  }, [])

  async function handleSave() {
    const access = getAccessToken()
    if (!access) return
    setSaving(true); setSaveError(null); setSaveSuccess(false)
    try {
      const res = await fetch(resolveBackendUrl('/api/accounts/me/'), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` }, body: JSON.stringify(editForm) })
      if (res.ok) { setUser(await res.json()); setEditing(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000) }
      else { const err = await res.json(); setSaveError(err.error || 'Erreur lors de la sauvegarde.') }
    } catch { setSaveError('Erreur réseau. Veuillez réessayer.') }
    finally { setSaving(false) }
  }

  function handleCancel() {
    if (!user) return
    setEditForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '', address: user.address || '', city: user.city || '', governorate: user.governorate || '', place_of_birth: user.place_of_birth || '' })
    setEditing(false); setSaveError(null)
  }

  const roleLabel = () => { if (!user) return ''; if (user.is_superuser || user.user_type === 'supervisor') return 'Superviseur'; if (user.is_staff || user.user_type === 'agent') return 'Agent Municipal'; return 'Citoyen' }
  const isAgent = user?.is_staff || user?.user_type === 'agent' || user?.is_superuser

  if (loading) return (
    <MainLayout user={null} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Mon Profil' }]}>
      <style>{CSS}</style>
      <div className="pf-loading"><div className="pf-spinner"></div><span style={{ fontSize: '.82rem', color: '#9ca3af' }}>Chargement du profil...</span></div>
    </MainLayout>
  )

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Mon Profil' }]}>
      <style>{CSS}</style>
      <div className="pf-wrap">

        {/* ── Identity card ── */}
        <div className="pf-card">
          <div className="pf-card-top"></div>
          <div className="pf-card-body">
            <div className="pf-avatar-row">
              <div className="pf-avatar">{initials(user)}</div>
              <div style={{ flex: 1 }}>
                <div className="pf-name">{user?.first_name} {user?.last_name}</div>
                {(user?.first_name_ar || user?.last_name_ar) && (
                  <div className="pf-name-ar">{user?.first_name_ar} {user?.last_name_ar}</div>
                )}
                <div className="pf-badges">
                  {user?.is_verified
                    ? <span className="pf-badge pf-badge-verified"><i className="fas fa-check-circle"></i>Compte vérifié</span>
                    : <span className="pf-badge pf-badge-unverified"><i className="fas fa-hourglass-half"></i>En attente de vérification</span>
                  }
                  <span className={`pf-badge ${isAgent ? 'pf-badge-agent' : 'pf-badge-citizen'}`}>
                    <i className="fas fa-id-badge"></i>{roleLabel()}
                  </span>
                </div>
              </div>
              <div className="pf-edit-btn">
                {!editing ? (
                  <button className="pf-btn pf-btn-primary" onClick={() => setEditing(true)}>
                    <i className="fas fa-pencil-alt"></i>Modifier
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="pf-btn pf-btn-success" onClick={handleSave} disabled={saving}>
                      {saving ? <span className="pf-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> : <i className="fas fa-save"></i>}
                      Enregistrer
                    </button>
                    <button className="pf-btn pf-btn-secondary" onClick={handleCancel} disabled={saving}>Annuler</button>
                  </div>
                )}
              </div>
            </div>

            {saveSuccess && <div className="pf-feedback-ok"><i className="fas fa-check-circle me-2"></i>Profil mis à jour avec succès !</div>}
            {saveError  && <div className="pf-feedback-err"><i className="fas fa-exclamation-triangle me-2"></i>{saveError}</div>}

            <hr className="pf-divider" />

            {/* Info grid */}
            <div className="pf-grid">
              {/* Email */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-envelope"></i>Email</label>
                <div className="pf-value pf-readonly">{user?.email}<i className="fas fa-lock" style={{ fontSize: '.65rem', color: '#d1d5db', marginLeft: 'auto' }}></i></div>
              </div>
              {/* CIN */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-id-card"></i>CIN</label>
                <div className="pf-value pf-readonly">{user?.cin || '—'}<i className="fas fa-lock" style={{ fontSize: '.65rem', color: '#d1d5db', marginLeft: 'auto' }}></i></div>
              </div>
              {/* First name */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-user"></i>Prénom</label>
                {editing ? <input className="pf-input" type="text" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                  : <div className="pf-value">{user?.first_name || '—'}</div>}
              </div>
              {/* Last name */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-user"></i>Nom</label>
                {editing ? <input className="pf-input" type="text" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                  : <div className="pf-value">{user?.last_name || '—'}</div>}
              </div>
              {/* Phone */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-phone"></i>Téléphone</label>
                {editing ? <input className="pf-input" type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  : <div className="pf-value">{user?.phone || '—'}</div>}
              </div>
              {/* City */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-city"></i>Ville</label>
                {editing ? <input className="pf-input" type="text" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                  : <div className="pf-value">{user?.city || '—'}</div>}
              </div>
              {/* Governorate */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-map-marker-alt"></i>Gouvernorat</label>
                {editing ? <input className="pf-input" type="text" value={editForm.governorate} onChange={e => setEditForm(f => ({ ...f, governorate: e.target.value }))} />
                  : <div className="pf-value">{user?.governorate || '—'}</div>}
              </div>
              {/* Date of birth */}
              <div className="pf-field">
                <label className="pf-label"><i className="fas fa-birthday-cake"></i>Date de naissance</label>
                <div className="pf-value pf-readonly">{formatDate(user?.date_of_birth)}<i className="fas fa-lock" style={{ fontSize: '.65rem', color: '#d1d5db', marginLeft: 'auto' }}></i></div>
              </div>
              {/* Address */}
              <div className="pf-field pf-field-full">
                <label className="pf-label"><i className="fas fa-map-pin"></i>Adresse</label>
                {editing ? <input className="pf-input" type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                  : <div className="pf-value">{user?.address || '—'}</div>}
              </div>
            </div>

            <div className="pf-footer-links">
              <Link to="/forgot-password" className="pf-footer-link"><i className="fas fa-key"></i>Changer le mot de passe</Link>
              <span className="pf-footer-link" style={{ cursor: 'default' }}>
                <i className="fas fa-calendar-alt"></i>Membre depuis {user?.date_joined ? new Date(user.date_joined).getFullYear() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mes demandes ── */}
        <div className="pf-section-hdr">
          <div className="pf-section-hdr-bar"></div>
          <div className="pf-section-hdr-title">Mes demandes & dossiers</div>
          <span style={{ fontSize: '.65rem', color: '#9ca3af', fontFamily: "'Cairo',sans-serif", direction: 'rtl', marginLeft: 4 }}>طلباتي وملفاتي</span>
        </div>

        <div className="pf-stats-grid">
          {stats.map(card => (
            <div key={card.key} className="pf-stat-card" style={{ borderLeftColor: card.color }}>
              <div className="pf-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                <i className={`fas ${card.icon}`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div className="pf-stat-label">{card.label}</div>
                <div className="pf-stat-label-ar">{card.labelAr}</div>
                {card.total !== null && card.pending !== null && card.pending > 0 && (
                  <div className="pf-stat-sub">{card.pending} en attente</div>
                )}
                <Link to={card.route} className="pf-stat-link">Voir <i className="fas fa-arrow-right"></i></Link>
              </div>
              <div className="pf-stat-count">
                {card.total === null
                  ? <span style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: card.color, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }}></span>
                  : card.total}
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="pf-quick">
          <div className="pf-quick-title"><i className="fas fa-plus-circle me-2"></i>Nouvelle demande</div>
          <div className="pf-quick-btns">
            <Link to="/nouvelle-reclamation" className="pf-quick-btn"><i className="fas fa-bullhorn"></i>Signalement</Link>
            <Link to="/demande-evenement" className="pf-quick-btn"><i className="fas fa-calendar-plus"></i>Événement</Link>
            <Link to="/demande-residence" className="pf-quick-btn"><i className="fas fa-home"></i>Attestation résidence</Link>
            <Link to="/declaration-naissance" className="pf-quick-btn"><i className="fas fa-baby"></i>Décl. naissance</Link>
            <Link to="/declaration-deces" className="pf-quick-btn"><i className="fas fa-cross"></i>Décl. décès</Link>
            <Link to="/services" className="pf-quick-btn"><i className="fas fa-th-large"></i>Tous les services</Link>
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
