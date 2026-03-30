import React from 'react';
import { useI18n } from '../i18n/LanguageProvider';

interface ProfileCardProps {
  user: { first_name: string; last_name: string; email: string; phone?: string; first_name_ar?: string; last_name_ar?: string } | null;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  const { t, lang } = useI18n();

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {user ? user.first_name[0].toUpperCase() : '?'}
        </div>
        <div className="profile-name">
          {user ? (lang === 'ar' && user.first_name_ar ? `${user.first_name_ar} ${user.last_name_ar}` : `${user.first_name} ${user.last_name}`) : t('loading')}
        </div>
        <div className="profile-email">
          {user ? user.email : '...'}
        </div>
      </div>
      <div className="profile-body">
        <div className="profile-row">
          <span className="lbl">{t('city_label')}</span>
          <span className="val">{t('kelibia')}</span>
        </div>
        <div className="profile-row">
          <span className="lbl">{t('tel_short')}</span>
          <span className="val" dir="ltr">{user?.phone || '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
