import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type Extrait = {
  id: number
  n_etat_civil: string | number

  nom_complet_fr: string
  nom_complet_ar: string
  date_naissance: string
  url_fr: string
  url_ar: string
  is_paid: boolean
}


type MesExtraitsResponse = {
  mon_extrait?: Extrait | null
  conjoints?: Extrait[]
  enfants?: Extrait[]
}

export default function MesNaissancesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<MesExtraitsResponse | null>(null)
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean; has_active_asd: boolean } | null>(null)

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
        const userRes = await fetch(resolveBackendUrl('/api/accounts/me/'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        const res = await fetch(resolveBackendUrl('/extrait-naissance/api/mes-extraits/'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const errorData = (await res.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(errorData?.error || 'Impossible de trouver vos actes de naissance.')
        }
        const json = (await res.json()) as MesExtraitsResponse
        setData(json)
      } catch (e: any) {
        console.error(e)
        setError(e.message || "Erreur de connexion avec la base de données.")
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
              {/* Debug: console.log('Extrait:', extrait.nom_complet_fr, 'Paid:', extrait.is_paid, 'ASD:', user?.has_active_asd) */}
              {(!extrait.is_paid && !user?.has_active_asd) ? (
                <button
                  className="btn btn-warning w-100 rounded-pill fw-bold animate__animated animate__pulse animate__infinite shadow-sm"
                  onClick={() => navigate(`/paiement?amount=0.500&reason=Extrait+de+Naissance&requestId=${extrait.id}&requestType=birth_extract&target=/mes-naissances&file_fr=${encodeURIComponent(resolveBackendUrl(extrait.url_fr))}&file_ar=${encodeURIComponent(resolveBackendUrl(extrait.url_ar))}`)}
                >
                  <i className="fas fa-lock me-2"></i> {t('pay_2dt') || 'Payer 0.500 DT'}
                </button>
              ) : (
                <>
                  <a
                    href={resolveBackendUrl(extrait.url_fr)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-primary flex-fill"
                  >
                    <i className="fas fa-print me-1" /> {lang === 'ar' ? 'الفرنسية' : 'FR'}
                  </a>
                  <a
                    href={resolveBackendUrl(extrait.url_ar)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary flex-fill arabic-font"
                  >
                    <i className="fas fa-print me-1" /> {t('version_ar')}
                  </a>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      user={user}
      onLogout={logout}
      breadcrumbs={[{ label: t('birth_extracts') }]}
    >
      <div className={`row mb-4 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="col d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold section-title">
              <i className="fas fa-baby me-2" />
              {t('birth_extracts')}
            </h2>
            <p className="text-muted">{t('extraction_desc')}</p>
          </div>
          <Link to="/services" className="btn btn-outline-secondary">
            <i className={`fas ${lang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'} me-2`} />
            {t('back_to_services') || 'Retour aux services'}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">{t('loading_identity')}</p>
        </div>
      ) : !user?.is_verified ? (
        <div className={`alert alert-warning border-0 shadow-sm p-4 d-flex align-items-center ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ borderRadius: '15px' }}>
          <i className={`fas fa-exclamation-triangle fa-2x ${lang === 'ar' ? 'ms-3' : 'me-3'} text-warning`}></i>
          <div>
            <h5 className="fw-bold mb-1">{t('unverified_title')}</h5>
            <p className="mb-0">{t('account_verification_required')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className={lang === 'ar' ? 'font-arabic text-end' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <h4 className="mb-3 border-bottom pb-2">{t('my_birth_extract') || 'Mon Extrait de Naissance'}</h4>
          <div className="row mb-5">
            {data?.mon_extrait ? (
              card(data.mon_extrait)
            ) : (
              <div className="col-12">
                <div className="alert alert-secondary">
                  {t('no_birth_extract_found')}
                </div>
              </div>
            )}
          </div>

          <h4 className="mb-3 border-bottom pb-2 mt-4">{t('my_children_extracts')}</h4>
          <div className="row">
            {data?.enfants && data.enfants.length > 0 ? (
              data.enfants.map((enf) => card(enf))
            ) : (
              <div className="col-12">
                <div className="alert alert-secondary text-muted">
                  <i className="fas fa-info-circle me-2" />
                  {t('no_child_birth_extract_found')}
                </div>
              </div>
            )}
          </div>

          {data?.conjoints && data.conjoints.length > 0 ? (
            <div className="mt-4">
              <h4 className="mb-3 border-bottom pb-2">{t('my_spouse_extracts')}</h4>
              <div className="row" id="conjointsList">
                {data.conjoints.map((c) => card(c))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </MainLayout>
  )
}

