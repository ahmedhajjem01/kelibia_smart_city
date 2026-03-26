import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { storeTokens } from '../lib/authStorage'

type ActivationResponse = {
  access?: string
  refresh?: string
  username?: string
  detail?: string
}

export default function ActivatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'warning' | 'success' | 'danger'; text: string } | null>(
    null
  )

  useEffect(() => {
    const uid = searchParams.get('uid')
    const token = searchParams.get('token')

    if (!uid || !token) {
      setLoading(false)
      setMessage({
        type: 'warning',
        text: 'UID ou Token manquant dans le lien d\'activation.',
      })
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/accounts/activation/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, token }),
        })

        const data = (await res.json().catch(() => ({}))) as ActivationResponse

        if (!res.ok) {
          throw new Error(data.detail || 'Activation échouée.')
        }

        setLoading(false)
        setMessage({
          type: 'success',
          text: 'Compte activé avec succès ! Redirection vers votre tableau de bord...',
        })

        if (data.access && data.refresh) {
          storeTokens({ access: data.access, refresh: data.refresh, username: data.username })
        }

        setTimeout(() => navigate('/dashboard'), 2000)
      } catch (e) {
        setLoading(false)
        setMessage({
          type: 'danger',
          text: "L'activation a échoué. Le lien est peut-être expiré ou déjà utilisé.",
        })
        console.error(e)
      }
    })()
  }, [navigate, searchParams])

  return (
    <div className="bg-light d-flex align-items-center vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-header bg-primary text-white text-center py-4">
                <h3 className="font-weight-light my-2">Activation de votre compte</h3>
              </div>

              <div className="card-body p-5 text-center">
                {loading ? (
                  <div>
                    <div className="spinner-border text-primary mb-3" role="status" />
                    <p>Vérification de vos informations en cours...</p>
                  </div>
                ) : null}

                {message ? (
                  <div
                    className={`alert alert-${message.type === 'danger' ? 'danger' : message.type} d-block mt-3`}
                    role="alert"
                    aria-live="polite"
                  >
                    {message.text}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

