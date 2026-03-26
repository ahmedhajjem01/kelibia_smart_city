import { useState, useCallback } from 'react'

let _showToast = null

export function useToast() {
  return { showToast: _showToast }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  _showToast = showToast

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={('toast-msg ' + t.type)}>
          <i className={('fas fa-' + (t.type === 'success' ? 'check-circle' : 'exclamation-circle') + ' toast-icon')}></i>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

export function showToast(msg, type = 'success') {
  if (_showToast) _showToast(msg, type)
}