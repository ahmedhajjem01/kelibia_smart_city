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

const CSS = `
.sp-root{min-height:100vh;background:#0f1117;display:flex;align-items:flex-start;justify-content:center;font-family:"Segoe UI",sans-serif;padding:40px 16px}
.sp-card{width:100%;max-width:560px;background:#1a1d27;border-radius:16px;padding:40px 36px 36px;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.sp-icon{width:52px;height:52px;background:#2563eb;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.5rem;color:#fff}
.sp-title{text-align:center;color:#f0f2f5;font-size:1.2rem;font-weight:700;margin-bottom:3px}
.sp-sub{text-align:center;color:#6b7280;font-size:.82rem;margin-bottom:24px}
.sp-lang{display:flex;justify-content:center;gap:8px;margin-bottom:28px}
.sp-lang-btn{background:none;border:1px solid #2a2d3a;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.78rem;color:#6b7280;display:flex;align-items:center;gap:5px;transition:all .2s}
.sp-lang-btn:hover,.sp-lang-btn.active{border-color:#2563eb;color:#93c5fd}
.sp-section{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#2563eb;margin:24px 0 14px;display:flex;align-items:center;gap:8px}
.sp-section::after{content:'';flex:1;height:1px;background:#2a2d3a}
.sp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sp-field{margin-bottom:14px}
.sp-label{display:block;font-size:.78rem;color:#9ca3af;margin-bottom:5px;font-weight:500}
.sp-input{width:100%;background:#0f1117;border:1.5px solid #2a2d3a;border-radius:8px;padding:11px 14px;font-size:.88rem;color:#e5e7eb;outline:none;box-sizing:border-box;transition:border-color .2s}
.sp-input:focus{border-color:#2563eb}
.sp-input::placeholder{color:#4b5563}
.sp-input:disabled{opacity:.5;cursor:not-allowed}
.sp-select{width:100%;background:#0f1117;border:1.5px solid #2a2d3a;border-radius:8px;padding:11px 14px;font-size:.88rem;color:#e5e7eb;outline:none;box-sizing:border-box;transition:border-color .2s;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
.sp-select:focus{border-color:#2563eb}
.sp-select option{background:#1a1d27}
.sp-textarea{width:100%;background:#0f1117;border:1.5px solid #2a2d3a;border-radius:8px;padding:11px 14px;font-size:.88rem;color:#e5e7eb;outline:none;box-sizing:border-box;resize:vertical;min-height:72px;transition:border-color .2s}
.sp-textarea:focus{border-color:#2563eb}
.sp-input-wrap{position:relative}
.sp-input-wrap .sp-input{padding-right:42px}
.sp-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#6b7280;cursor:pointer;padding:4px;display:flex;align-items:center}
.sp-btn{width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:12px;font-size:.95rem;font-weight:600;cursor:pointer;margin-top:6px;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.sp-btn:hover:not(:disabled){background:#1d4ed8}
.sp-btn:disabled{opacity:.6;cursor:not-allowed}
.sp-error{background:#2d1515;border:1px solid #7f1d1d;border-radius:8px;padding:10px 14px;color:#fca5a5;font-size:.82rem;margin-top:12px}
.sp-success{background:#0f2a1a;border:1px solid #166534;border-radius:8px;padding:10px 14px;color:#86efac;font-size:.82rem;margin-top:12px}
.sp-links{text-align:center;margin-top:20px}
.sp-links a{color:#6b7280;font-size:.82rem;text-decoration:none;transition:color .2s}
.sp-links a:hover{color:#9ca3af}
.sp-switch{display:flex;align-items:center;gap:10px;background:#0f1117;border:1.5px solid #2a2d3a;border-radius:8px;padding:10px 14px;margin-bottom:14px;cursor:pointer}
.sp-switch input[type=checkbox]{accent-color:#2563eb;width:16px;height:16px;cursor:pointer;flex-shrink:0}
.sp-switch-label{font-size:.85rem;color:#9ca3af;cursor:pointer;user-select:none}
.sp-spouse-box{background:#0f1117;border:1.5px solid #2563eb33;border-radius:10px;padding:14px 16px;margin-bottom:14px}
.sp-spouse-title{font-size:.75rem;color:#60a5fa;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.sp-cin-box{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px}
.sp-cin-slot{background:#0f1117;border:1.5px dashed #2a2d3a;border-radius:10px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:8px;min-height:130px;justify-content:center}
.sp-cin-slot img{max-height:90px;border-radius:6px;object-fit:cover}
.sp-cin-slot-lbl{font-size:.72rem;color:#6b7280;font-weight:600}
.sp-cin-btns{display:flex;gap:6px;width:100%}
.sp-cin-btn{flex:1;background:#1e2435;border:1px solid #2a2d3a;border-radius:6px;padding:5px 8px;font-size:.72rem;color:#9ca3af;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;transition:all .2s}
.sp-cin-btn:hover{border-color:#2563eb;color:#93c5fd}
@media(max-width:480px){.sp-row{grid-template-columns:1fr}.sp-cin-box{grid-template-columns:1fr}}
`

