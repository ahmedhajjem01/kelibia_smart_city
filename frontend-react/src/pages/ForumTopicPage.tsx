import { resolveBackendUrl } from '../lib/backendUrl'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

interface Tag { id: number; name: string }
interface Author { id: number; first_name: string; last_name: string; email: string; user_type: string }
interface Reply {
  id: number; content: string; author: Author; created_at: string
  votes_count: number; has_voted: boolean
}
interface TopicDetail {
  id: number; title: string; content: string; category: string
  author: Author; tags: Tag[]
  is_pinned: boolean; is_resolved: boolean; views: number
  replies_count: number; votes_count: number; has_voted: boolean
  created_at: string; replies: Reply[]
}

const CATEGORY_LABELS: Record<string, string> = {
  questions: '🏛️ Questions aux agents',
  suggestions: '💡 Suggestions',
  debates: '🗣️ Débats citoyens',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Avatar({ user }: { user: Author }) {
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
  const bg = user.user_type === 'agent' ? '#1565c0' : '#2e7d32'
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export default function ForumTopicPage() {
  const { id } = useParams<{ id: string }>()
  const { setLang } = useI18n()
  const navigate = useNavigate()

  const [topic, setTopic]         = useState<TopicDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  const access = getAccessToken()

  useEffect(() => {
    if (!access) { navigate('/login'); return }
    fetchTopic()
    fetchMe()
  }, [id])

  async function fetchTopic() {
    setLoading(true)
    const res = await fetch(`/api/forum/topics/${id}/`, { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) setTopic(await res.json())
    setLoading(false)
  }

  async function fetchMe() {
    const res = await fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) setCurrentUser((await res.json()) as { user_type?: string; is_staff?: boolean; is_superuser?: boolean; is_verified?: boolean })
  }

  async function submitReply() {
    if (!replyText.trim()) { setError('La réponse ne peut pas être vide.'); return }
    setSending(true); setError('')
    const res = await fetch(`/api/forum/topics/${id}/reply/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText }),
    })
    if (res.ok) { setReplyText(''); fetchTopic() }
    else setError("Erreur lors de l'envoi de la reponse.")
    setSending(false)
  }

  async function voteTopic() {
    await fetch(`/api/forum/topics/${id}/vote/`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } })
    fetchTopic()
  }

  async function voteReply(replyId: number) {
    await fetch(`/api/forum/replies/${replyId}/vote/`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } })
    fetchTopic()
  }

  async function togglePin() {
    await fetch(`/api/forum/topics/${id}/pin/`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } })
    fetchTopic()
  }

  async function toggleResolve() {
    await fetch(`/api/forum/topics/${id}/resolve/`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } })
    fetchTopic()
  }

  const isAgentOrAdmin = currentUser?.user_type === 'agent' || currentUser?.user_type === 'supervisor' || currentUser?.is_staff || currentUser?.is_superuser

  if (loading) return (
    <div className='d-flex align-items-center justify-content-center' style={{ minHeight: '100vh' }}>
      <div className="spinner-border text-primary"></div>
    </div>
  )

  if (!topic) return (
    <div className="container mt-5 text-center">
      <p className="text-muted">Sujet introuvable.</p>
      <Link to="/forum" className="btn btn-primary">Retour au forum</Link>
    </div>
  )

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to={isAgentOrAdmin ? "/agent-dashboard" : "/dashboard"}>
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
            <Link to="/forum" className="btn btn-outline-light btn-sm">
              <i className="fas fa-arrow-left me-1"></i>Forum
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mt-4 mb-5" style={{ maxWidth: '860px' }}>

        {/* BREADCRUMB */}
        <nav className="mb-3" style={{ fontSize: '.82rem' }}>
          <Link to={isAgentOrAdmin ? "/agent-dashboard" : "/dashboard"} style={{ color: '#1565c0' }}>{isAgentOrAdmin ? "Accueil Agent" : "Accueil"}</Link>
          <span className="mx-2 text-muted">/</span>
          <Link to="/forum" style={{ color: '#1565c0' }}>Forum</Link>
          <span className="mx-2 text-muted">/</span>
          <span className="text-muted">{topic.title.slice(0, 40)}{topic.title.length > 40 ? '...' : ''}</span>
        </nav>

        {/* TOPIC CARD */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-start gap-3">
              <Avatar user={topic.author} />
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                  {topic.is_pinned && <span className='badge' style={{ background: '#fff3e0', color: '#e65100' }}>📌 Épinglé</span>}
                  {topic.is_resolved && <span className='badge' style={{ background: '#e8f5e9', color: '#1b5e20' }}>✅ Résolu</span>}
                  <span className="badge bg-primary">{CATEGORY_LABELS[topic.category] || topic.category}</span>
                </div>
                <h2 className="fw-bold mb-2" style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>{topic.title}</h2>
                <div className="d-flex gap-3 mb-3" style={{ fontSize: '.78rem', color: '#888' }}>
                  <span><i className="fas fa-user me-1"></i>{topic.author.first_name} {topic.author.last_name}
                    {topic.author.user_type === 'agent' && <span className='badge ms-1' style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '.65rem' }}>Agent</span>}
                  </span>
                  <span><i className="fas fa-calendar me-1"></i>{formatDate(topic.created_at)}</span>
                  <span><i className="fas fa-eye me-1"></i>{topic.views} vues</span>
                </div>
                {topic.tags.length > 0 && (
                  <div className="d-flex gap-1 flex-wrap mb-3">
                    {topic.tags.map(tag => <span key={tag.id} className='badge' style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '.72rem' }}>#{tag.name}</span>)}
                  </div>
                )}
                <div style={{ lineHeight: 1.7, color: '#333', fontSize: '.92rem', whiteSpace: 'pre-wrap' }}>{topic.content}</div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mt-4 pt-3 border-top flex-wrap gap-2">
              <div className="d-flex gap-2 align-items-center">
                <button onClick={voteTopic} className="btn btn-sm"
                  style={{ background: topic.has_voted ? '#1565c0' : '#e3f2fd', color: topic.has_voted ? '#fff' : '#1565c0', border: 'none', borderRadius: '8px' }}>
                  <i className="fas fa-thumbs-up me-1"></i>{topic.votes_count} j’aime
                </button>
                <span style={{ fontSize: '.78rem', color: '#888' }}>
                  <i className="fas fa-comment me-1"></i>{topic.replies_count} réponse(s)
                </span>
              </div>
              {isAgentOrAdmin && (
                <div className="d-flex gap-2">
                  <button onClick={togglePin} className={`btn btn-sm ${topic.is_pinned ? 'btn-warning' : 'btn-outline-warning'}`}>
                    <i className="fas fa-thumbtack me-1"></i>{topic.is_pinned ? 'Désépingler' : 'Épingler'}
                  </button>
                  <button onClick={toggleResolve} className={`btn btn-sm ${topic.is_resolved ? 'btn-success' : 'btn-outline-success'}`}>
                    <i className="fas fa-check-circle me-1"></i>{topic.is_resolved ? 'Non résolu' : 'Marquer résolu'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REPLIES */}
        <h5 className="fw-bold mb-3" style={{ color: '#1a1a2e' }}>
          <i className="fas fa-comments me-2" style={{ color: '#1565c0' }}></i>
          {topic.replies.length} Réponse(s)
        </h5>

        {topic.replies.length === 0 ? (
          <div className="text-center py-4 text-muted mb-4" style={{ background: '#f8f9fa', borderRadius: '12px' }}>
            <i className="fas fa-comment-slash" style={{ fontSize: '2rem', opacity: .3, display: 'block', marginBottom: '8px' }}></i>
            Aucune réponse pour le moment. Soyez le premier à répondre !
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {topic.replies.map((reply, index) => (
              <div key={reply.id} className="card border-0 shadow-sm">
                <div className="card-body p-3 px-4">
                  <div className="d-flex gap-3 align-items-start">
                    <Avatar user={reply.author} />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-semibold" style={{ color: '#1a1a2e' }}>
                          {reply.author.first_name} {reply.author.last_name}
                        </span>
                        {reply.author.user_type === 'agent' && (
                          <span className='badge' style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '.65rem' }}>
                            <i className="fas fa-id-badge me-1"></i>Agent Municipal
                          </span>
                        )}
                        <span style={{ fontSize: '.72rem', color: '#aaa' }}>#{index + 1}</span>
                      </div>
                      <div style={{ fontSize: '.78rem', color: '#aaa', marginBottom: '8px' }}>
                        <i className="fas fa-clock me-1"></i>{formatDate(reply.created_at)}
                      </div>
                      <div style={{ lineHeight: 1.7, color: '#333', fontSize: '.9rem', whiteSpace: 'pre-wrap' }}>{reply.content}</div>
                      <div className="mt-2">
                        <button onClick={() => voteReply(reply.id)} className="btn btn-sm"
                          style={{ background: reply.has_voted ? '#e3f2fd' : '#f8f9fa', color: reply.has_voted ? '#1565c0' : '#888', border: 'none', fontSize: '.75rem', borderRadius: '6px' }}>
                          <i className="fas fa-thumbs-up me-1"></i>{reply.votes_count}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPLY FORM */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3" style={{ color: '#1a1a2e' }}>
              <i className="fas fa-reply me-2" style={{ color: '#1565c0' }}></i>Votre réponse
            </h6>
            {currentUser && !currentUser.is_verified ? (
              <div className="alert alert-info border-0 shadow-sm rounded-4 text-center py-4">
                <i className="fas fa-user-clock fs-3 mb-3 text-info d-block"></i>
                <h6 className="fw-bold">{t('account_pending_verification')}</h6>
                <p className="small mb-0 opacity-75">{t('account_pending_verification_desc')}</p>
              </div>
            ) : (
              <>
                <textarea className="form-control mb-3" rows={4} value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Écrivez votre réponse ici..." />
                <button onClick={submitReply} className="btn btn-primary" disabled={sending}>
                  {sending ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi...</> : <><i className="fas fa-paper-plane me-2"></i>Envoyer la réponse</>}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
