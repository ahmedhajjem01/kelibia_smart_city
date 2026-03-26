import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
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
          text: 'Si cette adresse existe, un e-mail a été envoyé avec les instructions.',
        })
      } else {
        const errorData = (await res.json().catch(() => null)) as
          | { email?: string[] }
          | null
        setMessage({
          type: 'danger',
          text: errorData?.email ? errorData.email[0] : "Erreur lors de l'envoi.",
        })
      }
    } catch {
      setMessage({
        type: 'danger',
        text: 'Erreur de connexion au serveur.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-light d-flex align-items-center vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            <div className="card shadow-lg border-0 rounded-lg mt-5">
              <div className="card-header bg-primary text-white text-center py-4">
                <h3 className="font-weight-light my-2">Récupération</h3>
                <p className="small mb-0">Mot de passe oublié</p>
              </div>

              <div className="card-body p-4">
                <div className="small mb-3 text-muted">
                  Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser
                  votre mot de passe.
                </div>

                <form id="forgotPasswordForm" onSubmit={onSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="name@example.com"
                      required
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                    />
                    <label htmlFor="email">Adresse e-mail</label>
                  </div>

                  <div className="d-grid gap-2">
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : null}
                      Envoyer le lien
                    </button>
                  </div>

                  {message ? (
                    <div className={`alert mt-3 alert-${message.type}`} role="alert">
                      {message.text}
                    </div>
                  ) : null}
                </form>
              </div>

              <div className="card-footer text-center py-3">
                <div className="small">
                  <Link to="/login">Retour à la connexion</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