export default function SignupPage() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useI18n()
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
    <div className="sp-root">
      <style>{CSS}</style>
      <div className="sp-card">
        <div className="sp-icon"><i className="fas fa-city"></i></div>
        <div className="sp-title">Kélibia Smart City</div>
        <div className="sp-sub">{t('create_citizen_account')}</div>

        <div className="sp-lang">
          <button className={`sp-lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>
            <img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" /> FR
          </button>
          <button className={`sp-lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>
            <img src="https://flagcdn.com/w20/tn.png" width="16" alt="TN" /> عربي
          </button>
        </div>

        <form onSubmit={onSubmit}>

          {/* ── Identity ── */}
          <div className="sp-section"><i className="fas fa-id-card"></i>{t('identity')}</div>
          <div className="sp-row">
            <div className="sp-field">
              <label className="sp-label">{t('first_name')}</label>
              <input className="sp-input" type="text" placeholder={t('first_name')} required value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-label">{t('last_name')}</label>
              <input className="sp-input" type="text" placeholder={t('last_name')} required value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="sp-field">
            <label className="sp-label">{t('cin_label')}</label>
            <input className="sp-input" type="text" placeholder="12345678" pattern="[0-9]{8}" maxLength={8} required value={cin} onChange={e => setCin(e.target.value)} />
          </div>
          <div className="sp-row">
            <div className="sp-field">
              <label className="sp-label">{t('date_of_birth')}</label>
              <input className="sp-input" type="date" required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
            </div>
            <div className="sp-field">
              <label className="sp-label">{t('place_of_birth')}</label>
              <input className="sp-input" type="text" placeholder={t('place_of_birth')} required value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} />
            </div>
          </div>

          {/* Married toggle */}
          <label className="sp-switch">
            <input type="checkbox" checked={isMarried} onChange={e => setIsMarried(e.target.checked)} />
            <span className="sp-switch-label">{t('is_married')}</span>
          </label>
          {isMarried && (
            <div className="sp-spouse-box">
              <div className="sp-spouse-title"><i className="fas fa-heart"></i>{t('spouse_info')}</div>
              <div className="sp-field">
                <label className="sp-label">{t('spouse_cin')}</label>
                <input className="sp-input" type="text" placeholder="12345678" pattern="[0-9]{8}" maxLength={8} value={spouseCin} onChange={e => setSpouseCin(e.target.value)} required={isMarried} />
              </div>
              <div className="sp-row">
                <div className="sp-field">
                  <label className="sp-label">{t('spouse_first_name')}</label>
                  <input className="sp-input" type="text" value={spouseFirstName} onChange={e => setSpouseFirstName(e.target.value)} required={isMarried} />
                </div>
                <div className="sp-field">
                  <label className="sp-label">{t('spouse_last_name')}</label>
                  <input className="sp-input" type="text" value={spouseLastName} onChange={e => setSpouseLastName(e.target.value)} required={isMarried} />
                </div>
              </div>
            </div>
          )}

          {/* ── CIN Documents ── */}
          <div className="sp-section"><i className="fas fa-id-badge"></i>{t('documents_cin')}</div>
          <div className="sp-cin-box">
            {(['front', 'back'] as const).map(side => (
              <div key={side} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="sp-cin-slot">
                  <span className="sp-cin-slot-lbl">{side === 'front' ? t('cin_front') : t('cin_back')}</span>
                  {(side === 'front' ? cinFront : cinBack) ? (
                    <img src={URL.createObjectURL(side === 'front' ? cinFront! : cinBack!)} alt={side} />
                  ) : (
                    <i className="fas fa-id-card" style={{ fontSize: '2rem', color: '#2a2d3a' }}></i>
                  )}
                </div>
                <div className="sp-cin-btns">
                  <button type="button" className="sp-cin-btn" onClick={() => setShowCamera(side)}>
                    <i className="fas fa-camera"></i>{t('camera')}
                  </button>
                  <input type="file" id={`file-${side}`} hidden accept="image/*" onChange={e => e.target.files && (side === 'front' ? setCinFront(e.target.files[0]) : setCinBack(e.target.files[0]))} />
                  <button type="button" className="sp-cin-btn" onClick={() => document.getElementById(`file-${side}`)?.click()}>
                    <i className="fas fa-upload"></i>{t('upload')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Contact & Location ── */}
          <div className="sp-section"><i className="fas fa-map-marker-alt"></i>{t('contact_loc')}</div>
          <div className="sp-row">
            <div className="sp-field">
              <label className="sp-label">{t('phone_label')}</label>
              <input className="sp-input" type="tel" placeholder="12345678" pattern="[0-9]{8}" maxLength={8} required value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-label">{t('email')}</label>
              <input className="sp-input" type="email" placeholder="nom@exemple.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="sp-row">
            <div className="sp-field">
              <label className="sp-label">{t('governorate_label')}</label>
              <select className="sp-select" required value={governorate} onChange={e => { setGovernorate(e.target.value); setCity('') }}>
                <option value="" disabled>{t('choose')}</option>
                {governorates.map(g => <option key={g} value={g}>{g === 'Kef' ? 'Le Kef' : g}</option>)}
              </select>
            </div>
            <div className="sp-field">
              <label className="sp-label">{t('city_label')}</label>
              <select className="sp-select" required disabled={!governorate} value={city} onChange={e => setCity(e.target.value)}>
                <option value="" disabled>{t('choose')}</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="sp-field">
            <label className="sp-label">{t('address_label')}</label>
            <textarea className="sp-textarea" placeholder={t('address_label')} required value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          {/* ── Security ── */}
          <div className="sp-section"><i className="fas fa-lock"></i>{t('security')}</div>
          <div className="sp-row">
            <div className="sp-field">
              <label className="sp-label">{t('password_label')}</label>
              <div className="sp-input-wrap">
                <input className="sp-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="sp-eye" onClick={() => setShowPassword(p => !p)}>
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <div className="sp-field">
              <label className="sp-label">{t('confirm_password')}</label>
              <div className="sp-input-wrap">
                <input className="sp-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••••" required value={rePassword} onChange={e => setRePassword(e.target.value)} />
                <button type="button" className="sp-eye" onClick={() => setShowPassword(p => !p)}>
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <button className="sp-btn" type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm" role="status" />}
            {t('signup_btn')}
          </button>

          {message && (
            <div className={messageType === 'success' ? 'sp-success' : 'sp-error'} dangerouslySetInnerHTML={{ __html: message }} />
          )}
        </form>

        <div className="sp-links">
          <Link to="/login">{t('already_have_account')}</Link>
        </div>
      </div>

      {/* Camera modal */}
      {showCamera && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1d27', borderRadius: 14, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ background: '#0f1117', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2d3a' }}>
              <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '.9rem' }}>{t('capture_title')} — {showCamera === 'front' ? t('cin_front') : t('cin_back')}</span>
              <button onClick={() => setShowCamera(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ padding: 16, background: '#000', textAlign: 'center' }}>
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" mirrored={mirrored} videoConstraints={videoConstraints}
                onUserMediaError={() => { alert(t('camera_error_alert')); setShowCamera(null) }}
                style={{ borderRadius: 8, width: '100%' }}
              />
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', gap: 10, justifyContent: 'center', background: '#0f1117', borderTop: '1px solid #2a2d3a' }}>
              <button type="button" onClick={() => setMirrored(m => !m)}
                style={{ background: mirrored ? '#2563eb22' : 'none', border: '1px solid #2a2d3a', borderRadius: 7, padding: '6px 14px', color: '#9ca3af', cursor: 'pointer', fontSize: '.8rem' }}>
                <i className="fas fa-arrows-alt-h me-1"></i>{mirrored ? 'Miroir ON' : 'Miroir OFF'}
              </button>
              <button type="button" onClick={capture}
                style={{ background: '#2563eb', border: 'none', borderRadius: 7, padding: '8px 28px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '.9rem' }}>
                <i className="fas fa-camera me-2"></i>{t('take_photo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

