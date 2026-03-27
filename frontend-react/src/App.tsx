import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import LanguageProvider from './i18n/LanguageProvider'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ActivatePage from './pages/ActivatePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage'
import DashboardPage from './pages/DashboardPage'
import AgentDashboardPage from './pages/AgentDashboardPage'
import ServicesPage from './pages/ServicesPage'
import MunicipaliteNaissancesPage from './pages/MunicipaliteNaissancesPage'
import DeclarationNaissancePage from './pages/DeclarationNaissancePage'
import DeclarationDecesPage from './pages/DeclarationDecesPage'
import MesExtraitsPage from './pages/MesExtraitsPage'
import MesDecesPage from './pages/MesDecesPage'
import MesMariagesPage from './pages/MesMariagesPage'
import DemandeResidencePage from './pages/DemandeResidencePage'
import MesResidencesPage from './pages/MesResidencesPage'
import ReclamationFormPage from './pages/ReclamationFormPage'
import MesReclamationsPage from './pages/MesReclamationsPage'
import AgentReclamationsPage from './pages/AgentReclamationsPage'
import ComingSoonPage from './pages/ComingSoonPage'

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password-confirm"
            element={<ResetPasswordConfirmPage />}
          />

          {/* Remaining pages will be converted next (citizen/agent + services). */}
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
          <Route
            path="/agent-dashboard"
            element={<AgentDashboardPage />}
          />
          <Route
            path="/services"
            element={<ServicesPage />}
          />
          <Route
            path="/mes-extraits"
            element={<MesExtraitsPage />}
          />
          <Route
            path="/mes-deces"
            element={<MesDecesPage />}
          />
          <Route
            path="/mes-mariages"
            element={<MesMariagesPage />}
          />
          <Route
            path="/declaration-naissance"
            element={<DeclarationNaissancePage />}
          />
          <Route
            path="/declaration-deces"
            element={<DeclarationDecesPage />}
          />
          <Route
            path="/municipalite-naissances"
            element={<MunicipaliteNaissancesPage />}
          />
          <Route
            path="/demande-residence"
            element={<DemandeResidencePage />}
          />
          <Route
            path="/mes-residences"
            element={<MesResidencesPage />}
          />
          <Route
            path="/nouvelle-reclamation"
            element={<ReclamationFormPage />}
          />
          <Route
            path="/mes-reclamations"
            element={<MesReclamationsPage />}
          />
          <Route
            path="/agent-reclamations"
            element={<AgentReclamationsPage />}
          />

          {/* Backward-compatible aliases with old .html URLs */}
          <Route path="/agent_dashboard.html" element={<AgentDashboardPage />} />
          <Route path="/services.html" element={<ServicesPage />} />
          <Route
            path="/municipalite-naissances.html"
            element={<MunicipaliteNaissancesPage />}
          />
          <Route path="/dashboard.html" element={<DashboardPage />} />

          <Route path="/login.html" element={<LoginPage />} />
          <Route path="/signup.html" element={<SignupPage />} />
          <Route path="/activate.html" element={<ActivatePage />} />
          <Route path="/forgot-password.html" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password-confirm.html"
            element={<ResetPasswordConfirmPage />}
          />

          <Route path="/mes-extraits.html" element={<MesExtraitsPage />} />
          <Route path="/mes-deces.html" element={<MesDecesPage />} />
          <Route path="/mes-mariages.html" element={<MesMariagesPage />} />
          <Route
            path="/declaration-naissance.html"
            element={<DeclarationNaissancePage />}
          />
          <Route
            path="/declaration-deces.html"
            element={<DeclarationDecesPage />}
          />

          <Route path="*" element={<ComingSoonPage title="Page non trouvée" />} />
        </Routes>
      </BrowserRouter>
      <SpeedInsights />
    </LanguageProvider>
  )
}
