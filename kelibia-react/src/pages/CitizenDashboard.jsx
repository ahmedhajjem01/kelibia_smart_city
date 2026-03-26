import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import TopBar from '../components/layout/TopBar'
import MainNavbar from '../components/layout/MainNavbar'
import HeroStrip from '../components/layout/HeroStrip'
import Sidebar from '../components/layout/Sidebar'
import PageFooter from '../components/layout/PageFooter'
import LeafletMap from '../components/map/LeafletMap'
import PickMap from '../components/map/PickMap'
import { ToastContainer, showToast } from '../components/common/Toast'
import apiClient from '../api/axios'

/* ── Fort image sources (fallback chain) ── */
const FORT_SOURCES = [
  '/images/fort.webp',
  '/images/fort_kelibia.jpg',
  'https://www.tunisia.travel/media/thumbs/poi/large/fort-de-kelibia-2.jpg',
  'https://media-cdn.tripadvisor.com/media/photo-s/0e/4a/8e/5c/kelibia-castle.jpg',
]

function FortBanner() {
  const [srcIdx, setSrcIdx] = useState(0)
  const [failed, setFailed] = useState(false)

  function handleError() {
    const next = srcIdx + 1
    if (next < FORT_SOURCES.length) {
      setSrcIdx(next)
    } else {
      setFailed(true)
    }
  }

  return (
    <div className="fort-banner">
      <div className="fort-placeholder">
        <i className="fas fa-fort-awesome"></i>
        <span>Fort de Kélibia</span>
      </div>
      {!failed && (
        <img
          src={FORT_SOURCES[srcIdx]}
          alt="Fort de Kélibia"
          style={{ position: 'relative', zIndex: 1 }}
          onError={handleError}
        />
      )}
      <span className="fort-caption" style={{ zIndex: 3 }}>
        Fort de Kélibia — Patrimoine historique
      </span>
    </div>
  )
}

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [reclamations, setReclamations] = useState([])
  const [modalOpen, setModalOpen]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [modalAlert, setModalAlert]     = useState(null) // {msg, type}
  const [coords, setCoords]             = useState(null) // {lat, lng}

  // Form fields
  const titleRef       = useRef()
  const categoryRef    = useRef()
  const descriptionRef = useRef()
  const imageRef       = useRef()

  /* ── Fetch reclamations for map ── */
  useEffect(() => {
    apiClient.get('/api/reclamations/')
      .then(res => {
        const data = res.data
        setReclamations(Array.isArray(data) ? data : (data.results || []))
      })
      .catch(() => {})
  }, [])

  /* ── Prevent body scroll when modal open ── */
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  function openModal()  { setModalOpen(true);  setModalAlert(null); setCoords(null) }
  function closeModal() { setModalOpen(false); setModalAlert(null); setCoords(null) }

  /* ── Submit reclamation ── */
  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setModalAlert(null)

    const imageFile = imageRef.current?.files[0]
    let body, headers

    if (imageFile) {
      body = new FormData()
      body.append('title',       titleRef.current.value)
      body.append('category',    categoryRef.current.value)
      body.append('description', descriptionRef.current.value)
      body.append('image', imageFile)
      if (coords) {
        body.append('latitude',  coords.lat.toFixed(6))
        body.append('longitude', coords.lng.toFixed(6))
      }
      headers = {}   // axios injects Bearer; let browser set multipart boundary
    } else {
      const payload = {
        title:       titleRef.current.value,
        category:    categoryRef.current.value,
        description: descriptionRef.current.value,
      }
      if (coords) {
        payload.latitude  = parseFloat(coords.lat.toFixed(6))
        payload.longitude = parseFloat(coords.lng.toFixed(6))
      }
      body    = payload
      headers = { 'Content-Type': 'application/json' }
    }

    try {
      const res = await apiClient.post('/api/reclamations/', body, { headers })
      if (res.status === 201 || res.status === 200) {
        setModalAlert({ msg: 'Signalement envoyé avec succès !', type: 'success' })
        titleRef.current.value       = ''
        categoryRef.current.value    = 'lighting'
        descriptionRef.current.value = ''
        if (imageRef.current) imageRef.current.value = ''
        // Refresh map markers
        const updated = await apiClient.get('/api/reclamations/')
        const d = updated.data
        setReclamations(Array.isArray(d) ? d : (d.results || []))
        setTimeout(() => closeModal(), 1400)
      }
    } catch (err) {
      const errData = err.response?.data || {}
      const msg = Object.values(errData).flat().join(' ') || 'Erreur lors de l\'envoi.'
      setModalAlert({ msg, type: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Use my location ── */
  function useMyLocation() {
    if (!navigator.geolocation) { alert('Géolocalisation non supportée.'); return }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Impossible d\'obtenir votre position.')
    )
  }

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : ''
  const initials = fullName
    ? fullName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
      <TopBar />
      <MainNavbar />

      {/* HERO STRIP */}
      <div className="hero-strip">
        <div className="hero-top">
          <div>
            <div className="greeting">
              <i className="fas fa-hand-wave me-2"></i>
              <span>{t('welcome')}</span>{' '}
              <strong>{user?.first_name || fullName || 'Citoyen'}</strong> !
            </div>
            <div className="sub">{t('welcome_msg')}</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge-role">
              <i className="fas fa-user-check me-1"></i>
              <span>{t('citizen_role')}</span>
            </span>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/40px-Flag_of_Tunisia.svg.png"
              height="22" style={{ borderRadius: '3px' }} alt="Tunisie"
            />
          </div>
        </div>
        <FortBanner />
      </div>

      {/* BREADCRUMB */}
      <div className="breadcrumb-bar">
        <a href="#"><i className="fas fa-home me-1"></i>{t('home')}</a>
        <span className="mx-2 text-muted">/</span>
        <span>{t('citizen_portal')}</span>
      </div>

      {/* PAGE BODY */}
      <div className="page-body">

        {/* SIDEBAR */}
        <Sidebar variant="citizen" />

        {/* MAIN CONTENT */}
        <div className="main-content">

          {/* QUICK ACTIONS */}
          <div className="content-card mb-4">
            <div className="card-header-custom">
              <span><i className="fas fa-bolt icon"></i>{t('quick_actions')}</span>
            </div>
            <div className="card-body-custom">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <button className="quick-action-btn w-100" onClick={openModal}>
                    <i className="fas fa-plus-circle qa-icon"></i>
                    <span>{t('new_reclamation')}</span>
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <Link className="quick-action-btn w-100" to="/mes-reclamations">
                    <i className="fas fa-list-check qa-icon"></i>
                    <span>{t('my_reclamations')}</span>
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link className="quick-action-btn w-100" to="/services">
                    <i className="fas fa-file-invoice qa-icon"></i>
                    <span>{t('admin_services')}</span>
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <button className="quick-action-btn w-100">
                    <i className="fas fa-newspaper qa-icon"></i>
                    <span>{t('news_title')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARTE SIG 3 COUCHES */}
          <div className="content-card mb-4" id="mapCard">
            <div className="card-header-custom" style={{ background: 'linear-gradient(90deg,#0d2b4e,#1565c0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><i className="fas fa-map-marked-alt me-2"></i>Carte de Kélibia — Signalements en temps réel</span>
              <span style={{ fontSize: '.72rem', opacity: '.75' }}>
                {reclamations.length} signalement(s)
              </span>
            </div>
            <LeafletMap reclamations={reclamations} height="320px" />
          </div>

          {/* NEWS CARD */}
          <div className="content-card">
            <div className="card-header-custom" style={{ background: 'linear-gradient(90deg,#1a3a5c,#1565c0)' }}>
              <span><i className="fas fa-newspaper icon"></i>{t('news_title')}</span>
            </div>
            <div className="card-body-custom">
              <div className="news-mini">
                <div className="news-dot"></div>
                <div>
                  <div className="news-text">Ramassage des ordures — Programme de mai 2025</div>
                  <div className="news-date">12 mai 2025</div>
                </div>
              </div>
              <div className="news-mini">
                <div className="news-dot"></div>
                <div>
                  <div className="news-text">Travaux d'entretien des routes côtières</div>
                  <div className="news-date">8 mai 2025</div>
                </div>
              </div>
              <div className="news-mini">
                <div className="news-dot"></div>
                <div>
                  <div className="news-text">Réunion publique — plan d'urbanisme</div>
                  <div className="news-date">3 mai 2025</div>
                </div>
              </div>
            </div>
          </div>

        </div>{/* /main-content */}

        {/* RIGHT PROFILE COLUMN */}
        <div style={{ width: '240px', minWidth: '240px', padding: '24px 16px 24px 0', flexShrink: 0 }}>

          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-name">{fullName || 'Chargement...'}</div>
              <div className="profile-email">{user?.email || '...'}</div>
            </div>
            <div className="profile-body">
              <div className="profile-row">
                <span className="lbl">{t('profile_type')}</span>
                <span className="val" style={{ color: 'var(--green-mid)' }}>{t('citizen_role')}</span>
              </div>
              <div className="profile-row">
                <span className="lbl">{t('profile_city')}</span>
                <span className="val">{user?.city || 'Kélibia'}</span>
              </div>
              <div className="profile-row">
                <span className="lbl">{t('profile_phone')}</span>
                <span className="val">{user?.phone || '—'}</span>
              </div>
            </div>
          </div>

          <Link
            to="/mes-reclamations"
            style={{
              display: 'block', background: 'var(--green-mid)', color: '#fff',
              borderRadius: '8px', padding: '12px 16px', textDecoration: 'none',
              fontSize: '.85rem', fontWeight: 600, textAlign: 'center',
              boxShadow: '0 3px 10px rgba(46,125,50,.3)', transition: 'background .2s',
              marginBottom: '10px',
            }}
          >
            <i className="fas fa-list-check me-2"></i>Voir mes réclamations
          </Link>

          <button
            onClick={openModal}
            style={{
              display: 'block', width: '100%', background: '#fff', color: 'var(--green-dark)',
              border: '1.5px solid #c8e6c9', borderRadius: '8px', padding: '10px 16px',
              fontSize: '.82rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
            }}
          >
            <i className="fas fa-plus-circle me-2" style={{ color: 'var(--green-mid)' }}></i>
            Nouveau signalement
          </button>

        </div>

      </div>{/* /page-body */}

      <PageFooter />

      {/* ════ RECLAMATION MODAL ════ */}
      {modalOpen && (
        <div
          className="modal fade show d-block"
          style={{ background: 'rgba(0,0,0,.5)', zIndex: 1050 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">

              <div className="modal-header-custom">
                <div className="modal-title-custom">
                  <i className="fas fa-plus-circle me-2"></i>
                  {t('new_reclamation')}
                </div>
                <button type="button" className="btn-close-custom" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {modalAlert && (
                <div style={{
                  margin: '12px 22px 0', borderRadius: '8px', padding: '10px 14px', fontSize: '.84rem',
                  background: modalAlert.type === 'success' ? '#e8f5e9' : '#ffebee',
                  color: modalAlert.type === 'success' ? '#1b5e20' : '#b71c1c',
                  border: `1px solid ${modalAlert.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`,
                }}>
                  <i className={`fas fa-${modalAlert.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                  {modalAlert.msg}
                </div>
              )}

              <div className="modal-body">
                <form onSubmit={handleSubmit}>

                  <div className="mb-3">
                    <label className="form-label-custom">{t('col_title')}</label>
                    <input
                      type="text" className="form-control-custom" ref={titleRef} required
                      placeholder="Ex: Lampadaire cassé rue Ibn Khaldoun"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">{t('col_category')}</label>
                    <select className="form-select-custom" ref={categoryRef}>
                      <option value="lighting">💡 Éclairage Public</option>
                      <option value="trash">🗑️ Déchets / Hygiène</option>
                      <option value="roads">🛣️ Voirie / Routes</option>
                      <option value="noise">🔊 Nuisances Sonores</option>
                      <option value="other">📌 Autre</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Description</label>
                    <textarea
                      className="form-control-custom" ref={descriptionRef} rows={3} required
                      placeholder="Décrivez le problème en détail..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">
                      <i className="fas fa-camera me-1" style={{ color: 'var(--green-mid)' }}></i>
                      {t('col_photo')}
                    </label>
                    <input
                      type="file" className="form-control-custom" ref={imageRef}
                      accept="image/*" style={{ padding: '7px 12px' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label-custom">
                      <i className="fas fa-map-pin me-1" style={{ color: 'var(--green-mid)' }}></i>
                      Localisation sur la carte
                      <span style={{ fontWeight: 400, color: '#aaa', fontSize: '.74rem' }}> (cliquez pour pointer)</span>
                    </label>
                    <PickMap onLocationSelect={(lat, lng) => setCoords({ lat, lng })} coords={coords} />
                    <div className={`loc-coords${coords ? '' : ' empty'}`}>
                      <i className="fas fa-location-dot"></i>
                      <span>
                        {coords
                          ? `Lat: ${coords.lat.toFixed(5)}  •  Lng: ${coords.lng.toFixed(5)}`
                          : 'Aucune localisation sélectionnée'}
                      </span>
                    </div>
                    <div className="loc-hint">
                      <i className="fas fa-info-circle"></i>
                      Cliquez sur la carte pour géolocaliser le signalement.
                      <button
                        type="button" onClick={useMyLocation}
                        style={{ marginLeft: '6px', background: 'none', border: '1px solid var(--green-mid)', borderRadius: '5px', padding: '1px 8px', fontSize: '.72rem', color: 'var(--green-mid)', cursor: 'pointer' }}
                      >
                        <i className="fas fa-crosshairs me-1"></i>Ma position
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="submit-btn-custom" disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi en cours...</>
                      : <><i className="fas fa-paper-plane"></i> {t('submit')}</>}
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  )
}
