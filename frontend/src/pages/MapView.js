import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSites, getAPs } from '../services/api';
import './MapView.css';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
  const [sites, setSites] = useState([]);
  const [aps, setAps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAPs, setShowAPs] = useState(true);
  const [showSites, setShowSites] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesRes, apsRes] = await Promise.all([getSites(), getAPs()]);

        // Filtre sites avec coordonnées
        const sitesWithCoords = sitesRes.data.filter(s => s.latitude && s.longitude);
        setSites(sitesWithCoords);

        // Filtre AP avec coordonnées
        const apsWithCoords = apsRes.data.filter(ap => ap.latitude && ap.longitude);
        setAps(apsWithCoords);
      } catch (err) {
        console.error('Erreur chargement cartes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Chargement de la carte...</div>;

  // Centre de la carte (Maroc)
  const center = [31.7917, -7.0926];
  const zoom = 6;

  return (
    <div className="map-view-container">
      <div className="map-controls">
        <h3>Affichage</h3>
        <label>
          <input
            type="checkbox"
            checked={showSites}
            onChange={(e) => setShowSites(e.target.checked)}
          />
          <span>Sites ({sites.length})</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={showAPs}
            onChange={(e) => setShowAPs(e.target.checked)}
          />
          <span>Points d'accès ({aps.length})</span>
        </label>
      </div>

      <div className="map-container">
        <MapContainer center={center} zoom={zoom} className="map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Affiche les sites avec des marqueurs bleus */}
          {showSites && sites.map(site => (
            <div key={`site-${site.id}`}>
              <CircleMarker
                center={[parseFloat(site.latitude), parseFloat(site.longitude)]}
                radius={12}
                fillColor="#3b82f6"
                color="#1e40af"
                weight={2}
                opacity={0.8}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="popup-content">
                    <strong className="popup-title">{site.nom}</strong>
                    <p className="popup-label">Type: <span className="badge site">Site</span></p>
                    <p className="popup-info">{site.adresse || 'Adresse non disponible'}</p>
                    <p className="popup-coordinates">
                      Lat: {parseFloat(site.latitude).toFixed(4)}<br />
                      Long: {parseFloat(site.longitude).toFixed(4)}
                    </p>
                    <p className="popup-count">Points d'accès: {aps.filter(ap => ap.site_id === site.id).length}</p>
                  </div>
                </Popup>
              </CircleMarker>
              {/* Cercle autour du site */}
              <Circle
                center={[parseFloat(site.latitude), parseFloat(site.longitude)]}
                radius={5000}
                pathOptions={{ color: '#3b82f6', fill: false, dashArray: '5, 5' }}
              />
            </div>
          ))}

          {/* Affiche les access points avec des marqueurs verts */}
          {showAPs && aps.map(ap => {
            // Déterminer la couleur basée sur le statut
            let fillColor = '#10b981'; // green par défaut
            let borderColor = '#059669';

            if (ap.statut && typeof ap.statut === 'string') {
              const status = ap.statut.toLowerCase().trim();
              if (status === 'maintenance') {
                fillColor = '#f59e0b';
                borderColor = '#d97706';
              } else if (status === 'hors_ligne' || status === 'hors ligne') {
                fillColor = '#ef4444';
                borderColor = '#dc2626';
              }
            }

            return (
              <CircleMarker
                key={`ap-${ap.id}`}
                center={[parseFloat(ap.latitude), parseFloat(ap.longitude)]}
                radius={8}
                fillColor={fillColor}
                color={borderColor}
                weight={2}
                opacity={0.8}
                fillOpacity={0.8}
              >
                <Popup>
                  <div className="popup-content">
                    <strong className="popup-title">{ap.nom}</strong>
                    <p className="popup-label">Type: <span className="badge ap">Access Point</span></p>
                    <p className="popup-info">
                      MAC: <code>{ap.mac}</code><br />
                      IP: <code>{ap.ip_address || 'N/A'}</code>
                    </p>
                    <p className="popup-building">
                      Bâtiment: {ap.batiment || 'N/A'}<br />
                      Étage: {ap.etage || 'N/A'}<br />
                      Salle: {ap.salle || 'N/A'}
                    </p>
                    <p className="popup-status">
                      Statut:
                      <span className={`status-badge ${ap.statut}`}>
                        {ap.statut === 'actif' ? '✓ Actif' : ap.statut === 'maintenance' ? '⚙ Maintenance' : '✗ Hors ligne'}
                      </span>
                    </p>
                    {ap.site_nom && <p className="popup-site">Site: <strong>{ap.site_nom}</strong></p>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className="map-legend">
        <h3>Légende</h3>
        <div className="legend-item">
          <div className="legend-circle site"></div>
          <span>Sites</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle ap-active"></div>
          <span>Access Point (Actif)</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle ap-maint"></div>
          <span>Access Point (Maintenance)</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle ap-offline"></div>
          <span>Access Point (Hors ligne)</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;

