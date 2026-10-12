import React from 'react';
import './Navbar.css';

const Navbar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'fa-tachometer-alt' },
    { id: 'accesspoints', label: 'Points d’accès', icon: 'fa-wifi' },
    { id: 'map', label: 'Cartographie', icon: 'fa-map-marker-alt' },
    { id: 'alerts', label: 'Alertes', icon: 'fa-exclamation-triangle' },
    { id: 'reports', label: 'Rapports', icon: 'fa-file-alt' }
  ];

  return (
    <div className="navbar">
      <ul>
        {menuItems.map(item => (
          <li
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => setActiveTab(item.id)}
          >
            <i className={`fas ${item.icon}`}></i> {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Navbar;