import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type Demande = {
  id: number
  type_travaux: string
  type_travaux_display: string
  type_travaux_libre: string | null
  usage_batiment_display: string
  adresse_terrain: string
  numero_parcelle: string
  surface_terrain: number
  surface_construite: number
  nombre_etages: number
  date_debut_prevue: string
  duree_travaux_mois: number
  cout_estime: string | null
  nom_proprietaire: string
  nom_entrepreneur: string
  status: string
  status_display: string
  priorite: string
  priorite_display: string
  is_high_risk: boolean
  commentaire_agent: string
  permis_signe: string | null
  is_paid: boolean
  created_at: string
  updated_at: string
}

type UserInfo = { first_name: string; last_name: string; email: string; is_verified: boolean }

const STATUS_CONFIG: Record<string, { cls: string; icon: string }> = {
  pending:              { cls: 'bg-primary text-white',  icon: 'fa-clock' },
  en_cours_instruction: { cls: 'bg-warning text-dark',   icon: 'fa-search' },
  favorable:            { cls: 'bg-info text-white',     icon: 'fa-thumbs-up' },
  defavorable:          { cls: 'bg-danger text-white',   icon: 'fa-thumbs-down' },
  changes_requested:    { cls: 'bg-warning text-dark',   icon: 'fa-edit' },
  permis_delivre:       { cls: 'bg-success text-white',  icon: 'fa-award' },
  rejet_definitif:      { cls: 'bg-dark text-white',     icon: 'fa-ban' },
}

const TYPE_EMOJI: Record<string, string> = {
  construction_neuve: '🏗️',
  renovation:         '🔨',
  extension:          '📐',
  demolition:         '🏚️',
  cloture:            '🪨',
  piscine:            '🏊',
  panneau_solaire:    '☀️',
  ravalement:         '🎨',
  autre:              '📋',
}

