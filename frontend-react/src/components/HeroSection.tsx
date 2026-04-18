import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';
import { Link } from 'react-router-dom';
import fortImg from '../assets/fort.webp';

interface HeroSectionProps {
  user: { first_name: string; first_name_ar?: string } | null;
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t } = useI18n();

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '384px' }}>
      {/* Background */}
      <img src={fortImg} alt="Fort de Kélibia" className="w-full h-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)' }}
      />

      {/* Content — bottom-left aligned like the mockup */}
      <div className="absolute inset-0 flex flex-col justify-end px-12 pb-14">
        {/* Icon (moved from center to left) */}
        <img src="/media/tunisia_logo.png" alt="Logo" style={{ width: '60px', height: 'auto', marginBottom: '12px' }} />

        <h1
          className="font-extrabold text-white uppercase tracking-tighter leading-none mb-2"
          style={{ fontFamily: 'Public Sans, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}
        >
          République Tunisienne
        </h1>
        <h2
          className="font-medium text-white mb-6 leading-none"
          style={{ fontFamily: 'Cairo, Tajawal, sans-serif', fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', opacity: 0.85 }}
        >
          الجمهورية التونسية
        </h2>
        <div>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white no-underline active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'background .2s' }}
          >
            <i className="fas fa-compass"></i>
            Découvrir la Ville
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
