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
}
.lp-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(23,94,173,.45) 0%, transparent 60%, rgba(149,74,0,.25) 100%);
}

/* ── Glow blobs ── */
.lp-blob-br {
  position: fixed;
  bottom: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: rgba(149,74,0,.12);
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}
.lp-blob-tl {
  position: fixed;
  top: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: rgba(23,94,173,.1);
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
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
  background: rgba(23,94,173,.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 48px 44px;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
}
@media (min-width: 768px) {
  .lp-hero { display: flex; }
}
.lp-hero-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.lp-hero-logo { height: 56px; width: auto; }
.lp-hero-brand-name {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -.5px;
  text-transform: uppercase;
  line-height: 1.1;
}
.lp-hero-brand-sub {
  font-size: .72rem;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  opacity: .8;
  margin-top: 2px;
}
.lp-hero-headline {
  font-size: 2.8rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -.5px;
}
.lp-hero-accent { color: #ffb785; }
.lp-hero-desc {
  font-size: 1rem;
  opacity: .82;
  line-height: 1.65;
  max-width: 380px;
  margin-top: 18px;
}
.lp-hero-badges {
  display: flex;
  align-items: center;
  gap: 28px;
}
.lp-hero-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: .8rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: .9;
}
.lp-hero-badge i { color: #ffb785; font-size: 1rem; }

/* ── Form side ── */
.lp-form-side {
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  padding: 40px 36px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* ── Language toggle ── */
.lp-lang-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 28px;
}
.lp-lang-pill {
  background: #e7e7f1;
  border-radius: 999px;
  padding: 4px;
  display: flex;
  gap: 2px;
}
.lp-lang-opt {
  border: none;
  background: none;
  border-radius: 999px;
  padding: 5px 16px;
  font-size: .75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s;
  color: #6b7280;
  font-family: inherit;
}
.lp-lang-opt.active {
  background: #175ead;
  color: #fff;
  box-shadow: 0 2px 8px rgba(23,94,173,.25);
}

/* ── Mobile logo ── */
.lp-mobile-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.lp-mobile-logo img { height: 44px; }
@media (min-width: 768px) { .lp-mobile-logo { display: none; } }

/* ── Greeting ── */
.lp-greeting {
  margin-bottom: 28px;
}
.lp-greeting h2 {
  font-size: 1.55rem;
  font-weight: 800;
  color: #191b22;
  margin: 0 0 6px;
}
.lp-greeting p {
  font-size: .88rem;
  color: #564336;
  margin: 0;
  line-height: 1.5;
}

/* ── Fields ── */
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
}
.lp-label i { color: #954a00; font-size: .85rem; }
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
  font-family: inherit;
}
.lp-input::placeholder { color: #9ca3af; }
.lp-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px #954a00;
}
.lp-input-wrap { position: relative; }
.lp-input-wrap .lp-input { padding-right: 46px; }
.lp-eye {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #897364;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  font-size: .95rem;
}

/* ── Remember / Forgot ── */
.lp-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  gap: 8px;
}
.lp-remember {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}
.lp-remember input[type=checkbox] {
  accent-color: #954a00;
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.lp-remember span {
  font-size: .82rem;
  color: #6b7280;
  user-select: none;
}
.lp-forgot {
  font-size: .82rem;
  color: #175ead;
  font-weight: 700;
  text-decoration: none;
}
.lp-forgot:hover { text-decoration: underline; }

/* ── Submit button ── */
.lp-btn {
  width: 100%;
  background: linear-gradient(135deg, #954a00 0%, #f18221 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 14px 20px;
  font-size: .95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: opacity .2s, transform .1s;
  box-shadow: 0 4px 20px rgba(149,74,0,.3);
  letter-spacing: .5px;
  font-family: inherit;
}
.lp-btn:hover:not(:disabled) { opacity: .9; }
.lp-btn:active:not(:disabled) { transform: scale(.98); }
.lp-btn:disabled { opacity: .6; cursor: not-allowed; }

/* ── Error ── */
.lp-error {
  background: #ffdad6;
  border: 1px solid #ba1a1a;
  border-radius: 10px;
  padding: 11px 15px;
  color: #93000a;
  font-size: .83rem;
  margin-top: 14px;
}

/* ── Divider ── */
.lp-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
}
.lp-divider-line { flex: 1; height: 1px; background: rgba(137,115,100,.2); }
.lp-divider-txt {
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #897364;
  white-space: nowrap;
}

/* ── Alt login buttons ── */
.lp-alt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lp-alt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 14px;
  border: 1.5px solid rgba(137,115,100,.2);
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

/* ── Footer ── */
.lp-footer {
  margin-top: 28px;
  text-align: center;
}
.lp-footer p { font-size: .73rem; color: #9ca3af; margin: 0 0 6px; }
.lp-footer-links { display: flex; justify-content: center; gap: 16px; }
.lp-footer-links a { font-size: .73rem; color: #9ca3af; text-decoration: none; }
.lp-footer-links a:hover { color: #175ead; }
.lp-signup-link { font-size: .85rem; color: #564336; margin-top: 14px; }
.lp-signup-link a { color: #175ead; font-weight: 700; text-decoration: none; }
.lp-signup-link a:hover { text-decoration: underline; }
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
      const res = await fetch('/api/token/', {
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
          alt="Kélibia coastline"
        />
        <div className="lp-bg-overlay"></div>
      </div>
      <div className="lp-blob-br"></div>
      <div className="lp-blob-tl"></div>

      {/* Card */}
      <div className="lp-container">

        {/* ── Hero side ── */}
        <div className="lp-hero">
          <div className="lp-hero-brand">
            <img
              className="lp-hero-logo"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXxofGh8pDXCkYXwP1qvQu6f3nI-NpzQY1TBvuA_0RczTAtS-foDfpusI_fwTJ97u0T7VDc2WxNJhSr2BufovZlz7HLjxj5vvDktrG3NcJT-V1yXikFBcc8TAtighE9Rh7rw7IBp5_QKy5nyilxPWReP8-SbSFPgatszO-WQvmWmuO0DmSlEaKPXxv48YxcthidL1MIYFLtnIA0WZbBzOu8EScmjOLxQPToglABlrzjRiI8obNlEGMYhqKvbDNY0U1Xqbl7GshbwCe"
              alt="Ville de Kélibia"
            />
            <div>
              <div className="lp-hero-brand-name">Ville de Kélibia</div>
              <div className="lp-hero-brand-sub">Smart City Portal</div>
            </div>
          </div>

          <div>
            <div className="lp-hero-headline">
              Votre ville,<br />
              <span className="lp-hero-accent">Connectée &amp; Durable.</span>
            </div>
            <p className="lp-hero-desc">
              Accédez à vos services municipaux, suivez vos demandes en temps
              réel et participez à l'évolution de notre cité méditerranéenne.
            </p>
          </div>

          <div className="lp-hero-badges">
            <div className="lp-hero-badge">
              <i className="fas fa-shield-alt"></i> Sécurisé
            </div>
            <div className="lp-hero-badge">
              <i className="fas fa-language"></i> Multilingue
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
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-_NytB4G5_BlxwR-bIX1uvMIVdWBnm30wP3l89REEUeOkBq171i-AI-9LDfrg-fJPAbM5pt3jWfhjAKGRdHzEy8h7tc1nHKaT-7E3-s1VsV5dRfgvBTDxWCB2RkFzRCsp3HQQC5q-9wBOosQWfKTUxBPUfZXBHsCvkSDF6Pa5Cxd1hIEP6xOmc8E0gpQn_04ztANq3Ke0vdx6eVEEVITK5ZweO9V70W8baoDKngIpME0C3bac-HhMkxT6Q3jGco8oIcImd3Q1pAs8"
              alt="Kélibia Smart City"
            />
          </div>

          {/* Greeting */}
          <div className="lp-greeting">
            <h2>Bon retour !</h2>
            <p>Connectez-vous pour accéder à votre espace citoyen.</p>
          </div>

          <form onSubmit={onSubmit}>
            {/* Email */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="email">
                <i className="fas fa-at"></i> Adresse Email
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
                <i className="fas fa-lock-open"></i> Mot de Passe
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
              SE CONNECTER <i className="fas fa-arrow-right"></i>
            </button>

            {error && <div className="lp-error">{error}</div>}
          </form>

          {/* Alt login */}
          <div className="lp-divider">
            <div className="lp-divider-line"></div>
            <span className="lp-divider-txt">Ou continuer avec</span>
            <div className="lp-divider-line"></div>
          </div>
          <div className="lp-alt-grid">
            <button className="lp-alt-btn">
              <i className="fas fa-id-card icon-blue"></i> Tunisie ID
            </button>
            <button className="lp-alt-btn">
              <i className="fas fa-qrcode icon-orange"></i> Scan QR
            </button>
          </div>

          {/* Footer */}
          <div className="lp-footer">
            <p className="lp-signup-link">
              Pas encore inscrit ? <Link to="/signup">{t('create_account')}</Link>
            </p>
            <p>© 2024 Commune de Kélibia — Smart City Portal</p>
            <div className="lp-footer-links">
              <a href="#">Confidentialité</a>
              <a href="#">Assistance</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
