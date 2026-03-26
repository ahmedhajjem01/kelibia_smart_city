import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import LoginPage from './pages/LoginPage'
import CitizenDashboard from './pages/CitizenDashboard'
import AgentDashboard from './pages/AgentDashboard'
import MesReclamationsPage from './pages/MesReclamationsPage'
import ServicesPage from './pages/ServicesPage'

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh'}}><div className="spinner-border text-primary" role="status"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole === 'agent' && user.user_type !== 'agent' && !user.is_staff && !user.is_superuser) return <Navigate to="/dashboard" replace />
  if (requiredRole === 'citizen' && (user.user_type === 'agent' || user.is_staff)) return <Navigate to="/agent" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={user.user_type === 'agent' || user.is_staff ? '/agent' : '/dashboard'} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="citizen"><CitizenDashboard /></ProtectedRoute>} />
      <Route path="/agent"     element={<ProtectedRoute requiredRole="agent"><AgentDashboard /></ProtectedRoute>} />
      <Route path="/mes-reclamations" element={<ProtectedRoute requiredRole="citizen"><MesReclamationsPage /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <AppRoutes />
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}