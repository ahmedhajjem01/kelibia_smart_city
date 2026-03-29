import React from 'react';

interface ProfileCardProps {
  user: { first_name: string; last_name: string; email: string; phone?: string } | null;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {user ? user.first_name[0].toUpperCase() : '?'}
        </div>
        <div className="profile-name">
          {user ? `${user.first_name} ${user.last_name}` : 'Chargement...'}
        </div>
        <div className="profile-email">
          {user ? user.email : '...'}
        </div>
      </div>
      <div className="profile-body">
        <div className="profile-row">
          <span className="lbl">Ville</span>
          <span className="val">Kélibia</span>
        </div>
        <div className="profile-row">
          <span className="lbl">Tél.</span>
          <span className="val">{user?.phone || '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
