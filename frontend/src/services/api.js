// src/services/api.js
const API_URL = 'http://localhost:5000/api';
async function request(endpoint, method = 'GET', body = null, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const config = {
    method,
    headers,
  };
  if (body && !isFormData) {
    config.body = JSON.stringify(body);
  } else if (body && isFormData) {
    config.body = body;
  }
  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Erreur réseau');
  }
  return { data };
}

// Auth
export const login = (credentials) => request('/auth/login', 'POST', credentials);
export const getMe = () => request('/auth/me', 'GET');
// Points d'accès
export const getAPs = () => request('/ap', 'GET');
export const getAPById = (id) => request(`/ap/${id}`, 'GET');
export const createAP = (data) => request('/ap', 'POST', data);
export const updateAP = (id, data) => request(`/ap/${id}`, 'PUT', data);
export const deleteAP = (id) => request(`/ap/${id}`, 'DELETE');
// Sites
export const getSites = () => request('/sites', 'GET');
// Métriques
export const getLatestMetrics = (apId) => request(`/ap/${apId}/metrics/latest`, 'GET');
export const getMetricsHistory = (apId, hours = 24) => request(`/ap/${apId}/metrics/history?hours=${hours}`, 'GET');
// Alertes
export const getAlertes = () => request('/alertes', 'GET');
export const resolveAlerte = (id) => request(`/alertes/${id}/resoudre`, 'PUT');
// Notifications
export const getNotifications = () => request('/notifications', 'GET');
export const markNotificationAsRead = (id) => request(`/notifications/${id}/lire`, 'PUT');
