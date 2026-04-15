import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';
import fortImg from '../assets/fort.webp';

interface HeroSectionProps {
  user: { first_name: string; first_name_ar?: string } | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ user }) => {
  const { t, lang } = useI18n();

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '420px' }}>
      {/* Background image */}
      <img
        src={fortImg}
        alt="Fort de Kélibia"
        className="w-full h-full object-cover"
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(30,19,19,0.25), rgba(30,19,19,0.72))' }}
      ></div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
        {/* Icon */}
        <i className="fas fa-castle text-white mb-4" style={{ fontSize: '3rem', opacity: 0.9 }}></i>

        {/* Bilingual title */}
        <h1
          className="font-black text-white uppercase tracking-tighter mb-2"
          style={{ fontFamily: 'Public Sans, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Ville de Kélibia
        </h1>
        <h2
          className="font-bold text-white mb-6"
          dir="rtl"
          style={{ fontFamily: 'Cairo, Tajawal, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', opacity: 0.92 }}
        >
          بلدية قليبية
        </h2>

        {/* Welcome message */}
        <p className="text-white font-medium uppercase tracking-[0.2em] text-sm mb-3" style={{ opacity: 0.85 }}>
          {t('welcome')}, <strong>{user ? (lang === 'ar' && user.first_name_ar ? user.first_name_ar : user.first_name) : t('citoyen_role')}</strong>
        </p>
        <p className="text-white text-xs uppercase tracking-widest" style={{ opacity: 0.65 }}>
          {t('welcome_msg')}
        </p>
      </div>

      {/* Fort caption */}
      <span
        className="absolute bottom-4 right-6 text-white text-xs py-1 px-3 rounded"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 3 }}
      >
        {t('fort_caption')}
      </span>
    </div>
  );
};

export default HeroSection;
