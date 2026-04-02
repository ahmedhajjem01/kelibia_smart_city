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
}

type StatCard = {
  key: string
  icon: string
  color: string
  bg: string
  label: string
  labelAr: string
  route: string
  total: number | null
  pending: number | null
  approved: number | null
}

function initials(u: UserInfo | null) {
  if (!u) return '?'
  const f = u.first_name?.[0] || ''
  const l = u.last_name?.[0] || ''
  return (f + l).toUpperCase() || u.email?.[0]?.toUpperCase() || '?'
}

function avatarColor(name: string) {
  const colors = ['#6f42c1', '#0d6efd', '#198754', '#dc3545', '#fd7e14', '#0dcaf0', '#6610f2', '#d63384']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return iso }
}

export default function ProfilePage() {
  useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    governorate: '',
    place_of_birth: '',
  })

  const [stats, setStats] = useState<StatCard[]>([
    { key: 'reclamations', icon: 'fa-exclamation-circle', color: '#dc3545', bg: '#fff5f5', label: 'Réclamations',         labelAr: 'الشكاوى',          route: '/mes-reclamations', total: null, pending: null, approved: null },
    { key: 'evenements',   icon: 'fa-calendar-check',    color: '#6f42c1', bg: '#f5f0ff', label: 'Événements',            labelAr: 'التظاهرات',        route: '/mes-evenements',   total: null, pending: null, approved: null },
    { key: 'residences',   icon: 'fa-home',              color: '#0d6efd', bg: '#f0f5ff', label: 'Attestations résidence', labelAr: 'شهادات الإقامة',   route: '/mes-residences',   total: null, pending: null, approved: null },
    { key: 'naissances',   icon: 'fa-baby',              color: '#198754', bg: '#f0fff5', label: 'Déclarations naissance', labelAr: 'تصاريح الولادة',   route: '/mes-naissances',   total: null, pending: null, approved: null },
    { key: 'deces',        icon: 'fa-cross',             color: '#6c757d', bg: '#f8f9fa', label: 'Déclarations décès',    labelAr: 'تصاريح الوفاة',   route: '/mes-deces',        total: null, pending: null, approved: null },
    { key: 'mariages',     icon: 'fa-ring',              color: '#fd7e14', bg: '#fff8f0', label: 'Demandes mariage',       labelAr: 'طلبات الزواج',     route: '/mes-mariages',     total: null, pending: null, approved: null },
  ])

  // ── Fetch user profile ───────────────────────────────────────────────────────
  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }

    fetch(resolveBackendUrl('/api/accounts/me/'), {
      headers: { Authorization: `Bearer ${access}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data)
          setEditForm({
            first_name:    data.first_name    || '',
            last_name:     data.last_name     || '',
            phone:         data.phone         || '',
            address:       data.address       || '',
            city:          data.city          || '',
            governorate:   data.governorate   || '',
            place_of_birth: data.place_of_birth || '',
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [navigate])

  // ── Fetch stats in parallel ──────────────────────────────────────────────────
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

    Promise.allSettled(
      Object.entries(endpoints).map(([key, url]) =>
        fetch(url, { headers: h })
          .then(r => r.ok ? r.json() : null)
          .then(data => ({ key, data }))
      )
    ).then(results => {
      setStats(prev => prev.map(card => {
        const result = results.find(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{key: string; data: unknown}>).value?.key === card.key)
        if (!result || result.status !== 'fulfilled') return card
        const raw = (result as PromiseFulfilledResult<{key: string; data: unknown}>).value.data
        if (!raw) return card

        const items: Record<string, string>[] = Array.isArray(raw) ? raw : ((raw as {results?: unknown[]}).results || [])
        const total   = items.length
        const pending = items.filter(i => ['pending', 'en_attente', 'soumis'].includes(i.status || i.statut || '')).length
        const approved = items.filter(i => ['approved', 'resolved', 'approuve', 'signe'].includes(i.status || i.statut || '')).length
        return { ...card, total, pending, approved }
      }))
    })
  }, [])

  // ── Save profile edits ───────────────────────────────────────────────────────
  async function handleSave() {
    const access = getAccessToken()
    if (!access) return
    setSaving(true); setSaveError(null); setSaveSuccess(false)

    try {
      const res = await fetch(resolveBackendUrl('/api/accounts/me/'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setUser(updated)
        setEditing(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const err = await res.json()
        setSaveError(err.error || 'Erreur lors de la sauvegarde.')
      }
    } catch {
      setSaveError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (!user) return
    setEditForm({
      first_name:    user.first_name    || '',
      last_name:     user.last_name     || '',
      phone:         user.phone         || '',
      address:       user.address       || '',
      city:          user.city          || '',
      governorate:   user.governorate   || '',
      place_of_birth: user.place_of_birth || '',
    })
    setEditing(false)
    setSaveError(null)
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const roleLabel = () => {
    if (!user) return ''
    if (user.is_superuser || user.user_type === 'supervisor') return 'Superviseur'
    if (user.is_staff || user.user_type === 'agent') return 'Agent Municipal'
    return 'Citoyen'
  }

  const roleColor = () => {
    if (!user) return '#6c757d'
    if (user.is_superuser || user.user_type === 'supervisor') return '#6f42c1'
    if (user.is_staff || user.user_type === 'agent') return '#0d6efd'
    return '#198754'
  }

  const inputCls = "form-control bg-light border-0 shadow-sm"
  const inputStyle = { borderRadius: '10px', fontSize: '.9rem' }
  const labelCls = "form-label fw-semibold small text-uppercase text-muted mb-1"

  if (loading) return (
    <MainLayout user={null} onLogout={() => navigate('/login')} breadcrumbs={[{ label: 'Mon Profil' }]}>
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <span className="spinner-border text-primary me-3"></span>
        <span className="text-muted">Chargement du profil...</span>
      </div>
    </MainLayout>
  )

  const accentColor = user ? avatarColor(`${user.first_name}${user.last_name}`) : '#6f42c1'

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: 'Mon Profil' }]}>
      <div className="container-fluid py-3 pb-5" style={{ maxWidth: 1000 }}>

        {/* ── SECTION 1: Identity card ─────────────────────────────────────── */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">

          {/* Colored top banner */}
          <div style={{ background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}88)`, height: 80 }} />

          <div className="card-body px-4 pb-4 pt-0">
            {/* Avatar row */}
            <div className="d-flex align-items-end gap-4 mb-3" style={{ marginTop: -44 }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow"
                style={{ width: 80, height: 80, background: accentColor, color: '#fff', fontSize: '1.8rem', border: '4px solid #fff', flexShrink: 0 }}>
                {initials(user)}
              </div>
              <div className="pb-1 flex-grow-1">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h4 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>
                    {user?.first_name} {user?.last_name}
                  </h4>
                  {(user?.first_name_ar || user?.last_name_ar) && (
                    <span className="text-muted" style={{ fontFamily: 'Arial', direction: 'rtl', fontSize: '.95rem' }}>
                      {user?.first_name_ar} {user?.last_name_ar}
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                  {/* Verification badge */}
                  {user?.is_verified ? (
                    <span className="badge rounded-pill px-3 py-1" style={{ background: '#d1fae5', color: '#065f46', fontSize: '.75rem' }}>
                      <i className="fas fa-check-circle me-1"></i>Compte vérifié
                    </span>
                  ) : (
                    <span className="badge rounded-pill px-3 py-1" style={{ background: '#fef3c7', color: '#92400e', fontSize: '.75rem' }}>
                      <i className="fas fa-hourglass-half me-1"></i>En attente de vérification
                    </span>
                  )}
                  {/* Role badge */}
                  <span className="badge rounded-pill px-3 py-1" style={{ background: `${roleColor()}22`, color: roleColor(), fontSize: '.75rem' }}>
                    <i className="fas fa-id-badge me-1"></i>{roleLabel()}
                  </span>
                </div>
              </div>
              {/* Edit toggle */}
              <div className="pb-1">
                {!editing ? (
                  <button className="btn btn-outline-primary rounded-pill px-4"
                    style={{ fontSize: '.85rem' }}
                    onClick={() => setEditing(true)}>
                    <i className="fas fa-pencil-alt me-2"></i>Modifier
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button className="btn btn-success rounded-pill px-4" style={{ fontSize: '.85rem' }}
                      onClick={handleSave} disabled={saving}>
                      {saving
                        ? <span className="spinner-border spinner-border-sm"></span>
                        : <><i className="fas fa-save me-2"></i>Enregistrer</>}
                    </button>
                    <button className="btn btn-outline-secondary rounded-pill px-3" style={{ fontSize: '.85rem' }}
                      onClick={handleCancel} disabled={saving}>
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback */}
            {saveSuccess && (
              <div className="alert alert-success rounded-3 py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '.88rem' }}>
                <i className="fas fa-check-circle"></i> Profil mis à jour avec succès !
              </div>
            )}
            {saveError && (
              <div className="alert alert-danger rounded-3 py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '.88rem' }}>
                <i className="fas fa-exclamation-triangle"></i> {saveError}
              </div>
            )}

            <hr className="my-3" />

            {/* Info grid */}
            <div className="row g-3">

              {/* Email — always read-only */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-envelope me-1 text-primary opacity-75"></i>Email</label>
                <div className="d-flex align-items-center gap-2">
                  <span className="form-control bg-light border-0 shadow-sm text-muted"
                    style={{ ...inputStyle, cursor: 'default' }}>
                    {user?.email}
                  </span>
                  <span title="Non modifiable"><i className="fas fa-lock text-muted opacity-50"></i></span>
                </div>
              </div>

              {/* CIN — always read-only */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-id-card me-1 text-primary opacity-75"></i>CIN</label>
                <div className="d-flex align-items-center gap-2">
                  <span className="form-control bg-light border-0 shadow-sm text-muted"
                    style={{ ...inputStyle, cursor: 'default' }}>
                    {user?.cin || '—'}
                  </span>
                  <span title="Non modifiable"><i className="fas fa-lock text-muted opacity-50"></i></span>
                </div>
              </div>

              {/* First name */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-user me-1 text-primary opacity-75"></i>Prénom</label>
                {editing ? (
                  <input type="text" className={inputCls} style={inputStyle}
                    value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                ) : (
                  <div className="form-control bg-light border-0 shadow-sm" style={{ ...inputStyle, cursor: 'default' }}>{user?.first_name || '—'}</div>
                )}
              </div>

              {/* Last name */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-user me-1 text-primary opacity-75"></i>Nom</label>
                {editing ? (
                  <input type="text" className={inputCls} style={inputStyle}
                    value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                ) : (
                  <div className="form-control bg-light border-0 shadow-sm" style={{ ...inputStyle, cursor: 'default' }}>{user?.last_name || '—'}</div>
                )}
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-phone me-1 text-primary opacity-75"></i>Téléphone</label>
                {editing ? (
                  <input type="tel" className={inputCls} style={inputStyle}
                    value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                ) : (
                  <div className="form-control bg-light border-0 shadow-sm" style={{ ...inputStyle, cursor: 'default' }}>{user?.phone || '—'}</div>
                )}
              </div>

              {/* City */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-city me-1 text-primary opacity-75"></i>Ville</label>
                {editing ? (
                  <input type="text" className={inputCls} style={inputStyle}
                    value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                ) : (
                  <div className="form-control bg-light border-0 shadow-sm" style={{ ...inputStyle, cursor: 'default' }}>{user?.city || '—'}</div>
                )}
              </div>

              {/* Governorate */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-map-marker-alt me-1 text-primary opacity-75"></i>Gouvernorat</label>
                {editing ? (
                  <input type="text" className={inputCls} style={inputStyle}
                    value={editForm.governorate} onChange={e => setEditForm(f => ({ ...f, governorate: e.target.value }))} />
                ) : (
                  <div className="form-control bg-light border-0 shadow-sm" style={{ ...inputStyle, cursor: 'default' }}>{user?.governorate || '—'}</div>
                )}
              </div>

              {/* Date of birth — read-only (set during registration) */}
              <div className="col-md-6">
                <label className={labelCls}><i className="fas fa-birthday-cake me-1 text-primary opacity-75"></i>Date de naissance</label>
                <div className="d-flex align-items-center gap-2">
                  <span className="form-control bg-light border-0 shadow-sm text-muted"
                    style={{ ...inputStyle, cursor: 'default' }}>
                    {formatDate(user?.date_of_birth)}
                  </span>
                  <span title="Non modifiable"><i className="fas fa-lock text-muted opacity-50"></i></span>
                </div>
              </div>

              {/* Address */}
              <div className="col-12">
                <label className={labelCls}><i className="fas fa-map-pin me-1 text-primary opacity-75"></i>Adresse</label>
                {editing ? (
                  <input type="text" className={inputCls} style={inputStyle}
                    value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                ) : (
                  <div className="form-control bg-light border-0 shadow-sm" style={{ ...inputStyle, cursor: 'default' }}>{user?.address || '—'}</div>
                )}
              </div>

            </div>

            {/* Footer links */}
            <div className="d-flex gap-3 mt-4 flex-wrap" style={{ fontSize: '.82rem' }}>
              <Link to="/forgot-password" className="text-decoration-none text-muted">
                <i className="fas fa-key me-1"></i>Changer le mot de passe
              </Link>
              <span className="text-muted opacity-50">•</span>
              <span className="text-muted">
                <i className="fas fa-calendar-alt me-1 opacity-75"></i>
                Membre depuis {user ? new Date((user as unknown as {date_joined?: string}).date_joined || '').getFullYear() || '—' : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Mes demandes ──────────────────────────────────────────── */}
        <div className="mb-3 d-flex align-items-center gap-3">
          <div className="rounded-3 p-2 shadow-sm d-flex align-items-center justify-content-center"
            style={{ background: 'linear-gradient(135deg,#6f42c1,#0d6efd)', color: '#fff', width: 38, height: 38 }}>
            <i className="fas fa-folder-open"></i>
          </div>
          <div>
            <h5 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>Mes demandes & dossiers</h5>
            <p className="text-muted small mb-0" style={{ direction: 'rtl' }}>طلباتي وملفاتي</p>
          </div>
        </div>

        <div className="row g-3">
          {stats.map(card => (
            <div key={card.key} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden"
                style={{ transition: 'transform .18s, box-shadow .18s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}>

                {/* Colored left accent bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: card.color, borderRadius: '16px 0 0 16px' }} />

                <div className="card-body ps-4 pe-3 py-3">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    {/* Icon */}
                    <div className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: 44, height: 44, background: card.bg, color: card.color, fontSize: '1.1rem', flexShrink: 0 }}>
                      <i className={`fas ${card.icon}`}></i>
                    </div>
                    {/* Total badge */}
                    <span className="badge rounded-pill fw-bold px-3 py-2"
                      style={{ background: card.total === null ? '#f8f9fa' : card.bg, color: card.color, fontSize: '.85rem', minWidth: 36 }}>
                      {card.total === null
                        ? <span className="spinner-border spinner-border-sm" style={{ width: '0.75rem', height: '0.75rem', borderWidth: '0.15em' }}></span>
                        : card.total}
                    </span>
                  </div>

                  <div className="fw-bold mb-1" style={{ color: '#1a1a2e', fontSize: '.93rem' }}>{card.label}</div>
                  <div className="text-muted small mb-2" style={{ direction: 'rtl', fontSize: '.78rem' }}>{card.labelAr}</div>

                  {/* Sub stats */}
                  {card.total !== null && card.total > 0 && (
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {card.pending !== null && card.pending > 0 && (
                        <span className="badge rounded-pill px-2 py-1"
                          style={{ background: '#fff8e1', color: '#e65100', fontSize: '.72rem' }}>
                          <i className="fas fa-hourglass-half me-1"></i>{card.pending} en attente
                        </span>
                      )}
                      {card.approved !== null && card.approved > 0 && (
                        <span className="badge rounded-pill px-2 py-1"
                          style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '.72rem' }}>
                          <i className="fas fa-check me-1"></i>{card.approved} approuvé{card.approved > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {card.total === 0 && (
                    <p className="text-muted small mb-2" style={{ fontSize: '.78rem' }}>Aucune demande pour l'instant</p>
                  )}

                  <Link to={card.route}
                    className="btn btn-sm rounded-pill px-3 fw-semibold mt-1"
                    style={{ background: card.bg, color: card.color, border: `1px solid ${card.color}33`, fontSize: '.8rem' }}>
                    Voir mes demandes <i className="fas fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick new request row ─────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm rounded-4 mt-4">
          <div className="card-body p-3">
            <p className="text-muted small fw-semibold text-uppercase mb-3">
              <i className="fas fa-plus-circle me-2 text-primary"></i>Nouvelle demande
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/nouvelle-reclamation" className="btn btn-sm btn-outline-danger rounded-pill px-3">
                <i className="fas fa-exclamation-circle me-1"></i>Réclamation
              </Link>
              <Link to="/demande-evenement" className="btn btn-sm btn-outline-secondary rounded-pill px-3" style={{ color: '#6f42c1', borderColor: '#6f42c1' }}>
                <i className="fas fa-calendar-plus me-1"></i>Événement
              </Link>
              <Link to="/demande-residence" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                <i className="fas fa-home me-1"></i>Attestation résidence
              </Link>
              <Link to="/declaration-naissance" className="btn btn-sm btn-outline-success rounded-pill px-3">
                <i className="fas fa-baby me-1"></i>Déclaration naissance
              </Link>
              <Link to="/declaration-deces" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                <i className="fas fa-cross me-1"></i>Déclaration décès
              </Link>
              <Link to="/services" className="btn btn-sm btn-light rounded-pill px-3 text-muted">
                <i className="fas fa-th-large me-1"></i>Tous les services
              </Link>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
