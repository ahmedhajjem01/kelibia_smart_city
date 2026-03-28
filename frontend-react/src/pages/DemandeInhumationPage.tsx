import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

interface Declaration {
  id: number
  defunt_detail: {
    prenom_fr: string
    nom_fr: string
    prenom_ar: string
    nom_ar: string
  }
  date_deces: string
}

export default function DemandeInhumationPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [availableDecls, setAvailableDecls] = useState<Declaration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch User Info
    fetch(resolveBackendUrl('/accounts/user/'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => data && setUser(data))
      .catch(console.error)

    fetch(resolveBackendUrl('/extrait-deces/api/inhumation/'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAvailableDecls(data.available_declarations || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const token = getAccessToken()
    if (!token) return

    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      declaration_deces: formData.get('declaration_deces'),
      cimetiere_fr: formData.get('cimetiere_fr'),
      cimetiere_ar: formData.get('cimetiere_ar'),
      date_souhaitee: formData.get('date_souhaitee')
    }

    try {
      const res = await fetch(resolveBackendUrl('/extrait-deces/api/inhumation/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const err = await res.json()
        setError(err.error || t('error_msg'))
      }
    } catch (err) {
      setError(t('error_msg'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-5 text-center">{t('loading')}</div>

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: t('req_inhumation') }]}
    >
      <div className={`container py-2 pb-5 ${lang === 'ar' ? 'text-end' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-header bg-white p-4 border-0">
                <h2 className="fw-bold text-primary mb-1">{t('req_inhumation')}</h2>
                <p className="text-muted">
                  {lang === 'ar' 
                    ? 'إجراء طلب رخصة دفن بعد التصريح بالوفاة وثبوتها.'
                    : 'Procédure de demande de permis d\'inhumer suite à un décès déclaré.'}
                </p>
              </div>
              <div className="card-body p-4">
                {submitted ? (
                  <div className="alert alert-success rounded-4 p-4 text-center">
                    <i className="fas fa-check-circle fa-3x mb-3 d-block"></i>
                    <h4 className="fw-bold">{t('inhumation_success')}</h4>
                    <Link to="/mes-demandes" className="btn btn-success mt-3 rounded-pill px-4 shadow-sm">
                      {lang === 'ar' ? 'عرض طلباتي' : 'Voir mes demandes'}
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger mb-4 shadow-sm rounded-3"><i className="fas fa-exclamation-triangle me-2"></i>{error}</div>}
                    
                    <div className="mb-4">
                      <label className="form-label fw-bold">{t('select_death_decl')}</label>
                      <select name="declaration_deces" className="form-select form-select-lg border-2 shadow-sm" required>
                        <option value="">-- {lang === 'ar' ? 'اختر' : 'Choisir'} --</option>
                        {availableDecls.map(d => (
                          <option key={d.id} value={d.id}>
                            {lang === 'ar' ? `${d.defunt_detail.prenom_ar} ${d.defunt_detail.nom_ar}` : `${d.defunt_detail.prenom_fr} ${d.defunt_detail.nom_fr}`} 
                            ({new Date(d.date_deces).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      {availableDecls.length === 0 && (
                        <div className="alert alert-info mt-3 small shadow-sm">
                          <i className="fas fa-info-circle me-2"></i>
                          {lang === 'ar' 
                            ? 'لم يتم العثور على أي تصريح وفاة مصادق عليه وبدون رخصة. يرجى التصريح بالوفاة أولاً أو انتظار مصادقة العون.'
                            : "Aucune déclaration de décès validée et sans permis n'a été trouvée. Veuillez d'abord déclarer le décès ou attendre la validation de l'agent."}
                        </div>
                      )}
                    </div>

                    <div className="row">
                       <div className="col-md-6 mb-4">
                        <label className="form-label fw-bold">{t('cemetery')} (FR)</label>
                        <input name="cimetiere_fr" className="form-control" defaultValue="Cimetière de Kelibia" required />
                      </div>
                      <div className="col-md-6 mb-4">
                        <label className="form-label fw-bold">{t('cemetery')} (AR)</label>
                        <input name="cimetiere_ar" className="form-control" defaultValue="مقبرة قليبية" required dir="rtl" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">{t('burial_date')}</label>
                      <input type="datetime-local" name="date_souhaitee" className="form-control form-control-lg shadow-sm" required />
                    </div>

                    <div className="d-grid gap-2 pt-3">
                      <button type="submit" className="btn btn-primary btn-lg rounded-pill shadow" disabled={submitting || availableDecls.length === 0}>
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('processing')}</> : <><i className="fas fa-paper-plane me-2"></i>{t('submit')}</>}
                      </button>
                      <Link to="/dashboard" className="btn btn-link text-muted">
                        {t('home')}
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
