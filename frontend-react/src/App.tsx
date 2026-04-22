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
import DeclarationNaissancePage from './pages/DeclarationNaissancePage'
import DeclarationDecesPage from './pages/DeclarationDecesPage'
import MesExtraitsPage from './pages/MesExtraitsPage'
import MesNaissancesPage from './pages/MesNaissancesPage'
import MesDecesPage from './pages/MesDecesPage'
import MesMariagesPage from './pages/MesMariagesPage'
import DemandeResidencePage from './pages/DemandeResidencePage'
import MesResidencesPage from './pages/MesResidencesPage'
import ReclamationFormPage from './pages/ReclamationFormPage'
import MesReclamationsPage from './pages/MesReclamationsPage'
import MariageContractPage from './pages/MariageContractPage'
import MesDemandesPage from './pages/MesDemandesPage'
import DemandeInhumationPage from './pages/DemandeInhumationPage'
import DemandeLivretFamillePage from './pages/DemandeLivretFamillePage'
import ComingSoonPage from './pages/ComingSoonPage'
import ForumPage from './pages/ForumPage'
import ForumTopicPage from './pages/ForumTopicPage'
import PaymentSimulationPage from './pages/PaymentSimulationPage'
import DemandeEvenementChoixPage from './pages/DemandeEvenementChoixPage'
import DemandeEvenementPublicPage from './pages/DemandeEvenementPublicPage'
import DemandeEvenementPrivePage from './pages/DemandeEvenementPrivePage'
import MesEvenementsPage from './pages/MesEvenementsPage'
import EvenementsPublicsPage from './pages/EvenementsPublicsPage'
import ProfilePage from './pages/ProfilePage'
import DemandeConstructionPage from './pages/DemandeConstructionPage'
import MesConstructionsPage from './pages/MesConstructionsPage'
import DemandeGoudronnagePage from './pages/DemandeGoudronnagePage'
import DemandeCertificatVocationPage from './pages/DemandeCertificatVocationPage'
import DemandeRaccordementPage from './pages/DemandeRaccordementPage'
import DemandeTransfertCorpsPage from './pages/DemandeTransfertCorpsPage'
import DemandeLegalisationPage from './pages/DemandeLegalisationPage'
import DemandeEnregistrementBienPage from './pages/DemandeEnregistrementBienPage'
import DemandeChangementProprietePage from './pages/DemandeChangementProprietePage'
import DemandeChangementVocationBienPage from './pages/DemandeChangementVocationBienPage'
import NewsPage from './pages/NewsPage'
import DemandeEauPage from './pages/DemandeEauPage'
import MesEauPage from './pages/MesEauPage'
import DemandeArgentPage from './pages/DemandeArgentPage'
import MesImpotsPage from './pages/MesImpotsPage'
import DemandeCommercePage from './pages/DemandeCommercePage'
import MesCommercePage from './pages/MesCommercePage'



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
            path="/mes-naissances"
            element={<MesNaissancesPage />}
          />
          <Route
            path="/mes-demandes"
            element={<MesDemandesPage />}
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
            path="/demande-mariage"
            element={<MariageContractPage />}
          />
          <Route
            path="/demande-inhumation"
            element={<DemandeInhumationPage />}
          />
          <Route path="/demande-livret-famille" element={<DemandeLivretFamillePage />} />
          <Route path="/paiement" element={<PaymentSimulationPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ForumTopicPage />} />

          {/* Social & Événements */}
          <Route path="/demande-evenement" element={<DemandeEvenementChoixPage />} />
          <Route path="/demande-evenement-public" element={<DemandeEvenementPublicPage />} />
          <Route path="/demande-evenement-prive" element={<DemandeEvenementPrivePage />} />
          <Route path="/mes-evenements" element={<MesEvenementsPage />} />
          <Route path="/demande-construction" element={<DemandeConstructionPage />} />
          <Route path="/demande-goudronnage" element={<DemandeGoudronnagePage />} />
          <Route path="/demande-certificat-vocation" element={<DemandeCertificatVocationPage />} />
          <Route path="/demande-raccordement" element={<DemandeRaccordementPage />} />
          <Route path="/demande-transfert-corps" element={<DemandeTransfertCorpsPage />} />
          <Route path="/demande-legalisation" element={<DemandeLegalisationPage />} />
          <Route path="/demande-bien" element={<DemandeEnregistrementBienPage />} />
          <Route path="/demande-propriete-changement" element={<DemandeChangementProprietePage />} />
          <Route path="/demande-vocation-changement" element={<DemandeChangementVocationBienPage />} />
          <Route path="/mes-constructions" element={<MesConstructionsPage />} />
          <Route path="/evenements" element={<EvenementsPublicsPage />} />

          {/* Eau, Lumière & Égouts */}
          <Route path="/demande-eau" element={<DemandeEauPage />} />
          <Route path="/mes-eau" element={<MesEauPage />} />

          {/* Argent & Impôts */}
          <Route path="/demande-argent" element={<DemandeArgentPage />} />
          <Route path="/mes-impots" element={<MesImpotsPage />} />

          {/* Boutiques & Commerces */}
          <Route path="/demande-commerce" element={<DemandeCommercePage />} />
          <Route path="/mes-commerce" element={<MesCommercePage />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Backward-compatible aliases with old .html URLs */}
          <Route path="/agent_dashboard.html" element={<AgentDashboardPage />} />
          <Route path="/services.html" element={<ServicesPage />} />
          <Route path="/agent-dashboard" element={<AgentDashboardPage />} />
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
          <Route
            path="/demande-mariage.html"
            element={<MariageContractPage />}
          />

          <Route path="*" element={<ComingSoonPage title="Page non trouvée" />} />
        </Routes>
      </BrowserRouter>
      <SpeedInsights />
    </LanguageProvider>
  )
}
