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
          src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=1200" 
          alt="Kelibia Coast" 
          style={{ position: 'relative', zIndex: 1 }} 
        />
        <span className="fort-caption" style={{ zIndex: 3 }}>
          Kélibia — Panorama Méditerranéen
        </span>
      </div>
    </div>
  );
};

export default HeroSection;
