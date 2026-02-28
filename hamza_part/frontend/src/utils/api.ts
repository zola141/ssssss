import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analytics endpoints
export const analyticsAPI = {
  getMatchHistory: (params?: any) =>
    apiClient.get('/analytics/match-history', { params }),
  getStats: (params?: any) => apiClient.get('/analytics/stats', { params }),
  getUserActivity: (params?: any) =>
    apiClient.get('/analytics/user-activity', { params }),
  getStatsSummary: (params?: any) =>
    apiClient.get('/analytics/stats-summary', { params }),
  getUserRankings: (limit?: number) =>
    apiClient.get('/analytics/rankings', { params: { limit } }),
  getActivityTrends: (params?: any) =>
    apiClient.get('/analytics/activity-trends', { params }),
  getMergedStats: () => apiClient.get('/analytics/merged-stats'),
  syncMergedStats: () => apiClient.post('/analytics/sync-json'),
  exportData: (format: string = 'json', params?: any) =>
    apiClient.get('/analytics/export', { params: { format, ...params }, responseType: 'blob' }),
};

// Data export endpoints
export const dataExportAPI = {
  exportAll: (format: string = 'json') =>
    apiClient.get('/data-export/all', { params: { format }, responseType: 'blob' }),
  exportMatches: (format: string = 'json') =>
    apiClient.get('/data-export/matches', { params: { format }, responseType: 'blob' }),
  importData: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/data-export/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  validateImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/data-export/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// GDPR endpoints
export const gdprAPI = {
  requestData: (userId: string) =>
    apiClient.post('/gdpr/request-data', { userId }),
  downloadData: (userId: string) =>
    apiClient.get('/gdpr/download-data', { params: { userId } }),
  requestDeletion: (userId: string) =>
    apiClient.post('/gdpr/request-deletion', { userId }),
  confirmDeletion: (token: string) =>
    apiClient.get(`/gdpr/confirm-deletion/${token}`),
  getPendingRequests: () => apiClient.get('/gdpr/pending-requests'),
  getDeletionStatus: (userId: string) =>
    apiClient.get('/gdpr/deletion-status', { params: { userId } }),
};

export default apiClient;
