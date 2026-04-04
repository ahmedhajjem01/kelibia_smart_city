import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

export default function PaymentSimulationPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Simulation data from state or defaults
  const queryParams = new URLSearchParams(location.search)
  const amount = queryParams.get('amount') || '5.000'
  const reason = queryParams.get('reason') || (lang === 'ar' ? 'رسوم إدارية' : 'Frais de dossier')
  const reference = queryParams.get('ref') || `REF-${Math.floor(Math.random() * 900000) + 100000}`
  const targetUrl = queryParams.get('target') || '/dashboard'

  const [step, setStep] = useState(1) // 1: Card Selection, 3: Processing, 4: Success
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [user, setUser] = useState<any>(null)
  const [savedCards, setSavedCards] = useState<any[]>([])
  const [selectedCardId, setSelectedCardId] = useState<number | 'new'>('new')
  const [saveCard, setSaveCard] = useState(false)



  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch('/api/accounts/me/', { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.json()).then(data => setUser(data))
    
    // Fetch Saved Cards
    fetch('/api/accounts/cards/', { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.json()).then(data => {
        setSavedCards(data)
        if (data.length > 0) setSelectedCardId(data[0].id)
      })
  }, [navigate])


  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep(3)

    const requestId = queryParams.get('requestId')
    const requestType = queryParams.get('requestType') // 'livret' or 'residence'

    try {
        const access = getAccessToken()
        // Wait 2 seconds for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 2000))

        if (requestId && requestType) {
            const res = await fetch('/api/payments/confirm/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`
                },
                body: JSON.stringify({
                    request_id: requestId,
                    request_type: requestType,
                    paiement_recu: true
                })
            })
            if (!res.ok) console.error('Failed to update backend payment status')
        }

        // Save card if requested and it's a new card
        if (selectedCardId === 'new' && saveCard) {
            await fetch('/api/accounts/cards/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`
                },
                body: JSON.stringify(cardDetails)
            })
        }
        
        setStep(4)

    } catch (err) {
        console.error(err)
        setStep(1)
        alert('Erreur de connexion au serveur de paiement.')
    }
  }


  return (
    <MainLayout user={user} onLogout={() => navigate('/login')}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '20px' }}>
              <div className="row g-0">
                
                {/* Left Side: Summary */}
                <div className="col-md-5 bg-primary text-white p-4 p-lg-5 d-flex flex-column justify-content-between">
                  <div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/100px-Flag_of_Tunisia.svg.png" width="40" className="rounded mb-4 shadow-sm" alt="TN" />
                    <h3 className="fw-bold mb-4">{lang === 'ar' ? 'تفاصيل الدفع' : 'Récapitulatif'}</h3>
                    
                    <div className="mb-4">
                      <div className="small opacity-75">{lang === 'ar' ? 'الخدمة' : 'Service'}</div>
                      <div className="fs-5 fw-bold">{reason}</div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="small opacity-75">Référence</div>
                      <div className="font-monospace h6">{reference}</div>
                    </div>
                  </div>

                  <div className="border-top pt-4 mt-5">
                    <div className="small opacity-75">{lang === 'ar' ? 'المبلغ المطلوب' : 'TOTAL À PAYER'}</div>
                    <div className="display-5 fw-bold">{amount} <small className="fs-6">DT</small></div>
                  </div>
                </div>

                {/* Right Side: Interactive Forms */}
                <div className="col-md-7 bg-white p-4 p-lg-5">
                  {step === 1 && (
                    <div className="animate__animated animate__fadeIn">
                      <h4 className="fw-bold mb-4 text-dark">{lang === 'ar' ? 'وسيلة الدفع' : 'Mode de paiement'}</h4>
                      
                      <div className="mb-4 d-flex gap-3">
                        <div className="payment-type active border p-3 rounded-4 w-50 text-center shadow-sm cursor-pointer border-primary">
                          <i className="fas fa-credit-card fa-2x text-primary mb-2"></i>
                          <div className="small fw-bold">Carte Bancaire</div>
                        </div>
                        <div className="payment-type border p-3 rounded-4 w-50 text-center opacity-50 cursor-not-allowed">
                          <i className="fas fa-university fa-2x text-muted mb-2"></i>
                          <div className="small fw-bold">Virement (E-Dinar)</div>
                        </div>
                      </div>

                      {savedCards.length > 0 && (
                        <div className="mb-4">
                           <label className="form-label small text-muted fw-bold">Mes Cartes Enregistrées</label>
                           <div className="d-flex flex-column gap-2">
                              {savedCards.map(c => (
                                <div key={c.id} 
                                     className={`card p-3 border-2 cursor-pointer transition-all ${selectedCardId === c.id ? 'border-primary bg-light shadow-sm' : 'border-light'}`}
                                     onClick={() => setSelectedCardId(c.id)}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <i className={`fab fa-cc-${c.brand.toLowerCase()} fa-2x text-primary`}></i>
                                            <div>
                                                <div className="fw-bold">**** **** **** {c.last_4}</div>
                                                <div className="extra-small text-muted">{c.card_holder} | Exp: {c.expiry}</div>
                                            </div>
                                        </div>
                                        <input type="radio" checked={selectedCardId === c.id} readOnly className="form-check-input" />
                                    </div>
                                </div>
                              ))}
                              <div className={`card p-3 border-2 cursor-pointer transition-all ${selectedCardId === 'new' ? 'border-primary bg-light shadow-sm' : 'border-light'}`}
                                     onClick={() => setSelectedCardId('new')}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light rounded-circle p-2"><i className="fas fa-plus text-primary"></i></div>
                                            <div className="fw-bold">Utiliser une autre carte</div>
                                        </div>
                                        <input type="radio" checked={selectedCardId === 'new'} readOnly className="form-check-input" />
                                    </div>
                                </div>
                           </div>
                        </div>
                      )}

                      <form onSubmit={handlePay}>
                        {selectedCardId === 'new' && (
                          <div className="animate__animated animate__fadeIn">
                            <div className="mb-3">
                              <label className="form-label small text-muted">Nom sur la carte</label>
                              <input type="text" className="form-control form-control-lg bg-light border-0" placeholder="M. HABIB BOURGUIBA" required 
                                     onChange={e => setCardDetails({...cardDetails, name: e.target.value})} />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small text-muted">Numéro de carte</label>
                              <div className="input-group input-group-lg">
                                <span className="input-group-text bg-light border-0"><i className="far fa-credit-card"></i></span>
                                <input type="text" className="form-control bg-light border-0" placeholder="XXXX XXXX XXXX XXXX" required maxLength={16}
                                       onChange={e => setCardDetails({...cardDetails, number: e.target.value})} />
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-7">
                                <div className="mb-3">
                                  <label className="form-label small text-muted">Expiration</label>
                                  <input type="text" className="form-control bg-light border-0" placeholder="MM/AA" required maxLength={5}
                                         onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} />
                                </div>
                              </div>
                              <div className="col-5">
                                <div className="mb-3">
                                  <label className="form-label small text-muted">CVV</label>
                                  <input type="password" className="form-control bg-light border-0" placeholder="123" required maxLength={3}
                                         onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} />
                                </div>
                              </div>
                            </div>
                            
                            <div className="form-check mb-3">
                                <input className="form-check-input" type="checkbox" id="saveCardCheck" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} />
                                <label className="form-check-label small text-muted" htmlFor="saveCardCheck">
                                    Enregistrer cette carte pour mes prochains paiements
                                </label>
                            </div>
                          </div>
                        )}

                        
                        <div className="alert alert-warning small border-0 py-2 mt-2">
                           <i className="fas fa-info-circle me-1"></i> SIMULATION (PFE) : Ne saisissez pas de vraies données.
                        </div>

                        <button className="btn btn-primary btn-lg w-100 rounded-pill mt-4 fw-bold py-3 shadow">
                          {lang === 'ar' ? 'تأكيد الدفع' : 'Confirmer le paiement'}
                        </button>
                      </form>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="text-center py-5 animate__animated animate__fadeIn">
                      <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem' }} role="status"></div>
                      <h4 className="mt-4 fw-bold">Traitement en cours...</h4>
                      <p className="text-muted">Connexion sécurisée aux serveurs bancaires.</p>
                      <div className="badge bg-light text-muted border px-3 py-2 rounded-pill mt-3">Ref Secured: TXN-B-992120-X</div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="text-center py-4 animate__animated animate__zoomIn">
                      <div className="mb-4">
                        <i className="fas fa-check-circle fa-5x text-success"></i>
                      </div>
                      <h3 className="fw-bold text-success mb-2">{lang === 'ar' ? 'تم الدفع بنجاح' : 'Paiement Réussi !'}</h3>
                      <p className="text-muted mb-4">Votre transaction a été validée avec succès.</p>
                      
                      <div className="bg-light p-4 rounded-4 mb-4 text-start">
                        <div className="d-flex justify-content-between mb-2"><span>Statut</span><span className="badge bg-success">APPROUVÉ</span></div>
                        <div className="d-flex justify-content-between mb-2"><span>Montant</span><span className="fw-bold">{amount} DT</span></div>
                        <div className="d-flex justify-content-between mb-2"><span>Date</span><span>{new Date().toLocaleString()}</span></div>
                        <div className="d-flex justify-content-between"><span>Autorisation</span><span className="font-monospace text-primary">#AUTH-9921-S</span></div>
                      </div>

                      <div className="d-grid gap-2">
                         <button className="btn btn-dark btn-lg rounded-pill fw-bold" onClick={() => window.print()}>
                            <i className="fas fa-receipt me-2"></i> {lang === 'ar' ? 'طباعة الوصل' : 'Télécharger le reçu'}
                         </button>
                         <button className="btn btn-outline-primary rounded-pill border-2 fw-bold" onClick={() => navigate(targetUrl)}>
                            {targetUrl === '/dashboard' ? (lang === 'ar' ? 'العودة للمنظومة' : 'Retour au portail') : (lang === 'ar' ? 'الدخول للخدمة الآن ⚡' : 'Accéder au service maintenant ⚡')}
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4 opacity-50 small">
              <i className="fas fa-shield-halved me-1"></i> Système de sécurisé conforme aux standards PCI-DSS (Simulation PFE)
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .payment-type.active { border-width: 2px !important; background-color: #f0f7ff; }
        .form-control:focus { box-shadow: none; background-color: #fff !important; border: 1.5px solid var(--bs-primary) !important; }
        .cursor-not-allowed { cursor: not-allowed; }
        .cursor-pointer { cursor: pointer; }
        @media print {
           .ag-navbar, .ag-sidebar, .btn-outline-primary { display: none !important; }
           .card { border: none !important; shadow: none !important; }
        }
      `}</style>
    </MainLayout>
  )
}
