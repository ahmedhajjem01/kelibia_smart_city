import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

export default function DeclarationNaissancePage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  const token = getAccessToken()

  const attachmentRef = useRef<HTMLInputElement | null>(null)
  const pereIdRef = useRef<HTMLInputElement | null>(null)
  const mereIdRef = useRef<HTMLInputElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)


  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch User Info for MainLayout
    fetch(resolveBackendUrl('/api/accounts/me/'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => data && setUser(data))
      .catch(console.error)
  }, [navigate, token])

  // Canvas Drawing logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX
    const y = (('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX
    const y = (('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY
    
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)

    try {
      const form = e.currentTarget as HTMLFormElement
      const fd = new FormData(form)

      const payload = new FormData()

      payload.append('prenom_fr', String(fd.get('prenom_fr') || ''))
      payload.append('prenom_ar', String(fd.get('prenom_ar') || ''))
      payload.append('nom_fr', String(fd.get('nom_fr') || ''))
      payload.append('nom_ar', String(fd.get('nom_ar') || ''))
      payload.append('date_naissance', String(fd.get('date_naissance') || ''))
      payload.append('lieu_naissance_fr', String(fd.get('lieu_naissance_fr') || ''))
      payload.append('lieu_naissance_ar', String(fd.get('lieu_naissance_ar') || ''))
      payload.append('sexe', String(fd.get('sexe') || ''))
      payload.append('cin_pere', String(fd.get('cin_pere') || ''))
      payload.append('cin_mere', String(fd.get('cin_mere') || ''))
      payload.append('commentaire', String(fd.get('commentaire') || ''))

      // Manual date validation (10 days rule)
      const dateNaissanceStr = fd.get('date_naissance') as string
      if (dateNaissanceStr) {
        const dateNav = new Date(dateNaissanceStr)
        const now = new Date()
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
        
        if (dateNav > now) {
          alert(t('date_ref_future'))
          setSubmitting(false)
          return
        }
        if (dateNav < tenDaysAgo) {
          alert(t('legal_delay_10_days'))
          setSubmitting(false)
          return
        }
      }

      // Files
      const attachment = attachmentRef.current?.files?.[0]
      if (attachment) payload.append('attachment', attachment)
      
      const pereId = pereIdRef.current?.files?.[0]
      if (pereId) payload.append('cin_pere_scan', pereId)
      
      const mereId = mereIdRef.current?.files?.[0]
      if (mereId) payload.append('cin_mere_scan', mereId)

      // Signature to Blob
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png')
        const blob = await (await fetch(dataUrl)).blob()
        payload.append('signature_declarant', blob, 'signature.png')
      }

      const res = await fetch('/extrait-naissance/api/declaration/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(JSON.stringify(err))
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert(t('error_msg'))
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: t('birth_decl_title') }]}
    >
      <div className="container py-2">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-white p-4 border-0">
                <h2 className="fw-bold text-primary mb-1">{t('birth_decl_title')}</h2>
                <p className="text-muted">{t('birth_decl_desc')}</p>
              </div>

              <div className="card-body p-4">
                {!submitted ? (
                  <form id="birthDeclarationForm" onSubmit={onSubmit}>
                    <h5 className="section-title fw-bold text-dark">{t('newborn_info')}</h5>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-2">
                        <label htmlFor="prenom_fr" className="form-label">
                          {t('first_name_fr')}
                        </label>
                        <input type="text" className="form-control" id="prenom_fr" name="prenom_fr" required />
                      </div>
                      <div className="col-md-6 mb-2">
                        <label htmlFor="prenom_ar" className="form-label d-flex justify-content-between">
                          <span dir="rtl">{t('first_name_ar')}</span>
                        </label>
                        <input type="text" className="form-control" id="prenom_ar" name="prenom_ar" dir="rtl" required />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-2">
                        <label htmlFor="nom_fr" className="form-label">
                          {t('last_name_fr')}
                        </label>
                        <input type="text" className="form-control" id="nom_fr" name="nom_fr" required />
                      </div>
                      <div className="col-md-6 mb-2">
                        <label htmlFor="nom_ar" className="form-label d-flex justify-content-between">
                          <span dir="rtl">{t('last_name_ar')}</span>
                        </label>
                        <input type="text" className="form-control" id="nom_ar" name="nom_ar" dir="rtl" required />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="date_naissance" className="form-label">
                          {t('date_of_birth')}
                        </label>
                        <input 
                          type="datetime-local" 
                          className="form-control" 
                          id="date_naissance" 
                          name="date_naissance" 
                          required 
                          max={new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)}
                          min={new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)}
                        />
                        <div className="form-text small text-primary">
                          <i className="fas fa-info-circle me-1"></i>
                          {t('legal_delay_10_days')}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="sexe" className="form-label">
                          {t('gender')}
                        </label>
                        <select className="form-select" id="sexe" name="sexe" required>
                          <option value="M">{t('male')}</option>
                          <option value="F">{t('female')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6 mb-2">
                        <label htmlFor="lieu_naissance_fr" className="form-label">
                          {t('place_of_birth_fr')}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="lieu_naissance_fr"
                          name="lieu_naissance_fr"
                          placeholder={t('hosp_placeholder_fr')}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-2">
                        <label htmlFor="lieu_naissance_ar" className="form-label d-flex justify-content-between">
                          <span dir="rtl">{t('place_of_birth_ar')}</span>
                        </label>
                        <input
                          type="text"
                          className="form-control text-end"
                          id="lieu_naissance_ar"
                          name="lieu_naissance_ar"
                          dir="rtl"
                          placeholder={t('hosp_placeholder_ar')}
                          required
                        />
                      </div>
                    </div>

                    <h5 className="section-title fw-bold text-dark">{t('profile')}</h5>

                    <div className="row mb-4">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="cin_pere" className="form-label">
                          {t('cin_pere')}
                        </label>
                        <input type="text" className="form-control" id="cin_pere" name="cin_pere" maxLength={8} />
                        <div className="mt-2 text-start">
                          <label className="form-label small text-muted d-block">{t('parent_id_pere')}</label>
                          <input type="file" ref={pereIdRef} className="form-control form-control-sm" accept="image/*" />
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="cin_mere" className="form-label">
                          {t('cin_mere')}
                        </label>
                        <input type="text" className="form-control" id="cin_mere" name="cin_mere" maxLength={8} />
                        <div className="mt-2 text-start">
                          <label className="form-label small text-muted d-block">{t('parent_id_mere')}</label>
                          <input type="file" ref={mereIdRef} className="form-control form-control-sm" accept="image/*" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="input-group">
                        <input
                          ref={attachmentRef}
                          type="file"
                          className="form-control"
                          id="attachment"
                          name="attachment"
                          accept="image/*,application/pdf"
                          required
                        />
                      </div>
                      <div id="scanStatus" className="form-text">
                        {t('birth_decl_desc')}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="commentaire" className="form-label">
                        {t('comments')}
                      </label>
                      <textarea className="form-control" id="commentaire" name="commentaire" rows={2} />
                    </div>

                    <div className="mb-4">
                      <label className="form-label d-flex justify-content-between">
                        <span>{t('signature_label')}</span>
                        <button type="button" className="btn btn-sm btn-outline-secondary py-0" onClick={clearSignature}>
                          {t('signature_clear')}
                        </button>
                      </label>
                      <div className="border rounded bg-white shadow-sm" style={{ height: 150, cursor: 'crosshair', touchAction: 'none' }}>
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={150}
                          className="w-100 h-100"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      <small className="form-text text-muted">
                        <i className="fas fa-info-circle me-1" />
                        {t('signature_help')}
                      </small>
                    </div>

                    <div className="d-grid pt-3">
                      <button type="submit" className="btn btn-primary btn-lg" id="submitBtn" disabled={submitting}>
                        <i className="fas fa-baby me-2" />
                        {submitting ? (
                          <span>{t('processing')}</span>
                        ) : (
                          <span>{t('send_declaration')}</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div id="successMsg" className="alert alert-success mt-4">
                    <i className="fas fa-check-circle me-2" />
                    {t('birth_declaration_success')}
                    <div className="mt-3">
                      <Link to="/dashboard" className="btn btn-success btn-sm">
                        {t('back_to_dashboard')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

