import { useMemo, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useI18n } from '../i18n/LanguageProvider'

const cityData: Record<string, string[]> = {
  Nabeul: [
    'Nabeul', 'Hammamet', 'Kélibia', 'Dar Chaâbane El Fehri', 'Béni Khiar',
    'El Mida', 'Hammam Ghezèze', 'Korba', 'Menzel Bouzelfa', 'Menzel Temime',
    'Soliman', 'Takilsa', 'Grombalia', 'Béni Khalled', 'Bou Argoub', 'El Haouaria',
  ],
  Ariana: ['Ariana', 'Soukra', 'Raoued', 'Kalaat el-Andalous', 'Sidi Thabet', 'Mnihla', 'Ettadhamen'],
  Tunis: ['Tunis', 'La Marsa', 'Le Kram', 'La Goulette', 'Carthage', 'Sidi Bou Saïd', 'Gammarth', 'Sidi Hassine', 'El Ouardia'],
  Sousse: ['Sousse', 'Hammam Sousse', 'Akouda', 'Kalâa Kebira', 'Kalâa Seghira', 'Msaken', 'Enfidha', 'Bouficha', 'Hergla'],
  'Ben Arous': ['Ben Arous', 'Ezzahra', 'Hammam Lif', 'Hammam Chott', 'Bou Mhel el-Bassatine', 'Mornag', 'Radès', 'Mégrin', 'Fouchana'],
  Bizerte: ['Bizerte', 'Menzel Bourguiba', 'Mateur', 'Ghezala', 'Sejnane', 'Joumine', 'Utique', 'Ghar El Melh', 'Ras Jebel'],
  Sfax: ['Sfax', 'Sakiet Ezzit', 'Sakiet Eddaier', 'Chihia', 'Gremda', 'El Ain', 'Thyna', 'Agareb', 'Jebiniana'],
  Monastir: ['Monastir', 'Khniss', 'Ouerdanin', 'Sahline', 'Zéramdine', 'Béni Hassen', 'Jemmal', 'Bekalta', 'Sayada', 'Téboulba', 'Ksibet el-Médiouni'],
  Beja: ['Béja Centre', 'Amdoun', 'Goubellat', 'Medjez el-Bab', 'Nefza', 'Téboursouk', 'Testour', 'Thibar'],
  Gabes: ['Gabès Centre', 'El Hamma', 'Ghannouch', 'Mareth', 'Matmata', 'Menzel El Habib', 'Métouia'],
  Gafsa: ['Gafsa Centre', 'El Guettar', 'El Ksar', 'Mdhilla', 'Métlaoui', 'Moularès', 'Redeyef', 'Sened'],
  Jendouba: ['Jendouba Centre', 'Aïn Draham', 'Balta-Bou Aouane', 'Bou Salem', 'Fernana', 'Ghardimaou', 'Oued Meliz', 'Tabarka'],
  Kairouan: ['Kairouan Centre', 'Bou Hajla', 'Chebika', 'Echrarda', 'Haffouz', 'Hajeb El Ayoun', 'Nasrallah', 'Oueslatia', 'Sbikha'],
  Kasserine: ['Kasserine Centre', 'Fériana', 'Foussana', 'Haidra', 'Jedelienne', 'Majel Bel Abbès', 'Sbeïtla', 'Sbiba', 'Thala'],
  Kebili: ['Kébili Centre', 'Douz Centre', 'Faouar', 'Souk Lahad'],
  Kef: ['Le Kef Centre', 'Dahmani', 'Jerissa', 'Kalâat Khasba', 'Kalaat Senan', 'Nebeur', 'Sakiet Sidi Youssef', 'Tajerouine'],
  Mahdia: ['Mahdia Centre', 'Bou Merdes', 'Chebba', 'Chorbane', 'El Jem', 'Hebira', 'Ksour Essef', 'Melloulèche', 'Ouled Chamekh', 'Sidi Alouane'],
  Manouba: ['La Manouba Centre', 'Borj El Amri', 'Djedeida', 'Douar Hicher', 'El Battan', 'Mornaguia', 'Oued Ellil', 'Tebourba'],
  Medenine: ['Médenine Centre', 'Ben Guerdane', 'Djerba Ajim', 'Djerba Houmt Souk', 'Djerba Midoun', 'Zarzis'],
  'Sidi Bouzid': ['Sidi Bouzid Centre', 'Bir El Hafey', 'Cebbala Ouled Asker', 'Jilma', 'Mazzouna', 'Menzel Bouzaiane', 'Regueb', 'Sidi Ali Ben Aoun'],
  Siliana: ['Siliana Centre', 'Bou Arada', 'Bargou', 'Gaâfour', 'Kesra', 'Makthar', 'Rouhia'],
  Tataouine: ['Tataouine Centre', 'Bir Lahmar', 'Dehiba', 'Ghomrassen', 'Remada', 'Smâr'],
  Tozeur: ['Tozeur Centre', 'Degache', 'Hezoua', 'Nefta', 'Tamaghza'],
  Zaghouan: ['Zaghouan Centre', 'Bir Mcherga', 'El Fahs', 'Nadhour', 'Saouaf', 'Zriba'],
}

