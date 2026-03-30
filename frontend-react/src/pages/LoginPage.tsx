import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storeTokens } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

type TokenResponse = {
  access: string
  refresh: string
  is_staff: boolean
  is_superuser: boolean
  user_type?: 'agent' | string
}

const CSS = `
.lp-root{min-height:100vh;background:#0f1117;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",sans-serif}
.lp-card{width:100%;max-width:400px;background:#1a1d27;border-radius:16px;padding:44px 40px 36px;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.lp-icon{width:52px;height:52px;background:#2563eb;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:1.5rem;color:#fff}
.lp-title{text-align:center;color:#f0f2f5;font-size:1.25rem;font-weight:700;margin-bottom:4px}
.lp-sub{text-align:center;color:#6b7280;font-size:.82rem;margin-bottom:32px}
.lp-label{display:block;font-size:.78rem;color:#9ca3af;margin-bottom:6px;font-weight:500}
.lp-input{width:100%;background:#0f1117;border:1.5px solid #2a2d3a;border-radius:8px;padding:11px 14px;font-size:.9rem;color:#e5e7eb;outline:none;box-sizing:border-box;transition:border-color .2s}
.lp-input:focus{border-color:#2563eb}
.lp-input::placeholder{color:#4b5563}
.lp-btn{width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:12px;font-size:.95rem;font-weight:600;cursor:pointer;margin-top:8px;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.lp-btn:hover:not(:disabled){background:#1d4ed8}
.lp-btn:disabled{opacity:.6;cursor:not-allowed}
.lp-links{display:flex;justify-content:center;gap:20px;margin-top:22px}
.lp-links a{color:#6b7280;font-size:.82rem;text-decoration:none;transition:color .2s}
.lp-links a:hover{color:#9ca3af}
.lp-error{background:#2d1515;border:1px solid #7f1d1d;border-radius:8px;padding:10px 14px;color:#fca5a5;font-size:.82rem;margin-top:14px}
.lp-field{margin-bottom:18px}
.lp-lang{display:flex;justify-content:center;gap:8px;margin-bottom:24px}
.lp-lang-btn{background:none;border:1px solid #2a2d3a;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.78rem;color:#6b7280;display:flex;align-items:center;gap:5px;transition:all .2s}
.lp-lang-btn:hover,.lp-lang-btn.active{border-color:#2563eb;color:#93c5fd}
`

export default function LoginPage() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useI18n()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = CSS
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedPassword = localStorage.getItem('rememberedPassword')
    if (savedEmail && savedPassword) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const raw = await res.text()

      let data: Partial<TokenResponse> & { detail?: string } | null = null
      if (raw) {
        try {
          data = JSON.parse(raw) as Partial<TokenResponse> & { detail?: string }
        } catch {
          // Backend might return HTML/text on failure; keep error generic.
        }
      }

      if (!res.ok) {
        throw new Error(data?.detail || raw || 'Erreur de connexion.')
      }

      if (!data?.access || !data?.refresh) {
        throw new Error(data?.detail || 'Réponse invalide du serveur.')
      }

      storeTokens({
        access: data.access as string,
        refresh: data.refresh as string,
      })

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
        localStorage.setItem('rememberedPassword', password)
      } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberedPassword')
      }

      // Role-based redirection
      if (data.is_staff || data.is_superuser || data.user_type === 'supervisor') {
        if (email === 'admin@kelibiasmartcity.tn' || data.user_type === 'supervisor') {
          window.location.href = '/admin/'
        } else {
          navigate('/agent-dashboard')
        }
      } else if (data.user_type === 'agent') {
        navigate('/agent-dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-icon">
          <i className="fas fa-city"></i>
        </div>
        <div className="lp-title">Kélibia Smart City</div>
        <div className="lp-sub">{t('portal_title')}</div>

        <div className="lp-lang">
          <button className={`lp-lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>
            <img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" /> FR
          </button>
          <button className={`lp-lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>
            <img src="https://flagcdn.com/w20/tn.png" width="16" alt="TN" /> عربي
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="lp-field">
            <label className="lp-label" htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              className="lp-input"
              placeholder="nom@exemple.com"
              required
              value={email}
              onChange={ev => setEmail(ev.target.value)}
            />
          </div>

          <div className="lp-field" style={{ position: 'relative' }}>
            <label className="lp-label" htmlFor="password">{t('password_label')}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="lp-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={ev => setPassword(ev.target.value)}
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, marginTop: -4 }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={ev => setRememberMe(ev.target.checked)}
              style={{ accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: '.8rem', color: '#6b7280', cursor: 'pointer', userSelect: 'none' }}>
              {t('remember_me')}
            </label>
          </div>

          <button className="lp-btn" type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />}
            {t('login_btn')}
          </button>

          {error && <div className="lp-error">{error}</div>}
        </form>

        <div className="lp-links">
          <Link to="/signup">{t('create_account')}</Link>
          <Link to="/forgot-password">{t('forgot_password')}</Link>
        </div>
      </div>
    </div>
  )
}
