import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'

type DemandeLivret = {
  id: number
  nom_chef_famille: string
  prenom_chef_famille: string
  cin_epoux?: string | null
  cin_epouse?: string | null
  citizen_name?: string
  status: 'pending' | 'approved' | 'rejected' | 'ready' | string
  motif_demande: string
  created_at: string

  guichet_recuperation?: string | null
  is_paid?: boolean
}



type DemandeDetails = DemandeLivret & {
  photo_chef_famille?: string | null
  extrait_mariage?: string | null
  extrait_naissance_epoux1?: string | null
  extrait_naissance_epoux2?: string | null
  extraits_enfants?: string | null
  commentaire_agent?: string | null
}

export default function MunicipaliteLivretPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [demandes, setDemandes] = useState<DemandeLivret[] | null>(null)
  const [currentId, setCurrentId] = useState<number | null>(null)

  const [modalBodyHtml, setModalBodyHtml] = useState<string>('')
  const [modalStatus, setModalStatus] = useState<DemandeDetails['status'] | null>(null)
  const [guichetInput, setGuichetInput] = useState<string>('01')

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    ;(async () => {
      try {
        const response = await fetch('/livret-famille/demandes/', {
          headers: { Authorization: `Bearer ${access}` },
        })

        if (!response.ok) throw new Error('Failed to fetch demandes')
        const data = (await response.json()) as DemandeLivret[]
        setDemandes(data)
      } catch (e) {
        console.error(e)
        setDemandes([])
      }
    })()
  }, [navigate, lang])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  async function fetchDetails(id: number) {
    const access = getAccessToken()
    if (!access) return

    setCurrentId(id)
    setModalStatus(null)
    setModalBodyHtml('<div class="text-center"><div class="spinner-border text-primary"></div></div>')

    const modalEl = document.getElementById('detailsModal')
    if (window.bootstrap?.Modal && modalEl) {
      const instance = window.bootstrap.Modal.getOrCreateInstance(modalEl)
      instance.show()
    }

    try {
        const response = await fetch(`/livret-famille/demandes/${id}/`, {
          headers: { Authorization: `Bearer ${access}` },
        })

        const data = (await response.json()) as DemandeDetails

        const filesHtml = [
          { label: 'Extrait Mariage', url: data.extrait_mariage },
          { label: 'Naissance Époux 1', url: data.extrait_naissance_epoux1 },
          { label: 'Naissance Époux 2', url: data.extrait_naissance_epoux2 },
          { label: 'Extraits Enfants', url: data.extraits_enfants },
        ].map(f => f.url ? `
          <div class="mb-2">
            <a href="${resolveBackendUrl(f.url)}" target="_blank" class="btn btn-sm btn-outline-primary w-100">
              <i class="fas fa-file-pdf me-2"></i>Voir ${f.label}
            </a>
          </div>
        ` : '').join('')

        const html = `
          <div class="row">
            <div class="col-md-6 border-end">
              <h6 class="fw-bold text-primary mb-3">Informations de la famille</h6>
              <p class="mb-1"><strong>Chef de famille:</strong> ${data.prenom_chef_famille} ${data.nom_chef_famille}</p>
              <p class="mb-1"><strong>Motif:</strong> ${data.motif_demande}</p>
              <p class="mb-1"><strong>Date Demande:</strong> ${new Date(data.created_at).toLocaleString()}</p>
              <hr>
              <p class="mb-1"><strong>CIN Époux:</strong> ${data.cin_epoux || '-'}</p>
              <p class="mb-1"><strong>CIN Épouse:</strong> ${data.cin_epouse || '-'}</p>
              <p class="mb-1"><strong>Statut Actuel:</strong> <span class="badge bg-secondary">${data.status}</span></p>
              <p class="mb-1"><strong>Paiement:</strong> ${data.is_paid ? '<span class="badge bg-success">PAYÉ</span>' : '<span class="badge bg-danger">NON PAYÉ</span>'}</p>
            </div>
            <div class="col-md-6">
              <h6 class="fw-bold text-primary mb-3">Documents Justificatifs</h6>
              ${filesHtml || '<div class="alert alert-warning">Aucun document fourni</div>'}
              ${data.photo_chef_famille ? `
                <div class="mt-3 text-center">
                  <div class="small fw-bold mb-1">Photo du chef</div>
                  <img src="${resolveBackendUrl(data.photo_chef_famille)}" class="img-thumbnail" style="max-height: 120px;">
                </div>
              ` : ''}
            </div>
          </div>
        `

        setModalBodyHtml(html)
        setModalStatus(data.status)
        if (data.guichet_recuperation) setGuichetInput(data.guichet_recuperation)
    } catch (err) {
        setModalBodyHtml('<div class="alert alert-danger">Erreur de chargement</div>')
    }
  }

  async function updateStatus(newStatus: string) {
    if (!currentId) return

    const access = getAccessToken()
    if (!access) return

    const body: any = { status: newStatus }
    if (newStatus === 'ready') {
        body.guichet_recuperation = guichetInput
    }

    const res = await fetch(`/livret-famille/demandes/${currentId}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const modalEl = document.getElementById('detailsModal')
      if (window.bootstrap?.Modal && modalEl) {
          const instance = window.bootstrap.Modal.getOrCreateInstance(modalEl)
          instance.hide()
      }

      // Refresh list
      const response = await fetch('/livret-famille/demandes/', {
        headers: { Authorization: `Bearer ${access}` },
      })

      if (response.ok) {
        const data = (await response.json()) as DemandeLivret[]
        setDemandes(data)
      }
      window.alert('Statut mis à jour avec succès !')
    } else {
        window.alert('Erreur lors de la mise à jour.')
    }
  }

  return (
    <div className="bg-light min-vh-100">
      <style>{`
        .arabic-font { font-family: 'Cairo', sans-serif; }
        .table-responsive { border-radius: 10px; background: white; padding: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .status-ready { background-color: #d1e7dd; color: #0f5132; }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <span className="navbar-brand">
            <i className="fas fa-building-columns me-2" />
            Administration Kélibia
          </span>
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-light btn-sm ms-3" onClick={logout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5 pb-5">
        <div className="row mb-4">
          <div className="col-md-12 text-start">
             <button className="btn btn-sm btn-secondary mb-3" onClick={() => navigate('/agent-dashboard')}>
                <i className="fas fa-arrow-left me-2"></i>Retour Dashboard
             </button>
            <h2 className="fw-bold"><i className="fas fa-book-open me-2 text-primary"></i>Gestion des Livrets de Famille</h2>
            <p className="text-muted">Validation des dossiers et notification de retrait aux citoyens.</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Demandeur</th>
                <th>Chef de Famille</th>
                <th>Motif</th>
                <th>Date</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>

            </thead>
            <tbody>
              {demandes === null ? (
                <tr>
                  <td colSpan={6} className="text-center p-5">
                    <div className="spinner-border text-primary" role="status" />
                  </td>
                </tr>
              ) : demandes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-5 text-muted">
                    Aucune demande de livret trouvée.
                  </td>
                </tr>
              ) : (
                demandes.map((item) => (
                  <tr key={item.id}>
                    <td>{item.citizen_name || `Utilisateur #${item.id}`}</td>
                    <td>
                      <div className="fw-bold">{item.prenom_chef_famille} ${item.nom_chef_famille}</div>
                      <div className="small text-muted">CIN: ${item.cin_epoux || item.cin_epouse || '-'}</div>
                    </td>
                    <td><span className="badge bg-light text-dark">${item.motif_demande}</span></td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      {item.is_paid ? (
                        <span className="badge bg-success"><i className="fas fa-check me-1"></i> Reçu</span>
                      ) : (
                        <span className="badge bg-danger"><i className="fas fa-times me-1"></i> En attente</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-${item.status === 'ready' ? 'success' : item.status === 'pending' ? 'warning' : item.status === 'in_progress' ? 'primary' : 'secondary'}`}>
                        {item.status === 'ready' ? 'Prêt pour retrait' : item.status === 'in_progress' ? 'En cours' : item.status}
                      </span>
                    </td>

                    <td>
                      <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={() => fetchDetails(item.id)}>
                        <i className="fas fa-tasks me-1"></i> Gérer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <div className="modal fade" id="detailsModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Gestion de la demande #${currentId}</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body p-4" dangerouslySetInnerHTML={{ __html: modalBodyHtml }} />
            
            <div className="modal-footer bg-light flex-column align-items-stretch">
              
              {(!modalStatus || modalStatus === 'pending' || modalStatus === 'in_progress' || modalStatus === 'approved') ? (
                <div className="p-3 border rounded mb-3 bg-white shadow-sm">
                   <h6 className="fw-bold mb-3"><i className="fas fa-bell me-2 text-warning"></i>Étape Finale : Validation et Notification</h6>
                   
                   {!demandes?.find(d => d.id === currentId)?.is_paid && (
                     <div className="alert alert-danger py-2 small mb-3">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        <strong>Attention :</strong> Le paiement n'a pas encore été confirmé par le citoyen.
                     </div>
                   )}

                   <div className="row align-items-center">

                      <div className="col-md-7">
                        <p className="small text-muted mb-0">Indiquez le numéro du guichet où le citoyen pourra récupérer son livret physique.</p>
                      </div>
                      <div className="col-md-5">
                        <div className="input-group">
                           <span className="input-group-text bg-light">Guichet n°</span>
                           <input type="text" className="form-control fw-bold" value={guichetInput} onChange={e => setGuichetInput(e.target.value)} placeholder="01" />
                        </div>
                      </div>
                   </div>
                   <div className="d-flex gap-2 mt-3 justify-content-end">
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => updateStatus('rejected')}>
                        <i className="fas fa-times me-1"></i> Rejeter le dossier
                      </button>
                      <button type="button" className="btn btn-success" onClick={() => updateStatus('ready')}>
                        <i className="fas fa-check-circle me-1"></i> Marquer comme Prêt & Notifier
                      </button>
                   </div>
                </div>
              ) : modalStatus === 'ready' ? (
                <div className="alert alert-success d-flex align-items-center">
                    <i className="fas fa-info-circle fa-lg me-3"></i>
                    <div>Le citoyen a été notifié que son livret est prêt au <strong>Guichet n°{guichetInput}</strong>.</div>
                </div>
              ) : null}

              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
