import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type ActeMariage = {
  numero_registre: string | number
  annee_acte: string | number
  conjoint_fr: string
  conjoint_ar: string
  date_mariage: string
  url_fr: string
  url_ar: string
}

export default function MesMariagesPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mariages, setMariages] = useState<ActeMariage[]>([])
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

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
        // Fetch User Info
        const userRes = await fetch(resolveBackendUrl('/accounts/user/'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        const res = await fetch(resolveBackendUrl('/extrait-mariage/extraits/'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const errorData = (await res.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(errorData?.error || 'Impossible de trouver vos actes de mariage.')
        }
        const json = (await res.json()) as ActeMariage[]
        setMariages(json)
      } catch (e: any) {
        console.error(e)
        setError(e.message || 'Erreur de connexion avec la base de données.')
        setMariages([])
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
    <MainLayout
      user={user}
      onLogout={logout}
      breadcrumbs={[{ label: 'Mes Actes de Mariage' }]}
    >
      <div className="row mb-4">
        <div className="col d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold section-title">
              <i className="fas fa-ring me-2" />
              Mes Actes de Mariage
            </h2>
            <p className="text-muted">
              Extraction numérique immédiate connectée au registre d'État Civil.
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
          <p className="mt-2 text-muted">Recherche de vos actes de mariage en cours...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div>
          <h4 className="mb-3 border-bottom pb-2">Mes Actes de Mariage</h4>
          {mariages.length > 0 ? (
            <div className="row mb-5">
              {mariages.map((m) => {
                const conjoint = lang === 'ar' ? m.conjoint_ar : m.conjoint_fr
                const label =
                  lang === 'ar' ? `زواج مع ${conjoint}` : `Mariage avec ${conjoint}`
                return (
                  <div className="col-md-6 col-lg-4 mb-4" key={`${m.numero_registre}-${m.annee_acte}`}>
                    <div className="card shadow-sm h-100 border-warning" style={{ borderWidth: 2 }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <i className="fas fa-ring fa-2x text-warning opacity-50" />
                          <span className="badge bg-warning text-dark rounded-pill">
                            Acte N° {m.numero_registre} / {m.annee_acte}
                          </span>
                        </div>
                        <h5 className="card-title fw-bold">{label}</h5>
                        <p className="card-text text-muted mb-4">
                          <i className="fas fa-calendar-alt me-2" />
                          {m.date_mariage}
                        </p>
                        <div className="d-flex gap-2">
                          <a
                            href={resolveBackendUrl(m.url_fr)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-warning flex-fill fw-bold"
                          >
                            <i className="fas fa-print me-1" /> Version Française
                          </a>
                          <a
                            href={resolveBackendUrl(m.url_ar)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-warning flex-fill arabic-font fw-bold"
                          >
                            <i className="fas fa-print me-1" /> النسخة العربية
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="alert alert-secondary text-muted">
              Aucun acte de mariage trouvé pour votre profil.
            </div>
          )}
        </div>
      )}
    </MainLayout>
  )
}

