import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

interface Tag { id: number; name: string }
interface Author { id: number; first_name: string; last_name: string; email: string; user_type: string }
interface Topic {
  id: number; title: string; category: string; author: Author; tags: Tag[]
  is_pinned: boolean; is_resolved: boolean; views: number
  replies_count: number; votes_count: number; has_voted: boolean; created_at: string
}
interface Stats { total_topics: number; total_replies: number; active_members: number }

const CATEGORY_LABELS: Record<string, string> = {
  questions: '🏛️ Questions aux agents',
  suggestions: '💡 Suggestions',
  debates: '🗣️ Débats citoyens',
}
const CATEGORY_COLORS: Record<string, string> = {
  questions: '#1565c0', suggestions: '#2e7d32', debates: '#6a1b9a',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ForumPage() {
  const { t, setLang } = useI18n()
  const navigate = useNavigate()

  const [topics, setTopics]       = useState<Topic[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [tags, setTags]           = useState<Tag[]>([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState('')
  const [search, setSearch]       = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [notifCount, setNotifCount] = useState(0)

  const [showModal, setShowModal]     = useState(false)
  const [newTitle, setNewTitle]       = useState('')
  const [newContent, setNewContent]   = useState('')
  const [newCategory, setNewCategory] = useState('questions')
  const [newTags, setNewTags]         = useState('')
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState('')

  const access = getAccessToken()

  useEffect(() => {
    if (!access) { navigate('/login'); return }
    Promise.all([fetchTopics(), fetchStats(), fetchTags(), fetchNotifCount()])
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (access) fetchTopics()
  }, [category, activeTag, search])

  async function fetchTopics() {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (activeTag) params.set('tag', activeTag)
    if (search) params.set('search', search)
    const res = await fetch(`/api/forum/topics/?${params}`, {
      headers: { Authorization: `Bearer ${access}` },
    })
    if (res.ok) setTopics(await res.json())
  }

  async function fetchStats() {
    const res = await fetch('/api/forum/stats/', { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) {
      const data = await res.json()
      setStats(Array.isArray(data) ? data[0] : (data.results ? data.results[0] : data))
    }
  }

  async function fetchTags() {
    const res = await fetch('/api/forum/tags/', { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) setTags(await res.json())
  }

  async function fetchNotifCount() {
    const res = await fetch('/api/forum/notifications/', { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) {
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.results || [])
      setNotifCount(list.filter((n: any) => !n.is_read).length)
    }
  }

  async function createTopic() {
    if (!newTitle.trim() || !newContent.trim()) { setCreateError('Titre et contenu requis.'); return }
    setCreating(true); setCreateError('')
    const tagNames = newTags.split(',').map((t: string) => t.trim()).filter(Boolean)
    const res = await fetch('/api/forum/topics/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory, tag_names: tagNames }),
    })
    if (res.ok) {
      const topic = await res.json()
      setShowModal(false); setNewTitle(''); setNewContent(''); setNewTags('')
      navigate(`/forum/${topic.id}`)
    } else {
      setCreateError('Erreur lors de la création.')
    }
    setCreating(false)
  }

  async function voteTopic(id: number, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    const res = await fetch(`/api/forum/topics/${id}/vote/`, {
      method: 'POST', headers: { Authorization: `Bearer ${access}` },
    })
    if (res.ok) fetchTopics()
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/dashboard">
            <i className="fas fa-city me-2"></i>Kelibia Smart City
          </Link>
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group me-2">
              <button className='btn btn-sm btn-outline-light' onClick={() => setLang('fr')}>
                <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
              </button>
              <button className='btn btn-sm btn-outline-light' onClick={() => setLang('ar')}>
                <img src="https://flagcdn.com/w40/tn.png" width="20" alt="AR" />
              </button>
            </div>
            <Link to="/dashboard" className="btn btn-outline-light btn-sm">
              <i className="fas fa-home me-1"></i>Tableau de bord
            </Link>
            <Link to="/forum" className="btn btn-outline-light btn-sm position-relative">
              <i className="fas fa-bell"></i>
              {notifCount > 0 && (
                <span className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger' style={{ fontSize: '0.65rem' }}>
                  {notifCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className='fw-bold mb-1' style={{ color: '#1a1a2e' }}>
              <i className='fas fa-comments me-2' style={{ color: '#1565c0' }}></i>Forum Citoyen
            </h2>
            <p className='text-muted mb-0' style={{ fontSize: '.88rem' }}>
              Posez vos questions, partagez vos suggestions et débattez avec la communauté
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus-circle me-2"></i>Nouveau sujet
          </button>
        </div>

        {stats && (
          <div className="row g-3 mb-4">
            {[
              { icon: 'fa-comments', label: 'Sujets', val: stats.total_topics, color: '#1565c0' },
              { icon: 'fa-reply-all', label: 'Réponses', val: stats.total_replies, color: '#2e7d32' },
              { icon: 'fa-users', label: 'Membres actifs', val: stats.active_members, color: '#6a1b9a' },
            ].map(s => (
              <div className="col-4" key={s.label}>
                <div className="card border-0 shadow-sm text-center py-3">
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '.78rem', color: '#888' }}>
                    <i className={`fas ${s.icon} me-1`}></i>{s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="d-flex gap-2 flex-wrap mb-3">
          {[
            { key: '', label: '📋 Tous' },
            { key: 'questions', label: '🏛️ Questions aux agents' },
            { key: 'suggestions', label: '💡 Suggestions' },
            { key: 'debates', label: '🗣️ Débats' },
          ].map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={`btn btn-sm ${category === c.key ? 'btn-primary' : 'btn-outline-secondary'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="d-flex gap-2 flex-wrap mb-3">
            {tags.slice(0, 15).map(tag => (
              <span key={tag.id} onClick={() => setActiveTag(activeTag === tag.name ? '' : tag.name)}
                className="badge" style={{
                  cursor: 'pointer', fontSize: '.75rem', padding: '5px 10px',
                  background: activeTag === tag.name ? '#1565c0' : '#e3f2fd',
                  color: activeTag === tag.name ? '#fff' : '#1565c0',
                }}>#{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className='input-group mb-4' style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-white"><i className="fas fa-search text-muted"></i></span>
          <input type="text" className="form-control" placeholder="Rechercher un sujet..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <p className="mt-2 text-muted">Chargement du forum...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className='fas fa-inbox' style={{ fontSize: '3rem', opacity: .3, display: 'block', marginBottom: '12px' }}></i>
            <p>Aucun sujet pour le moment.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus me-1"></i>Créer le premier sujet
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {topics.map(topic => (
              <Link key={topic.id} to={`/forum/${topic.id}`} style={{ textDecoration: 'none' }}>
                <div className="card border-0 shadow-sm"
                  style={{ borderLeft: `4px solid ${CATEGORY_COLORS[topic.category] || '#1565c0'}`, transition: 'transform .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                  <div className="card-body py-3 px-4">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          {topic.is_pinned && <span className='badge' style={{ background: '#fff3e0', color: '#e65100', fontSize: '.7rem' }}>📌 Épinglé</span>}
                          {topic.is_resolved && <span className='badge' style={{ background: '#e8f5e9', color: '#1b5e20', fontSize: '.7rem' }}>✅ Résolu</span>}
                          <span className='badge' style={{ background: (CATEGORY_COLORS[topic.category] || '#1565c0') + '22', color: CATEGORY_COLORS[topic.category] || '#1565c0', fontSize: '.7rem' }}>
                            {CATEGORY_LABELS[topic.category] || topic.category}
                          </span>
                        </div>
                        <h5 className='fw-bold mb-1' style={{ color: '#1a1a2e', fontSize: '1rem' }}>{topic.title}</h5>
                        <div className='dw-flex align-items-center gap-3' style={{ fontSize: '.78rem', color: '#888' }}>
                          <span><i className="fas fa-user me-1"></i>{topic.author.first_name} {topic.author.last_name}
                            {topic.author.user_type === 'agent' && <span className='badge ms-1' style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '.65rem' }}>Agent</span>}
                          </span>
                          <span><i className="fas fa-calendar me-1"></i>{formatDate(topic.created_at)}</span>
                          <span><i className="fas fa-eye me-1"></i>{topic.views}</span>
                        </div>
                        {topic.tags.length > 0 && (
                          <div className="mt-2 d-flex gap-1 flex-wrap">
                            {topic.tags.map(tag => <span key={tag.id} className='badge' style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '.68rem' }}>#{tag.name}</span>)}
                          </div>
                        )}
                      </div>
                      <div className='d-flex flex-column align-items-center gap-2 ms-3' style={{ minWidth: '60px' }}>
                        <button onClick={e => voteTopic(topic.id, e)} className="btn btn-sm"
                          style={{ background: topic.has_voted ? '#1565c0' : '#e3f2fd', color: topic.has_voted ? '#fff' : '#1565c0', border: 'none', borderRadius: '8px' }}>
                          <i className="fas fa-thumbs-up me-1"></i>{topic.votes_count}
                        </button>
                        <div style={{ textAlign: 'center', fontSize: '.72rem', color: '#888' }}>
                          <i className="fas fa-comment me-1"></i>{topic.replies_count}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className='modal fade show d-block' style={{ background: 'rgba(0,0,0,.5)', zIndex: 1050 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className='modal-header' style={{ background: 'linear-gradient(90deg,#0d2b4e,#1565c0)', color: '#fff' }}>
                <h5 className="modal-title fw-bold"><i className="fas fa-plus-circle me-2"></i>Nouveau sujet</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {createError && <div className="alert alert-danger py-2 mb-3">{createError}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Titre *</label>
                  <input type="text" className="form-control" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Quand seront réparés les lampadaires du port ?" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Catégorie *</label>
                  <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    <option value="questions">🏛️ Questions aux agents municipaux</option>
                    <option value="suggestions">💡 Suggestions amélioration</option>
                    <option value="debates">🗣️ Débats citoyens</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Contenu *</label>
                  <textarea className="form-control" rows={5} value={newContent} onChange={e => setNewContent(e.target.value)}
                    placeholder="Décrivez votre sujet en détail..." />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Tags <span className="text-muted fw-normal">(séparés par virgules)</span></label>
                  <input type="text" className="form-control" value={newTags} onChange={e => setNewTags(e.target.value)}
                    placeholder="Ex: voirie, éclairage, port" />
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={createTopic} disabled={creating}>
                  {creating ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi...</> : <><i className="fas fa-paper-plane me-2"></i>Publier</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
