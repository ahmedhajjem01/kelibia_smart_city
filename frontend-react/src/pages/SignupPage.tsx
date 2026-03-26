import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const cityData: Record<string, string[]> = {
  Nabeul: [
    'Nabeul',
    'Hammamet',
    'Kélibia',
    'Dar Chaâbane El Fehri',
    'Béni Khiar',
    'El Mida',
    'Hammam Ghezèze',
    'Korba',
    'Menzel Bouzelfa',
    'Menzel Temime',
    'Soliman',
    'Takilsa',
    'Grombalia',
    'Béni Khalled',
    'Bou Argoub',
    'El Haouaria',
  ],
  Ariana: [
    'Ariana',
    'Soukra',
    'Raoued',
    'Kalaat el-Andalous',
    'Sidi Thabet',
    'Mnihla',
    'Ettadhamen',
  ],
  Tunis: [
    'Tunis',
    'La Marsa',
    'Le Kram',
    'La Goulette',
    'Carthage',
    'Sidi Bou Saïd',
    'Gammarth',
    'Sidi Hassine',
    'El Ouardia',
  ],
  Sousse: [
    'Sousse',
    'Hammam Sousse',
    'Akouda',
    'Kalâa Kebira',
    'Kalâa Seghira',
    'Msaken',
    'Enfidha',
    'Bouficha',
    'Hergla',
  ],
  'Ben Arous': [
    'Ben Arous',
    'Ezzahra',
    'Hammam Lif',
    'Hammam Chott',
    'Bou Mhel el-Bassatine',
    'Mornag',
    'Radès',
    'Mégrin',
    'Fouchana',
  ],
  Bizerte: [
    'Bizerte',
    'Menzel Bourguiba',
    'Mateur',
    'Ghezala',
    'Sejnane',
    'Joumine',
    'Utique',
    'Ghar El Melh',
    'Ras Jebel',
  ],
  Sfax: [
    'Sfax',
    'Sakiet Ezzit',
    'Sakiet Eddaier',
    'Chihia',
    'Gremda',
    'El Ain',
    'Thyna',
    'Agareb',
    'Jebiniana',
  ],
  Monastir: [
    'Monastir',
    'Khniss',
    'Ouerdanin',
    'Sahline',
    'Zéramdine',
    'Béni Hassen',
    'Jemmal',
    'Bekalta',
    'Sayada',
    'Téboulba',
    'Ksibet el-Médiouni',
  ],
  Beja: [
    'Béja Centre',
    'Amdoun',
    'Goubellat',
    'Medjez el-Bab',
    'Nefza',
    'Téboursouk',
    'Testour',
    'Thibar',
  ],
  Gabes: [
    'Gabès Centre',
    'El Hamma',
    'Ghannouch',
    'Mareth',
    'Matmata',
    'Menzel El Habib',
    'Métouia',
  ],
  Gafsa: [
    'Gafsa Centre',
    'El Guettar',
    'El Ksar',
    'Mdhilla',
    'Métlaoui',
    'Moularès',
    'Redeyef',
    'Sened',
  ],
  Jendouba: [
    'Jendouba Centre',
    'Aïn Draham',
    'Balta-Bou Aouane',
    'Bou Salem',
    'Fernana',
    'Ghardimaou',
    'Oued Meliz',
    'Tabarka',
  ],
  Kairouan: [
    'Kairouan Centre',
    'Bou Hajla',
    'Chebika',
    'Echrarda',
    'Haffouz',
    'Hajeb El Ayoun',
    'Nasrallah',
    'Oueslatia',
    'Sbikha',
  ],
  Kasserine: [
    'Kasserine Centre',
    'Fériana',
    'Foussana',
    'Haidra',
    'Jedelienne',
    'Majel Bel Abbès',
    'Sbeïtla',
    'Sbiba',
    'Thala',
  ],
  Kebili: ['Kébili Centre', 'Douz Centre', 'Faouar', 'Souk Lahad'],
  Kef: [
    'Le Kef Centre',
    'Dahmani',
    'Jerissa',
    'Kalâat Khasba',
    'Kalaat Senan',
    'Nebeur',
    'Sakiet Sidi Youssef',
    'Tajerouine',
  ],
  Mahdia: [
    'Mahdia Centre',
    'Bou Merdes',
    'Chebba',
    'Chorbane',
    'El Jem',
    'Hebira',
    'Ksour Essef',
    'Melloulèche',
    'Ouled Chamekh',
    'Sidi Alouane',
  ],
  Manouba: [
    'La Manouba Centre',
    'Borj El Amri',
    'Djedeida',
    'Douar Hicher',
    'El Battan',
    'Mornaguia',
    'Oued Ellil',
    'Tebourba',
  ],
  Medenine: [
    'Médenine Centre',
    'Ben Guerdane',
    'Djerba Ajim',
    'Djerba Houmt Souk',
    'Djerba Midoun',
    'Zarzis',
  ],
  'Sidi Bouzid': [
    'Sidi Bouzid Centre',
    'Bir El Hafey',
    'Cebbala Ouled Asker',
    'Jilma',
    'Mazzouna',
    'Menzel Bouzaiane',
    'Regueb',
    'Sidi Ali Ben Aoun',
  ],
  Siliana: [
    'Siliana Centre',
    'Bou Arada',
    'Bargou',
    'Gaâfour',
    'Kesra',
    'Makthar',
    'Rouhia',
  ],
  Tataouine: [
    'Tataouine Centre',
    'Bir Lahmar',
    'Dehiba',
    'Ghomrassen',
    'Remada',
    'Smâr',
  ],
  Tozeur: ['Tozeur Centre', 'Degache', 'Hezoua', 'Nefta', 'Tamaghza'],
  Zaghouan: [
    'Zaghouan Centre',
    'Bir Mcherga',
    'El Fahs',
    'Nadhour',
    'Saouaf',
    'Zriba',
  ],
}

