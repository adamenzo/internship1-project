import React, { useState, useEffect } from 'react';
import { getAPs, getAlertes } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [aps, setAps] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apsRes, alertesRes] = await Promise.all([getAPs(), getAlertes()]);
        setAps(apsRes.data);
        setAlertes(alertesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  const totalAP = aps.length;
  const actifs = aps.filter(ap => ap.statut === 'actif').length;
  const horsLigne = aps.filter(ap => ap.statut === 'hors_ligne').length;
  const alertesNonResolues = alertes.length;

  return (
    <div className="dashboard-container">
      {/* Colonne gauche */}
      <div className="left-column">
        <div className="cards">
          <div className="card">
            <i className="fas fa-wifi"></i>
            <div className="value">{totalAP}</div>
            <div className="label">Points d'accès</div>
          </div>
          <div className="card">
            <i className="fas fa-check-circle"></i>
            <div className="value">{actifs}</div>
            <div className="label">Actifs</div>
          </div>
          <div className="card">
            <i className="fas fa-exclamation-triangle"></i>
            <div className="value">{horsLigne}</div>
            <div className="label">Hors ligne</div>
          </div>
          <div className="card">
            <i className="fas fa-bell"></i>
            <div className="value">{alertesNonResolues}</div>
            <div className="label">Alertes actives</div>
          </div>
        </div>
        <div className="extra-info">
          <h3>État du réseau</h3>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${(actifs / totalAP) * 100}%` }}></div>
          </div>
          <p>Disponibilité : {Math.round((actifs / totalAP) * 100)}%</p>
        </div>
      </div>

      {/* Colonne droite */}
      <div className="right-column">
        <div className="alerts-table">
          <h3>Dernières alertes</h3>
           <table>
            <thead>
              <tr><th>AP</th><th>Message</th><th>Date</th><th>Sévérité</th> </tr>
            </thead>
            <tbody>
              {alertesNonResolues === 0 ? (
                <tr><td colSpan="4">Aucune alerte</td></tr>
              ) : (
                alertes.slice(0, 5).map(a => (
                  <tr key={a.id}>
                    <td>{a.ap_nom}</td>
                    <td>{a.message}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`severity ${a.severity}`}>
                        {a.severity === 'critical' ? 'Critique' : 'Avertissement'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
