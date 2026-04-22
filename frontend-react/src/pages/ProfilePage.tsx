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
  labelKey: string
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
.pf-card { background:#fff; border:1px solid #eeeeee; margin-bottom:16px; position: relative; overflow: hidden; }
.pf-card-top { background:linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%); height:72px; }
.pf-card-body { padding:0 24px 24px; }
.pf-avatar-row { display:flex; align-items:flex-end; gap:18px; margin-top:-40px; margin-bottom:18px; }
.pf-avatar { width:76px; height:76px; border-radius:50%; background:#d4aa8d; color:#fff; font-size:1.7rem; font-weight:900; display:flex; align-items:center; justify-content:center; border:4px solid #fff; flex-shrink:0; font-family:'Public Sans',sans-serif; }
.pf-name { font-size:1rem; font-weight:900; color:#1a1c1c; font-family:'Public Sans',sans-serif; margin-bottom:4px; }
.pf-name-ar { font-size:.85rem; color:#6b7280; font-family:'Cairo',sans-serif; }
.pf-badges { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.pf-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.3px; border-radius: 4px; }
.pf-badge-verified   { background:#d1fae5; color:#065f46; }
.pf-badge-unverified { background:#fef3c7; color:#92400e; }
.pf-badge-citizen    { background:#dbeafe; color:#1e40af; }
.pf-badge-agent      { background:#ede9fe; color:#5b21b6; }
.pf-edit-btn { margin-left:auto; padding-bottom:4px; }
[dir="rtl"] .pf-edit-btn { margin-left:0; margin-right:auto; }

.pf-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; border:none; cursor:pointer; font-family:'Public Sans',sans-serif; transition:filter .15s; border-radius: 4px; }
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
.pf-value { font-size:.85rem; color:#1a1c1c; padding:9px 12px; background:#f9fafb; border:1px solid #f3f4f6; border-radius: 4px; }
.pf-input { font-size:.85rem; color:#1a1c1c; padding:9px 12px; background:#fff; border:1px solid #e5e7eb; outline:none; font-family:inherit; transition:border .15s; width:100%; border-radius: 4px; }
.pf-input:focus { border-color:#d4aa8d; }
.pf-readonly { opacity:.6; cursor:default; display:flex; align-items:center; gap:8px; }
.pf-feedback-ok  { background:#d1fae5; color:#065f46; padding:10px 14px; font-size:.8rem; font-weight:600; margin-bottom:14px; border-left:3px solid #065f46; }
[dir="rtl"] .pf-feedback-ok { border-left:none; border-right:3px solid #065f46; }
.pf-feedback-err { background:#fee2e2; color:#991b1b; padding:10px 14px; font-size:.8rem; font-weight:600; margin-bottom:14px; border-left:3px solid #C44536; }
[dir="rtl"] .pf-feedback-err { border-left:none; border-right:3px solid #C44536; }
.pf-section-hdr { display:flex; align-items:center; gap:10px; margin-bottom:14px; margin-top:8px; }
.pf-section-hdr-bar { width:4px; height:20px; background:#d4aa8d; flex-shrink:0; }
.pf-section-hdr-title { font-size:.85rem; font-weight:900; color:#1a1c1c; font-family:'Public Sans',sans-serif; text-transform:uppercase; letter-spacing:.5px; }
.pf-stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; margin-bottom:16px; }
.pf-stat-card { background:#fff; border:1px solid #eeeeee; border-left:3px solid #d4aa8d; display:flex; align-items:center; gap:14px; padding:14px 16px; transition:box-shadow .2s; position: relative; border-radius: 4px; }
[dir="rtl"] .pf-stat-card { border-left:1px solid #eeeeee; border-right:3px solid #d4aa8d; }
.pf-stat-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.07); }
.pf-stat-icon { width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; border-radius: 50%; }
.pf-stat-label { font-size:.78rem; font-weight:800; color:#1a1c1c; font-family:'Public Sans',sans-serif; }
.pf-stat-count { font-size:1.4rem; font-weight:900; color:#d4aa8d; font-family:'Public Sans',sans-serif; margin-left:auto; }
[dir="rtl"] .pf-stat-count { margin-left:0; margin-right:auto; }
.pf-stat-sub { font-size:.65rem; color:#9ca3af; margin-top:2px; }
.pf-stat-link { display:inline-flex; align-items:center; gap:4px; font-size:.7rem; font-weight:700; color:#d4aa8d; text-decoration:none; text-transform:uppercase; letter-spacing:.3px; margin-top:4px; }
.pf-stat-link:hover { color:#b87a50; }
.pf-quick { background:#fff; border:1px solid #eeeeee; padding:16px 20px; border-radius: 4px; }
.pf-quick-title { font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; margin-bottom:10px; }
.pf-quick-btns { display:flex; gap:8px; flex-wrap:wrap; }
.pf-quick-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; background:#E6F4F7; color:#0F4C5C; border:1px solid #B5DDE5; font-size:.72rem; font-weight:700; text-transform:uppercase; text-decoration:none; transition:background .15s; border-radius: 4px; }
.pf-quick-btn:hover { background:#B5DDE5; color:#0F4C5C; }
.pf-footer-links { display:flex; gap:16px; margin-top:14px; flex-wrap:wrap; }
.pf-footer-link { font-size:.72rem; color:#9ca3af; text-decoration:none; display:flex; align-items:center; gap:5px; }
.pf-footer-link:hover { color:#d4aa8d; }
.pf-loading { display:flex; align-items:center; justify-content:center; gap:12px; padding:60px 0; }
.pf-spinner { width:28px; height:28px; border:3px solid #e5e7eb; border-top-color:#d4aa8d; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
@media(max-width:600px){ .pf-grid { grid-template-columns:1fr; } .pf-avatar-row { flex-wrap:wrap; align-items: center; justify-content: center; text-align: center; } .pf-edit-btn { width: 100%; margin: 10px 0; } }
`

export default function ProfilePage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', address: '', city: '', governorate: '', place_of_birth: '' })
  
  const [stats, setStats] = useState<StatCard[]>([
    { key: 'reclamations', icon: 'fa-bullhorn',        color: '#C44536', labelKey: 'my_reclamations',           route: '/mes-reclamations', total: null, pending: null, approved: null },
    { key: 'naissances',   icon: 'fa-baby',             color: '#065f46', labelKey: 'birth_certs',              route: '/mes-naissances',   total: null, pending: null, approved: null },
    { key: 'mariages',     icon: 'fa-ring',             color: '#d4aa8d', labelKey: 'marriage_certs',           route: '/mes-mariages',     total: null, pending: null, approved: null },
    { key: 'permis',       icon: 'fa-hard-hat',         color: '#0F4C5C', labelKey: 'permis_construire',        route: '/mes-constructions', total: null, pending: null, approved: null },
    { key: 'livrets',      icon: 'fa-book',             color: '#b87a50', labelKey: 'livret_famille',           route: '/mes-demandes',     total: null, pending: null, approved: null },
    { key: 'extraits',     icon: 'fa-file-contract',    color: '#6b7280', labelKey: 'extraits_hub_title',       route: '/mes-extraits',     total: null, pending: null, approved: null },
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
      naissances:   resolveBackendUrl('/extrait-naissance/api/declaration/'),
      mariages:     resolveBackendUrl('/extrait-mariage/demandes/'),
      permis:       resolveBackendUrl('/api/construction/demandes/'),
      livrets:      resolveBackendUrl('/livret-famille/demandes/'),
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
        return { ...card, total: items.length, pending: items.filter(i => ['pending','en_attente','soumis','instruction'].includes(i.status||i.statut||'')).length, approved: items.filter(i => ['approved','resolved','approuve','signe','favorable','permis_delivre'].includes(i.status||i.statut||'')).length }
      }))
    })
  }, [])

  async function handleSave() {
    const access = getAccessToken()
    if (!access) return
    setSaving(true); setSaveError(null); setSaveSuccess(false)
    try {
      const res = await fetch(resolveBackendUrl('/api/accounts/me/'), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` }, body: JSON.stringify(editForm) })
      if (res.ok) { setUser(await res.json()); setEditing(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 4000) }
      else { const err = await res.json(); setSaveError(err.error || t('update_error')) }
    } catch { setSaveError(t('network_error')) }
    finally { setSaving(false) }
  }

  function handleCancel() {
    if (!user) return
    setEditForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '', address: user.address || '', city: user.city || '', governorate: user.governorate || '', place_of_birth: user.place_of_birth || '' })
    setEditing(false); setSaveError(null)
  }

  const roleLabel = () => { 
    if (!user) return ''; 
    if (user.is_superuser || user.user_type === 'supervisor') return t('role_supervisor'); 
    if (user.is_staff || user.user_type === 'agent') return t('role_agent'); 
    return t('role_citizen'); 
  }
  const isAgent = user?.is_staff || user?.user_type === 'agent' || user?.is_superuser

  if (loading) return (
    <MainLayout user={null} onLogout={() => navigate('/login')} breadcrumbs={[{ label: t('profile_title') }]}>
      <style>{CSS}</style>
      <div className="pf-loading">
        <div className="pf-spinner"></div>
        <span style={{ fontSize: '.82rem', color: '#9ca3af' }}>{t('loading_profile')}</span>
      </div>
    </MainLayout>
  )

  const userName = lang === 'ar' && user?.first_name_ar 
    ? `${user.first_name_ar} ${user.last_name_ar || ''}`
    : `${user?.first_name} ${user?.last_name}`;

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[{ label: t('profile_title') }]}>
      <style>{CSS}</style>
      <div className="pf-wrap">

        {/* ── Identity card ── */}
        <div className="pf-card">
          <div className="pf-card-top"></div>
          <div className="pf-card-body">
            <div className="pf-avatar-row">
              <div className="pf-avatar">{initials(user)}</div>
              <div style={{ flex: 1 }}>
                <div className="pf-name">{userName}</div>
                {(lang !== 'ar' && (user?.first_name_ar || user?.last_name_ar)) && (
                   <div className="pf-name-ar" style={{ direction: 'rtl' }}>{user?.first_name_ar} {user?.last_name_ar}</div>
                )}
                <div className="pf-badges">
                  {user?.is_verified
                    ? <span className="pf-badge pf-badge-verified"><i className="fas fa-check-circle me-1"></i>{t('status_verified')}</span>
                    : <span className="pf-badge pf-badge-unverified"><i className="fas fa-hourglass-half me-1"></i>{t('status_unverified')}</span>
                  }
                  <span className={`pf-badge ${isAgent ? 'pf-badge-agent' : 'pf-badge-citizen'}`}>
                    <i className="fas fa-id-badge me-1"></i>{roleLabel()}
                  </span>
                </div>
              </div>
              <div className="pf-edit-btn">
                {!editing ? (
                  <button className="pf-btn pf-btn-primary" onClick={() => setEditing(true)}>
                    <i className={`fas fa-pencil-alt ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{t('edit')}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="pf-btn pf-btn-success" onClick={handleSave} disabled={saving}>
                      {saving ? <span className="pf-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> : <i className={`fas fa-save ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>}
                      {t('save')}
                    </button>
                    <button className="pf-btn pf-btn-secondary" onClick={handleCancel} disabled={saving}>{t('cancel')}</button>
                  </div>
                )}
              </div>
            </div>

            {saveSuccess && <div className="pf-feedback-ok animate__animated animate__fadeIn"><i className="fas fa-check-circle me-2 ms-2"></i>{t('update_success')}</div>}
            {saveError  && <div className="pf-feedback-err animate__animated animate__shakeX"><i className="fas fa-exclamation-triangle me-2 ms-2"></i>{saveError}</div>}

            <hr className="pf-divider" />

            {/* Info grid */}
            <div className="pf-grid">
              {/* Email */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-envelope ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('email')}</label>
                <div className="pf-value pf-readonly">{user?.email}<i className="fas fa-lock" style={{ fontSize: '.65rem', color: '#d1d5db', marginLeft: lang === 'ar' ? '0' : 'auto', marginRight: lang === 'ar' ? 'auto' : '0' }}></i></div>
              </div>
              {/* CIN */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-id-card ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('cin')}</label>
                <div className="pf-value pf-readonly">{user?.cin || '—'}<i className="fas fa-lock" style={{ fontSize: '.65rem', color: '#d1d5db', marginLeft: lang === 'ar' ? '0' : 'auto', marginRight: lang === 'ar' ? 'auto' : '0' }}></i></div>
              </div>
              {/* First name */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-user ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('first_name')}</label>
                {editing ? <input className="pf-input" type="text" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                  : <div className="pf-value">{user?.first_name || '—'}</div>}
              </div>
              {/* Last name */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-user ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('last_name')}</label>
                {editing ? <input className="pf-input" type="text" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                  : <div className="pf-value">{user?.last_name || '—'}</div>}
              </div>
              {/* Phone */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-phone ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('phone')}</label>
                {editing ? <input className="pf-input" type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  : <div className="pf-value">{user?.phone || '—'}</div>}
              </div>
              {/* City */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-city ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('city')}</label>
                {editing ? <input className="pf-input" type="text" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                  : <div className="pf-value">{user?.city || '—'}</div>}
              </div>
              {/* Governorate */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-map-marker-alt ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('governorate')}</label>
                {editing ? <input className="pf-input" type="text" value={editForm.governorate} onChange={e => setEditForm(f => ({ ...f, governorate: e.target.value }))} />
                  : <div className="pf-value">{user?.governorate || '—'}</div>}
              </div>
              {/* Date of birth */}
              <div className="pf-field">
                <label className="pf-label"><i className={`fas fa-birthday-cake ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('date_of_birth')}</label>
                <div className="pf-value pf-readonly">{formatDate(user?.date_of_birth)}<i className="fas fa-lock" style={{ fontSize: '.65rem', color: '#d1d5db', marginLeft: lang === 'ar' ? '0' : 'auto', marginRight: lang === 'ar' ? 'auto' : '0' }}></i></div>
              </div>
              {/* Address */}
              <div className="pf-field pf-field-full">
                <label className="pf-label"><i className={`fas fa-map-pin ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('address')}</label>
                {editing ? <input className="pf-input" type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                  : <div className="pf-value">{user?.address || '—'}</div>}
              </div>
            </div>

            <div className="pf-footer-links">
              <Link to="/forgot-password" className="pf-footer-link"><i className={`fas fa-key ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('change_password')}</Link>
              <span className="pf-footer-link" style={{ cursor: 'default' }}>
                <i className={`fas fa-calendar-alt ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('member_since')} {user?.date_joined ? new Date(user.date_joined).getFullYear() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mes demandes ── */}
        <div className="pf-section-hdr">
          <div className="pf-section-hdr-bar"></div>
          <div className="pf-section-hdr-title">{t('account_stats')}</div>
        </div>

        <div className="pf-stats-grid">
          {stats.map(card => (
            <div key={card.key} className="pf-stat-card" style={{ borderLeftColor: lang !== 'ar' ? card.color : '#eeeeee', borderRightColor: lang === 'ar' ? card.color : '#eeeeee' }}>
              <div className="pf-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                <i className={`fas ${card.icon}`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div className="pf-stat-label">{t(card.labelKey)}</div>
                {card.total !== null && card.pending !== null && card.pending > 0 && (
                  <div className="pf-stat-sub">{card.pending} {lang === 'ar' ? 'قيد الانتظار' : 'en attente'}</div>
                )}
                <Link to={card.route} className="pf-stat-link">{t('view_all')} <i className={`fas fa-arrow-${lang === 'ar' ? 'left' : 'right'} ms-1 me-1`}></i></Link>
              </div>
              <div className="pf-stat-count">
                {card.total === null
                  ? <span className="pf-spinner" style={{ width: 22, height: 22 }}></span>
                  : card.total}
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="pf-quick">
          <div className="pf-quick-title"><i className={`fas fa-plus-circle ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{t('new_request')}</div>
          <div className="pf-quick-btns">
            <Link to="/nouvelle-reclamation" className="pf-quick-btn"><i className={`fas fa-bullhorn ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('new_reclamation')}</Link>
            <Link to="/demande-evenement" className="pf-quick-btn"><i className={`fas fa-calendar-plus ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('event_request')}</Link>
            <Link to="/demande-residence" className="pf-quick-btn"><i className={`fas fa-home ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('residence_cert')}</Link>
            <Link to="/declaration-naissance" className="pf-quick-btn"><i className={`fas fa-baby ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('birth_decl')}</Link>
            <Link to="/declaration-deces" className="pf-quick-btn"><i className={`fas fa-cross ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('death_decl')}</Link>
            <Link to="/services" className="pf-quick-btn"><i className={`fas fa-th-large ${lang === 'ar' ? 'ms-1' : 'me-1'}`}></i>{t('view_all_services')}</Link>
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
