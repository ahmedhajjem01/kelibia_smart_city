import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

type ActeMariage = {
  id: number
  numero_registre: string | number
  annee_acte: string | number
  conjoint_fr: string
  conjoint_ar: string
  date_mariage: string
  url_fr: string
  url_ar: string
  is_paid: boolean
}

type DemandeMariage = {
  id: number
  type_contrat: string
  lieu_mariage: string
  nom_epoux: string
  nom_epouse: string
  date_souhaitee: string
  status: string
  commentaire_agent: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; label_fr: string; label_ar: string }> = {
  pending:    { bg: '#fff8e1', color: '#f57f17', label_fr: 'En attente',     label_ar: 'قيد الانتظار' },
  en_attente: { bg: '#fff8e1', color: '#f57f17', label_fr: 'En attente',     label_ar: 'قيد الانتظار' },
  soumis:     { bg: '#fff8e1', color: '#f57f17', label_fr: 'Soumis',         label_ar: 'مُقدَّم' },
  instruction:{ bg: '#e3f2fd', color: '#0d47a1', label_fr: 'En instruction', label_ar: 'قيد الدراسة' },
  signed:     { bg: '#e8f5e9', color: '#2e7d32', label_fr: 'Signé',          label_ar: 'موقّع' },
  approved:   { bg: '#e8f5e9', color: '#2e7d32', label_fr: 'Approuvé',       label_ar: 'مقبول' },
  rejected:   { bg: '#fce4ec', color: '#c62828', label_fr: 'Rejeté',         label_ar: 'مرفوض' },
}

function getStatusCfg(status: string, lang: string) {
  const cfg = STATUS_CONFIG[status] ?? { bg: '#f5f5f5', color: '#616161', label_fr: status, label_ar: status }
  return { ...cfg, label: lang === 'ar' ? cfg.label_ar : cfg.label_fr }
}

export default function MesMariagesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mariages, setMariages] = useState<ActeMariage[]>([])
  const [demandes, setDemandes] = useState<DemandeMariage[]>([])
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
        const [userRes, extraitsRes] = await Promise.all([
          fetch(resolveBackendUrl('/api/accounts/me/'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(resolveBackendUrl('/extrait-mariage/extraits/'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (userRes.ok) {
          setUser(await userRes.json())
        }

        if (extraitsRes.ok) {
          const json = (await extraitsRes.json()) as ActeMariage[]
          setMariages(json)
        }

      } catch (e: any) {
        console.error(e)
        setError(e.message || 'Erreur de connexion avec la base de données.')
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
      breadcrumbs={[{ label: t('marriage_acts_title') }]}
    >
      <div className={`row mb-4 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="col d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold section-title">
              <i className="fas fa-ring me-2" />
              {t('marriage_acts_title')}
            </h2>
            <p className="text-muted">
              {t('extraction_desc')}
            </p>
          </div>
          <Link to="/services" className="btn btn-outline-secondary">
            <i className={`fas ${lang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'} me-2`} />
            {t('back_to_services')}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">{t('loading')}</p>
        </div>
      ) : !user?.is_verified ? (
        <div
          className={`alert alert-warning border-0 shadow-sm p-4 d-flex align-items-center ${lang === 'ar' ? 'font-arabic' : ''}`}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          style={{ borderRadius: '15px' }}
        >
          <i className={`fas fa-exclamation-triangle fa-2x ${lang === 'ar' ? 'ms-3' : 'me-3'} text-warning`} />
          <div>
            <h5 className="fw-bold mb-1">{t('unverified_title')}</h5>
            <p className="mb-0">{t('account_verification_required')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className={lang === 'ar' ? 'font-arabic text-end' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>


          {/* ── Actes de mariage signés ── */}
          <h4 className="mb-3 border-bottom pb-2">
            <i className="fas fa-ring me-2" style={{ color: '#c61f2c' }} />
            {t('marriage_acts_title')}
          </h4>

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
                            {t('id_label') || 'Acte N°'} {m.numero_registre} / {m.annee_acte}
                          </span>
                        </div>
                        <h5 className="card-title fw-bold">{label}</h5>
                        <p className="card-text text-muted mb-4">
                          <i className="fas fa-calendar-alt me-2" />
                          {m.date_mariage}
                        </p>
                        <div className="d-flex gap-2">
                          {(!m.is_paid && !user?.has_active_asd) ? (
                            <div className="d-flex flex-column gap-2 w-100">
                              <small
                                className="text-warning fw-bold text-center p-1 rounded"
                                style={{ fontSize: '0.7rem', background: '#fff8e1', border: '1px solid #ffd54f' }}
                              >
                                {t('payment_required_msg')}
                              </small>
                              <button
                                className="btn btn-warning w-100 rounded-pill fw-bold animate__animated animate__pulse animate__infinite shadow-sm"
                                onClick={() =>
                                  navigate(
                                    `/paiement?amount=0.500&reason=Extrait+de+Mariage&requestId=${m.id}&requestType=marriage_extract&target=/mes-mariages&file_fr=${encodeURIComponent(resolveBackendUrl(m.url_fr))}&file_ar=${encodeURIComponent(resolveBackendUrl(m.url_ar))}`
                                  )
                                }
                              >
                                <i className="fas fa-lock me-2" /> {t('pay_2dt') || 'Payer 0.500 DT'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <a
                                href={`${resolveBackendUrl(m.url_fr)}?token=${getAccessToken()}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-warning flex-fill fw-bold"
                              >
                                <i className="fas fa-print me-1" />{' '}
                                {lang === 'ar' ? 'الفرنسية' : 'Version Française'}
                              </a>
                              <a
                                href={`${resolveBackendUrl(m.url_ar)}?token=${getAccessToken()}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline-warning flex-fill arabic-font fw-bold"
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
              })}
            </div>
          ) : (
            <div className="alert alert-secondary text-muted">
              {t('no_marriage_act_found')}
            </div>
          )}
        </div>
      )}
    </MainLayout>
  )
}
