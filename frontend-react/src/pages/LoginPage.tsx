import { resolveBackendUrl } from '../lib/backendUrl'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storeTokens } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import logo from '../assets/logo.png'
import tunisiaLogo from '../assets/tunisia_log.png'

type TokenResponse = {
  access: string
  refresh: string
  is_staff: boolean
  is_superuser: boolean
  user_type?: 'agent' | string
}

const CSS = `
/* ── Root ── */
.lp-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
  overflow: hidden;
  font-family: "Public Sans", "Segoe UI", sans-serif;
  background: #0f1117;
}

/* ── Background image ── */
.lp-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.lp-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.4;
}
.lp-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(149,74,0,.45) 0%, transparent 60%, rgba(149,74,0,.25) 100%);
}

/* ── Container ── */
.lp-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 960px;
  display: grid;
  grid-template-columns: 1fr;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,.35);
}
@media (min-width: 768px) {
  .lp-container { grid-template-columns: 7fr 5fr; }
}

/* ── Hero side ── */
.lp-hero {
  display: none;
  background: rgba(149,74,0,.82);
  backdrop-filter: blur(10px);
  padding: 48px 44px;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
}
@media (min-width: 768px) {
  .lp-hero { display: flex; }
}
.lp-hero-brand { display: flex; align-items: center; gap: 14px; }
.lp-hero-logo { height: 56px; width: auto; }
.lp-hero-brand-name { font-size: 1.5rem; font-weight: 800; text-transform: uppercase; line-height: 1.1; }
.lp-hero-brand-sub { font-size: .72rem; letter-spacing: 2px; text-transform: uppercase; opacity: .8; }
.lp-hero-headline { font-size: 2.8rem; font-weight: 900; line-height: 1.1; }
.lp-hero-accent { color: #ffb785; white-space: nowrap; }
.lp-hero-desc { font-size: 1rem; opacity: .82; line-height: 1.65; margin-top: 18px; }
.lp-hero-badges { display: flex; align-items: center; gap: 28px; }
.lp-hero-badge { display: flex; align-items: center; gap: 7px; font-size: .8rem; font-weight: 700; text-transform: uppercase; opacity: .9; }
.lp-hero-badge i { color: #ffb785; }

/* ── Form side ── */
.lp-form-side {
  background: rgba(255,255,255,.94);
  backdrop-filter: blur(18px);
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.lp-lang-wrap { display: flex; justify-content: flex-end; margin-bottom: 28px; }
.lp-lang-pill { background: #e7e7f1; border-radius: 999px; padding: 4px; display: flex; }
.lp-lang-opt { border: none; background: none; border-radius: 999px; padding: 5px 16px; font-size: .75rem; font-weight: 700; cursor: pointer; color: #6b7280; }
.lp-lang-opt.active { background: #954a00; color: #fff; }
.lp-mobile-logo { display: flex; justify-content: center; margin-bottom: 20px; }
.lp-mobile-logo img { height: 44px; }
@media (min-width: 768px) { .lp-mobile-logo { display: none; } }
.lp-greeting { margin-bottom: 28px; }
.lp-greeting h2 { font-size: 1.55rem; font-weight: 800; color: #191b22; margin-bottom: 6px; }
.lp-greeting p { font-size: .88rem; color: #6b7280; margin: 0; }
.lp-field { margin-bottom: 18px; }
.lp-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #564336;
  margin-bottom: 7px;
  transition: color 0.2s;
}
.lp-label i {
  color: #564336;
  font-size: .85rem;
  transition: color 0.2s;
}
.lp-field:focus-within .lp-label i {
  color: #954a00;
}
.lp-input {
  width: 100%;
  background: #e7e7f1;
  border: none;
  border-radius: 10px;
  padding: 13px 16px;
  font-size: .9rem;
  color: #191b22;
  outline: none;
  box-sizing: border-box;
  transition: box-shadow .2s, background .2s;
}
.lp-input::placeholder { color: #9ca3af; }
.lp-input:focus { background: #fff; box-shadow: 0 0 0 2px #954a00; }
.lp-input-wrap { position: relative; }
.lp-eye { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #897364; cursor: pointer; }
.lp-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.lp-remember { display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: .82rem; color: #6b7280; }
.lp-forgot { font-size: .82rem; color: #954a00; font-weight: 700; text-decoration: none; }
.lp-btn { width: 100%; background: linear-gradient(135deg, #954a00 0%, #f18221 100%); color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: .95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
.lp-error { background: #ffdad6; border: 1px solid #ba1a1a; border-radius: 10px; padding: 11px; color: #93000a; font-size: .83rem; margin-top: 14px; }
.lp-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
.lp-divider-line { flex: 1; height: 1px; background: rgba(0,0,0,.1); }
.lp-divider-txt { font-size: .7rem; font-weight: 700; text-transform: uppercase; color: #897364; }
.lp-alt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lp-alt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 14px;
  border: 1.5px solid rgba(137,115,100,.3);
  border-radius: 10px;
  background: none;
  font-size: .82rem;
  font-weight: 600;
  color: #191b22;
  cursor: pointer;
  transition: background .2s, border-color .2s;
  font-family: inherit;
}
.lp-alt-btn:hover { background: #f2f3fd; border-color: #ddc1b0; }
.lp-alt-btn i { font-size: 1rem; }
.lp-alt-btn .icon-blue { color: #175ead; }
.lp-alt-btn .icon-orange { color: #954a00; }
.lp-footer { margin-top: 20px; text-align: center; }
.lp-footer p { font-size: .72rem; color: #9ca3af; margin: 4px 0; }
.lp-signup-link { font-size: .78rem; color: #6b7280; }
.lp-signup-link a { color: #954a00; font-weight: 600; text-decoration: none; }
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
      const res = await fetch(resolveBackendUrl('/api/token/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const raw = await res.text()
      let data: Partial<TokenResponse> & { detail?: string } | null = null
      if (raw) {
        try { data = JSON.parse(raw) as Partial<TokenResponse> & { detail?: string } } catch { /* ignore */ }
      }

      if (!res.ok) throw new Error(data?.detail || raw || t('error_msg'))
      if (!data?.access || !data?.refresh) throw new Error(data?.detail || t('retrieval_error'))

      storeTokens({ access: data.access as string, refresh: data.refresh as string })

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
        localStorage.setItem('rememberedPassword', password)
      } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberedPassword')
      }

      if (data.is_staff || data.is_superuser || data.user_type === 'supervisor' || data.user_type === 'agent') {
        navigate('/agent-dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_msg'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-root">
      <style>{CSS}</style>

      {/* Background */}
      <div className="lp-bg">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOK4NOsrgsp-7XZZsRks3tpwcQfxiLaK9BLKPLGysOqi9B4Be--eGvYLPbbIFV6dc7-hLPuvXRlY7HheSreAP2qvCU3wDdMA9a-3Dv_SOFTwoO8MNLu_9aYbUk6Bo-rKqMzo3ff_7xbYsWzYNXbw1eDkJlsYtce8Q1KTjckP2T3NM2wpEJxpP3EpzSd3jeKl8P0tiK4lbHLRLfrJ_PEBUUKum0kOSE15G0rCmPfJ-VM3fGpC3qVjB2bLMWS1sP-rhdl-cvddrc9IbZ"
          alt="Background"
        />
        <div className="lp-bg-overlay"></div>
      </div>

      {/* Card */}
      <div className="lp-container">

        {/* ── Hero side ── */}
        <div className="lp-hero">
          <div className="lp-hero-brand">
            <img
              className="lp-hero-logo"
              src={tunisiaLogo}
              alt="Logo"
            />
            <div>
              <div className="lp-hero-brand-name">{t('republic_of_tunisia')}</div>
              <div className="lp-hero-brand-sub">{t('portal_title')}</div>
            </div>
          </div>

          <div>
            <div className="lp-hero-headline">
              {t('hero_headline_1')}<br />
              <span className="lp-hero-accent">{t('hero_headline_2')}</span>
            </div>
            <p className="lp-hero-desc">
              {t('hero_desc')}
            </p>
          </div>

          <div className="lp-hero-badges">
            <div className="lp-hero-badge">
              <i className="fas fa-shield-alt"></i> {t('secure')}
            </div>
            <div className="lp-hero-badge">
              <i className="fas fa-language"></i> {t('multilingual')}
            </div>
          </div>
        </div>

        {/* ── Form side ── */}
        <div className="lp-form-side">

          {/* Language toggle */}
          <div className="lp-lang-wrap">
            <div className="lp-lang-pill">
              <button className={`lp-lang-opt${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>FR</button>
              <button className={`lp-lang-opt${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>عربي</button>
            </div>
          </div>

          {/* Mobile logo */}
          <div className="lp-mobile-logo">
            <img src={tunisiaLogo} alt="Logo" />
          </div>

          {/* Greeting */}
          <div className="lp-greeting">
            <h2>{t('welcome_title')}</h2>
            <p>{t('welcome_subtitle')}</p>
          </div>

          <form onSubmit={onSubmit}>
            {/* Email */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="email">
                <i className="fas fa-at"></i> {t('email')}
              </label>
              <input
                id="email"
                type="email"
                className="lp-input"
                placeholder="nom@exemple.tn"
                required
                value={email}
                onChange={ev => setEmail(ev.target.value)}
              />
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="password">
                <i className="fas fa-lock"></i> {t('password_label')}
              </label>
              <div className="lp-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="lp-input"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={ev => setPassword(ev.target.value)}
                />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(p => !p)}>
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="lp-meta">
              <label className="lp-remember">
                <input type="checkbox" checked={rememberMe} onChange={ev => setRememberMe(ev.target.checked)} />
                <span>{t('remember_me')}</span>
              </label>
              <Link className="lp-forgot" to="/forgot-password">{t('forgot_password')}</Link>
            </div>

            {/* Submit */}
            <button className="lp-btn" type="submit" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm" role="status" />}
              {t('login_btn').toUpperCase()} <i className="fas fa-arrow-right"></i>
            </button>

            {error && <div className="lp-error">{error}</div>}
          </form>

          {/* Alt login */}
          <div className="lp-divider">
            <div className="lp-divider-line"></div>
            <span className="lp-divider-txt">{lang === 'ar' ? 'أو' : 'Ou'}</span>
            <div className="lp-divider-line"></div>
          </div>
          <div className="lp-alt-grid">
            <button className="lp-alt-btn">
              <i className="fas fa-id-card icon-blue"></i> {t('tunisia_id')}
            </button>
            <button className="lp-alt-btn">
              <i className="fas fa-qrcode icon-orange"></i> {t('scan_qr')}
            </button>
          </div>

          {/* Footer */}
          <div className="lp-footer">
            <p className="lp-signup-link">
              {t('not_registered_yet')} <Link to="/signup">{t('create_account')}</Link>
            </p>
            <p>{t('footer_text')}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
              <a href="#" style={{ fontSize: '.7rem', color: '#9ca3af', textDecoration: 'none' }}>{t('privacy')}</a>
              <a href="#" style={{ fontSize: '.7rem', color: '#9ca3af', textDecoration: 'none' }}>{t('assistance')}</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