export default function MesConstructionsPage() {
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    const fetchAll = async () => {
      try {
        const [userRes, demandesRes] = await Promise.all([
          fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/construction/demandes/'), { headers: { Authorization: `Bearer ${access}` } }),
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

  const fmt = (d: string) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: 'Mes permis de construire' }]}>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-primary m-0" style={{ fontSize: '1.2rem' }}>
            <i className="fas fa-hard-hat me-2"></i>Mes Permis de Construire
          </h2>
          <p className="text-muted small mb-0">طلبات رخصة البناء</p>
        </div>
        <Link to="/demande-construction" className="btn btn-primary rounded-pill shadow-sm px-4">
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
              <i className="fas fa-hard-hat fa-3x text-muted opacity-25 mb-3 d-block"></i>
              <p className="text-muted mb-3">Aucune demande de permis trouvée.</p>
              <Link to="/demande-construction" className="btn btn-primary rounded-pill px-4">
                <i className="fas fa-plus me-2"></i>Soumettre une demande
              </Link>
            </div>
          ) : (
            <div className="p-3 p-md-4 d-flex flex-column gap-3">
              {demandes.map(d => {
                const sc = STATUS_CONFIG[d.status] || { cls: 'bg-secondary text-white', icon: 'fa-question' }
                const emoji = TYPE_EMOJI[d.type_travaux] || '🏗️'
                const isExpanded = expandedId === d.id
                return (
                  <div key={d.id} className="border-0 rounded-4 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

                    {d.is_high_risk && (
                      <div className="px-4 py-2 d-flex align-items-center gap-2"
                        style={{ background: '#fff3e0', borderBottom: '1px solid #ffcc02', fontSize: '.82rem', color: '#e65100' }}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <strong>Dossier haute priorité</strong> — Inspection technique sur site requise
                      </div>
                    )}

                    <div className="p-4 d-flex align-items-start gap-3 flex-wrap bg-white"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0d6efd,#6610f2)', fontSize: '1.4rem' }}>
                        {emoji}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span className="fw-bold" style={{ fontSize: '1rem', color: '#1a1a2e' }}>{d.type_travaux_display}</span>
                          {d.type_travaux === 'autre' && d.type_travaux_libre && (
                            <span className="text-muted small">— {d.type_travaux_libre}</span>
                          )}
                          <span className={`badge rounded-pill ${sc.cls}`} style={{ fontSize: '.72rem' }}>
                            <i className={`fas ${sc.icon} me-1`}></i>{d.status_display}
                          </span>
                          {d.priorite === 'haute' && (
                            <span className="badge bg-danger rounded-pill" style={{ fontSize: '.72rem' }}>
                              <i className="fas fa-exclamation-triangle me-1"></i>Haute priorité
                            </span>
                          )}
                          {d.is_paid && (
                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill" style={{ fontSize: '.7rem' }}>
                              <i className="fas fa-check-circle me-1"></i>Frais réglés
                            </span>
                          )}
                        </div>
                        <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '.82rem', color: '#777' }}>
                          <span><i className="fas fa-map-marker-alt me-1 text-primary opacity-75"></i>{d.adresse_terrain}</span>
                          <span><i className="fas fa-expand me-1 text-success opacity-75"></i>{d.surface_construite} m²</span>
                          <span><i className="fas fa-layer-group me-1 text-warning opacity-75"></i>{d.nombre_etages} étage{d.nombre_etages > 1 ? 's' : ''}</span>
                          <span><i className="fas fa-calendar me-1 text-info opacity-75"></i>{fmt(d.created_at)}</span>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-muted`} style={{ marginTop: 4 }}></i>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-top" style={{ background: '#fafbfc' }}>
                        <div className="row g-3 mt-2">
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Usage</div>
                            <div>{d.usage_batiment_display}</div>
                          </div>
                          {d.numero_parcelle && (
                            <div className="col-md-6">
                              <div className="text-muted small text-uppercase fw-bold mb-1">N° Parcelle</div>
                              <div>{d.numero_parcelle}</div>
                            </div>
                          )}
                          <div className="col-md-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Surface terrain</div>
                            <div>{d.surface_terrain} m²</div>
                          </div>
                          <div className="col-md-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Date début prévue</div>
                            <div>{fmt(d.date_debut_prevue)}</div>
                          </div>
                          <div className="col-md-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Durée travaux</div>
                            <div>{d.duree_travaux_mois} mois</div>
                          </div>
                          {d.cout_estime && (
                            <div className="col-md-6">
                              <div className="text-muted small text-uppercase fw-bold mb-1">Coût estimatif</div>
                              <div>{parseFloat(d.cout_estime).toLocaleString('fr-FR')} DT</div>
                            </div>
                          )}
                          {d.nom_entrepreneur && (
                            <div className="col-md-6">
                              <div className="text-muted small text-uppercase fw-bold mb-1">Entrepreneur</div>
                              <div>{d.nom_entrepreneur}</div>
                            </div>
                          )}
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Propriétaire</div>
                            <div>{d.nom_proprietaire}</div>
                          </div>
                          <div className="col-md-6">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Mis à jour</div>
                            <div>{fmt(d.updated_at)}</div>
                          </div>

                          {d.status === 'changes_requested' && (
                            <div className="col-12">
                              <div className="p-3 rounded-3 d-flex gap-2 align-items-start"
                                style={{ background: '#fff8e1', border: '2px solid #f9a825', fontSize: '.88rem' }}>
                                <i className="fas fa-edit mt-1" style={{ color: '#f57f17' }}></i>
                                <div>
                                  <strong style={{ color: '#e65100' }}>L'agent vous demande des modifications</strong>
                                  <p className="mb-0 mt-1 text-muted small">
                                    Veuillez consulter le commentaire ci-dessous et soumettre une nouvelle demande corrigée.
                                    <br />يطلب منكم العون إجراء تعديلات. يرجى الاطلاع على التعليق أدناه وإعادة تقديم الطلب.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {d.status === 'favorable' && (
                            <div className="col-12">
                              <div className="p-3 rounded-3 d-flex gap-2 align-items-start"
                                style={{ background: '#e3f9f5', border: '2px solid #20c997', fontSize: '.88rem' }}>
                                <i className="fas fa-thumbs-up mt-1 text-success"></i>
                                <div>
                                  <strong className="text-success">Avis favorable</strong>
                                  <p className="mb-0 mt-1 text-muted small">
                                    Votre dossier a reçu un avis favorable. Le permis officiel sera bientôt délivré.
                                    <br />تمّ إبداء رأي إيجابي. سيتم تسليم الرخصة قريباً.
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
                            {d.permis_signe ? (
                              <a href={resolveBackendUrl(d.permis_signe)} target="_blank" rel="noopener noreferrer"
                                className="btn btn-success rounded-pill px-4 shadow-sm">
                                <i className="fas fa-file-contract me-2"></i>Télécharger le permis signé
                              </a>
                            ) : d.status === 'permis_delivre' ? (
                              <span className="text-muted small">
                                <i className="fas fa-hourglass-half me-1"></i>Document en cours de préparation...
                              </span>
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
