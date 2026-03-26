import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'

type Extrait = {
  n_etat_civil: string | number
  nom_complet_fr: string
  nom_complet_ar: string
  date_naissance: string
  url_fr: string
  url_ar: string
}

type MesExtraitsResponse = {
  mon_extrait?: Extrait | null
  conjoints?: Extrait[]
  enfants?: Extrait[]
}

export default function MesExtraitsPage() {
  const { setLang, lang } = useI18n()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<MesExtraitsResponse | null>(null)

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
        const res = await fetch('/extrait-naissance/api/mes-extraits/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('db error')
        const json = (await res.json()) as MesExtraitsResponse
        setData(json)
      } catch (e) {
        console.error(e)
        setError("Erreur de connexion avec la base de données.")
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate, lang])

  function logout() {
    clearTokens()
    navigate('/login')
  }

  function card(extrait: Extrait) {
    const nomComplet = lang === 'ar' ? extrait.nom_complet_ar : extrait.nom_complet_fr
    return (
      <div className="col-md-6 col-lg-4 mb-4" key={`${extrait.n_etat_civil}`}>
        <div className="card shadow-sm h-100 border-primary" style={{ borderWidth: 2 }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <i className="fas fa-file-contract fa-2x text-primary opacity-50" />
              <span className="badge bg-primary rounded-pill">N° {extrait.n_etat_civil}</span>
            </div>
            <h5 className="card-title fw-bold">{nomComplet}</h5>
            <p className="card-text text-muted mb-4">
              <i className="fas fa-birthday-cake me-2" />
              {extrait.date_naissance}
            </p>
            <div className="d-flex gap-2">
              <a
                href={resolveBackendUrl(extrait.url_fr)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary flex-fill"
              >
                <i className="fas fa-print me-1" /> FR
              </a>
              <a
                href={resolveBackendUrl(extrait.url_ar)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary flex-fill arabic-font"
              >
                <i className="fas fa-print me-1" /> بالعربية
              </a>
            </div>
          </div>
        </div>
      </div>
    )
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
                <i className="fas fa-folder-open me-2" />
                Mes Extraits de Naissance
              </h2>
              <p className="text-muted">Extraction numérique immédiate connectée au registre d'État Civil.</p>
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
            <p className="mt-2 text-muted">Vérification de votre identité et recherche des actes en cours...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div>
            <h4 className="mb-3 border-bottom pb-2">Mon Extrait de Naissance</h4>
            <div className="row mb-5">
              {data?.mon_extrait ? (
                card(data.mon_extrait)
              ) : (
                <div className="col-12">
                  <div className="alert alert-secondary">
                    Aucun extrait de naissance correspondant à votre profil n'a été trouvé rattaché à votre compte.
                  </div>
                </div>
              )}
            </div>

            <h4 className="mb-3 border-bottom pb-2 mt-4">Extraits de mes enfants</h4>
            <div className="row">
              {data?.enfants && data.enfants.length > 0 ? (
                data.enfants.map((enf) => card(enf))
              ) : (
                <div className="col-12">
                  <div className="alert alert-secondary text-muted">
                    <i className="fas fa-info-circle me-2" />
                    Aucun acte de naissance d'enfant n'est rattaché à votre CIN.
                  </div>
                </div>
              )}
            </div>

            {data?.conjoints && data.conjoints.length > 0 ? (
              <div className="mt-4">
                <h4 className="mb-3 border-bottom pb-2">Extrait de mon conjoint</h4>
                <div className="row" id="conjointsList">
                  {data.conjoints.map((c) => card(c))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

