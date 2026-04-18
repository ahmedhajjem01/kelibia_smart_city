import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

// ── Types ───────────────────────────────────────────────────────────────────

type Article = {
  id: number
  title: string
  slug: string
  content: string
  image: string | null
  author_name: string
  created_at: string
  updated_at: string
  is_published: boolean
}

type PublicEvent = {
  id: number
  titre_evenement: string
  type_evenement: string
  type_evenement_display: string
  description: string
  nombre_participants: number
  lieu_type_display: string
  lieu_details: string
  date_debut: string
  date_fin: string
  heure_debut: string
  heure_fin: string
  nom_organisateur: string
  association_nom: string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TAGS = [
  { value: '', label_fr: 'Toutes', label_ar: 'الكل', icon: 'fa-th-large' },
  { value: 'municipal', label_fr: 'Municipal', label_ar: 'بلدي', icon: 'fa-landmark' },
  { value: 'travaux', label_fr: 'Travaux', label_ar: 'أشغال', icon: 'fa-hard-hat' },
  { value: 'environnement', label_fr: 'Environnement', label_ar: 'بيئة', icon: 'fa-leaf' },
  { value: 'culture', label_fr: 'Culture', label_ar: 'ثقافة', icon: 'fa-paint-brush' },
  { value: 'sport', label_fr: 'Sport', label_ar: 'رياضة', icon: 'fa-running' },
]

// Only show public/community events — exclude private family events
const PUBLIC_EVENT_TYPES = [
  'concert', 'culturel', 'sportif', 'marche', 'association',
  'religieux', 'commercial', 'charite', 'politique', 'autre',
]

const TYPE_COLOR: Record<string, string> = {
  fete_familiale: '#e91e63', mariage: '#f06292', remise_diplomes: '#7b1fa2',
  concert: '#9c27b0', marche: '#ff9800', association: '#2196f3',
  sportif: '#4caf50', culturel: '#ff5722', commercial: '#607d8b',
  religieux: '#1565c0', politique: '#37474f', charite: '#d32f2f', autre: '#795548',
}

const TYPE_ICON: Record<string, string> = {
  fete_familiale: 'fa-birthday-cake', mariage: 'fa-ring', remise_diplomes: 'fa-graduation-cap',
  concert: 'fa-music', marche: 'fa-store', association: 'fa-users',
  sportif: 'fa-running', culturel: 'fa-theater-masks', commercial: 'fa-briefcase',
  religieux: 'fa-mosque', politique: 'fa-landmark', charite: 'fa-hand-holding-heart', autre: 'fa-calendar-day',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, lang: string) {
  return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function readingTime(content: string, lang: string) {
  const mins = Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
  return lang === 'ar' ? `${mins} دقيقة قراءة` : `${mins} min de lecture`
}

function excerpt(content: string, maxLen = 160) {
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain
}

function isUpcoming(ev: PublicEvent) { return new Date(ev.date_debut) > new Date() }
function isOngoing(ev: PublicEvent) {
  const now = new Date()
  return new Date(ev.date_debut) <= now && new Date(ev.date_fin) >= now
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  // Tab: 'news' | 'events'
  const [activeTab, setActiveTab] = useState<'news' | 'events'>('news')

  // News state
  const [articles, setArticles] = useState<Article[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [featured, setFeatured] = useState<Article | null>(null)

  // Events state
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [eventSearch, setEventSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [eventsFetched, setEventsFetched] = useState(false)

  useEffect(() => {
    const access = getAccessToken()
    if (access) {
      fetch('/api/accounts/me/', { headers: { Authorization: `Bearer ${access}` } })
        .then(r => r.ok ? r.json() : null).then(d => d && setUser(d)).catch(() => {})
    }
    fetchArticles()
  }, [])

  // Lazy-load events when tab is switched
  useEffect(() => {
    if (activeTab === 'events' && !eventsFetched) {
      fetchEvents()
    }
  }, [activeTab])

  async function fetchArticles() {
    setLoadingNews(true)
    try {
      const res = await fetch('/api/news/')
      if (res.ok) {
        const data = await res.json()
        const list: Article[] = Array.isArray(data) ? data : (data.results || [])
        setArticles(list)
        if (list.length > 0) setFeatured(list[0])
      }
    } catch (e) { console.error(e) }
    finally { setLoadingNews(false) }
  }

  async function fetchEvents() {
    setLoadingEvents(true)
    try {
      const res = await fetch('/api/evenements/publics/')
      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : (data.results || []))
        setEventsFetched(true)
      }
    } catch (e) { console.error(e) }
    finally { setLoadingEvents(false) }
  }

  function logout() { clearTokens(); navigate('/login') }

  // Only public/community events (no private family events)
  const publicEvents = events.filter(ev => PUBLIC_EVENT_TYPES.includes(ev.type_evenement))

  // Filtered articles
  const filteredArticles = articles.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    const matchTag = !activeTag || a.title.toLowerCase().includes(activeTag) || a.content.toLowerCase().includes(activeTag)
    return matchSearch && matchTag
  })
  const restArticles = featured ? filteredArticles.filter(a => a.id !== featured.id) : filteredArticles

  // Filtered events (only from public event types)
  const filteredEvents = publicEvents.filter(ev => {
    const q = eventSearch.toLowerCase()
    const matchSearch = !q || ev.titre_evenement.toLowerCase().includes(q) || ev.description.toLowerCase().includes(q)
    const matchType = !eventTypeFilter || ev.type_evenement === eventTypeFilter
    return matchSearch && matchType
  })

  // Unique event types for filter dropdown (only public types present in data)
  const eventTypes = Array.from(new Set(publicEvents.map(e => e.type_evenement)))

  return (
    <MainLayout
      user={user}
      onLogout={logout}
      breadcrumbs={[{ label: lang === 'ar' ? 'أخبار قليبية' : 'Actualités de Kélibia' }]}
    >
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div
        className="rounded-4 mb-4 p-4 text-white position-relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F4C5C 0%, #B5DDE5 100%)' }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 position-relative">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="fas fa-newspaper me-2"></i>
              {lang === 'ar' ? 'أخبار قليبية' : 'Actualités de Kélibia'}
            </h2>
            <p className="mb-0 opacity-75" style={{ fontSize: '.9rem' }}>
              {lang === 'ar'
                ? 'ابق على اطلاع بآخر الأحداث والبلاغات الصادرة عن بلديتك'
                : 'Restez informé des derniers événements et annonces de votre commune'}
            </p>
          </div>
          <div className="d-flex gap-2">
            <span className="badge rounded-pill px-3 py-2" style={{ background: 'rgba(255,255,255,.2)', fontSize: '.82rem' }}>
              <i className="fas fa-file-alt me-1"></i>
              {articles.length} {lang === 'ar' ? 'خبر' : `article${articles.length !== 1 ? 's' : ''}`}
            </span>
            <span className="badge rounded-pill px-3 py-2" style={{ background: 'rgba(181,221,229,.35)', fontSize: '.82rem' }}>
              <i className="fas fa-calendar-star me-1"></i>
              {eventsFetched ? publicEvents.length : '—'} {lang === 'ar' ? 'فعالية' : 'événement(s)'}
            </span>
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────── */}
      <div className="d-flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('news')}
          className={`btn rounded-pill px-4 fw-bold ${activeTab === 'news' ? 'shadow-sm' : 'btn-outline-secondary'}`}
          style={{ fontSize: '.88rem', transition: 'all .2s', ...(activeTab === 'news' ? { background: '#B5DDE5', color: '#0F4C5C', borderColor: '#B5DDE5' } : {}) }}
        >
          <i className="fas fa-newspaper me-2"></i>
          {lang === 'ar' ? 'الأخبار البلدية' : 'Actualités municipales'}
          {articles.length > 0 && (
            <span className={`ms-2 badge rounded-pill ${activeTab === 'news' ? 'bg-white' : 'bg-secondary text-white'}`}
              style={{ fontSize: '.7rem', color: activeTab === 'news' ? '#0F4C5C' : undefined }}>{articles.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`btn rounded-pill px-4 fw-bold ${activeTab === 'events' ? 'shadow-sm' : 'btn-outline-secondary'}`}
          style={{
            fontSize: '.88rem', transition: 'all .2s',
            background: activeTab === 'events' ? '#B5DDE5' : '',
            color: activeTab === 'events' ? '#0F4C5C' : '',
            borderColor: activeTab === 'events' ? '#B5DDE5' : '',
          }}
        >
          <i className="fas fa-calendar-star me-2"></i>
          {lang === 'ar' ? 'الفعاليات' : 'Événements'}
          {eventsFetched && publicEvents.length > 0 && (
            <span className={`ms-2 badge rounded-pill ${activeTab === 'events' ? 'bg-white' : 'bg-secondary text-white'}`}
              style={{ fontSize: '.7rem', color: activeTab === 'events' ? '#0F4C5C' : '' }}>{publicEvents.length}</span>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB: ACTUALITÉS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'news' && (
        <>
          {/* Search + tag filters */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-white"
                      placeholder={lang === 'ar' ? 'ابحث في الأخبار...' : 'Rechercher une actualité...'}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                      <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-7">
                  <div className="d-flex flex-wrap gap-2">
                    {CATEGORY_TAGS.map(tag => (
                      <button
                        key={tag.value}
                        onClick={() => setActiveTag(activeTag === tag.value ? '' : tag.value)}
                        className={`btn btn-sm rounded-pill px-3 fw-bold ${activeTag === tag.value ? '' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '.8rem', transition: 'all .2s', ...(activeTag === tag.value ? { background: '#B5DDE5', color: '#0F4C5C', borderColor: '#B5DDE5' } : {}) }}
                      >
                        <i className={`fas ${tag.icon} me-1`}></i>
                        {lang === 'ar' ? tag.label_ar : tag.label_fr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loadingNews ? (
            <div className="row g-4">
              <div className="col-12"><div className="skeleton-box rounded-4" style={{ height: 280 }}></div></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="col-12 col-md-4">
                  <div className="skeleton-box rounded-4" style={{ height: 220 }}></div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-newspaper fa-3x text-muted opacity-25 mb-3 d-block"></i>
              <p className="text-muted fw-bold">
                {lang === 'ar' ? 'لا توجد أخبار حاليًا' : 'Aucune actualité pour le moment'}
              </p>
              {search && (
                <button className="btn btn-outline-primary btn-sm rounded-pill px-4 mt-2" onClick={() => setSearch('')}>
                  <i className="fas fa-times me-1"></i>
                  {lang === 'ar' ? 'مسح البحث' : 'Effacer la recherche'}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured article */}
              {featured && filteredArticles.find(a => a.id === featured.id) && (
                <div
                  className="card border-0 rounded-4 shadow-sm overflow-hidden mb-4"
                  style={{ cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
                  onClick={() => setSelectedArticle(featured)}
                >
                  <div className="row g-0">
                    <div className="col-md-5 position-relative" style={{ minHeight: 220 }}>
                      {featured.image ? (
                        <img src={resolveBackendUrl(featured.image)} alt={featured.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 220 }} />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center"
                          style={{ background: 'linear-gradient(135deg, #0F4C5C 0%, #B5DDE5 100%)', minHeight: 220 }}>
                          <i className="fas fa-newspaper fa-4x text-white opacity-50"></i>
                        </div>
                      )}
                      <span className="badge position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill"
                        style={{ background: '#B5DDE5', color: '#0F4C5C', fontSize: '.78rem' }}>
                        <i className="fas fa-star me-1"></i>
                        {lang === 'ar' ? 'الخبر الأبرز' : 'À la une'}
                      </span>
                    </div>
                    <div className="col-md-7">
                      <div className="p-4 h-100 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '.8rem', color: '#888' }}>
                            <span><i className="fas fa-user me-1"></i>{featured.author_name}</span>
                            <span>·</span>
                            <span><i className="fas fa-calendar me-1"></i>{formatDate(featured.created_at, lang)}</span>
                            <span>·</span>
                            <span><i className="fas fa-clock me-1"></i>{readingTime(featured.content, lang)}</span>
                          </div>
                          <h3 className="fw-bold mb-3" style={{ color: '#1a1a2e', lineHeight: 1.35 }}>{featured.title}</h3>
                          <p className="text-muted" style={{ lineHeight: 1.65, fontSize: '.92rem' }}>{excerpt(featured.content, 200)}</p>
                        </div>
                        <div>
                          <button className="btn rounded-pill px-4 fw-bold" style={{ fontSize: '.85rem', background: '#B5DDE5', color: '#0F4C5C', borderColor: '#B5DDE5' }}
                            onClick={e => { e.stopPropagation(); setSelectedArticle(featured) }}>
                            <i className="fas fa-arrow-right me-2"></i>
                            {lang === 'ar' ? 'قراءة المزيد' : "Lire l'article"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Article grid */}
              {restArticles.length > 0 && (
                <div className="row g-4">
                  {restArticles.map(article => (
                    <div key={article.id} className="col-12 col-md-6 col-xl-4">
                      <div
                        className="card border-0 rounded-4 shadow-sm h-100 overflow-hidden"
                        style={{ cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
                        onClick={() => setSelectedArticle(article)}
                      >
                        <div style={{ height: 160, overflow: 'hidden' }}>
                          {article.image ? (
                            <img src={resolveBackendUrl(article.image)} alt={article.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center"
                              style={{ background: 'linear-gradient(135deg, #E6F4F7 0%, #B5DDE5 100%)' }}>
                              <i className="fas fa-newspaper fa-2x" style={{ color: '#0F4C5C', opacity: .5 }}></i>
                            </div>
                          )}
                        </div>
                        <div className="p-3 d-flex flex-column flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '.75rem', color: '#aaa' }}>
                            <span><i className="fas fa-calendar me-1"></i>{formatDate(article.created_at, lang)}</span>
                            <span>·</span>
                            <span><i className="fas fa-clock me-1"></i>{readingTime(article.content, lang)}</span>
                          </div>
                          <h6 className="fw-bold mb-2" style={{ color: '#1a1a2e', lineHeight: 1.4 }}>{article.title}</h6>
                          <p className="text-muted small mb-3 flex-grow-1" style={{ lineHeight: 1.6 }}>{excerpt(article.content, 120)}</p>
                          <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top">
                            <span style={{ fontSize: '.75rem', color: '#888' }}>
                              <i className="fas fa-user me-1"></i>{article.author_name}
                            </span>
                            <button
                              className="btn btn-sm rounded-pill px-3"
                              style={{ fontSize: '.76rem', color: '#0F4C5C', borderColor: '#B5DDE5', background: 'transparent' }}
                              onClick={e => { e.stopPropagation(); setSelectedArticle(article) }}
                            >
                              {lang === 'ar' ? 'قراءة' : 'Lire'} <i className="fas fa-arrow-right ms-1"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB: ÉVÉNEMENTS CITOYENS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <>
          {/* Search + type filter */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-white"
                      placeholder={lang === 'ar' ? 'ابحث في التظاهرات...' : 'Rechercher un événement...'}
                      value={eventSearch}
                      onChange={e => setEventSearch(e.target.value)}
                    />
                    {eventSearch && (
                      <button className="btn btn-outline-secondary" onClick={() => setEventSearch('')}>
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <select
                    className="form-select bg-white"
                    value={eventTypeFilter}
                    onChange={e => setEventTypeFilter(e.target.value)}
                  >
                    <option value="">{lang === 'ar' ? 'كل الأنواع' : 'Tous les types'}</option>
                    {eventTypes.map(t => (
                      <option key={t} value={t}>
                        {events.find(e => e.type_evenement === t)?.type_evenement_display || t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-2 text-end">
                  <span className="badge rounded-pill px-3 py-2" style={{ background: '#B5DDE5', color: '#0F4C5C', fontSize: '.82rem' }}>
                    {filteredEvents.length} {lang === 'ar' ? 'نتيجة' : 'résultat(s)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loadingEvents ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: '#0F4C5C' }}></div>
              <p className="mt-3 text-muted">{lang === 'ar' ? 'جاري تحميل التظاهرات...' : 'Chargement des événements...'}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-calendar-times fa-3x opacity-25 mb-3 d-block" style={{ color: '#0F4C5C' }}></i>
              <p className="text-muted fw-bold">
                {lang === 'ar' ? 'لا توجد فعاليات حاليًا' : 'Aucun événement pour le moment'}
              </p>
              <p className="text-muted small">
                {lang === 'ar' ? 'تحقق لاحقًا' : 'Revenez plus tard'}
              </p>
              <button className="btn btn-sm rounded-pill px-4 mt-2 fw-bold"
                style={{ background: '#B5DDE5', color: '#0F4C5C' }}
                onClick={() => navigate('/demande-evenement')}>
                <i className="fas fa-plus me-2"></i>
                {lang === 'ar' ? 'تنظيم تظاهرة' : 'Organiser un événement'}
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {filteredEvents.map(ev => {
                const color = TYPE_COLOR[ev.type_evenement] || '#6c757d'
                const icon = TYPE_ICON[ev.type_evenement] || 'fa-calendar-day'
                const ongoing = isOngoing(ev)
                const upcoming = isUpcoming(ev)
                return (
                  <div key={ev.id} className="col-12 col-md-6 col-xl-4">
                    <div
                      className="card border-0 rounded-4 shadow-sm h-100 overflow-hidden"
                      style={{ transition: 'transform .2s, box-shadow .2s', cursor: 'default' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
                    >
                      {/* Color band header */}
                      <div className="d-flex align-items-center gap-3 p-3"
                        style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)`, borderBottom: `3px solid ${color}` }}>
                        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 44, height: 44, background: color, color: '#fff', fontSize: '1.1rem' }}>
                          <i className={`fas ${icon}`}></i>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-bold text-truncate" style={{ color: '#1a1a2e', fontSize: '.93rem' }}>
                            {ev.titre_evenement}
                          </div>
                          <div className="small text-muted">{ev.type_evenement_display}</div>
                        </div>
                        <div className="d-flex flex-column gap-1">
                          {ongoing && (
                            <span className="badge bg-success rounded-pill" style={{ fontSize: '.65rem' }}>
                              <i className="fas fa-circle me-1" style={{ fontSize: '.45rem' }}></i>
                              {lang === 'ar' ? 'جارٍ' : 'En cours'}
                            </span>
                          )}
                          {upcoming && !ongoing && (
                            <span className="badge rounded-pill" style={{ fontSize: '.65rem', background: '#B5DDE5', color: '#0F4C5C' }}>
                              <i className="fas fa-clock me-1"></i>
                              {lang === 'ar' ? 'قادم' : 'À venir'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-3">
                        <div className="d-flex flex-column gap-2" style={{ fontSize: '.83rem', color: '#555' }}>
                          <div>
                            <i className="fas fa-calendar-alt me-2" style={{ color: '#0F4C5C' }}></i>
                            <strong>{formatShortDate(ev.date_debut)}</strong>
                            {ev.date_debut !== ev.date_fin && <> → <strong>{formatShortDate(ev.date_fin)}</strong></>}
                            <span className="text-muted ms-2">
                              {ev.heure_debut?.slice(0, 5)} — {ev.heure_fin?.slice(0, 5)}
                            </span>
                          </div>
                          <div><i className="fas fa-map-marker-alt me-2 text-danger"></i>{ev.lieu_details}</div>
                          <div><i className="fas fa-users me-2 text-info"></i>
                            {ev.nombre_participants} {lang === 'ar' ? 'مشارك' : 'participants attendus'}
                          </div>
                        </div>

                        {ev.description && (
                          <p className="text-muted small mt-3 mb-0 pt-2 border-top" style={{ lineHeight: 1.6 }}>
                            {excerpt(ev.description, 100)}
                          </p>
                        )}

                        <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between">
                          <span style={{ fontSize: '.75rem', color: '#888' }}>
                            <i className="fas fa-user me-1"></i>{ev.nom_organisateur}
                          </span>
                          {ev.association_nom && (
                            <span className="badge bg-light text-secondary border" style={{ fontSize: '.7rem' }}>
                              <i className="fas fa-building me-1"></i>{ev.association_nom}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* CTA */}
          {!loadingEvents && (
            <div className="text-center mt-5 py-4 rounded-4"
              style={{ background: 'linear-gradient(135deg, #E6F4F7, #B5DDE5)' }}>
              <i className="fas fa-calendar-plus fa-2x mb-3 d-block" style={{ color: '#0F4C5C' }}></i>
              <h5 className="fw-bold" style={{ color: '#0F4C5C' }}>
                {lang === 'ar' ? 'هل تريد تنظيم فعالية؟' : 'Vous souhaitez organiser un événement ?'}
              </h5>
              <p className="text-muted small mb-3">
                {lang === 'ar'
                  ? 'قدّم طلب ترخيص وسيتم مراجعته من قبل البلدية.'
                  : 'Déposez une demande d\'autorisation auprès de la municipalité.'}
              </p>
              <button className="btn rounded-pill px-5 fw-bold shadow-sm"
                style={{ background: '#0F4C5C', color: '#fff' }}
                onClick={() => navigate('/demande-evenement')}>
                <i className="fas fa-plus me-2"></i>
                {lang === 'ar' ? 'تقديم طلب' : 'Déposer une demande'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── ARTICLE DETAIL MODAL ─────────────────────────────────── */}
      {selectedArticle && (
        <div
          className="modal fade show d-block"
          style={{ background: 'rgba(0,0,0,.55)' }}
          onClick={() => setSelectedArticle(null)}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              {selectedArticle.image ? (
                <div style={{ height: 280, overflow: 'hidden', position: 'relative' }}>
                  <img src={resolveBackendUrl(selectedArticle.image)} alt={selectedArticle.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 100%)',
                    padding: '2rem 1.5rem 1rem',
                  }}>
                    <h3 className="text-white fw-bold mb-0">{selectedArticle.title}</h3>
                  </div>
                  <button className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow"
                    style={{ width: 36, height: 36, padding: 0 }}
                    onClick={() => setSelectedArticle(null)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="p-4 text-white position-relative"
                  style={{ background: 'linear-gradient(135deg, #0F4C5C 0%, #B5DDE5 100%)' }}>
                  <h3 className="fw-bold mb-0 pe-5">{selectedArticle.title}</h3>
                  <button className="btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-3 shadow"
                    style={{ width: 34, height: 34, padding: 0 }}
                    onClick={() => setSelectedArticle(null)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              <div className="modal-body p-4">
                <div className="d-flex flex-wrap align-items-center gap-3 mb-4 pb-3 border-bottom"
                  style={{ fontSize: '.83rem', color: '#888' }}>
                  <span><i className="fas fa-user-tie me-1" style={{ color: '#0F4C5C' }}></i><strong>{selectedArticle.author_name}</strong></span>
                  <span><i className="fas fa-calendar-alt me-1" style={{ color: '#0F4C5C' }}></i>{formatDate(selectedArticle.created_at, lang)}</span>
                  <span><i className="fas fa-clock me-1" style={{ color: '#0F4C5C' }}></i>{readingTime(selectedArticle.content, lang)}</span>
                  {selectedArticle.updated_at !== selectedArticle.created_at && (
                    <span className="badge bg-light text-secondary border">
                      <i className="fas fa-pen me-1"></i>
                      {lang === 'ar' ? 'تم التحديث' : 'Mis à jour'} {formatDate(selectedArticle.updated_at, lang)}
                    </span>
                  )}
                </div>
                <div className="article-content" style={{
                  lineHeight: 1.8, fontSize: '1rem', color: '#333', whiteSpace: 'pre-wrap',
                  direction: lang === 'ar' ? 'rtl' : 'ltr',
                  textAlign: lang === 'ar' ? 'right' : 'left',
                }}>
                  {selectedArticle.content}
                </div>
              </div>

              <div className="modal-footer border-0 bg-light px-4 py-3">
                <button className="btn btn-light rounded-pill px-4" onClick={() => setSelectedArticle(null)}>
                  <i className="fas fa-arrow-left me-2"></i>
                  {lang === 'ar' ? 'العودة للأخبار' : 'Retour aux actualités'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .skeleton-box {
          background: #eee;
          background-image: linear-gradient(90deg, #eee 0px, #f5f5f5 40px, #eee 80px);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer {
          0%   { background-position: -100% 0; }
          100% { background-position:  100% 0; }
        }
      `}</style>
    </MainLayout>
  )
}
