import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

type MessageState =
  | { type: 'success' | 'danger'; text: string }
  | { type: 'success'; node: React.ReactNode }

export default function ResetPasswordConfirmPage() {
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

  const submitLabel = useMemo(() => {
    return loading ? 'Traitement...' : 'Réinitialiser'
  }, [loading])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== reNewPassword) {
      setMessage({ type: 'danger', text: 'Les mots de passe ne correspondent pas.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users/reset_password_confirm/', {
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
              Mot de passe changé avec succès !{' '}
              <Link to="/login" className="alert-link">
                Connectez-vous ici
              </Link>
            </>
          ),
        })
        setNewPassword('')
        setReNewPassword('')
      } else {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>
        let errMsg = 'Échec de la réinitialisation.'
        // Keep same priority as original page
        if (data['new_password'] && Array.isArray(data['new_password'])) {
          errMsg = (data['new_password'] as string[])[0] || errMsg
        } else if (data['non_field_errors'] && Array.isArray(data['non_field_errors'])) {
          errMsg = (data['non_field_errors'] as string[])[0] || errMsg
        } else if (data['token']) {
          errMsg = 'Le lien est invalide ou a expiré.'
        }

        setMessage({ type: 'danger', text: errMsg })
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err instanceof Error ? err.message : 'Erreur de réinitialisation.',
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
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-header bg-primary text-white text-center py-4">
                <h3 className="font-weight-light my-2">Nouveau mot de passe</h3>
              </div>

              <div className="card-body p-4">
                <form id="resetConfirmForm" onSubmit={onSubmit}>
                  {!hasParams ? (
                    <>
                      <div className="mb-3">
                        <label className="form-label small text-muted">UID</label>
                        <input
                          type="text"
                          id="uid"
                          className="form-control form-control-sm"
                          value={uid}
                          onChange={(ev) => setUid(ev.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-muted">Token</label>
                        <input
                          type="text"
                          id="token"
                          className="form-control form-control-sm"
                          value={token}
                          onChange={(ev) => setToken(ev.target.value)}
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="new_password"
                      placeholder="Nouveau mot de passe"
                      required
                      value={newPassword}
                      onChange={(ev) => setNewPassword(ev.target.value)}
                    />
                    <label htmlFor="new_password">Nouveau mot de passe</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="re_new_password"
                      placeholder="Confirmer"
                      required
                      value={reNewPassword}
                      onChange={(ev) => setReNewPassword(ev.target.value)}
                    />
                    <label htmlFor="re_new_password">Confirmer</label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    id="submitBtn"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" />
                    ) : null}
                    {submitLabel}
                  </button>

                  {message ? (
                    <div
                      className={`alert mt-3 d-block ${
                        message.type === 'success' ? 'alert-success' : 'alert-danger'
                      }`}
                      role="alert"
                    >
                      {'text' in message ? message.text : message.node}
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