const governorates = [
  'Ariana', 'Beja', 'Ben Arous', 'Bizerte', 'Gabes', 'Gafsa', 'Jendouba',
  'Kairouan', 'Kasserine', 'Kebili', 'Kef', 'Mahdia', 'Manouba', 'Medenine',
  'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
  'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
]

const CSS = `
/* ── Reset & base ── */
.sg-root {
  min-height: 100vh;
  background: #faf8ff;
  font-family: "Public Sans", "Segoe UI", sans-serif;
  color: #191b22;
}

/* ── Top nav ── */
.sg-nav {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 32px;
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 1px 0 rgba(0,0,0,.06);
}
.sg-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.sg-nav-logo {
  height: 38px;
  width: auto;
}
.sg-nav-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #175ead;
  letter-spacing: -.4px;
}
.sg-nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}
.sg-nav-links a {
  color: #6b7280;
  font-size: .88rem;
  text-decoration: none;
  transition: color .2s;
}
.sg-nav-links a:hover { color: #f18221; }
.sg-nav-lang {
  background: none;
  border: 1.5px solid #ffd4b0;
  border-radius: 999px;
  padding: 4px 14px;
  color: #954a00;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s;
}
.sg-nav-lang:hover { background: #fff3e8; }

/* ── Main canvas ── */
.sg-main {
  padding: 112px 24px 64px;
  max-width: 1100px;
  margin: 0 auto;
}
.sg-layout {
  display: flex;
  gap: 56px;
  align-items: flex-start;
}

/* ── Left sidebar ── */
.sg-sidebar {
  width: 320px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
}
.sg-hero-title {
  font-size: 2.8rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -.5px;
  margin-bottom: 20px;
}
.sg-gradient-text {
  background: linear-gradient(135deg, #954a00 0%, #f18221 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sg-hero-sub {
  color: #564336;
  font-size: 1rem;
  line-height: 1.65;
  margin-bottom: 28px;
}
.sg-glass-tile {
  background: rgba(255,255,255,.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(221,193,176,.3);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,.04);
}
.sg-tile-icon {
  background: #ffdcc6;
  border-radius: 10px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #954a00;
  font-size: 1.1rem;
}
.sg-tile-title {
  font-size: .88rem;
  font-weight: 700;
  color: #175ead;
  margin-bottom: 3px;
}
.sg-tile-body {
  font-size: .78rem;
  color: #6b7280;
  line-height: 1.5;
}
.sg-hero-img {
  border-radius: 18px;
  overflow: hidden;
  height: 180px;
  position: relative;
}
.sg-hero-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .7s;
}
.sg-hero-img:hover img { transform: scale(1.06); }
.sg-hero-img-caption {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(23,94,173,.75), transparent);
  display: flex;
  align-items: flex-end;
  padding: 18px 20px;
  color: #fff;
  font-size: .88rem;
  font-weight: 500;
}

/* ── Form card ── */
.sg-card {
  flex: 1;
  background: #ffffff;
  border-radius: 20px;
  padding: 44px 48px;
  box-shadow: 0 4px 32px rgba(0,0,0,.06);
  border: 1px solid rgba(225,226,236,.6);
}

/* ── Section headers ── */
.sg-section-hd {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 26px;
}
.sg-section-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #175ead;
}
.sg-section-title-ar {
  display: block;
  font-size: .78rem;
  font-weight: 400;
  color: #6b7280;
  margin-top: 1px;
}
.sg-step-badge {
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #954a00;
}
.sg-divider {
  border: none;
  border-top: 1px solid #f0ebe6;
  margin: 36px 0;
}

/* ── Fields ── */
.sg-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}
.sg-grid-full {
  grid-column: 1 / -1;
}
.sg-field { display: flex; flex-direction: column; gap: 5px; }
.sg-label {
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #897364;
}
.sg-input, .sg-select, .sg-textarea {
  background: #e7e7f1;
  border: none;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: .9rem;
  color: #191b22;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: box-shadow .2s, background .2s;
  font-family: inherit;
}
.sg-input::placeholder, .sg-textarea::placeholder { color: #9ca3af; }
.sg-input:focus, .sg-select:focus, .sg-textarea:focus {
  background: #fff;
  box-shadow: 0 0 0 2px #954a00;
}
.sg-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  cursor: pointer;
}
.sg-select option { background: #fff; color: #191b22; }
.sg-textarea { resize: vertical; min-height: 80px; }
.sg-phone-wrap {
  display: flex;
  gap: 8px;
}
.sg-phone-prefix {
  background: #e7e7f1;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: .88rem;
  font-weight: 700;
  color: #175ead;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.sg-input-wrap { position: relative; }
.sg-input-wrap .sg-input { padding-right: 44px; }
.sg-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #897364;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

/* ── Documents section ── */
.sg-doc-section {
  background: #f2f3fd;
  border-radius: 16px;
  padding: 24px 28px;
  margin: 36px 0;
}
.sg-cin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 18px;
}
.sg-cin-slot {
  background: #fff;
  border: 2px dashed #ddc1b0;
  border-radius: 14px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color .2s, background .2s;
  padding: 16px;
  text-align: center;
}
.sg-cin-slot:hover { border-color: #954a00; background: #fff8f4; }
.sg-cin-slot img { max-height: 90px; border-radius: 8px; object-fit: cover; }
.sg-cin-slot-icon { font-size: 2rem; color: #ddc1b0; }
.sg-cin-slot-lbl { font-size: .78rem; font-weight: 600; color: #6b7280; }
.sg-cin-slot-sub { font-size: .68rem; color: #9ca3af; }
.sg-cin-btns {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  width: 100%;
}
.sg-cin-btn {
  flex: 1;
  background: #fff;
  border: 1px solid #e1e2ec;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: .72rem;
  color: #564336;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all .2s;
  font-family: inherit;
}
.sg-cin-btn:hover { border-color: #954a00; color: #954a00; }

/* ── Married toggle ── */
.sg-switch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f2f3fd;
  border-radius: 10px;
  padding: 12px 16px;
  margin: 20px 0;
  cursor: pointer;
}
.sg-switch-row input[type=checkbox] {
  accent-color: #954a00;
  width: 17px;
  height: 17px;
  cursor: pointer;
}
.sg-switch-lbl { font-size: .88rem; color: #564336; cursor: pointer; user-select: none; }
.sg-spouse-box {
  background: #fff8f4;
  border: 1.5px solid #ffdcc6;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 18px;
}
.sg-spouse-hd {
  font-size: .75rem;
  font-weight: 700;
  color: #f18221;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Submit area ── */
.sg-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}
.sg-submit-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.sg-btn {
  background: linear-gradient(135deg, #954a00 0%, #f18221 100%);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 14px 36px;
  font-size: .95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity .2s, transform .1s;
  font-family: inherit;
  box-shadow: 0 4px 18px rgba(149,74,0,.25);
  white-space: nowrap;
}
.sg-btn:hover:not(:disabled) { opacity: .9; }
.sg-btn:active:not(:disabled) { transform: scale(.97); }
.sg-btn:disabled { opacity: .6; cursor: not-allowed; }
.sg-login-link {
  font-size: .85rem;
  color: #6b7280;
}
.sg-login-link a {
  color: #175ead;
  font-weight: 700;
  text-decoration: none;
}
.sg-login-link a:hover { text-decoration: underline; }
.sg-terms-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f2f3fd;
  border-radius: 10px;
  padding: 14px 16px;
}
.sg-terms-row input[type=checkbox] { accent-color: #954a00; width: 15px; height: 15px; flex-shrink: 0; margin-top: 2px; cursor: pointer; }
.sg-terms-text { font-size: .77rem; color: #6b7280; line-height: 1.5; }
.sg-terms-text a { color: #954a00; }

/* ── Messages ── */
.sg-error {
  background: #ffdad6;
  border: 1px solid #ba1a1a;
  border-radius: 10px;
  padding: 12px 16px;
  color: #93000a;
  font-size: .83rem;
  margin-top: 14px;
}
.sg-success {
  background: #e6f4ea;
  border: 1px solid #166534;
  border-radius: 10px;
  padding: 12px 16px;
  color: #166534;
  font-size: .83rem;
  margin-top: 14px;
}

/* ── Footer ── */
.sg-footer {
  background: #f8f9fc;
  border-top: 1px solid #e1e2ec;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.sg-footer-brand { font-size: .88rem; font-weight: 700; color: #175ead; }
.sg-footer-copy { font-size: .78rem; color: #9ca3af; }
.sg-footer-links { display: flex; gap: 20px; }
.sg-footer-links a { font-size: .78rem; color: #9ca3af; text-decoration: none; }
.sg-footer-links a:hover { color: #175ead; }

/* ── Camera modal ── */
.sg-cam-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.75);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.sg-cam-modal {
  background: #fff;
  border-radius: 18px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,.3);
}
.sg-cam-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e1e2ec;
}
.sg-cam-title { font-weight: 700; font-size: .95rem; color: #191b22; }
.sg-cam-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
}
.sg-cam-body { padding: 0; background: #000; text-align: center; }
.sg-cam-footer {
  padding: 14px 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  border-top: 1px solid #e1e2ec;
}
.sg-cam-mirror {
  background: #f2f3fd;
  border: 1px solid #e1e2ec;
  border-radius: 8px;
  padding: 8px 16px;
  color: #564336;
  cursor: pointer;
  font-size: .8rem;
  font-family: inherit;
}
.sg-cam-capture {
  background: linear-gradient(135deg, #954a00, #f18221);
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  font-size: .88rem;
  font-family: inherit;
}

@media (max-width: 900px) {
  .sg-layout { flex-direction: column; }
  .sg-sidebar { width: 100%; position: static; }
  .sg-hero-title { font-size: 2rem; }
  .sg-card { padding: 28px 20px; }
  .sg-grid-2 { grid-template-columns: 1fr; }
  .sg-cin-grid { grid-template-columns: 1fr; }
  .sg-submit-row { flex-direction: column; align-items: stretch; }
  .sg-btn { justify-content: center; }
}
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
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [dateOfBirth, setDateOfBirth] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [isMarried, setIsMarried] = useState(false)
  const [spouseCin, setSpouseCin] = useState('')
  const [spouseFirstName, setSpouseFirstName] = useState('')
  const [spouseLastName, setSpouseLastName] = useState('')

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

  const videoConstraints = { facingMode: { ideal: 'environment' } }

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1000
          let width = img.width
          let height = img.height
          if (width > MAX_WIDTH) { height = (MAX_WIDTH / width) * height; width = MAX_WIDTH }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.6)
        }
      }
    })
  }

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
      const safeUsername = (firstName.toLowerCase().trim().split(' ').join('_') + cin).substring(0, 150)
      formData.append('username', safeUsername)
      formData.append('password', password)
      formData.append('re_password', rePassword)
      formData.append('cin', cin)
      if (cinFront) { const c = await compressImage(cinFront); formData.append('cin_front_image', c, 'front.jpg') }
      if (cinBack) { const c = await compressImage(cinBack); formData.append('cin_back_image', c, 'back.jpg') }
      formData.append('date_of_birth', dateOfBirth)
      formData.append('place_of_birth', placeOfBirth)
      formData.append('is_married', String(isMarried))
      if (isMarried) {
        formData.append('spouse_cin', spouseCin)
        formData.append('spouse_first_name', spouseFirstName)
        formData.append('spouse_last_name', spouseLastName)
      }

      const res = await fetch('/api/accounts/register/', { method: 'POST', body: formData })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        throw new Error(data?.error || `${t('error_msg')} (Code: ${res.status}). ${t('server_error_check_files')}`)
      }
      setMessage(t('signup_success_verified'))
      setTimeout(() => navigate('/login'), 300)
    } catch (err) {
      setMessageType('danger')
      setMessage(err instanceof Error ? err.message : t('signup_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sg-root">
      <style>{CSS}</style>

      {/* Top Nav */}
      <nav className="sg-nav">
        <a className="sg-nav-brand" href="/">
          <img
            className="sg-nav-logo"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbLAmKtkBQshXo3NZk0q4qIK4rVJ_J8nEu4Ay-eu_J--h-C-ot-X_QibRxePQUtOYyfLxIEGRDxZjYxdZ3-2wqpewJsh8Cw1Te5-QKpFzzpf_a1LVGJfsMxPcfYF2dsL7hwHMlodJovJ22uHyN5xrGbJ3njsgE8jUkXI9j5pMJpoSAv6ci_8pqtzEeLlOsYTCceEIxBzLkOAg7PElc2gPBw_N7NReNMsNHpjqZHbDh160yCXWmY76BWzR1x925UXmvoupiUkK_hObn"
            alt="Ville de Kélibia"
          />
          <span className="sg-nav-name">Ville de Kélibia</span>
        </a>
        <div className="sg-nav-links">
          <a href="#">Contact</a>
          <a href="#">FAQ</a>
          <button className="sg-nav-lang" onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}>
            {lang === 'fr' ? 'عربي' : 'FR'}
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="sg-main">
        <div className="sg-layout">

          {/* ── Left Sidebar ── */}
          <div className="sg-sidebar">
            <h1 className="sg-hero-title">
              <span className="sg-gradient-text">Devenir Citoyen</span>{' '}
              Numérique
            </h1>
            <p className="sg-hero-sub">
              Rejoignez l'écosystème Smart City de Kélibia. Accédez à vos
              services municipaux, suivez vos demandes et participez à la vie
              locale en un clic.
            </p>
            <div className="sg-glass-tile">
              <div className="sg-tile-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div>
                <div className="sg-tile-title">Sécurité des données</div>
                <div className="sg-tile-body">
                  Vos documents sont chiffrés et stockés localement selon les
                  normes nationales.
                </div>
              </div>
            </div>
            <div className="sg-hero-img">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8t1W84IxVUymVrGVEJHZw1XOiYg53wNQ3cUmfWflMIkDpSzTcqNe0K4_i71j5GEcHWwmD93CCAL9cwzmgVlPH8hqVbGXryFe_cFlHrBgQfedHoX5BaFFGMChzRc36erKdUgph-UkFpudjThaxXwIw4JYN8Z5y2XOPSXh6-2iZ75wLwOYJTH0RFxYFRebZYCYJRu704TPX6VYKmZ9H2e5hvWBLEZsH2o3M8R_j2cxj5-KZ7OlTh7Noa0r8gu-jT2SdzG9g3KHoQspp"
                alt="Kélibia Fortress"
              />
              <div className="sg-hero-img-caption">Kélibia : Entre Histoire et Futur</div>
            </div>
          </div>

          {/* ── Form Card ── */}
          <div className="sg-card">
            <form onSubmit={onSubmit}>

              {/* ── Section 1: Identité ── */}
              <div className="sg-section-hd">
                <h2 className="sg-section-title">
                  Identité Personnelle
                  <span className="sg-section-title-ar">الهوية الشخصية</span>
                </h2>
                <span className="sg-step-badge">Etape 01/04</span>
              </div>
              <div className="sg-grid-2">
                <div className="sg-field">
                  <label className="sg-label">Prénom / الإسم</label>
                  <input className="sg-input" type="text" placeholder="Ex: Mohamed" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="sg-field">
                  <label className="sg-label">Nom / اللقب</label>
                  <input className="sg-input" type="text" placeholder="Ex: Ben Ali" required value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div className="sg-field">
                  <label className="sg-label">N° Carte d'Identité (CIN) / رقم بطاقة التعريف</label>
                  <input className="sg-input" type="text" placeholder="00000000" pattern="[0-9]{8}" maxLength={8} required value={cin} onChange={e => setCin(e.target.value)} />
                </div>
                <div className="sg-field">
                  <label className="sg-label">Date de Naissance / تاريخ الولادة</label>
                  <input className="sg-input" type="date" required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                </div>
                <div className="sg-field sg-grid-full">
                  <label className="sg-label">Lieu de Naissance / مكان الولادة</label>
                  <input className="sg-input" type="text" placeholder="Ex: Kélibia" required value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} />
                </div>
              </div>

              {/* Married toggle */}
              <label className="sg-switch-row">
                <input type="checkbox" checked={isMarried} onChange={e => setIsMarried(e.target.checked)} />
                <span className="sg-switch-lbl">{t('is_married')}</span>
              </label>
              {isMarried && (
                <div className="sg-spouse-box">
                  <div className="sg-spouse-hd"><i className="fas fa-heart"></i>{t('spouse_info')}</div>
                  <div className="sg-field" style={{ marginBottom: 14 }}>
                    <label className="sg-label">{t('spouse_cin')}</label>
                    <input className="sg-input" type="text" placeholder="12345678" pattern="[0-9]{8}" maxLength={8} value={spouseCin} onChange={e => setSpouseCin(e.target.value)} required={isMarried} />
                  </div>
                  <div className="sg-grid-2">
                    <div className="sg-field">
                      <label className="sg-label">{t('spouse_first_name')}</label>
                      <input className="sg-input" type="text" value={spouseFirstName} onChange={e => setSpouseFirstName(e.target.value)} required={isMarried} />
                    </div>
                    <div className="sg-field">
                      <label className="sg-label">{t('spouse_last_name')}</label>
                      <input className="sg-input" type="text" value={spouseLastName} onChange={e => setSpouseLastName(e.target.value)} required={isMarried} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section 2: Documents ── */}
              <div className="sg-doc-section">
                <div className="sg-section-hd" style={{ marginBottom: 0 }}>
                  <h2 className="sg-section-title">
                    Documents
                    <span className="sg-section-title-ar">الوثائق المطلوبة</span>
                  </h2>
                  <span className="sg-step-badge">Etape 02/04</span>
                </div>
                <div className="sg-cin-grid">
                  {(['front', 'back'] as const).map(side => (
                    <div key={side} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="sg-cin-slot">
                        {(side === 'front' ? cinFront : cinBack) ? (
                          <img src={URL.createObjectURL(side === 'front' ? cinFront! : cinBack!)} alt={side} />
                        ) : (
                          <>
                            <span className="sg-cin-slot-icon"><i className="fas fa-id-card"></i></span>
                            <span className="sg-cin-slot-lbl">{side === 'front' ? 'Face Avant CIN' : 'Face Arrière CIN'}</span>
                            <span className="sg-cin-slot-sub">{side === 'front' ? 'Recto / وجه البطاقة' : 'Verso / ظهر البطاقة'}</span>
                          </>
                        )}
                      </div>
                      <div className="sg-cin-btns">
                        <button type="button" className="sg-cin-btn" onClick={() => setShowCamera(side)}>
                          <i className="fas fa-camera"></i>{t('camera')}
                        </button>
                        <input type="file" id={`file-${side}`} hidden accept="image/*" onChange={e => e.target.files && (side === 'front' ? setCinFront(e.target.files[0]) : setCinBack(e.target.files[0]))} />
                        <button type="button" className="sg-cin-btn" onClick={() => document.getElementById(`file-${side}`)?.click()}>
                          <i className="fas fa-upload"></i>{t('upload')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 3: Contact & Localisation ── */}
              <div className="sg-section-hd">
                <h2 className="sg-section-title">
                  Contact &amp; Localisation
                  <span className="sg-section-title-ar">الاتصال والموقع</span>
                </h2>
                <span className="sg-step-badge">Etape 03/04</span>
              </div>
              <div className="sg-grid-2">
                <div className="sg-field">
                  <label className="sg-label">Mobile / الهاتف الجوال</label>
                  <div className="sg-phone-wrap">
                    <span className="sg-phone-prefix">+216</span>
                    <input className="sg-input" type="tel" placeholder="00 000 000" pattern="[0-9]{8}" maxLength={8} required value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="sg-field">
                  <label className="sg-label">E-mail / البريد الإلكتروني</label>
                  <input className="sg-input" type="email" placeholder="nom@exemple.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="sg-field">
                  <label className="sg-label">Gouvernorat / الولاية</label>
                  <select className="sg-select" required value={governorate} onChange={e => { setGovernorate(e.target.value); setCity('') }}>
                    <option value="" disabled>{t('choose')}</option>
                    {governorates.map(g => <option key={g} value={g}>{g === 'Kef' ? 'Le Kef' : g}</option>)}
                  </select>
                </div>
                <div className="sg-field">
                  <label className="sg-label">Ville / المعتمدية</label>
                  <select className="sg-select" required disabled={!governorate} value={city} onChange={e => setCity(e.target.value)}>
                    <option value="" disabled>{t('choose')}</option>
                    {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sg-field sg-grid-full">
                  <label className="sg-label">Adresse Résidence / العنوان السكني</label>
                  <textarea className="sg-textarea" placeholder="Rue, Quartier, Code Postal..." required value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              <hr className="sg-divider" />

              {/* ── Section 4: Sécurité ── */}
              <div className="sg-section-hd">
                <h2 className="sg-section-title">
                  Sécurité
                  <span className="sg-section-title-ar">الأمان</span>
                </h2>
                <span className="sg-step-badge">Etape 04/04</span>
              </div>
              <div className="sg-grid-2">
                <div className="sg-field">
                  <label className="sg-label">Mot de passe / كلمة السر</label>
                  <div className="sg-input-wrap">
                    <input className="sg-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="sg-eye" onClick={() => setShowPassword(p => !p)}>
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="sg-field">
                  <label className="sg-label">Confirmer / تأكيد كلمة السر</label>
                  <div className="sg-input-wrap">
                    <input className="sg-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••••" required value={rePassword} onChange={e => setRePassword(e.target.value)} />
                    <button type="button" className="sg-eye" onClick={() => setShowPassword(p => !p)}>
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="sg-actions" style={{ marginTop: 32 }}>
                <div className="sg-submit-row">
                  <button className="sg-btn" type="submit" disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm" role="status" />}
                    Créer mon compte citoyen
                  </button>
                  <p className="sg-login-link">
                    Déjà inscrit ? <Link to="/login">Se connecter</Link>
                  </p>
                </div>
                <div className="sg-terms-row">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                  <span className="sg-terms-text">
                    J'accepte les <a href="#">Conditions Générales d'Utilisation</a> et la politique de protection des données personnelles de la Commune de Kélibia.
                  </span>
                </div>
              </div>

              {message && (
                <div className={messageType === 'success' ? 'sg-success' : 'sg-error'} dangerouslySetInnerHTML={{ __html: message }} />
              )}

            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sg-footer">
        <div>
          <div className="sg-footer-brand">Ville de Kélibia</div>
          <div className="sg-footer-copy">© 2024 Commune de Kélibia — Smart City Portal</div>
        </div>
        <div className="sg-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Security Disclosure</a>
        </div>
      </footer>

      {/* Camera modal */}
      {showCamera && (
        <div className="sg-cam-overlay">
          <div className="sg-cam-modal">
            <div className="sg-cam-header">
              <span className="sg-cam-title">{t('capture_title')} — {showCamera === 'front' ? 'Face Avant' : 'Face Arrière'}</span>
              <button className="sg-cam-close" onClick={() => setShowCamera(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="sg-cam-body">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                mirrored={mirrored}
                videoConstraints={videoConstraints}
                onUserMediaError={() => { alert(t('camera_error_alert')); setShowCamera(null) }}
                style={{ borderRadius: 0, width: '100%' }}
              />
            </div>
            <div className="sg-cam-footer">
              <button type="button" className="sg-cam-mirror" onClick={() => setMirrored(m => !m)}>
                <i className="fas fa-arrows-alt-h"></i> {mirrored ? 'Miroir ON' : 'Miroir OFF'}
              </button>
              <button type="button" className="sg-cam-capture" onClick={capture}>
                <i className="fas fa-camera"></i> {t('take_photo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
