import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { storeTokens } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

const CSS = `
.lp-root{min-height:100vh;background:#0f1117;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",sans-serif}
.lp-card{width:100%;max-width:400px;background:#1a1d27;border-radius:16px;padding:44px 40px 36px;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.lp-icon{width:52px;height:52px;background:#f18221;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:1.5rem;color:#fff}
.lp-title{text-align:center;color:#f0f2f5;font-size:1.25rem;font-weight:700;margin-bottom:4px}
.lp-sub{text-align:center;color:#6b7280;font-size:.82rem;margin-bottom:32px}
.lp-btn{width:100%;background:#f18221;color:#fff;border:none;border-radius:8px;padding:12px;font-size:.95rem;font-weight:600;cursor:pointer;margin-top:8px;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.lp-btn:hover:not(:disabled){background:#1d4ed8}
.lp-btn:disabled{opacity:.6;cursor:not-allowed}
.lp-error{background:#2d1515;border:1px solid #7f1d1d;border-radius:8px;padding:10px 14px;color:#fca5a5;font-size:.82rem;margin-top:14px}
.lp-success{background:#152d15;border:1px solid #166534;border-radius:8px;padding:10px 14px;color:#86efac;font-size:.82rem;margin-top:14px}
.lp-warning{background:#2d2a15;border:1px solid #713f12;border-radius:8px;padding:10px 14px;color:#fde047;font-size:.82rem;margin-top:14px}
`

type ActivationResponse = {
  access?: string
  refresh?: string
  username?: string
  detail?: string
}

export default function ActivatePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'warning' | 'success' | 'danger'; text: string } | null>(
    null
  )

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = CSS
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

  useEffect(() => {
    const uid = searchParams.get('uid')
    const token = searchParams.get('token')

    if (!uid || !token) {
      setLoading(false)
      setMessage({
        type: 'warning',
        text: t('activation_missing_params') || 'Lien invalide (UID ou Token manquant).',
      })
      return
    }

    ;(async () => {
      try {
        const res = await fetch(resolveBackendUrl('/api/accounts/activation/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, token }),
        })

        const data = (await res.json().catch(() => ({}))) as ActivationResponse

        if (!res.ok) {
          throw new Error(data.detail || t('activation_failed'))
        }

        setLoading(false)
        setMessage({
          type: 'success',
          text: t('activation_success') || 'Compte activé avec succès ! Redirection...',
        })

        if (data.access && data.refresh) {
          storeTokens({ access: data.access, refresh: data.refresh, username: data.username })
        }

        setTimeout(() => navigate('/dashboard'), 2000)
      } catch (e) {
        setLoading(false)
        setMessage({
          type: 'danger',
          text: t('activation_expired') || "L'activation a échoué. Le lien est peut-être expiré.",
        })
        console.error(e)
      }
    })()
  }, [navigate, searchParams, t])

  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-icon">
          <i className="fas fa-user-check"></i>
        </div>
        <div className="lp-title">{t('activation_title') || 'Activation'}</div>
        <div className="lp-sub">{t('activation_subtitle') || 'Vérification de votre compte'}</div>

        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ color: '#f18221' }} />
              <p style={{ color: '#6b7280', fontSize: '.9rem' }}>{t('processing') || 'Vérification...'}</p>
            </div>
          ) : null}

          {message && (
            <div className={`lp-${message.type === 'danger' ? 'error' : message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        {!loading && message?.type === 'danger' && (
          <button className="lp-btn" onClick={() => navigate('/login')} style={{ marginTop: '20px' }}>
            {t('back_to_login') || 'Retour'}
          </button>
        )}
      </div>
    </div>
  )
}

