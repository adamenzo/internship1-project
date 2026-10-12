import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Navbar from './components/Layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccessPoints from './pages/AccessPoints';
import MapView from './pages/MapView';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import './App.css';

const STORAGE_KEY = 'wifi_last_tab';

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActiveTab(saved);
    }
  }, [user]);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEY, tab);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  if (!isAuthenticated) return <Login />;

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'accesspoints': return <AccessPoints />;
      case 'map': return <MapView />;
      case 'alerts': return <Alerts />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div>
      <Header />
      <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      <main>{renderPage()}</main>
      <footer className="footer">
        Royaume du Maroc — Ministère de l'Intérieur
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
