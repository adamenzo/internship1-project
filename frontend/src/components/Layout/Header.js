import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="top-header">
      <div className="gov">
        <img src="/logo-ma.svg" alt="Armoiries" />
        <div className="gov-text">
          <h2>Royaume du Maroc</h2>
          <p>Ministère de l'Intérieur – Supervision WiFi</p>
        </div>
      </div>
      <div className="header-user">
        <span className="user-name">{user?.prenom} {user?.nom}</span>
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i> Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Header;


