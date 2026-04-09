import { useMemo, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useI18n } from '../i18n/LanguageProvider'

const cityData: Record<string, string[]> = {
  // ... (keeping cityData as is)
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
  const { t, setLang } = useI18n()
  const webcamRef = useRef<Webcam>(null)
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
  const [showPassword, setShowPassword] = useState(false)

  // Extra info
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [isMarried, setIsMarried] = useState(false)
  const [spouseCin, setSpouseCin] = useState('')
  const [spouseFirstName, setSpouseFirstName] = useState('')
  const [spouseLastName, setSpouseLastName] = useState('')

  // CIN Images
  const [cinFront, setCinFront] = useState<File | null>(null)
  const [cinBack, setCinBack] = useState<File | null>(null)
  const [showCamera, setShowCamera] = useState<'front' | 'back' | null>(null)
  const [mirrored, setMirrored] = useState(true)

  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success')

  const cityOptions = useMemo(() => {
    if (!governorate) return []
    return cityData[governorate] || []
  }, [governorate])

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      // Logic to convert base64 to File
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `cin_${showCamera}.jpg`, { type: 'image/jpeg' })
          if (showCamera === 'front') setCinFront(file)
          else setCinBack(file)
          setShowCamera(null)
        })
    }
  }, [showCamera])

  const videoConstraints = {
    facingMode: { ideal: "environment" }
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.6);
        };
      };
    });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (password !== rePassword) {
      setMessageType('danger')
      setMessage(t('password_mismatch'))
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('success')

    try {
      const formData = new FormData()
      formData.append('first_name', firstName)
      formData.append('last_name', lastName)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('address', address)
      formData.append('governorate', governorate)
      formData.append('city', city)
      
      // Generation auto de l'username (safe: sans espaces)
      const safeUsername = (firstName.toLowerCase().trim().split(' ').join('_') + cin).substring(0, 150)
      formData.append('username', safeUsername)
      formData.append('password', password)
      formData.append('re_password', rePassword)
      formData.append('cin', cin)
      
      if (cinFront) {
        const compressed = await compressImage(cinFront);
        formData.append('cin_front_image', compressed, 'front.jpg');
      }
      if (cinBack) {
        const compressed = await compressImage(cinBack);
        formData.append('cin_back_image', compressed, 'back.jpg');
      }

      formData.append('date_of_birth', dateOfBirth)
      formData.append('place_of_birth', placeOfBirth)
      formData.append('is_married', String(isMarried))
      if (isMarried) {
        formData.append('spouse_cin', spouseCin)
        formData.append('spouse_first_name', spouseFirstName)
        formData.append('spouse_last_name', spouseLastName)
      }

      const res = await fetch('/api/accounts/register/', {
        method: 'POST',
        body: formData,
      })

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!res.ok) {
        const errDetails = data?.error || `${t('error_msg')} (Code: ${res.status}). ${t('server_error_check_files')}`
        throw new Error(errDetails)
      }

      setMessage(t('signup_success_verified'))
      // Immediate redirection
      setTimeout(() => navigate('/login'), 300)
    } catch (err) {
      setMessageType('danger')
      setMessage(err instanceof Error ? err.message : t('signup_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-light d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-header bg-success text-white text-center py-4 position-relative">
                <div className="position-absolute top-0 end-0 m-2">
                   <div className="btn-group btn-group-sm">
                     <button className="btn btn-outline-light" onClick={() => setLang('fr')} title="Français">
                       <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
                     </button>
                     <button className="btn btn-outline-light" onClick={() => setLang('ar')} title="العربية">
                       <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
                     </button>
                   </div>
                </div>
                <h3 className="font-weight-light my-2">{t('create_citizen_account')}</h3>
                <p className="small mb-0">{t('join_smart_city')}</p>
              </div>

              <div className="card-body p-4">
                <form id="registerForm" onSubmit={onSubmit}>
                  <h5 className="mb-3 text-muted border-bottom pb-2">{t('identity')}</h5>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6 form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="first_name"
                        placeholder={t('first_name')}
                        required
                        value={firstName}
                        onChange={(ev) => setFirstName(ev.target.value)}
                      />
                      <label htmlFor="first_name">{t('first_name')}</label>
                    </div>
                    <div className="col-md-6 form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="last_name"
                        placeholder={t('last_name')}
                        required
                        value={lastName}
                        onChange={(ev) => setLastName(ev.target.value)}
                      />
                      <label htmlFor="last_name">{t('last_name')}</label>
                    </div>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="cin"
                      placeholder={t('cin_label')}
                      pattern="[0-9]{8}"
                      maxLength={8}

                      required
                      value={cin}
                      onChange={(ev) => setCin(ev.target.value)}
                    />
                    <label htmlFor="cin">{t('cin_label')}</label>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6 form-floating">
                      <input 
                        type="date" 
                        className="form-control" 
                        id="dob" 
                        required 
                        value={dateOfBirth} 
                        onChange={e => setDateOfBirth(e.target.value)} 
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      />
                      <label htmlFor="dob">{t('date_of_birth')}</label>
                    </div>
                    <div className="col-md-6 form-floating">
                      <input type="text" className="form-control" id="pob" placeholder={t('place_of_birth')} required value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} />
                      <label htmlFor="pob">{t('place_of_birth')}</label>
                    </div>
                  </div>

                  <div className="form-check form-switch mb-3 p-3 border rounded bg-light">
                    <input className="form-check-input ms-0" type="checkbox" id="married" checked={isMarried} onChange={e => setIsMarried(e.target.checked)} />
                    <label className="form-check-label ms-2 fw-bold" htmlFor="married">{t('is_married')}</label>
                  </div>

                  {isMarried && (
                    <div className="p-3 border rounded mb-3 animate__animated animate__fadeIn" style={{ borderLeft: '4px solid #198754' }}>
                        <h6 className="text-success mb-3 fw-bold"><i className="fas fa-heart me-2"></i>{t('spouse_info')}</h6>
                        <div className="form-floating mb-2">
                           <input type="text" className="form-control" id="scin" placeholder={t('spouse_cin')} pattern="[0-9]{8}" maxLength={8} value={spouseCin} onChange={e => setSpouseCin(e.target.value)} required={isMarried} />
                           <label htmlFor="scin">{t('spouse_cin')}</label>
                        </div>
                        <div className="row g-2">
                           <div className="col-6 form-floating">
                              <input type="text" className="form-control" id="sfn" placeholder={t('spouse_first_name')} value={spouseFirstName} onChange={e => setSpouseFirstName(e.target.value)} required={isMarried} />
                              <label htmlFor="sfn">{t('spouse_first_name')}</label>
                           </div>
                           <div className="col-6 form-floating">
                              <input type="text" className="form-control" id="sln" placeholder={t('spouse_last_name')} value={spouseLastName} onChange={e => setSpouseLastName(e.target.value)} required={isMarried} />
                              <label htmlFor="sln">{t('spouse_last_name')}</label>
                           </div>
                        </div>
                    </div>
                  )}

                  {/* CIN IMAGE CAPTURE SECTION */}
                  <h5 className="mb-3 text-muted border-bottom pb-2 mt-4">{t('documents_cin')}</h5>
                  <div className="row g-3 mb-4">
                    {/* Face Avant */}
                    <div className="col-md-6 text-center">
                      <label className="d-block mb-2 small fw-bold">{t('cin_front')}</label>
                      <div className="border rounded p-2 bg-light mb-2" style={{ height: '150px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {cinFront ? (
                           <img src={URL.createObjectURL(cinFront)} className="img-fluid rounded" style={{ maxHeight: '100%' }} alt="Avant" />
                         ) : (
                           <div className="text-muted small">{t('no_file')}</div>
                         )}
                      </div>
                      <div className="btn-group btn-group-sm w-100">
                        <button type="button" className="btn btn-outline-success" onClick={() => setShowCamera('front')}>
                          <i className="bi bi-camera me-1"></i>{t('camera')}
                        </button>
                        <input type="file" id="fileFront" hidden accept="image/*" onChange={(e) => e.target.files && setCinFront(e.target.files[0])} />
                        <button type="button" className="btn btn-outline-primary" onClick={() => document.getElementById('fileFront')?.click()}>
                           <i className="bi bi-upload me-1"></i>{t('upload')}
                        </button>
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: '10px' }}>{t('upload_fallback_msg')}</div>
                    </div>

                    {/* Face Arrière */}
                    <div className="col-md-6 text-center">
                      <label className="d-block mb-2 small fw-bold">{t('cin_back')}</label>
                      <div className="border rounded p-2 bg-light mb-2" style={{ height: '150px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {cinBack ? (
                           <img src={URL.createObjectURL(cinBack)} className="img-fluid rounded" style={{ maxHeight: '100%' }} alt="Arrière" />
                         ) : (
                           <div className="text-muted small">{t('no_file')}</div>
                         )}
                      </div>
                      <div className="btn-group btn-group-sm w-100">
                        <button type="button" className="btn btn-outline-success" onClick={() => setShowCamera('back')}>
                          <i className="bi bi-camera me-1"></i>{t('camera')}
                        </button>
                        <input type="file" id="fileBack" hidden accept="image/*" onChange={(e) => e.target.files && setCinBack(e.target.files[0])} />
                        <button type="button" className="btn btn-outline-primary" onClick={() => document.getElementById('fileBack')?.click()}>
                           <i className="bi bi-upload me-1"></i>{t('upload')}
                        </button>
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: '10px' }}>{t('upload_fallback_msg')}</div>
                    </div>
                  </div>

                  <h5 className="mb-3 text-muted border-bottom pb-2 mt-4">
                    {t('contact_loc')}
                  </h5>

                  <div className="form-floating mb-3">
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      placeholder={t('phone_label')}
                      pattern="[0-9]{8}"
                      maxLength={8}

                      required
                      value={phone}
                      onChange={(ev) => setPhone(ev.target.value)}
                    />
                    <label htmlFor="phone">{t('phone_label')}</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder={t('email')}
                      required
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                    />
                    <label htmlFor="email">{t('email')}</label>
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
                          {t('choose')}
                        </option>
                        {governorates.map((g) => (
                          <option key={g} value={g}>
                            {g === 'Kef' ? 'Le Kef' : g}
                          </option>
                        ))}
                      </select>
                      <label htmlFor="governorate">{t('governorate_label')}</label>
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
                          {t('choose')}
                        </option>
                        {cityOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <label htmlFor="city">{t('city_label')}</label>
                    </div>
                  </div>

                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      id="address"
                      placeholder={t('address_label')}
                      style={{ height: 80 }}
                      required
                      value={address}
                      onChange={(ev) => setAddress(ev.target.value)}
                    />
                    <label htmlFor="address">{t('address_label')}</label>
                  </div>

                  <h5 className="mb-3 text-muted border-bottom pb-2 mt-4">{t('security')}</h5>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6 form-floating position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        id="password"
                        placeholder={t('password_label')}
                        required
                        value={password}
                        onChange={(ev) => setPassword(ev.target.value)}
                        style={{ paddingRight: '45px' }}
                      />
                      <label htmlFor="password">{t('password_label')}</label>
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ zIndex: 10, paddingRight: '15px' }}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <div className="col-md-6 form-floating position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        id="re_password"
                        placeholder={t('confirm_password')}
                        required
                        value={rePassword}
                        onChange={(ev) => setRePassword(ev.target.value)}
                        style={{ paddingRight: '45px' }}
                      />
                      <label htmlFor="re_password">{t('confirm_password')}</label>
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ zIndex: 10, paddingRight: '15px' }}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
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
                      {t('signup_btn')}
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
                  <Link to="/login">{t('already_have_account')}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FOR CAMERA */}
      {showCamera && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
           <div className="modal-dialog modal-dialog-centered">
             <div className="modal-content">
               <div className="modal-header border-0">
                 <h5 className="modal-title">{t('capture_title')} ({showCamera === 'front' ? t('cin_front') : t('cin_back')})</h5>
                 <button type="button" className="btn-close" onClick={() => setShowCamera(null)}></button>
               </div>
               <div className="modal-body text-center bg-dark">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    mirrored={mirrored}
                    videoConstraints={videoConstraints}
                    onUserMedia={() => console.log("Camera access granted")}
                    onUserMediaError={(err) => {
                      console.error("Camera access error:", err);
                      alert(t('camera_error_alert'));
                      setShowCamera(null);
                    }}
                    className="img-fluid rounded"
                  />
                  <div className="mt-2 d-flex align-items-center justify-content-center gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm ${mirrored ? 'btn-light' : 'btn-outline-light'}`}
                      onClick={() => setMirrored(m => !m)}
                      title="Miroir / Mirror"
                    >
                      <i className="bi bi-symmetry-horizontal me-1"></i>
                      {mirrored ? 'Miroir ON' : 'Miroir OFF'}
                    </button>
                    <span className="text-muted small">{t('camera_troubleshoot')}</span>
                  </div>
               </div>
               <div className="modal-footer border-0 justify-content-center">
                 <button type="button" className="btn btn-success btn-lg px-5" onClick={capture}>
                    {t('take_photo')}
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  )
}

