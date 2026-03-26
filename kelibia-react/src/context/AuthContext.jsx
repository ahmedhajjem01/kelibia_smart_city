import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) { setLoading(false); return }
      const { data } = await apiClient.get('/api/accounts/me/')
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (credentials) => {
    const { data } = await apiClient.post('/api/token/', credentials)
    localStorage.setItem('accessToken', data.access)
    localStorage.setItem('refreshToken', data.refresh)
    localStorage.setItem('user_type', data.user_type || '')
    await fetchMe()
    return data
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user_type')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
