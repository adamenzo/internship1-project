import React, { useState, useEffect } from 'react';
import { getAPs, getAlertes } from '../services/api';

const Reports = () => {
  const [aps, setAps] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apsRes, alertesRes] = await Promise.all([getAPs(), getAlertes()]);
      setAps(apsRes.data);
      setAlertes(alertesRes.data);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename, columns) => {
    // Créer l'en-tête CSV
    const header = columns.map(col => col.label).join(',');
    // Créer les lignes
    const rows = data.map(item => columns.map(col => {
      let value = item[col.key];
      if (col.key === 'created_at' && value) value = new Date(value).toLocaleString();
      if (col.key === 'statut') {
        value = value === 'actif' ? 'Actif' : value === 'hors_ligne' ? 'Hors ligne' : value;
      }
      // Échapper les guillemets et les virgules
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')).join('\n');
    
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAPs = () => {
    const columns = [
      { key: 'nom', label: 'Nom' },
      { key: 'mac', label: 'MAC' },
      { key: 'ip_address', label: 'IP' },
      { key: 'modele', label: 'Modèle' },
      { key: 'site_nom', label: 'Site' },
      { key: 'batiment', label: 'Bâtiment' },
      { key: 'etage', label: 'Étage' },
      { key: 'salle', label: 'Salle' },
      { key: 'statut', label: 'Statut' }
    ];
    exportToCSV(aps, 'points_acces.csv', columns);
  };

  const exportAlertes = () => {
    const columns = [
      { key: 'ap_nom', label: 'Point d accès' },
      { key: 'message', label: 'Message' },
      { key: 'severity', label: 'Sévérité' },
      { key: 'created_at', label: 'Date' }
    ];
    exportToCSV(alertes, 'alertes.csv', columns);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Génération de rapports</h2>
      <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{ background: '#3c5d86', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
        >
          {loading ? 'Chargement...' : 'Charger les données'}
        </button>
        {aps.length > 0 && (
          <button
            onClick={exportAPs}
            style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
          >
            Exporter les points d'accès (CSV)
          </button>
        )}
        {alertes.length > 0 && (
          <button
            onClick={exportAlertes}
            style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
          >
            Exporter les alertes (CSV)
          </button>
        )}
      </div>
      {aps.length === 0 && !loading && <p style={{ marginTop: 20 }}>Aucune donnée chargée. Cliquez sur "Charger les données".</p>}
    </div>
  );
};

export default Reports;