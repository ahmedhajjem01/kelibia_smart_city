import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageProvider'

const CSS = `
.lp-root{min-height:100vh;background:#0f1117;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",sans-serif}
.lp-card{width:100%;max-width:400px;background:#1a1d27;border-radius:16px;padding:44px 40px 36px;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.lp-icon{width:52px;height:52px;background:#f18221;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:1.5rem;color:#fff}
.lp-title{text-align:center;color:#f0f2f5;font-size:1.25rem;font-weight:700;margin-bottom:4px}
.lp-sub{text-align:center;color:#6b7280;font-size:.82rem;margin-bottom:32px}
.lp-label{display:block;font-size:.78rem;color:#9ca3af;margin-bottom:6px;font-weight:500}
.lp-input{width:100%;background:#0f1117;border:1.5px solid #2a2d3a;border-radius:8px;padding:11px 14px;font-size:.9rem;color:#e5e7eb;outline:none;box-sizing:border-box;transition:border-color .2s}
.lp-input:focus{border-color:#f18221}
.lp-input::placeholder{color:#4b5563}
.lp-btn{width:100%;background:#f18221;color:#fff;border:none;border-radius:8px;padding:12px;font-size:.95rem;font-weight:600;cursor:pointer;margin-top:8px;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px}
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
.lp-lang-btn:hover,.lp-lang-btn.active{border-color:#f18221;color:#93c5fd}
`

type MessageState =
  | { type: 'success' | 'danger'; text: string }
  | { type: 'success'; node: React.ReactNode }

export default function ResetPasswordConfirmPage() {
  const { t, lang, setLang } = useI18n()
  const [searchParams] = useSearchParams()
  const initialUid = searchParams.get('uid') || ''
  const initialToken = searchParams.get('token') || ''
  const hasParams = Boolean(initialUid) && Boolean(initialToken)

  const [uid, setUid] = useState(initialUid)
  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [reNewPassword, setReNewPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const submitLabel = useMemo(() => {
    return loading ? t('processing') || 'Traitement...' : t('reset') || 'Réinitialiser'
  }, [loading, t])

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = CSS
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== reNewPassword) {
      setMessage({ type: 'danger', text: t('passwords_not_match') || 'Les mots de passe ne correspondent pas.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(resolveBackendUrl('/api/users/reset_password_confirm/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
          re_new_password: reNewPassword,
        }),
      })

      if (res.ok || res.status === 204) {
        setMessage({
          type: 'success',
          node: (
            <>
              {t('password_changed_success') || 'Mot de passe changé avec succès !'}{' '}
              <Link to="/login" style={{ color: '#86efac', textDecoration: 'underline' }}>
                {t('back_to_login') || 'Retour à la connexion'}
              </Link>
            </>
          ),
        })
        setNewPassword('')
        setReNewPassword('')
      } else {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>
        let errMsg = t('reset_failed') || 'Échec de la réinitialisation.'
        if (data['new_password'] && Array.isArray(data['new_password'])) {
          errMsg = (data['new_password'] as string[])[0] || errMsg
        } else if (data['non_field_errors'] && Array.isArray(data['non_field_errors'])) {
          errMsg = (data['non_field_errors'] as string[])[0] || errMsg
        } else if (data['token']) {
          errMsg = t('invalid_link') || 'Le lien est invalide ou a expiré.'
        }
        setMessage({ type: 'danger', text: errMsg })
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err instanceof Error ? err.message : t('error_msg'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-icon">
          <i className="fas fa-lock"></i>
        </div>
        <div className="lp-title">{t('new_password_title') || 'Nouveau mot de passe'}</div>
        <div className="lp-sub">{t('new_password_desc') || 'Choisissez votre nouveau mot de passe.'}</div>

        <div className="lp-lang">
          <button className={`lp-lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>
            <img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" /> FR
          </button>
          <button className={`lp-lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>
            <img src="https://flagcdn.com/w20/tn.png" width="16" alt="TN" /> عربي
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {!hasParams && (
            <>
              <div className="lp-field">
                <label className="lp-label">UID (Manuel)</label>
                <input
                  type="text"
                  className="lp-input"
                  value={uid}
                  onChange={(ev) => setUid(ev.target.value)}
                />
              </div>
              <div className="lp-field">
                <label className="lp-label">Token (Manuel)</label>
                <input
                  type="text"
                  className="lp-input"
                  value={token}
                  onChange={(ev) => setToken(ev.target.value)}
                />
              </div>
            </>
          )}

          <div className="lp-field">
            <label className="lp-label" htmlFor="new_password">{t('new_password_label') || 'Nouveau mot de passe'}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="new_password"
                type={showPassword ? "text" : "password"}
                className="lp-input"
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer'
                }}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="re_new_password">{t('confirm_password_label') || 'Confirmer'}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="re_new_password"
                type={showPassword ? "text" : "password"}
                className="lp-input"
                placeholder="••••••••"
                required
                value={reNewPassword}
                onChange={(ev) => setReNewPassword(ev.target.value)}
                style={{ paddingRight: '46px' }}
              />
            </div>
          </div>

          <button className="lp-btn" type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />}
            {submitLabel}
          </button>

          {message && (
            <div className={message.type === 'success' ? 'lp-success' : 'lp-error'}>
              {'text' in message ? message.text : message.node}
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

