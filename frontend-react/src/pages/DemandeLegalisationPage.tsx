import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

export default function DemandeLegalisationPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    type_document: '',
    nombre_copies: '1',
    motif: '',
  })

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch User Info
    fetch(resolveBackendUrl('/api/accounts/me/'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => data && setUser(data))
      .catch(console.error)
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const token = getAccessToken()
    if (!token) return

    setLoading(true)
    setError(null)

    // Save pre-demand
    try {
      const res = await fetch(resolveBackendUrl('/extrait-naissance/api/legalisation/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const savedData = await res.json()
        const amount = (parseFloat(formData.nombre_copies) * 0.500).toFixed(3)
        const reason = lang === 'ar' ? `التعريف بالإمضاء - ${formData.type_document}` : `Légalisation de Signature - ${formData.type_document}`
        const target = `/paiement?amount=${amount}&reason=${encodeURIComponent(reason)}&requestId=${savedData.id}&requestType=legalisation&target=/mes-demandes`
        navigate(target)
      } else {
        const err = await res.json()
        setError(err.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: lang === 'ar' ? 'التعريف بالإمضاء' : 'Légalisation de Signature' }]}
    >
      <div className={`container py-2 pb-5 ${lang === 'ar' ? 'text-end' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-primary text-white p-4 border-0">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                    <i className="fas fa-signature fa-lg"></i>
                  </div>
                  <div>
                    <h2 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>
                      {lang === 'ar' ? 'التعريف بالإمضاء (عن بعد)' : 'Légalisation de Signature (Pré-demande)'}
                    </h2>
                    <p className="mb-0 opacity-75 small">
                      {lang === 'ar' 
                        ? 'قم بتعمير البيانات والدفع مسبقاً لربح الوقت عند الحضور للبلدية.'
                        : 'Préparez votre dossier et payez en ligne pour gagner du temps au guichet.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4 p-md-5">
                {error && <div className="alert alert-danger mb-4 shadow-sm rounded-3"><i className="fas fa-exclamation-triangle me-2"></i>{error}</div>}
                <div className="alert alert-info border-0 shadow-sm rounded-3 mb-4 d-flex align-items-start gap-3">
                  <i className="fas fa-info-circle fa-lg mt-1"></i>
                  <div className="small">
                    <strong>{lang === 'ar' ? 'ملاحظة هامة:' : 'IMPORTANT :'}</strong><br />
                    {lang === 'ar' 
                      ? 'هذه الخدمة تسمح لك بتسجيل بياناتك ودفع الرسوم (0.500 د للملف). يجب عليك الحضور شخصياً بمقر البلدية لإتمام الإمضاء أمام العون.'
                      : 'Cette pré-demande permet d\'enregistrer vos données et payer les frais (0.500 DT par copie). La signature physique devant l\'officier de l\'État Civil au sein de la municipalité reste OBLIGATOIRE.'}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-md-8">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'نوع الوثيقة' : 'Type de document (Contat, Engagement, etc.)'}</label>
                      <input 
                        type="text" 
                        className="form-control form-control-lg bg-light border-0 shadow-sm" 
                        placeholder={lang === 'ar' ? 'مثال: عقد كراء' : 'Ex: Contrat de location'}
                        value={formData.type_document}
                        onChange={e => setFormData({...formData, type_document: e.target.value})}
                        required 
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'عدد النسخ' : 'Nombre de copies'}</label>
                      <input 
                        type="number" 
                        min="1"
                        className="form-control form-control-lg bg-light border-0 shadow-sm" 
                        value={formData.nombre_copies}
                        onChange={e => setFormData({...formData, nombre_copies: e.target.value})}
                        required 
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small text-uppercase">{lang === 'ar' ? 'الهدف من الاستعمال (اختياري)' : 'Motif / Usage (Optionnel)'}</label>
                      <textarea 
                        className="form-control bg-light border-0 shadow-sm" 
                        rows={3}
                        value={formData.motif}
                        onChange={e => setFormData({...formData, motif: e.target.value})}
                        style={{ borderRadius: '12px' }}
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-5 p-4 bg-light rounded-4 border">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold text-dark">{lang === 'ar' ? 'المعلوم الجملي' : 'Total des frais à payer'}</div>
                        <div className="text-muted small">{lang === 'ar' ? '0.500 د للنسخة الواحدة' : '0.500 DT par exemplaire'}</div>
                      </div>
                      <div className="h3 fw-bold text-primary mb-0">
                        {(parseFloat(formData.nombre_copies || '0') * 0.500).toFixed(3)} DT
                      </div>
                    </div>
                  </div>

                  <div className="d-grid gap-3 mt-4">
                    <button type="submit" className="btn btn-primary btn-lg rounded-pill py-3 fw-bold shadow-lg" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-credit-card me-2"></i>}
                      {lang === 'ar' ? 'المرور للدفع الإلكتروني' : 'Passer au paiement en ligne'}
                    </button>
                    <Link to="/services" className="btn btn-link text-muted text-center text-decoration-none">
                      {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
