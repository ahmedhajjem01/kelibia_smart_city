import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageProvider'
import logo from '../assets/logo.png'
import tunisiaLogo from '../assets/tunisia_logo.png'

const CSS = `
/* ── Root ── */
.lp-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; position: relative; overflow: hidden; font-family: "Public Sans", "Segoe UI", sans-serif; background: #0f1117; }
.lp-bg { position: absolute; inset: 0; z-index: 0; }
.lp-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.4; }
.lp-bg-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(149,74,0,.45) 0%, transparent 60%, rgba(149,74,0,.25) 100%); }
.lp-container { position: relative; z-index: 10; width: 100%; max-width: 960px; display: grid; grid-template-columns: 1fr; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
@media (min-width: 768px) { .lp-container { grid-template-columns: 7fr 5fr; } }
.lp-hero { display: none; background: rgba(149,74,0,.82); backdrop-filter: blur(10px); padding: 48px 44px; flex-direction: column; justify-content: space-between; color: #fff; }
@media (min-width: 768px) { .lp-hero { display: flex; } }
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
.lp-form-side { background: rgba(255,255,255,.94); backdrop-filter: blur(18px); padding: 40px 36px; display: flex; flex-direction: column; justify-content: center; }
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
.lp-btn { width: 100%; background: linear-gradient(135deg, #954a00 0%, #f18221 100%); color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: .95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
.lp-error { background: #ffdad6; border: 1px solid #ba1a1a; border-radius: 10px; padding: 11px; color: #93000a; font-size: .83rem; margin-top: 14px; }
.lp-success{ background: #d3f9d8; border: 1px solid #2b8a3e; border-radius: 10px; padding: 11px; color: #092c09; font-size: .83rem; margin-top: 14px; }
.lp-footer { margin-top: 20px; text-align: center; }
.lp-footer p { font-size: .72rem; color: #9ca3af; margin: 4px 0; }
.lp-signup-link { font-size: .78rem; color: #6b7280; }
.lp-signup-link a { color: #954a00; font-weight: 600; text-decoration: none; }
`

export default function ForgotPasswordPage() {
  const { t, lang, setLang } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/users/reset_password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok || res.status === 204) {
        setMessage({
          type: 'success',
          text: t('forgot_password_success') || 'Si cette adresse existe, un e-mail a été envoyé.',
        })
      } else {
        const errorData = (await res.json().catch(() => null)) as { email?: string[] } | null
        setMessage({
          type: 'danger',
          text: errorData?.email ? errorData.email[0] : t('error_msg'),
        })
      }
    } catch {
      setMessage({ type: 'danger', text: t('error_msg') })
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
            <img className="lp-hero-logo" src={tunisiaLogo} alt="Logo" />
            <div>
              <div className="lp-hero-brand-name">République de Tunisie</div>
              <div className="lp-hero-brand-sub">{t('portal_title')}</div>
            </div>
          </div>

          <div>
            <div className="lp-hero-headline">
              Récupérer <br />
              <span className="lp-hero-accent">Votre accès.</span>
            </div>
            <p className="lp-hero-desc">
              Entrez l'adresse e-mail associée à votre compte, et nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
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
            <img src={logo} alt="Logo" />
          </div>

          {/* Greeting */}
          <div className="lp-greeting">
            <h2>{t('forgot_password')}</h2>
            <p>{t('forgot_password_desc') || 'Entrez votre e-mail pour réinitialiser.'}</p>
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

            {/* Submit */}
            <button className="lp-btn" type="submit" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm" role="status" />}
              {t('send_link') || 'Envoyer le lien'} <i className="fas fa-paper-plane"></i>
            </button>

            {message && (
              <div className={message.type === 'success' ? 'lp-success' : 'lp-error'}>
                {message.text}
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="lp-footer">
            <p className="lp-signup-link">
              <Link to="/login"><i className="fas fa-arrow-left"></i> {t('back_to_login') || 'Retour à la connexion'}</Link>
            </p>
            <p>{t('footer_text')}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
              <a href="#" style={{ fontSize: '.7rem', color: '#9ca3af', textDecoration: 'none' }}>Confidentialité</a>
              <a href="#" style={{ fontSize: '.7rem', color: '#9ca3af', textDecoration: 'none' }}>Assistance</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
