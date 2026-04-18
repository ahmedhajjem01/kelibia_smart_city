import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageProvider'

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
.lp-success{background:#152d15;border:1px solid #166534;border-radius:8px;padding:10px 14px;color:#86efac;font-size:.82rem;margin-top:14px}
.lp-field{margin-bottom:18px}
.lp-lang{display:flex;justify-content:center;gap:8px;margin-bottom:24px}
.lp-lang-btn{background:none;border:1px solid #2a2d3a;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.78rem;color:#6b7280;display:flex;align-items:center;gap:5px;transition:all .2s}
.lp-lang-btn:hover,.lp-lang-btn.active{border-color:#2563eb;color:#93c5fd}
`

export default function ForgotPasswordPage() {
  const { t, lang, setLang } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = CSS
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

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
        const errorData = (await res.json().catch(() => null)) as
          | { email?: string[] }
          | null
        setMessage({
          type: 'danger',
          text: errorData?.email ? errorData.email[0] : t('error_msg'),
        })
      }
    } catch {
      setMessage({
        type: 'danger',
        text: t('error_msg'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-icon">
          <i className="fas fa-key"></i>
        </div>
        <div className="lp-title">{t('forgot_password')}</div>
        <div className="lp-sub">
          {t('forgot_password_desc') || 'Entrez votre e-mail pour réinitialiser votre mot de passe.'}
        </div>

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
              onChange={(ev) => setEmail(ev.target.value)}
            />
          </div>

          <button className="lp-btn" type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />}
            {t('send_link') || 'Envoyer le lien'}
          </button>

          {message && (
            <div className={message.type === 'success' ? 'lp-success' : 'lp-error'}>
              {message.text}
            </div>
          )}
        </form>

        <div className="lp-links">
          <Link to="/login">{t('back_to_login') || 'Retour à la connexion'}</Link>
        </div>
      </div>
    </div>
  )
}

