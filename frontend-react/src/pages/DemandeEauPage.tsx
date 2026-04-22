import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'
import { useI18n } from '../i18n/LanguageProvider'

export default function DemandeEauPage() {
  const navigate = useNavigate()
  const { lang } = useI18n()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [formData, setFormData] = useState({ service_type: '', adresse: '', description: '' })
  const [files, setFiles] = useState<{ cin_recto?: File; cin_verso?: File }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const cinRectoRef = useRef<HTMLInputElement>(null)
  const cinVersoRef = useRef<HTMLInputElement>(null)

  const SERVICE_TYPES = [
    { value: 'raccordement_eau', label: lang === 'ar' ? 'الربط بشبكة المياه' : "Raccordement au réseau d'eau" },
    { value: 'raccordement_electricite', label: lang === 'ar' ? 'الربط بشبكة الكهرباء' : 'Raccordement électrique' },
    { value: 'raccordement_egouts', label: lang === 'ar' ? 'الربط بقنوات الصرف الصحي' : 'Raccordement aux égouts' },
    { value: 'reclamation_eau', label: lang === 'ar' ? 'شكوى بخصوص عداد المياه' : 'Réclamation compteur eau' },
    { value: 'reclamation_electricite', label: lang === 'ar' ? 'شكوى بخصوص عداد الكهرباء' : 'Réclamation compteur électricité' },
    { value: 'autre', label: lang === 'ar' ? 'أخرى' : 'Autre' },
  ]

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUser(d) })
  }, [navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    if (e.target.files?.[0]) setFiles(prev => ({ ...prev, [key]: e.target.files![0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.service_type || !formData.adresse) {
      setError(lang === 'ar' ? 'الرجاء ملء جميع الحقول الإلزامية.' : 'Veuillez remplir tous les champs obligatoires.')
      return
    }
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('service_type', formData.service_type)
      data.append('adresse', formData.adresse)
      data.append('description', formData.description)
      if (files.cin_recto) data.append('cin_recto', files.cin_recto)
      if (files.cin_verso) data.append('cin_verso', files.cin_verso)

      const res = await fetch(resolveBackendUrl('/api/eau/demande/'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` },
        body: data,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(JSON.stringify(err) || (lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب.' : 'Erreur lors de la soumission.'))
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/mes-eau'), 2500)
    } catch (err) {
      setError(lang === 'ar' ? 'خطأ في الشبكة. يرجى المحاولة مرة أخرى.' : 'Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[
      { label: lang === 'ar' ? 'الماء والكهرباء' : 'Eau, Lumière & Égouts', href: '/mes-eau' },
      { label: lang === 'ar' ? 'طلب جديد' : 'Nouvelle demande' },
    ]}>
      <div className={`row justify-content-center ${lang === 'ar' ? 'font-arabic text-end' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header rounded-top-4 text-white py-3 px-4"
              style={{ background: 'linear-gradient(135deg, #0d6efd, #0dcaf0)' }}>
              <h4 className="mb-0 fw-bold">
                <i className={`fas fa-tint ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
                {lang === 'ar' ? 'الماء، الكهرباء والصرف الصحي' : 'Demande — Eau, Lumière & Égouts'}
              </h4>
              <p className="mb-0 small opacity-75">{lang === 'ar' ? 'الربط بشبكات المياه والكهرباء وشكاوى العدادات' : 'Raccordements et réclamations de compteurs'}</p>
            </div>
            <div className="card-body p-4">
              {success ? (
                <div className="text-center py-5">
                  <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                  <h5 className="text-success">{lang === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Demande envoyée avec succès !'}</h5>
                  <p className="text-muted">{lang === 'ar' ? 'جاري التوجيه...' : 'Redirection en cours...'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger rounded-3">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">{lang === 'ar' ? 'نوع الخدمة' : 'Type de service'} <span className="text-danger">*</span></label>
                    <select name="service_type" className="form-select rounded-3" value={formData.service_type} onChange={handleChange} required>
                      <option value="">-- {lang === 'ar' ? 'اختر' : 'Sélectionner'} --</option>
                      {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">{lang === 'ar' ? 'عنوان الربط / العداد' : 'Adresse du raccordement / compteur'} <span className="text-danger">*</span></label>
                    <textarea name="adresse" className="form-control rounded-3" rows={2}
                      value={formData.adresse} onChange={handleChange} required
                      placeholder={lang === 'ar' ? 'الرقم، الشارع، الحي، قليبية...' : "Numéro, rue, quartier, Kélibia..."} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">{lang === 'ar' ? 'الوصف / التفاصيل' : 'Description / Détails'}</label>
                    <textarea name="description" className="form-control rounded-3" rows={3}
                      value={formData.description} onChange={handleChange}
                      placeholder={lang === 'ar' ? 'وضح طلبك أو المشكلة...' : "Précisez votre demande ou problème..."} />
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{lang === 'ar' ? 'بطاقة التعريف (الوجه)' : 'CIN Recto'}</label>
                      <div className="border rounded-3 p-3 text-center bg-light" style={{ cursor: 'pointer' }}
                        onClick={() => cinRectoRef.current?.click()}>
                        {files.cin_recto
                          ? <><i className={`fas fa-check-circle text-success ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i><span className="text-success small">{files.cin_recto.name}</span></>
                          : <><i className="fas fa-id-card fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">{lang === 'ar' ? 'انقر للتحميل' : 'Cliquer pour uploader'}</span></>}
                        <input ref={cinRectoRef} type="file" accept="image/*" className="d-none"
                          onChange={e => handleFileChange(e, 'cin_recto')} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{lang === 'ar' ? 'بطاقة التعريف (الخلف)' : 'CIN Verso'}</label>
                      <div className="border rounded-3 p-3 text-center bg-light" style={{ cursor: 'pointer' }}
                        onClick={() => cinVersoRef.current?.click()}>
                        {files.cin_verso
                          ? <><i className={`fas fa-check-circle text-success ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i><span className="text-success small">{files.cin_verso.name}</span></>
                          : <><i className="fas fa-id-card fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">{lang === 'ar' ? 'انقر للتحميل' : 'Cliquer pour uploader'}</span></>}
                        <input ref={cinVersoRef} type="file" accept="image/*" className="d-none"
                          onChange={e => handleFileChange(e, 'cin_verso')} />
                      </div>
                    </div>
                  </div>

                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary rounded-pill py-2 fw-bold" disabled={submitting}>
                      {submitting
                        ? <><span className={`spinner-border spinner-border-sm ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></span>{lang === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...'}</>
                        : <><i className={`fas fa-paper-plane ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>{lang === 'ar' ? 'إرسال الطلب' : 'Soumettre la demande'}</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