const governorates = [
  'Ariana',
  'Beja',
  'Ben Arous',
  'Bizerte',
  'Gabes',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kebili',
  'Kef',
  'Mahdia',
  'Manouba',
  'Medenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cin, setCin] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [rePassword, setRePassword] = useState('')

  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success')

  const cityOptions = useMemo(() => {
    if (!governorate) return []
    return cityData[governorate] || []
  }, [governorate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (password !== rePassword) {
      setMessageType('danger')
      setMessage('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        cin,
        phone,
        email,
        governorate,
        city,
        address,
        // Auto-generate username: Prenom + CIN
        username: firstName.toLowerCase().trim() + cin,
        password,
        re_password: rePassword,
      }

      const res = await fetch('/api/accounts/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!res.ok) {
        throw new Error(data?.error || "Une erreur est survenue lors de l'inscription.")
      }

      setMessageType('success')
      setMessage(
        "Compte créé avec succès ! <br>Veuillez vérifier votre <strong>Email</strong> pour l'activer."
      )

      // reset
      setFirstName('')
      setLastName('')
      setCin('')
      setPhone('')
      setEmail('')
      setGovernorate('')
      setCity('')
      setAddress('')
      setPassword('')
      setRePassword('')

      // Go to login for UX
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setMessageType('danger')
      setMessage(err instanceof Error ? err.message : 'Erreur lors de l’inscription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-light d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-header bg-success text-white text-center py-4">
                <h3 className="font-weight-light my-2">Créer un compte Citoyen</h3>
                <p className="small mb-0">Rejoignez Tunisia Smart City</p>
              </div>

              <div className="card-body p-4">
                <form id="registerForm" onSubmit={onSubmit}>
                  <h5 className="mb-3 text-muted border-bottom pb-2">Identité</h5>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6 form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="first_name"
                        placeholder="Prénom"
                        required
                        value={firstName}
                        onChange={(ev) => setFirstName(ev.target.value)}
                      />
                      <label htmlFor="first_name">Prénom</label>
                    </div>
                    <div className="col-md-6 form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="last_name"
                        placeholder="Nom"
                        required
                        value={lastName}
                        onChange={(ev) => setLastName(ev.target.value)}
                      />
                      <label htmlFor="last_name">Nom</label>
                    </div>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="cin"
                      placeholder="CIN (8 chiffres)"
                      pattern="\\d{8}"
                      maxLength={8}
                      required
                      value={cin}
                      onChange={(ev) => setCin(ev.target.value)}
                    />
                    <label htmlFor="cin">Numéro de CIN (8 chiffres)</label>
                  </div>

                  <h5 className="mb-3 text-muted border-bottom pb-2 mt-4">
                    Contact & Localisation
                  </h5>

                  <div className="form-floating mb-3">
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      placeholder="Téléphone (8 chiffres)"
                      pattern="\\d{8}"
                      maxLength={8}
                      required
                      value={phone}
                      onChange={(ev) => setPhone(ev.target.value)}
                    />
                    <label htmlFor="phone">Numéro de Téléphone</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="Email"
                      required
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                    />
                    <label htmlFor="email">Email</label>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6 form-floating">
                      <select
                        className="form-select"
                        id="governorate"
                        required
                        value={governorate}
                        onChange={(ev) => {
                          setGovernorate(ev.target.value)
                          setCity('')
                        }}
                      >
                        <option value="" disabled>
                          Choisir...
                        </option>
                        {governorates.map((g) => (
                          <option key={g} value={g}>
                            {g === 'Kef' ? 'Le Kef' : g}
                          </option>
                        ))}
                      </select>
                      <label htmlFor="governorate">Gouvernorat</label>
                    </div>

                    <div className="col-md-6 form-floating">
                      <select
                        className="form-select"
                        id="city"
                        required
                        disabled={!governorate}
                        value={city}
                        onChange={(ev) => setCity(ev.target.value)}
                      >
                        <option value="" disabled>
                          Choisir...
                        </option>
                        {cityOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <label htmlFor="city">Ville</label>
                    </div>
                  </div>

                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      id="address"
                      placeholder="Adresse complète"
                      style={{ height: 80 }}
                      required
                      value={address}
                      onChange={(ev) => setAddress(ev.target.value)}
                    />
                    <label htmlFor="address">Adresse complète (Rue, Immeuble...)</label>
                  </div>

                  <h5 className="mb-3 text-muted border-bottom pb-2 mt-4">Sécurité</h5>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6 form-floating">
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
                    <div className="col-md-6 form-floating">
                      <input
                        type="password"
                        className="form-control"
                        id="re_password"
                        placeholder="Confirmer"
                        required
                        value={rePassword}
                        onChange={(ev) => setRePassword(ev.target.value)}
                      />
                      <label htmlFor="re_password">Confirmer</label>
                    </div>
                  </div>

                  <div className="d-grid gap-2 mt-4">
                    <button
                      className="btn btn-success btn-lg"
                      type="submit"
                      disabled={loading}
                      id="registerBtn"
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : null}
                      S'inscrire
                    </button>
                  </div>

                  {message ? (
                    <div
                      id="message"
                      className={`alert mt-3 ${
                        messageType === 'success' ? 'alert-success' : 'alert-danger'
                      }`}
                      role="alert"
                      dangerouslySetInnerHTML={{ __html: message }}
                    />
                  ) : null}
                </form>
              </div>

              <div className="card-footer text-center py-3">
                <div className="small">
                  <Link to="/login">Vous avez déjà un compte ? Connectez-vous</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

