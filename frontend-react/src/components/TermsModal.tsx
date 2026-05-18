import React from 'react'
import { useI18n } from '../i18n/LanguageProvider'

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const { t, lang } = useI18n()

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: '"Public Sans", sans-serif',
          direction: lang === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
            {lang === 'ar' ? 'شروط الاستخدام العامة' : 'Conditions Générales d\'Utilisation'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', padding: '0 8px' }}
          >
            &times;
          </button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 600, color: '#b87a50', marginBottom: '16px' }}>
            {lang === 'ar' 
              ? 'مرحبًا بك في منصة مدينة قليبية الذكية.'
              : 'Bienvenue sur la plateforme Smart City de la Commune de Kélibia.'}
          </p>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '20px', marginBottom: '10px' }}>1. Acceptation des conditions</h3>
          <p style={{ marginBottom: '16px' }}>L'accès et l'utilisation de la plateforme Smart City Kélibia sont soumis à l'acceptation expresse de ces Conditions Générales d'Utilisation. Tout utilisateur s'engage à respecter les lois en vigueur et le règlement de la commune.</p>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '20px', marginBottom: '10px' }}>2. Protection des données personnelles</h3>
          <p style={{ marginBottom: '16px' }}>La Commune de Kélibia s'engage à protéger la vie privée de ses citoyens. Les données collectées (nom, CIN, coordonnées) sont strictement confidentielles et utilisées uniquement dans le cadre des services municipaux en ligne (état civil, réclamations, forum, etc.).</p>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '20px', marginBottom: '10px' }}>3. Utilisation des services (Forum et Réclamations)</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '6px' }}>Les signalements doivent être exacts et ne pas contenir de propos injurieux ou inappropriés.</li>
            <li style={{ marginBottom: '6px' }}>La municipalité se réserve le droit de supprimer tout contenu jugé abusif, diffamatoire ou contraire aux bonnes mœurs.</li>
            <li style={{ marginBottom: '6px' }}>En publiant une réclamation avec localisation, vous consentez à partager ces coordonnées géographiques avec les agents municipaux.</li>
          </ul>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '20px', marginBottom: '10px' }}>4. Modification des services</h3>
          <p style={{ marginBottom: '16px' }}>La Commune de Kélibia se réserve le droit de modifier, suspendre ou interrompre l'accès à tout ou partie de la plateforme sans préavis, pour des raisons de maintenance ou de mise à jour.</p>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', textAlign: 'right', background: '#f8fafc' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 24px', backgroundColor: '#d4aa8d', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {t('close') || 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  )
}
