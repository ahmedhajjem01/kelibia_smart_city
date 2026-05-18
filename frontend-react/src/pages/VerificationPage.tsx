import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { resolveBackendUrl } from '../lib/backendUrl'
import { getAccessToken, storeTokens } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'

export default function VerificationPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get email from location state or query params
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    // Try to get email from state first
    const stateEmail = (location.state as any)?.email
    if (stateEmail) {
      setEmail(stateEmail)
    } else {
      // Fallback to query params
      const params = new URLSearchParams(location.search)
      const paramEmail = params.get('email')
      if (paramEmail) {
        setEmail(paramEmail)
      } else {
        // If no email, redirect to login
        navigate('/login')
      }
    }
  }, [location, navigate])

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return // Only allow numbers
    
    const newCode = [...code]
    newCode[index] = value.substring(value.length - 1) // Keep only the last character
    setCode(newCode)

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError(lang === 'ar' ? 'الرجاء إدخال الكود المكون من 6 أرقام' : 'Veuillez saisir le code à 6 chiffres.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(resolveBackendUrl('/api/accounts/activation/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: fullCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la vérification.')
      }

      setSuccess(lang === 'ar' ? 'تم تفعيل الحساب بنجاح!' : 'Compte activé avec succès !')
      
      // Store tokens
      if (data.access && data.refresh) {
        storeTokens({
          access: data.access,
          refresh: data.refresh,
          username: data.username
        })
      }

      // Redirect to citizen page (dashboard)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(resolveBackendUrl('/api/accounts/resend-activation/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du code.")
      }

      setSuccess(lang === 'ar' ? 'تم إرسال كود جديد!' : 'Un nouveau code a été envoyé !')
      
      // Clear inputs
      setCode(['', '', '', '', '', ''])
      inputRefs[0].current?.focus()

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setResending(false)
    }
  }

  const CSS = `
    .verify-container {
      max-width: 500px;
      margin: 100px auto;
      padding: 30px;
      background: #fff;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      text-align: center;
      font-family: 'Public Sans', sans-serif;
    }
    .verify-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 20px;
    }
    .verify-sub {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    .code-inputs {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 30px;
      direction: ltr; /* Always LTR for code inputs */
    }
    .code-input {
      width: 50px;
      height: 60px;
      border: 1px solid #007791;
      border-radius: 8px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      outline: none;
      transition: border-color 0.2s;
    }
    .code-input:focus {
      border-color: #007791;
      box-shadow: 0 0 5px rgba(0, 119, 145, 0.3);
    }
    .verify-btn {
      padding: 12px 30px;
      background-color: #007791;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s;
      margin: 0 10px;
    }
    .verify-btn:hover {
      background-color: #005f73;
    }
    .verify-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .back-btn {
      padding: 12px 30px;
      background-color: #777;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s;
      margin: 0 10px;
    }
    .back-btn:hover {
      background-color: #555;
    }
    .resend-btn {
      background: none;
      border: none;
      color: #007791;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      margin-top: 20px;
      font-size: 0.9rem;
    }
    .resend-btn:disabled {
      color: #999;
      cursor: not-allowed;
      text-decoration: none;
    }
    .alert {
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }
    .alert-danger {
      background-color: #ffe3e3;
      color: #d63031;
    }
    .alert-success {
      background-color: #d4edda;
      color: #155724;
    }
  `

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', overflow: 'hidden' }}>
      <style>{CSS}</style>
      <div className="verify-container" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <h1 className="verify-title">
          {lang === 'ar' ? 'التحقق بخطوتين :' : 'Vérification en deux étapes :'}
        </h1>
        
        <p className="verify-sub">
          {lang === 'ar' 
            ? `تم إرسال رمز التحقق إلى بريدك الإلكتروني (${email}). يرجى إدخال هذا الرمز.`
            : `Un code de vérification a été envoyé à votre email (${email}). Veuillez saisir ce code.`}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="code-inputs">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                className="code-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                maxLength={1}
                disabled={loading}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button 
              type="button" 
              className="back-btn" 
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              {lang === 'ar' ? 'رجوع' : 'Retour'}
            </button>
            <button 
              type="submit" 
              className="verify-btn" 
              disabled={loading || code.some(d => !d)}
            >
              {loading ? (lang === 'ar' ? 'جاري التحقق...' : 'Vérification...') : (lang === 'ar' ? 'تحقق' : 'Vérifier')}
            </button>
          </div>
        </form>

        <button 
          className="resend-btn" 
          onClick={handleResend}
          disabled={resending || loading}
        >
          {resending 
            ? (lang === 'ar' ? 'جاري الإرسال...' : 'Renvoi en cours...') 
            : (lang === 'ar' ? 'إعادة إرسال الرمز' : 'Renvoyer le code')}
        </button>
      </div>
    </div>
  )
}
