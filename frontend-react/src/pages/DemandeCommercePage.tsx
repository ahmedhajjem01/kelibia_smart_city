import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

const SERVICE_TYPES = [
  { value: 'licence_enseigne', label: "Licence d'installation d'une enseigne publicitaire" },
]

export default function DemandeCommercePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [formData, setFormData] = useState({ service_type: '', nom_commerce: '', adresse_commerce: '', description: '' })
  const [files, setFiles] = useState<{ cin_recto?: File; cin_verso?: File; photo_enseigne?: File }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const cinRectoRef = useRef<HTMLInputElement>(null)
  const cinVersoRef = useRef<HTMLInputElement>(null)
  const photoEnseigneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUser(d) })
    // Pre-select since only one service type
    setFormData(prev => ({ ...prev, service_type: 'licence_enseigne' }))
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
    if (!formData.service_type || !formData.nom_commerce || !formData.adresse_commerce) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('service_type', formData.service_type)
      data.append('nom_commerce', formData.nom_commerce)
      data.append('adresse_commerce', formData.adresse_commerce)
      data.append('description', formData.description)
      if (files.cin_recto) {
        const ext = files.cin_recto.name.split('.').pop() || 'jpg'
        data.append('cin_recto', files.cin_recto, `cin_recto_${Date.now()}.${ext}`)
      }
      if (files.cin_verso) {
        const ext = files.cin_verso.name.split('.').pop() || 'jpg'
        data.append('cin_verso', files.cin_verso, `cin_verso_${Date.now()}.${ext}`)
      }
      if (files.photo_enseigne) {
        const ext = files.photo_enseigne.name.split('.').pop() || 'jpg'
        data.append('photo_enseigne', files.photo_enseigne, `enseigne_${Date.now()}.${ext}`)
      }

      const res = await fetch('/api/commerce/demande/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` },
        body: data,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(JSON.stringify(err) || 'Erreur lors de la soumission.')
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/mes-commerce'), 2500)
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout user={user} onLogout={() => navigate('/login')} breadcrumbs={[
      { label: 'Boutiques & Commerces', href: '/mes-commerce' },
      { label: 'Nouvelle demande' },
    ]}>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header rounded-top-4 text-white py-3 px-4"
              style={{ background: 'linear-gradient(135deg, #6f42c1, #d63384)' }}>
              <h4 className="mb-0 fw-bold">
                <i className="fas fa-store me-2"></i>
                Demande — Boutiques & Commerces
              </h4>
              <p className="mb-0 small opacity-75">Licences commerciales et enseignes publicitaires</p>
            </div>
            <div className="card-body p-4">
              {success ? (
                <div className="text-center py-5">
                  <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                  <h5 className="text-success">Demande envoyée avec succès !</h5>
                  <p className="text-muted">Redirection en cours...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger rounded-3">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Type de service <span className="text-danger">*</span></label>
                    <select name="service_type" className="form-select rounded-3" value={formData.service_type} onChange={handleChange} required>
                      <option value="">-- Sélectionner --</option>
                      {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nom du commerce <span className="text-danger">*</span></label>
                    <input type="text" name="nom_commerce" className="form-control rounded-3"
                      value={formData.nom_commerce} onChange={handleChange} required
                      placeholder="Ex: Épicerie Ben Salah, Salon Nour..." />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Adresse du commerce <span className="text-danger">*</span></label>
                    <textarea name="adresse_commerce" className="form-control rounded-3" rows={2}
                      value={formData.adresse_commerce} onChange={handleChange} required
                      placeholder="Numéro, rue, quartier, Kélibia..." />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description / Détails</label>
                    <textarea name="description" className="form-control rounded-3" rows={3}
                      value={formData.description} onChange={handleChange}
                      placeholder="Dimensions de l'enseigne, type d'affichage, matériau..." />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">CIN Recto</label>
                      <div className="border rounded-3 p-3 text-center bg-light" style={{ cursor: 'pointer' }}
                        onClick={() => cinRectoRef.current?.click()}>
                        {files.cin_recto
                          ? <><i className="fas fa-check-circle text-success me-2"></i><span className="text-success small">{files.cin_recto.name}</span></>
                          : <><i className="fas fa-id-card fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">Cliquer pour uploader</span></>}
                        <input ref={cinRectoRef} type="file" accept="image/*" className="d-none"
                          onChange={e => handleFileChange(e, 'cin_recto')} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">CIN Verso</label>
                      <div className="border rounded-3 p-3 text-center bg-light" style={{ cursor: 'pointer' }}
                        onClick={() => cinVersoRef.current?.click()}>
                        {files.cin_verso
                          ? <><i className="fas fa-check-circle text-success me-2"></i><span className="text-success small">{files.cin_verso.name}</span></>
                          : <><i className="fas fa-id-card fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">Cliquer pour uploader</span></>}
                        <input ref={cinVersoRef} type="file" accept="image/*" className="d-none"
                          onChange={e => handleFileChange(e, 'cin_verso')} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Photo de l'enseigne <span className="text-muted small">(optionnel)</span></label>
                    <div className="border rounded-3 p-3 text-center bg-light" style={{ cursor: 'pointer' }}
                      onClick={() => photoEnseigneRef.current?.click()}>
                      {files.photo_enseigne
                        ? <><i className="fas fa-check-circle text-success me-2"></i><span className="text-success small">{files.photo_enseigne.name}</span></>
                        : <><i className="fas fa-image fa-2x text-muted mb-2 d-block"></i><span className="text-muted small">Photo ou maquette de l'enseigne (optionnel)</span></>}
                      <input ref={photoEnseigneRef} type="file" accept="image/*,.pdf" className="d-none"
                        onChange={e => handleFileChange(e, 'photo_enseigne')} />
                    </div>
                  </div>

                  <div className="d-grid">
                    <button type="submit" className="btn rounded-pill py-2 fw-bold text-white" disabled={submitting}
                      style={{ background: 'linear-gradient(135deg, #6f42c1, #d63384)' }}>
                      {submitting
                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi en cours...</>
                        : <><i className="fas fa-paper-plane me-2"></i>Soumettre la demande</>}
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
