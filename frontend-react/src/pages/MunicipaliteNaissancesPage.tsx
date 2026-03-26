import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'

type Declaration = {
  id: number
  prenom_fr: string
  nom_fr: string
  prenom_ar: string
  nom_ar: string
  cin_pere?: string | null
  cin_mere?: string | null
  declarant: number
  created_at: string
  attachment?: string | null
  hospital_cert_number?: string | null
  status: 'pending' | 'validated' | 'rejected' | 'in_progress' | 'resolved' | string
}

type DeclarationDetails = Declaration & {
  date_naissance: string
  lieu_naissance_fr: string
  lieu_naissance_ar: string
  sexe: 'M' | 'F'
  commentaire?: string | null
}

export default function MunicipaliteNaissancesPage() {
  const { t, setLang, lang } = useI18n()
  const navigate = useNavigate()

  const [declarations, setDeclarations] = useState<Declaration[] | null>(null)
  const [currentDecId, setCurrentDecId] = useState<number | null>(null)

  const [modalBodyHtml, setModalBodyHtml] = useState<string>('')
  const [modalStatus, setModalStatus] = useState<DeclarationDetails['status'] | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) {
      navigate('/login')
      return
    }

    ;(async () => {
      try {
        const response = await fetch('/extrait-naissance/api/declaration/', {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (!response.ok) throw new Error('Failed to fetch declarations')
        const data = (await response.json()) as Declaration[]
        setDeclarations(data)
      } catch (e) {
        console.error(e)
        setDeclarations([])
      }
    })()
  }, [navigate, lang])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  function statusBadgeText(status: Declaration['status']) {
    return t(`status_${status}`)
  }

  async function fetchDetails(id: number) {
    const access = getAccessToken()
    if (!access) return

    setCurrentDecId(id)
    setModalStatus(null)
    setModalBodyHtml('<div class="text-center"><div class="spinner-border text-primary"></div></div>')

    const modalEl = document.getElementById('detailsModal')
    if (window.bootstrap?.Modal && modalEl) {
      const instance = window.bootstrap.Modal.getOrCreateInstance(modalEl)
      instance.show()
    }

    const response = await fetch(`/extrait-naissance/api/declaration/${id}/`, {
      headers: { Authorization: `Bearer ${access}` },
    })
    const data = (await response.json()) as DeclarationDetails

    const sexeText = data.sexe === 'M' ? 'Masculin' : 'Féminin'
    const attachmentHtml = data.attachment
      ? `<img src="${resolveBackendUrl(data.attachment)}" class="img-fluid rounded shadow-sm border" style="max-height: 300px;">`
      : data.hospital_cert_number
        ? `<div class="p-4 bg-light rounded border text-success">
            <i class="fas fa-check-circle fa-3x mb-3"></i>
            <br>Certificat Hospitalier Vérifié Numériquement<br><strong>${data.hospital_cert_number}</strong>
          </div>`
        : '<div class="alert alert-warning">Aucun document fourni</div>'

    const html = `
      <div class="row">
        <div class="col-md-6 border-end">
          <h6 class="fw-bold text-primary mb-3">Informations de naissance</h6>
          <p class="mb-1"><strong>Nom:</strong> ${data.prenom_fr} ${data.nom_fr}</p>
          <p class="mb-1"><strong>الاسم:</strong> ${data.prenom_ar} ${data.nom_ar}</p>
          <p class="mb-1"><strong>Date:</strong> ${new Date(data.date_naissance).toLocaleString()}</p>
          <p class="mb-1"><strong>Lieu:</strong> ${data.lieu_naissance_fr}</p>
          <p class="mb-1"><strong>Sexe:</strong> ${sexeText}</p>
          <hr>
          <p class="mb-1"><strong>CIN Père:</strong> ${data.cin_pere || '-'}</p>
          <p class="mb-1"><strong>CIN Mère:</strong> ${data.cin_mere || '-'}</p>
        </div>
        <div class="col-md-6 text-center">
          <h6 class="fw-bold text-primary mb-3">Pièce Justificative (Scan)</h6>
          ${attachmentHtml}
        </div>
      </div>
      <div class="mt-4 p-3 bg-light rounded">
        <h6 class="fw-bold">Observations du déclarant:</h6>
        <p class="mb-0 text-muted italic">"${data.commentaire || 'Aucune observation'}"</p>
      </div>
    `

    setModalBodyHtml(html)
    setModalStatus(data.status)
  }

  async function updateStatus(newStatus: 'validated' | 'rejected') {
    if (!currentDecId) return

    const confirmText =
      newStatus === 'validated'
        ? 'Voulez-vous vraiment valider cette déclaration ?'
        : 'Voulez-vous vraiment rejeter cette déclaration ?'

    if (!window.confirm(confirmText)) return

    const access = getAccessToken()
    if (!access) return

    const res = await fetch(`/extrait-naissance/api/declaration/${currentDecId}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    })

    if (res.ok) {
      const modalEl = document.getElementById('detailsModal')
      const instance = modalEl
        ? window.bootstrap?.Modal?.getInstance?.(modalEl) ?? null
        : null
      instance?.hide()

      // Refresh list
      const response = await fetch('/extrait-naissance/api/declaration/', {
        headers: { Authorization: `Bearer ${access}` },
      })
      if (response.ok) {
        const data = (await response.json()) as Declaration[]
        setDeclarations(data)
      }
      window.alert('Statut mis à jour avec succès !')
    }
  }

  return (
    <div className="bg-light">
      <style>{`
        .arabic-font { font-family: 'Cairo', sans-serif; }
        .section-title { border-left: 4px solid #0d6efd; padding-left: 10px; margin-bottom: 20px; }
        [dir="rtl"] .section-title { border-left: none; border-right: 4px solid #0d6efd; padding-left: 0; padding-right: 10px; }
        .table-responsive { border-radius: 10px; background: white; padding: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <span className="navbar-brand">
            <i className="fas fa-building-columns me-2" />
            Administration Kélibia
          </span>
          <div className="d-flex align-items-center">
            <span className="text-light me-3 small">
              <i className="fas fa-user-shield me-2" />
              Espace Agent
            </span>
            <div className="btn-group" role="group">
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('fr')}
              >
                FR
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('ar')}
              >
                AR
              </button>
            </div>
            <button className="btn btn-outline-light btn-sm ms-3" onClick={logout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row mb-4">
          <div className="col-md-12">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/agent-dashboard'); }}>
                    Tableau de bord
                  </a>
                </li>
                <li className="breadcrumb-item active">
                  {t('agent_birth_decl')}
                </li>
              </ol>
            </nav>
            <h2 className="fw-bold">{t('agent_birth_decl')}</h2>
            <p className="text-muted">{t('agent_birth_desc')}</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>{t('newborn_info')}</th>
                <th>{t('profile') + ' / ' + 'Declarant'}</th>
                <th>{t('estimated_time')}</th>
                <th>{t('attachment_scan')}</th>
                <th>{t('gender') + ' / ' + 'Statut'}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="declarationsList">
              {declarations === null ? (
                <tr>
                  <td colSpan={6} className="text-center p-5">
                    <div className="spinner-border text-primary" role="status" />
                    <div className="mt-2" style={{ color: '#6c757d' }}>
                      {t('loading')}
                    </div>
                  </td>
                </tr>
              ) : declarations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-5 text-muted">
                    Aucune déclaration trouvée.
                  </td>
                </tr>
              ) : (
                declarations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fw-bold">
                        {item.prenom_fr} {item.nom_fr}
                      </div>
                      <div className="small text-muted arabic-font">
                        {item.prenom_ar} {item.nom_ar}
                      </div>
                    </td>
                    <td>
                      <div className="small fw-bold">
                        CIN: {item.cin_pere || item.cin_mere}
                      </div>
                      <div className="small text-muted">Auteur: User ID {item.declarant}</div>
                    </td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>
                      {item.attachment ? (
                        <a
                          href={`http://127.0.0.1:8000${item.attachment}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-info"
                        >
                          <i className="fas fa-file-image me-1" />
                          Voir
                        </a>
                      ) : item.hospital_cert_number ? (
                        <span className="badge bg-success-subtle text-success border border-success">
                          <i className="fas fa-hospital me-1" />
                          Lié: {item.hospital_cert_number}
                        </span>
                      ) : (
                        <span className="text-muted small">Aucun doc</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge bg-${item.status}`}>
                        {statusBadgeText(item.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => fetchDetails(item.id)}
                      >
                        <i className="fas fa-eye" />
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
              <h5 className="modal-title fw-bold">{t('view_details')}</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body p-4" id="modalBody" dangerouslySetInnerHTML={{ __html: modalBodyHtml }} />
            <div className="modal-footer bg-light" id="modalFooter">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                {t('close')}
              </button>
              {modalStatus === 'pending' ? (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => updateStatus('rejected')}
                  >
                    <i className="fas fa-times me-2" />
                    <span>{t('reject')}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => updateStatus('validated')}
                  >
                    <i className="fas fa-check me-2" />
                    <span>{t('validate')}</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

