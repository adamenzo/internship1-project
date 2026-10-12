import React, { useState, useEffect } from 'react';
import { getAlertes, resolveAlerte } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Alerts = () => {
  const { user } = useAuth();
  const canEdit = user?.role_id === 1 || user?.role_id === 3;
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlertes = async () => {
    setLoading(true);
    try {
      const res = await getAlertes();
      setAlertes(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les alertes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertes();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveAlerte(id);
      // Recharger la liste
      fetchAlertes();
    } catch (err) {
      alert('Erreur lors de la résolution');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Chargement des alertes...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Alertes actives</h2>
      {alertes.length === 0 ? (
        <p>Aucune alerte en cours.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Point d'accès</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Message</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Date</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Sévérité</th>
              {canEdit && <th style={{ border: '1px solid #ddd', padding: 8 }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {alertes.map(alerte => (
              <tr key={alerte.id}>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{alerte.ap_nom}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{alerte.message}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{new Date(alerte.created_at).toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <span style={{
                    background: alerte.severity === 'critical' ? '#f8d7da' : '#fff3cd',
                    color: alerte.severity === 'critical' ? '#721c24' : '#856404',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 12
                  }}>
                    {alerte.severity === 'critical' ? 'Critique' : alerte.severity === 'warning' ? 'Avertissement' : 'Info'}
                  </span>
                </td>
                {canEdit && (
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    <button
                      onClick={() => handleResolve(alerte.id)}
                      style={{ background: '#28a745', color: 'white', border: 'none', padding: '4px 12px', cursor: 'pointer' }}
                    >
                      Résoudre
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Alerts;