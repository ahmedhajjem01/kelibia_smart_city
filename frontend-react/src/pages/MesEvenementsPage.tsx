import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type Demande = {
  id: number
  titre_evenement: string
  type_evenement: string
  type_evenement_display: string
  type_evenement_libre: string | null
  lieu_type_display: string
  lieu_details: string
  date_debut: string
  date_fin: string
  heure_debut: string
  heure_fin: string
  nombre_participants: number
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'changes_requested'
  status_display: string
  commentaire_agent: string
  autorisation_signee: string | null
  has_conflict: boolean
  conflict_with_title: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { cls: string; icon: string }> = {
  pending:           { cls: 'bg-warning text-dark',  icon: 'fa-hourglass-half' },
  in_progress:       { cls: 'bg-info text-white',    icon: 'fa-spinner' },
  approved:          { cls: 'bg-success text-white', icon: 'fa-check-circle' },
  rejected:          { cls: 'bg-danger text-white',  icon: 'fa-times-circle' },
  changes_requested: { cls: 'bg-warning text-dark',  icon: 'fa-edit' },
}

const TYPE_ICON: Record<string, string> = {
  fete_familiale: 'fa-birthday-cake',
  concert:        'fa-music',
  marche:         'fa-store',
  association:    'fa-users',
  sportif:        'fa-running',
  culturel:       'fa-theater-masks',
  commercial:     'fa-briefcase',
  autre:          'fa-calendar-day',
}

export default function MesEvenementsPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    const fetchAll = async () => {
      try {
        const [userRes, demandesRes] = await Promise.all([
          fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch('/api/evenements/demande/', { headers: { Authorization: `Bearer ${access}` } }),
        ])
        if (userRes.ok) setUser(await userRes.json())
        if (demandesRes.ok) {
          const data = await demandesRes.json()
          setDemandes(Array.isArray(data) ? data : (data.results || []))
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [navigate])

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: 'Mes demandes d\'événements' }]}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-primary text-uppercase m-0" style={{ fontSize: '1.2rem' }}>
            <i className="fas fa-calendar-alt me-2"></i>Mes demandes d'événements
          </h2>
          <p className="text-muted small mb-0">طلبات تراخيص التظاهرات الخاصة بكم</p>
        </div>
        <Link to="/demande-evenement" className="btn btn-primary rounded-pill shadow-sm px-4">
          <i className="fas fa-plus me-2"></i>Nouvelle demande
        </Link>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Chargement...</p>
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center p-5">
              <i className="fas fa-calendar-times fa-3x text-muted opacity-25 mb-3 d-block"></i>
              <p className="text-muted mb-3">Aucune demande d'événement trouvée.</p>
              <Link to="/demande-evenement" className="btn btn-primary rounded-pill px-4">
                <i className="fas fa-plus me-2"></i>Soumettre une demande
              </Link>
            </div>
          ) : (
            <div className="p-3 p-md-4 d-flex flex-column gap-3">
              {demandes.map(d => {
                const sc = STATUS_CONFIG[d.status] || { cls: 'bg-secondary text-white', icon: 'fa-question' }
                const icon = TYPE_ICON[d.type_evenement] || 'fa-calendar-day'
                const isExpanded = expandedId === d.id
                return (
                  <div key={d.id} className={`border rounded-4 overflow-hidden shadow-sm ${d.has_conflict ? 'border-warning' : 'border-0'}`}
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

                    {/* Conflict banner */}
                    {d.has_conflict && (
                      <div className="px-4 py-2 d-flex align-items-center gap-2"
                        style={{ background: '#fff8e1', borderBottom: '1px solid #ffe082', fontSize: '.82rem', color: '#f57f17' }}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <strong>Conflit détecté</strong> — un autre événement est prévu au même lieu et à la même date
                        {d.conflict_with_title && <span> : <em>« {d.conflict_with_title} »</em></span>}
                      </div>
                    )}

                    {/* Card header row */}
                    <div className="p-4 d-flex align-items-start gap-3 flex-wrap"
                      style={{ background: '#fff', cursor: 'pointer' }}
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#6f42c1,#0d6efd)', color: '#fff', fontSize: '1.2rem' }}>
                        <i className={`fas ${icon}`}></i>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span className="fw-bold" style={{ fontSize: '1rem', color: '#1a1a2e' }}>{d.titre_evenement}</span>
                          <span className={`badge rounded-pill ${sc.cls}`} style={{ fontSize: '.73rem' }}>
                            <i className={`fas ${sc.icon} me-1`}></i>{d.status_display}
                          </span>
                        </div>
                        <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '.82rem', color: '#777' }}>
                          <span>
                            <i className="fas fa-tag me-1 text-primary opacity-75"></i>
                            {d.type_evenement_display}
                            {d.type_evenement === 'autre' && d.type_evenement_libre && (
                              <span className="ms-1 text-dark">— {d.type_evenement_libre}</span>
                            )}
                          </span>
                          <span><i className="fas fa-map-marker-alt me-1 text-danger opacity-75"></i>{d.lieu_details}</span>
                          <span><i className="fas fa-calendar me-1 text-success opacity-75"></i>{fmt(d.date_debut)} → {fmt(d.date_fin)}</span>
                          <span><i className="fas fa-users me-1 text-info opacity-75"></i>{d.nombre_participants} participants</span>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-muted`} style={{ marginTop: 4 }}></i>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-top" style={{ background: '#fafbfc' }}>
                        <div className="row g-3 mt-2">
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Lieu</div>
                            <div>{d.lieu_type_display} — {d.lieu_details}</div>
                          </div>
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Horaires</div>
                            <div>{d.heure_debut?.slice(0, 5)} → {d.heure_fin?.slice(0, 5)}</div>
                          </div>
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Date de soumission</div>
                            <div>{fmt(d.created_at)}</div>
                          </div>
                          {/* Changes requested alert */}
                          {d.status === 'changes_requested' && (
                            <div className="col-12">
                              <div className="p-3 rounded-3 d-flex gap-2 align-items-start"
                                style={{ background: '#fff8e1', border: '2px solid #f9a825', fontSize: '.88rem' }}>
                                <i className="fas fa-edit mt-1" style={{ color: '#f57f17' }}></i>
                                <div>
                                  <strong style={{ color: '#e65100' }}>L'agent vous demande des modifications</strong>
                                  <p className="mb-0 mt-1 text-muted small">
                                    Veuillez consulter le commentaire ci-dessous et soumettre une nouvelle demande avec les corrections demandées.
                                    <br />يطلب منكم العون إجراء تعديلات. يرجى الاطلاع على التعليق أدناه وإعادة تقديم الطلب.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {d.commentaire_agent && (
                            <div className="col-12">
                              <div className="text-muted small text-uppercase fw-bold mb-1">Commentaire de l'agent</div>
                              <div className="p-3 rounded-3 border" style={{ background: '#fff', fontSize: '.88rem' }}>
                                <i className="fas fa-comment-dots me-2 text-primary"></i>{d.commentaire_agent}
                              </div>
                            </div>
                          )}
                          <div className="col-12">
                            {d.autorisation_signee ? (
                              <a href={resolveBackendUrl(d.autorisation_signee)} target="_blank" rel="noopener noreferrer"
                                className="btn btn-success rounded-pill px-4 shadow-sm">
                                <i className="fas fa-download me-2"></i>Télécharger l'autorisation
                              </a>
                            ) : d.status === 'approved' ? (
                              <span className="text-muted small"><i className="fas fa-hourglass-half me-1"></i>Document en cours de préparation...</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
