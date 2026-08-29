import apiClient from './apiClient.js';

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  logout: () => apiClient.post('/auth/logout'),
};

export const incidentService = {
  createIncident: (data) => apiClient.post('/incidents', data),
  
  // New media upload endpoints
  createIncidentWithMedia: (formData) => apiClient.post('/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  createIncidentWithCameraCapture: (formData) => apiClient.post('/incidents/with-camera-capture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  createIncidentWithoutMedia: (data) => apiClient.post('/incidents/without-media', data),
  
  verifyImage: (formData) => apiClient.post('/incidents/verify-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  getIncidents: (params) => apiClient.get('/incidents', { params }),
  getIncidentById: (id) => apiClient.get(`/incidents/${id}`),
  getNearbyIncidents: (params) => apiClient.get('/incidents/nearby', { params }),
  getAssignedIncidents: () => apiClient.get('/incidents/authority/assigned'),
  updateIncidentStatus: (id, data) => apiClient.put(`/incidents/${id}/status`, data),
  assignResponder: (id, data) => apiClient.post(`/incidents/${id}/assign`, data),
  verifyIncident: (id, isReal, notes) =>
    apiClient.post(`/incidents/${id}/verify`, { isReal, notes }),
  addComment: (id, data) => apiClient.post(`/incidents/${id}/comment`, data),
  triggerSOS: (id) => apiClient.post(`/incidents/${id}/sos`),
  deactivateSOS: (id) => apiClient.put(`/incidents/${id}/sos/deactivate`),
  getStatistics: () => apiClient.get('/incidents/stats'),
  getMyIncidents: () => apiClient.get('/incidents/my-reports'),
};

export const adminService = {
  getDashboardStats: () => apiClient.get('/admin/stats'),
  getAuthorityOfficers: (params) => apiClient.get('/admin/users/authority', { params }),
  createAuthorityOfficer: (data) => apiClient.post('/admin/users/authority', data),
  verifyAuthorityOfficer: (userId) => apiClient.put(`/admin/users/${userId}/verify`),
  reviewIncident: (incidentId, data) => apiClient.put(`/admin/incidents/${incidentId}/review`, data),
  assignIncidentToOfficer: (payload) => apiClient.post('/admin/incidents/assign', payload),
  deleteIncident: (incidentId) => apiClient.delete(`/admin/incidents/${incidentId}`),
};

export default {
  authService,
  incidentService,
  adminService,
};
