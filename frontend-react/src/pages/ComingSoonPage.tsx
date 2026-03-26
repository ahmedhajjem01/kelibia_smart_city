import { useEffect } from 'react'

export default function ComingSoonPage({ title }: { title: string }) {
  useEffect(() => {
    document.title = `Kelibia Smart City - ${title}`
  }, [title])

  return (
    <div className="bg-light d-flex align-items-center justify-content-center vh-100">
      <div className="text-center p-4" style={{ maxWidth: 560 }}>
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-header bg-primary text-white py-4 border-0">
            <h3 className="m-0">En cours de conversion</h3>
          </div>
          <div className="card-body p-4">
            <p className="text-muted mb-3">
              {title}. Cette page sera convertie en React juste après la partie
              authentification.
            </p>
            <p className="small text-muted mb-0">
              Suggestion : vérifie d’abord `login` / `signup` pour confirmer que
              l’intégration API est correcte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

