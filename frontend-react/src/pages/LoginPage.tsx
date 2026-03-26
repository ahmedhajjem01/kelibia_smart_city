import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storeTokens } from '../lib/authStorage'

type TokenResponse = {
  access: string
  refresh: string
  is_staff: boolean
  is_superuser: boolean
  user_type?: 'agent' | string
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      if (data.is_staff || data.is_superuser) {
        window.location.href = '/admin/'
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
    <div className="bg-light d-flex align-items-center vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            <div className="card shadow-lg border-0 rounded-lg mt-5">
              <div className="card-header bg-primary text-white text-center py-4">
                <h3 className="font-weight-light my-2">Kelibia Smart City</h3>
                <p className="small mb-0">Portail Citoyen & Agent</p>
              </div>

              <div className="card-body p-4">
                <form onSubmit={onSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="nom@exemple.com"
                      required
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                    />
                    <label htmlFor="email">Adresse Email</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      placeholder="Mot de passe"
                      required
                      value={password}
                      onChange={(ev) => setPassword(ev.target.value)}
                    />
                    <label htmlFor="password">Mot de passe</label>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value=""
                      id="rememberPasswordCheck"
                      checked={rememberMe}
                      onChange={(ev) => setRememberMe(ev.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="rememberPasswordCheck"
                    >
                      Se souvenir de moi
                    </label>
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-primary btn-lg"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                      ) : null}
                      Se connecter
                    </button>
                  </div>

                  {error ? (
                    <div
                      className="alert alert-danger mt-3"
                      role="alert"
                      aria-live="polite"
                    >
                      {error}
                    </div>
                  ) : null}
                </form>
              </div>

              <div className="card-footer text-center py-3">
                <div className="small">
                  <Link to="/forgot-password">Mot de passe oublié ?</Link>
                </div>
                <div className="small mt-2">
                  <Link
                    to="/signup"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Créer un compte (Nouveau)
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

