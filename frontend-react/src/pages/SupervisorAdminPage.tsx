import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const getToken = () => localStorage.getItem('access') || sessionStorage.getItem('access') || ''

type Tab = 'dashboard' | 'users' | 'services' | 'orders'

export default function SupervisorAdminPage() {
  const navigate = useNavigate()
  const token = getToken()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [user, setUser] = useState<any>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // ── data states ──────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // ── modal states ─────────────────────────────────────────
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addSvcOpen, setAddSvcOpen] = useState(false)
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', user_type: 'agent' })
  const [svcForm, setSvcForm] = useState({ name_fr: '', name_ar: '', processing_time: '', description_fr: '', category: '' })

  const api = (path: string, opts?: RequestInit) =>
    fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers || {}) } })

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  // ── auth guard ───────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    api('/api/accounts/me/').then(r => r.json()).then(u => {
      if (!u.is_staff && !u.is_superuser && u.user_type !== 'supervisor') { navigate('/login'); return }
      setUser(u)
      fetchSummary()
      fetchUsers()
      fetchServices()
      fetchOrders()
    }).catch(() => navigate('/login'))
  }, [])

  const fetchSummary = () =>
    api('/api/supervisor/services-summary/').then(r => r.json()).then(setSummary).catch(() => {})

  const fetchUsers = () => {
    setLoading(true)
    api('/api/accounts/verify-citizens/?mode=all').then(r => r.json()).then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }

  const fetchServices = () =>
    api('/api/services/categories/').then(r => r.json()).then((cats: any[]) => {
      setCategories(cats)
      const flat: any[] = []
      cats.forEach(c => (c.services || []).forEach((s: any) => flat.push({ ...s, category_name: c.name_fr, category_id: c.id })))
      setServices(flat)
    }).catch(() => {})

  const fetchOrders = () =>
    api('/api/supervisor/manage-orders/').then(r => r.json()).then(setOrders).catch(() => {})

  // ── user actions ─────────────────────────────────────────
  const userAction = async (id: number, action: string) => {
    const r = await api('/api/accounts/verify-citizens/', { method: 'POST', body: JSON.stringify({ user_id: id, action }) })
    if (r.ok) { notify(action === 'delete' ? 'Utilisateur supprimé' : 'Action effectuée'); fetchUsers() }
    else notify('Erreur', false)
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = await api('/api/accounts/admin-create/', { method: 'POST', body: JSON.stringify(userForm) })
    if (r.ok) { notify('Utilisateur créé !'); setAddUserOpen(false); setUserForm({ username: '', email: '', password: '', user_type: 'agent' }); fetchUsers() }
    else { const err = await r.json(); notify(err.error || 'Erreur', false) }
  }

  const createService = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = await api('/api/services/list/', { method: 'POST', body: JSON.stringify(svcForm) })
    if (r.ok) { notify('Service créé !'); setAddSvcOpen(false); setSvcForm({ name_fr: '', name_ar: '', processing_time: '', description_fr: '', category: '' }); fetchServices() }
    else notify('Erreur lors de la création', false)
  }

  const deleteService = async (id: number) => {
    if (!window.confirm('Supprimer ce service ?')) return
    const r = await api(`/api/services/list/${id}/`, { method: 'DELETE' })
    if (r.ok || r.status === 204) { notify('Service supprimé'); fetchServices() }
    else notify('Erreur', false)
  }

  const updateOrderStatus = async (type: string, id: number, status: string) => {
    const r = await api('/api/supervisor/manage-orders/', { method: 'POST', body: JSON.stringify({ type, order_id: id, status }) })
    if (r.ok) { notify('Statut mis à jour'); fetchOrders() }
    else notify('Erreur', false)
  }

  const deleteOrder = async (type: string, id: number) => {
    if (!window.confirm('Supprimer cette demande ?')) return
    const r = await api(`/api/supervisor/manage-orders/?type=${type}&id=${id}`, { method: 'DELETE' })
    if (r.ok) { notify('Demande supprimée'); fetchOrders() }
    else notify('Erreur', false)
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-TN') : '—'

  const STAT_CARDS = [
    { label: 'Utilisateurs', value: users.length, icon: 'fa-users', color: '#3b82f6' },
    { label: 'Services', value: services.length, icon: 'fa-cogs', color: '#8b5cf6' },
    { label: 'Résidence', value: summary?.attestation_residence ?? '…', icon: 'fa-home', color: '#10b981' },
    { label: 'Naissance', value: summary?.declaration_naissance ?? '…', icon: 'fa-baby', color: '#f59e0b' },
    { label: 'Demandes', value: orders.length, icon: 'fa-file-alt', color: '#ef4444' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", display: 'flex' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 240, background: '#1e293b', minHeight: '100vh', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, borderRight: '1px solid #334155' }}>
        <div style={{ padding: '8px 12px 20px', borderBottom: '1px solid #334155', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Kélibia Smart City</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>⚙ Admin Dashboard</div>
          {user && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{user.email}</div>}
        </div>

        {([
          ['dashboard', 'fa-th-large', 'Tableau de bord'],
          ['users', 'fa-users', 'Gestion Utilisateurs'],
          ['services', 'fa-cogs', 'Services Municipaux'],
          ['orders', 'fa-file-alt', 'Commandes / Demandes'],
        ] as [Tab, string, string][]).map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? '#3b82f6' : 'transparent',
            border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
            color: tab === id ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', width: '100%',
            transition: 'all .15s'
          }}>
            <i className={`fas ${icon}`} style={{ width: 16 }}></i>{label}
          </button>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => navigate('/agent-dashboard')} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#64748b', fontSize: 12, width: '100%' }}>
            <i className="fas fa-arrow-left me-2"></i>Retour Dashboard Agent
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.ok ? '#10b981' : '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,.3)', animation: 'slideIn .3s ease' }}>
            {toast.ok ? '✅' : '❌'} {toast.msg}
          </div>
        )}

        {/* ── TAB: DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Tableau de Bord Superviseur</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Vue d'ensemble de la plateforme Kélibia Smart City</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
              {STAT_CARDS.map(c => (
                <div key={c.label} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: `1px solid #334155`, borderTop: `3px solid ${c.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div><div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
                    </div>
                    <i className={`fas ${c.icon}`} style={{ color: c.color, fontSize: 22, opacity: .5 }}></i>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Dernières Demandes</h3>
                {orders.slice(0, 5).map(o => (
                  <div key={`${o.type}-${o.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{o.type_label}</div><div style={{ fontSize: 11, color: '#64748b' }}>{o.citizen_name}</div></div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: o.status === 'approved' ? '#065f46' : o.status === 'rejected' ? '#7f1d1d' : '#1e3a5f', color: o.status === 'approved' ? '#6ee7b7' : o.status === 'rejected' ? '#fca5a5' : '#93c5fd' }}>{o.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Accès Rapides</h3>
                {[['users', 'fa-user-plus', 'Ajouter un agent', '#3b82f6'], ['services', 'fa-plus-circle', 'Ajouter un service', '#8b5cf6'], ['orders', 'fa-list', 'Voir les demandes', '#10b981']].map(([t, icon, label, color]) => (
                  <button key={t} onClick={() => setTab(t as Tab)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', border: 'none', borderRadius: 8, padding: '10px 14px', marginBottom: 8, cursor: 'pointer', color: color as string, fontWeight: 600, fontSize: 13, width: '100%', textAlign: 'left' }}>
                    <i className={`fas ${icon}`}></i> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: USERS ── */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Gestion des Utilisateurs</h1>
                <p style={{ color: '#64748b', fontSize: 13 }}>{users.length} compte(s) au total</p>
              </div>
              <button onClick={() => setAddUserOpen(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                <i className="fas fa-user-plus me-2"></i>Ajouter un compte
              </button>
            </div>

            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chargement...</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      {['Utilisateur', 'Email', 'Type', 'Statut', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderTop: '1px solid #334155' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{u.full_name || u.username}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>CIN: {u.cin}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{u.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.user_type === 'supervisor' ? '#312e81' : u.user_type === 'agent' ? '#1e3a5f' : '#1f2937', color: u.user_type === 'supervisor' ? '#a5b4fc' : u.user_type === 'agent' ? '#93c5fd' : '#9ca3af' }}>
                            {u.user_type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: u.is_active ? '#065f46' : '#7f1d1d', color: u.is_active ? '#6ee7b7' : '#fca5a5' }}>
                            {u.is_active ? 'Actif' : 'Bloqué'}
                          </span>
                          {' '}
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: u.is_verified ? '#064e3b' : '#78350f', color: u.is_verified ? '#34d399' : '#fcd34d' }}>
                            {u.is_verified ? 'Vérifié' : 'Non vérifié'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {!u.is_verified && <Btn color="#10b981" title="Vérifier" icon="fa-check" onClick={() => userAction(u.id, 'verify')} />}
                            <Btn color="#f59e0b" title={u.is_active ? 'Bloquer' : 'Débloquer'} icon={u.is_active ? 'fa-ban' : 'fa-unlock'} onClick={() => userAction(u.id, 'toggle_active')} />
                            {u.user_type === 'citizen' && <Btn color="#3b82f6" title="→ Agent" icon="fa-briefcase" onClick={() => userAction(u.id, 'promote_to_agent')} />}
                            {u.user_type !== 'supervisor' && user?.is_superuser && <Btn color="#8b5cf6" title="→ Superviseur" icon="fa-crown" onClick={() => { if (window.confirm('Promouvoir en superviseur ?')) userAction(u.id, 'promote_to_supervisor') }} />}
                            <Btn color="#ef4444" title="Supprimer" icon="fa-trash" onClick={() => { if (window.confirm('Supprimer cet utilisateur ?')) userAction(u.id, 'delete') }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: SERVICES ── */}
        {tab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Services Municipaux</h1>
                <p style={{ color: '#64748b', fontSize: 13 }}>{services.length} service(s) — {categories.length} catégories</p>
              </div>
              <button onClick={() => setAddSvcOpen(true)} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                <i className="fas fa-plus me-2"></i>Ajouter un service
              </button>
            </div>

            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Service (FR)', 'Arabe', 'Catégorie', 'Délai', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{s.name_fr}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', direction: 'rtl' }}>{s.name_ar}</td>
                      <td style={{ padding: '12px 16px' }}><span style={{ background: '#1e3a5f', color: '#93c5fd', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.category_name}</span></td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{s.processing_time || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Btn color="#ef4444" title="Supprimer" icon="fa-trash" onClick={() => deleteService(s.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: ORDERS ── */}
        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Gestion des Demandes</h1>
                <p style={{ color: '#64748b', fontSize: 13 }}>{orders.length} demande(s) au total</p>
              </div>
              <button onClick={fetchOrders} style={{ background: '#334155', color: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 13 }}>
                <i className="fas fa-sync-alt me-2"></i>Rafraîchir
              </button>
            </div>

            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Type', 'Citoyen', 'Paiement', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={`${o.type}-${o.id}`} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{o.type_label}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>#{o.id}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{o.citizen_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: o.is_paid ? '#065f46' : '#1f2937', color: o.is_paid ? '#6ee7b7' : '#6b7280' }}>
                          {o.is_paid ? 'Payé' : 'Non payé'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={o.status}
                          onChange={e => updateOrderStatus(o.type, o.id, e.target.value)}
                          style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
                        >
                          <option value="pending">En attente</option>
                          <option value="in_progress">En cours</option>
                          <option value="approved">Approuvée</option>
                          <option value="rejected">Rejetée</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{fmt(o.created_at)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Btn color="#ef4444" title="Supprimer" icon="fa-trash" onClick={() => deleteOrder(o.type, o.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: ADD USER ── */}
      {addUserOpen && (
        <Modal title="Ajouter un Compte" onClose={() => setAddUserOpen(false)}>
          <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nom d'utilisateur" value={userForm.username} onChange={v => setUserForm(f => ({ ...f, username: v }))} placeholder="ex: agent_kcl" required />
            <Field label="Email" type="email" value={userForm.email} onChange={v => setUserForm(f => ({ ...f, email: v }))} placeholder="agent@kelibiasmartcity.tn" required />
            <Field label="Mot de passe" type="password" value={userForm.password} onChange={v => setUserForm(f => ({ ...f, password: v }))} placeholder="Min. 8 caractères" required />
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Type de compte</label>
              <select value={userForm.user_type} onChange={e => setUserForm(f => ({ ...f, user_type: e.target.value }))} style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                <option value="agent">Agent Municipal</option>
                <option value="supervisor">Superviseur</option>
              </select>
            </div>
            <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: 14, marginTop: 4 }}>Créer le compte</button>
          </form>
        </Modal>
      )}

      {/* ── MODAL: ADD SERVICE ── */}
      {addSvcOpen && (
        <Modal title="Ajouter un Service" onClose={() => setAddSvcOpen(false)}>
          <form onSubmit={createService} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Catégorie</label>
              <select required value={svcForm.category} onChange={e => setSvcForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                <option value="">-- Choisir une catégorie --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
              </select>
            </div>
            <Field label="Nom (Français)" value={svcForm.name_fr} onChange={v => setSvcForm(f => ({ ...f, name_fr: v }))} required />
            <Field label="Nom (Arabe)" value={svcForm.name_ar} onChange={v => setSvcForm(f => ({ ...f, name_ar: v }))} required />
            <Field label="Délai de traitement" value={svcForm.processing_time} onChange={v => setSvcForm(f => ({ ...f, processing_time: v }))} placeholder="ex: 24h – 48h" />
            <Field label="Description (FR)" value={svcForm.description_fr} onChange={v => setSvcForm(f => ({ ...f, description_fr: v }))} />
            <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: 14, marginTop: 4 }}>Créer le service</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Small reusable helpers ─────────────────────────────────────────────────

function Btn({ color, icon, title, onClick }: { color: string; icon: string; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} style={{ background: 'transparent', border: `1px solid ${color}`, color, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 12, transition: 'all .15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = color; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = color }}>
      <i className={`fas ${icon}`}></i>
    </button>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#1e293b', borderRadius: 14, width: '100%', maxWidth: 440, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box' }} />
    </div>
  )
}
