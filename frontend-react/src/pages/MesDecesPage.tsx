import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'

type ActeDeces = {
  numero_registre: string | number
  annee_acte: string | number
  nom_complet_fr: string
  nom_complet_ar: string
  date_deces: string
  url_fr: string
  url_ar: string
}

export default function MesDecesPage() {
  const { setLang, lang } = useI18n()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actes, setActes] = useState<ActeDeces[]>([])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const res = await fetch(resolveBackendUrl('/extrait-deces/api/mes-deces/'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const errorData = (await res.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(errorData?.error || 'Impossible de trouver les actes de décès.')
        }
        const json = (await res.json()) as { deces: ActeDeces[] }
        setActes(json.deces || [])
      } catch (e) {
        console.error(e)
        setError('Erreur de connexion avec la base de données.')
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate, lang])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <a className="navbar-brand" href="#" data-i18n="home">
            <i className="fas fa-city me-2" />
            Kelibia Smart City
          </a>

          <div className="d-flex align-items-center">
            <div className="btn-group me-3" role="group">
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('fr')}
                title="Français"
              >
                <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setLang('ar')}
                title="العربية"
              >
                <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
              </button>
            </div>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row mb-4">
          <div className="col d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-primary">
                <i className="fas fa-file-invoice me-2" />
                Mes Actes de Décès (Famille)
              </h2>
              <p className="text-muted">
                Extraction numérique immédiate des actes de décès des membres rattachés à votre profil.
              </p>
            </div>
            <Link to="/services" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2" />
              Retour aux services
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Recherche des actes de décès en cours...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row">
            {actes.length > 0 ? (
              actes.map((d) => {
                const nomComplet = lang === 'ar' ? d.nom_complet_ar : d.nom_complet_fr
                return (
                  <div key={`${d.numero_registre}-${d.annee_acte}`} className="col-md-6 col-lg-4 mb-4">
                    <div className="card shadow-sm h-100 border-dark" style={{ borderWidth: 2 }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <i className="fas fa-file-invoice fa-2x text-dark opacity-50" />
                          <span className="badge bg-dark rounded-pill">
                            Acte N° {d.numero_registre} / {d.annee_acte}
                          </span>
                        </div>
                        <h5 className="card-title fw-bold">{nomComplet}</h5>
                        <p className="card-text text-muted mb-4">
                          <i className="fas fa-calendar-times me-2" />
                          {d.date_deces}
                        </p>
                        <div className="d-flex gap-2">
                          <a
                            href={resolveBackendUrl(d.url_fr)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-dark flex-fill fw-bold"
                          >
                            <i className="fas fa-print me-1" /> Version FR
                          </a>
                          <a
                            href={resolveBackendUrl(d.url_ar)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-dark flex-fill arabic-font fw-bold"
                          >
                            <i className="fas fa-print me-1" /> النسخة العربية
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-12">
                <div className="alert alert-secondary text-muted">
                  <i className="fas fa-info-circle me-2" />
                  Aucun acte de décès trouvé pour votre famille.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

