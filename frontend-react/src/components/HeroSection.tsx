import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';

interface HeroSectionProps {
  user: { first_name: string } | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ user }) => {
  const { t } = useI18n();

  return (
    <div className="hero-strip">
      <div className="hero-top">
        <div>
          <div className="greeting">
            <i className="fas fa-hand-wave me-2"></i>
            <span>{t('welcome')}, </span>
            <strong>{user ? user.first_name : 'Citoyen'}</strong> !
          </div>
          <div className="sub">{t('welcome_msg')}</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge-role">
            <i className="fas fa-user-check me-1"></i>
            <span>Citoyen</span>
          </span>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/40px-Flag_of_Tunisia.svg.png"
            height="22" 
            style={{ borderRadius: '3px' }} 
            alt="Tunisie" 
          />
        </div>
      </div>

      <div className="fort-banner">
        <img 
          src="/fort.webp" 
          alt="Fort de Kélibia" 
          style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div className="fort-overlay" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 2 }}></div>
        <span className="fort-caption" style={{ zIndex: 3, position: 'absolute', bottom: '1rem', right: '2rem', color: 'white', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', backdropFilter: 'blur(4px)' }}>
          Fort de Kélibia — Patrimoine Historique
        </span>
      </div>
    </div>
  );
};

export default HeroSection;
