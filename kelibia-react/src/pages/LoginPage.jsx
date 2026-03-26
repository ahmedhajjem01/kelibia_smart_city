import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setError(''); setLoading(true)
    try {
      const data = await login({ email, password })
      if (data.is_staff || data.is_superuser) {
        window.location.href = 'http://127.0.0.1:8000/admin/'
      } else if (data.user_type === 'agent') {
        navigate('/agent')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center',color:'#e6edf3'}}>
      <div style={{width:'100%',maxWidth:'420px',padding:'20px'}}>
        <div style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'12px',padding:'40px 36px',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
          <div style={{textAlign:'center',marginBottom:'32px'}}>
            <div style={{width:'72px',height:'72px',background:'linear-gradient(135deg,#1f6feb,#388bfd)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
              <i className="fas fa-city" style={{fontSize:'2rem',color:'#fff'}}></i>
            </div>
            <h1 style={{fontSize:'1.6rem',fontWeight:'700',color:'#e6edf3',marginBottom:'8px'}}>Kélibia Smart City</h1>
            <p style={{color:'#8b949e'}}>Portail citoyen &amp; agent municipal</p>
          </div>

          {error && (
            <div style={{backgroundColor:'rgba(248,81,73,.12)',border:'1px solid rgba(248,81,73,.4)',color:'#f85149',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',textAlign:'center'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:'18px'}}>
              <label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',color:'#c9d1d9',marginBottom:'6px'}}>Adresse email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com" required
                style={{width:'100%',padding:'11px 14px',backgroundColor:'#0d1117',border:'1px solid #30363d',borderRadius:'8px',color:'#e6edf3',boxSizing:'border-box'}} />
            </div>
            <div style={{marginBottom:'18px'}}>
              <label style={{display:'block',fontSize:'0.85rem',fontWeight:'500',color:'#c9d1d9',marginBottom:'6px'}}>Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                style={{width:'100%',padding:'11px 14px',backgroundColor:'#0d1117',border:'1px solid #30363d',borderRadius:'8px',color:'#e6edf3',boxSizing:'border-box'}} />
            </div>
            <button type="submit" disabled={loading}
              style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#1f6feb,#388bfd)',color:'white',border:'none',borderRadius:'8px',cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1}}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div style={{textAlign:'center',marginTop:'24px'}}>
            <Link to="/signup" style={{color:'#388bfd',textDecoration:'none',fontSize:'0.85rem'}}>Créer un compte</Link>
            <span style={{color:'#484f58',margin:'0 10px'}}>|</span>
            <Link to="/forgot-password" style={{color:'#388bfd',textDecoration:'none',fontSize:'0.85rem'}}>Mot de passe oublié ?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}