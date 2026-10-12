import React, { useState, useEffect } from 'react';
import { getAPs, createAP, updateAP, deleteAP, getSites } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AccessPoints = () => {
  const { user } = useAuth();
  const canEdit = user?.role_id === 1 || user?.role_id === 3;
  const [aps, setAps] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    mac: '',
    nom: '',
    modele: '',
    firmware: '',
    ip_address: '',
    site_id: '',
    batiment: '',
    etage: '',
    salle: '',
    statut: 'actif'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apsRes, sitesRes] = await Promise.all([getAPs(), getSites()]);
      setAps(apsRes.data);
      setSites(sitesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateAP(editing, formData);
      } else {
        await createAP(formData);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce point d’accès ?')) {
      await deleteAP(id);
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      mac: '', nom: '', modele: '', firmware: '', ip_address: '',
      site_id: '', batiment: '', etage: '', salle: '', statut: 'actif'
    });
    setEditing(null);
  };

  if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Points d'accès WiFi</h2>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#3c5d86', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer' }}
          >
            + Ajouter
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Nom</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>MAC</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>IP</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Modèle</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Site</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Statut</th>
            {canEdit && <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {aps.map(ap => (
            <tr key={ap.id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{ap.nom}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{ap.mac}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{ap.ip_address}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{ap.modele}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{ap.site_nom || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <span style={{
                  background: ap.statut === 'actif' ? '#d4edda' : '#f8d7da',
                  color: ap.statut === 'actif' ? '#155724' : '#721c24',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12
                }}>
                  {ap.statut}
                </span>
              </td>
              {canEdit && (
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <button onClick={() => { setEditing(ap.id); setFormData(ap); setShowModal(true); }} style={{ marginRight: 8 }}>✏️</button>
                  <button onClick={() => handleDelete(ap.id)}>🗑️</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: 20, width: 500 }}>
            <h3>{editing ? 'Modifier' : 'Ajouter'} un point d'accès</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Nom" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required style={{ width: '100%', marginBottom: 10, padding: 8 }} />
              <input type="text" placeholder="MAC" value={formData.mac} onChange={e => setFormData({...formData, mac: e.target.value})} required style={{ width: '100%', marginBottom: 10, padding: 8 }} />
              <input type="text" placeholder="Adresse IP" value={formData.ip_address} onChange={e => setFormData({...formData, ip_address: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
              <input type="text" placeholder="Modèle" value={formData.modele} onChange={e => setFormData({...formData, modele: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
              <select value={formData.site_id} onChange={e => setFormData({...formData, site_id: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 8 }}>
                <option value="">Sélectionner un site</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
              <input type="text" placeholder="Bâtiment" value={formData.batiment} onChange={e => setFormData({...formData, batiment: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
              <input type="text" placeholder="Étage" value={formData.etage} onChange={e => setFormData({...formData, etage: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
              <input type="text" placeholder="Salle" value={formData.salle} onChange={e => setFormData({...formData, salle: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
              <select value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 8 }}>
                <option value="actif">Actif</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors_ligne">Hors ligne</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <button type="submit" style={{ background: '#3c5d86', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>Enregistrer</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} style={{ background: '#ccc', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessPoints;