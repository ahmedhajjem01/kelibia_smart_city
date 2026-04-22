import { resolveBackendUrl } from '../lib/backendUrl'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken, clearTokens } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'
import fortImg from '../assets/fort.webp'

interface Tag { id: number; name: string }
interface Author { id: number; first_name: string; last_name: string; email: string; user_type: string }
interface Topic {
  id: number; title: string; category: string; author: Author; tags: Tag[]
  is_pinned: boolean; is_resolved: boolean; views: number
  replies_count: number; votes_count: number; has_voted: boolean; created_at: string
}
interface Stats { total_topics: number; total_replies: number; active_members: number }

type UserInfo = {
  first_name: string
  last_name: string
  email: string
  is_verified: boolean
  user_type?: string
  is_staff?: boolean
  is_superuser?: boolean
}

type SortKey = 'recent' | 'votes' | 'replies'

const CATEGORY_LABELS: Record<string, string> = {
  questions: '🏛️ Questions aux agents',
  suggestions: '💡 Suggestions',
  debates: '🗣️ Débats citoyens',
}
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  questions: { bg: '#dbeafe', text: '#1e40af' },
  suggestions: { bg: '#dcfce7', text: '#166534' },
  debates: { bg: '#f3e8ff', text: '#6b21a8' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ForumPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [user, setUser]           = useState<UserInfo | null>(null)
  const [topics, setTopics]       = useState<Topic[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [tags, setTags]           = useState<Tag[]>([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState('')
  const [search, setSearch]       = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [notifCount, setNotifCount] = useState(0)
  const [sortBy, setSortBy]       = useState<SortKey>('recent')

  const [newTitle, setNewTitle]       = useState('')
  const [newContent, setNewContent]   = useState('')
  const [newCategory, setNewCategory] = useState('questions')
  const [newTags, setNewTags]         = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState('')

  const access = getAccessToken()

  useEffect(() => {
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data) })
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
    if (res.ok) {
      const data = await res.json()
      setTopics(Array.isArray(data) ? data : (data.results || []))
    }
  }

  async function fetchStats() {
    const res = await fetch(resolveBackendUrl('/api/forum/stats/'), { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) {
      const data = await res.json()
      setStats(Array.isArray(data) ? data[0] : (data.results ? data.results[0] : data))
    }
  }

  async function fetchTags() {
    const res = await fetch(resolveBackendUrl('/api/forum/tags/'), { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) setTags(await res.json())
  }

  async function fetchNotifCount() {
    const res = await fetch(resolveBackendUrl('/api/forum/notifications/'), { headers: { Authorization: `Bearer ${access}` } })
    if (res.ok) {
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.results || [])
      setNotifCount(list.filter((n: any) => !n.is_read).length)
    }
  }

  async function createTopic() {
    if (!newTitle.trim() || !newContent.trim()) { setCreateError('Titre et contenu requis.'); return }
    setCreating(true); setCreateError('')
    const tagNames = newTags.split(',').map((tt: string) => tt.trim()).filter(Boolean)
    const res = await fetch(resolveBackendUrl('/api/forum/topics/'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory, tag_names: tagNames }),
    })
    if (res.ok) {
      const topic = await res.json()
      setNewTitle(''); setNewContent(''); setNewTags('')
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

  function logout() {
    clearTokens()
    navigate('/login')
  }

  const sortedTopics = [...topics].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    if (sortBy === 'votes') return b.votes_count - a.votes_count
    if (sortBy === 'replies') return b.replies_count - a.replies_count
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  /* ── Right sidebar ── */
  const rightSidebar = (
    <div className={`space-y-4 pt-4 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Launch discussion button */}
      <button
        onClick={() => {
          if (!user?.is_verified) {
            alert(t('account_pending_verification_desc'))
            return
          }
          setShowModal(true)
        }}
        className={`w-full py-3 text-white font-black text-sm tracking-wide rounded-xl shadow-lg flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform relative overflow-hidden border-0 cursor-pointer ${!user?.is_verified ? 'opacity-70 grayscale' : ''}`}
        style={{ 
          background: 'linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%)', 
          boxShadow: user?.is_verified ? '0 10px 30px rgba(180,122,80,0.3)' : 'none' 
        }}
      >
        <span>{t('start_discussion')}</span>
        <i className={`fas fa-comment-plus absolute ${lang === 'ar' ? 'left-6' : 'right-6'} opacity-20 text-2xl`}></i>
      </button>

      {user && !user.is_verified && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-amber-800 text-[11px] font-medium animate-pulse">
           <i className="fas fa-info-circle me-1"></i> {t('account_pending_verification_desc')}
        </div>
      )}

      {/* Categories */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4 uppercase tracking-widest text-xs">
          {t('category_label')}
        </h4>
        <ul className="space-y-3 list-none p-0 m-0">
          {[
            { key: 'questions', icon: 'fas fa-landmark', label: t('questions_agents'), count: topics.filter(t => t.category === 'questions').length },
            { key: 'suggestions', icon: 'fas fa-lightbulb', label: t('suggestions_amelioration'), count: topics.filter(t => t.category === 'suggestions').length },
            { key: 'debates', icon: 'fas fa-comments', label: t('debates_citoyens'), count: topics.filter(t => t.category === 'debates').length },
          ].map(cat => (
            <li key={cat.key}
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setCategory(category === cat.key ? '' : cat.key)}
            >
              <div className={`flex items-center gap-3 text-sm transition-colors ${category === cat.key ? 'font-bold' : 'text-slate-600'}`}
                style={{ color: category === cat.key ? '#d4aa8d' : undefined }}>
                <i className={`${cat.icon} w-5 text-center text-slate-400`}></i>
                <span>{cat.label}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 ${lang === 'ar' ? 'mr-auto' : 'ml-auto'}`}>{cat.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Stats */}
      {stats && (
        <div className="p-4 rounded-xl text-white" style={{ backgroundColor: '#1e293b' }}>
          <h4 className="font-bold border-b border-white/10 pb-4 mb-4 uppercase tracking-widest text-xs">
            {t('forum_stats')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: stats.total_topics, label: t('total_topics_stats') },
              { val: stats.active_members, label: t('active_members_stats') },
              { val: stats.total_replies, label: t('total_replies_stats'), wide: true },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 ${s.wide ? 'col-span-2' : ''}`} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-lg font-black" style={{ color: '#d4aa8d' }}>{s.val}</span>
                <span className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification badge */}
      {notifCount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
          <i className="fas fa-bell" style={{ color: '#d4aa8d' }}></i>
          <span className="text-sm font-bold" style={{ color: '#b87a50' }}>{notifCount} {t('notifications')}</span>
        </div>
      )}
    </div>
  )

  return (
    <MainLayout
      user={user}
      onLogout={logout}
      breadcrumbs={[{ label: t('forum') || 'Forum Citoyen' }]}
      showHero={false}
      rightSidebar={rightSidebar}
    >
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''}>
        {/* ── HERO BANNER ── */}
        <div className="relative w-full overflow-hidden rounded-xl mb-4" style={{ height: '160px' }}>
          <img src={fortImg} alt="Forum" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,28,58,0.4), rgba(0,28,58,0.72))' }}></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <h1 className="font-black text-white uppercase tracking-tight mb-0"
              style={{ fontFamily: 'Public Sans, sans-serif', fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>
              {lang === 'ar' ? 'المنتدى المجتمعي' : 'Forum Communautaire'}
            </h1>
            <p className="text-white uppercase tracking-widest mt-2" style={{ opacity: 0.75, fontSize: '.68rem' }}>
              {t('forum_desc')}
            </p>
          </div>
        </div>

        {/* ── SEARCH & FILTERS ── */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <i className={`fas fa-search absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 text-xs`}></i>
            <input
              type="text"
              className={`w-full ${lang === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-slate-50 border-0 rounded-xl text-xs focus:ring-2 focus:outline-none`}
              style={{ '--tw-ring-color': 'rgba(241,130,33,0.2)' } as any}
              placeholder={t('search_topics_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: '', label: t('all_label') },
              { key: 'recent', label: t('recent_topics'), isSortBtn: true, sortVal: 'recent' as SortKey },
              { key: 'votes', label: t('popular_topics'), isSortBtn: true, sortVal: 'votes' as SortKey },
            ] as any[]).map(btn => (
              <button
                key={btn.key}
                onClick={() => btn.isSortBtn ? setSortBy(btn.sortVal) : setCategory(btn.key)}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
                style={
                  (btn.isSortBtn ? sortBy === btn.sortVal : category === btn.key)
                    ? { backgroundColor: '#d4aa8d', color: 'white' }
                    : { backgroundColor: '#f1f5f9', color: '#475569' }
                }
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CATEGORY FILTER BUTTONS ── */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { key: '', label: `📋 ${t('all_label')}`, color: '#64748b' },
            { key: 'questions', label: `🏛️ ${t('questions_agents')}`, color: '#1e40af' },
            { key: 'suggestions', label: `💡 ${t('suggestions_amelioration')}`, color: '#166534' },
            { key: 'debates', label: `🗣️ ${t('debates_citoyens')}`, color: '#6b21a8' },
          ].map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
              style={
                category === c.key
                  ? { backgroundColor: c.color, color: 'white' }
                  : { backgroundColor: '#f1f5f9', color: c.color }
              }
            >
              {c.label}
            </button>
          ))}

          {/* Sort buttons */}
          <div className={`flex items-center gap-1 ${lang === 'ar' ? 'me-auto' : 'ms-auto'}`}>
            <span className="text-xs text-slate-400 me-1"><i className="fas fa-sort me-1"></i>{t('sort_by')}</span>
            {([
              { key: 'recent', label: t('recent_topics') },
              { key: 'replies', label: t('most_active') },
            ] as { key: SortKey; label: string }[]).map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className="px-3 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer"
                style={sortBy === s.key ? { backgroundColor: '#d4aa8d', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#475569' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAGS ── */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {tags.slice(0, 15).map(tag => (
              <span
                key={tag.id}
                onClick={() => setActiveTag(activeTag === tag.name ? '' : tag.name)}
                className="px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors"
                style={
                  activeTag === tag.name
                    ? { backgroundColor: '#d4aa8d', color: 'white' }
                    : { backgroundColor: '#dbeafe', color: '#1e40af' }
                }
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* ── TOPICS LIST ── */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner-border text-primary mb-3"></div>
            <p className="text-slate-400 text-sm">{t('loading_forum')}</p>
          </div>
        ) : sortedTopics.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <i className="fas fa-inbox text-5xl opacity-30 block mb-3"></i>
            <p>{t('no_topics_found')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTopics.map((topic, idx) => {
              const catColor = CATEGORY_COLORS[topic.category] || { bg: '#dbeafe', text: '#1e40af' }
              return (
                <Link
                  key={topic.id}
                  to={`/forum/${topic.id}`}
                  className="block no-underline"
                >
                  <div
                    className="bg-white p-3 rounded-xl shadow-sm border border-transparent hover:border-blue-200 transition-all group"
                    style={{ [lang === 'ar' ? 'borderRight' : 'borderLeft']: `4px solid ${catColor.text}` }}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2 w-full">
                        {/* Badges row */}
                        <div className="flex flex-wrap gap-2">
                          {topic.is_pinned && (
                            <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>📌 {t('pinned')}</span>
                          )}
                          {topic.is_resolved && (
                            <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: '#e8f5e9', color: '#1b5e20' }}>✅ {t('resolved')}</span>
                          )}
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: catColor.bg, color: catColor.text }}>
                            {t(topic.category === 'questions' ? 'questions_agents' : topic.category === 'suggestions' ? 'suggestions_amelioration' : 'debates_citoyens') || topic.category}
                          </span>
                          {/* Rank badge */}
                          {sortBy === 'votes' && idx < 3 && (
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: ['#d97706', '#9ca3af', '#92400e'][idx] }}>
                              #{idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-1">
                          {topic.title}
                        </h3>

                        {/* Author + meta */}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <i className="fas fa-user"></i>
                            {topic.author.first_name} {topic.author.last_name}
                            {topic.author.user_type === 'agent' && (
                              <span className="ms-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>{t('agent_badge')}</span>
                            )}
                          </span>
                          <span className="flex items-center gap-1"><i className="fas fa-calendar"></i>{formatDate(topic.created_at)}</span>
                          <span className="flex items-center gap-1"><i className="fas fa-eye"></i>{topic.views}</span>
                        </div>

                        {/* Tags */}
                        {topic.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {topic.tags.map(tag => (
                              <span key={tag.id} className="px-2 py-0.5 rounded text-[11px] font-bold"
                                style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: votes + replies + join button */}
                      <div className={`flex flex-row md:flex-col items-center gap-3 md:min-w-[80px] ${lang === 'ar' ? 'mr-auto' : 'ml-auto'}`}>
                        <button
                          onClick={e => voteTopic(topic.id, e)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
                          style={topic.has_voted
                            ? { backgroundColor: '#d4aa8d', color: 'white' }
                            : { backgroundColor: 'rgba(212,170,141,.1)', color: '#d4aa8d' }
                          }
                        >
                          <i className="fas fa-thumbs-up"></i>{topic.votes_count}
                        </button>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <i className="fas fa-comment"></i>{topic.replies_count}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-tighter hover:underline"
                          style={{ color: '#d4aa8d', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                          {t('join_discussion')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── CREATE TOPIC MODAL ── */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
              {/* Modal header */}
              <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg,#b87a50 0%,#d4aa8d 100%)' }}>
                <h5 className="font-bold text-white mb-0 flex items-center gap-2">
                  <i className="fas fa-plus-circle"></i>
                  {t('new_topic')}
                </h5>
                <button
                  className="bg-transparent border-0 text-white opacity-80 hover:opacity-100 cursor-pointer text-xl"
                  onClick={() => setShowModal(false)}
                >×</button>
              </div>

              {/* Modal body */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
                {createError && (
                  <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    {t('create_error')}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('topic_title')} *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'rgba(241,130,33,0.3)' } as any}
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder={t('reclamation_placeholder_title')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('topic_category')} *</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                    >
                      <option value="questions">🏛️ {t('questions_agents')}</option>
                      <option value="suggestions">💡 {t('suggestions_amelioration')}</option>
                      <option value="debates">🗣️ {t('debates_citoyens')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('topic_content')} *</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none resize-none"
                      rows={5}
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      placeholder={t('topic_content_placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('tags')} <span className="text-slate-400 font-normal">({t('add_tags')})</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
                      value={newTags}
                      onChange={e => setNewTags(e.target.value)}
                      placeholder={t('tags_placeholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 border-0 cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white border-0 cursor-pointer flex items-center gap-2 transition-opacity"
                  style={{ backgroundColor: '#d4aa8d', opacity: creating ? 0.7 : 1 }}
                  onClick={createTopic}
                  disabled={creating}
                >
                  {creating ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span>{t('sending')}</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i>{t('publish')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
