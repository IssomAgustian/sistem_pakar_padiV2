import axios from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================
export const authApi = {
  login: (credentials) => adminApi.post('/auth/login', credentials),
  logout: () => adminApi.post('/auth/logout'),
  getCurrentUser: () => adminApi.get('/auth/me'),
};

// ==================== DASHBOARD ENDPOINTS ====================
export const dashboardApi = {
  getStats: () => adminApi.get('/admin/dashboard/'),
  getStatistics: () => adminApi.get('/admin/dashboard/statistics'),
  getRecentActivities: (limit = 10) => adminApi.get(`/admin/dashboard/activities?limit=${limit}`),
  getDiseaseDistribution: () => adminApi.get('/admin/dashboard/disease-distribution'),
  getMonthlyTrend: (months = 6) => adminApi.get(`/admin/dashboard/monthly-trend?months=${months}`),
};

// ==================== DISEASES ENDPOINTS ====================
export const diseasesApi = {
  getAll: (params = {}) => adminApi.get('/admin/diseases/', { params }),
  getById: (id) => adminApi.get(`/admin/diseases/${id}`),
  create: (data) => adminApi.post('/admin/diseases/', data),
  update: (id, data) => adminApi.put(`/admin/diseases/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/diseases/${id}`),
  bulkDelete: (ids) => adminApi.post('/admin/diseases/bulk-delete', { ids }),
  uploadImage: (id, formData) => adminApi.post(`/admin/diseases/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ==================== SYMPTOMS ENDPOINTS ====================
export const symptomsApi = {
  getAll: (params = {}) => adminApi.get('/admin/symptoms/', { params }),
  getById: (id) => adminApi.get(`/admin/symptoms/${id}`),
  create: (data) => adminApi.post('/admin/symptoms/', data),
  update: (id, data) => adminApi.put(`/admin/symptoms/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/symptoms/${id}`),
  bulkDelete: (ids) => adminApi.post('/admin/symptoms/bulk-delete', { ids }),
  getByCategory: (category) => adminApi.get(`/admin/symptoms/category/${category}`),
};

// ==================== RULES ENDPOINTS ====================
export const rulesApi = {
  getAll: (params = {}) => adminApi.get('/admin/rules/', { params }),
  getById: (id) => adminApi.get(`/admin/rules/${id}`),
  create: (data) => adminApi.post('/admin/rules/', data),
  update: (id, data) => adminApi.put(`/admin/rules/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/rules/${id}`),
  toggleActive: (id) => adminApi.patch(`/admin/rules/${id}/toggle`),
  getByDisease: (diseaseId) => adminApi.get(`/admin/rules/disease/${diseaseId}`),
};

// ==================== USERS ENDPOINTS ====================
export const usersApi = {
  getAll: (params = {}) => adminApi.get('/admin/users/', { params }),
  getById: (id) => adminApi.get(`/admin/users/${id}`),
  create: (data) => adminApi.post('/admin/users/', data),
  update: (id, data) => adminApi.put(`/admin/users/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/users/${id}`),
  toggleActive: (id) => adminApi.patch(`/admin/users/${id}/toggle-active`),
  toggleRole: (id) => adminApi.patch(`/admin/users/${id}/toggle-role`),
  resetPassword: (id, data) => adminApi.post(`/admin/users/${id}/reset-password`, data),
  getUserStats: (id) => adminApi.get(`/admin/users/${id}/stats`),
};

// ==================== DIAGNOSIS HISTORY ENDPOINTS ====================
export const diagnosisHistoryApi = {
  getAll: (params = {}) => adminApi.get('/admin/diagnosis-history/', { params }),
  getById: (id) => adminApi.get(`/admin/diagnosis-history/${id}`),
  delete: (id) => adminApi.delete(`/admin/diagnosis-history/${id}`),
  bulkDelete: (ids) => adminApi.post('/admin/diagnosis-history/bulk-delete', { ids }),
  getByUser: (userId, params = {}) => adminApi.get(`/admin/diagnosis-history/user/${userId}`, { params }),
  getByDisease: (diseaseId, params = {}) => adminApi.get(`/admin/diagnosis-history/disease/${diseaseId}`, { params }),
  getStats: () => adminApi.get('/admin/diagnosis-history/stats'),
};

// ==================== REPORTS ENDPOINTS ====================
export const reportsApi = {
  getDiseaseDistribution: (params = {}) => adminApi.get('/admin/reports/disease-distribution', { params }),
  getDiagnosisTimeline: (params = {}) => adminApi.get('/admin/reports/diagnosis-timeline', { params }),
  getUserActivity: (params = {}) => adminApi.get('/admin/reports/user-activity', { params }),
  getMethodComparison: (params = {}) => adminApi.get('/admin/reports/method-comparison', { params }),
  getSymptomFrequency: (params = {}) => adminApi.get('/admin/reports/symptom-frequency', { params }),
  getAccuracyReport: (params = {}) => adminApi.get('/admin/reports/accuracy-report', { params }),
  exportReport: (type, params = {}) => adminApi.get(`/admin/reports/export/${type}`, {
    params,
    responseType: 'blob'
  }),
};

// ==================== SETTINGS ENDPOINTS ====================
export const settingsApi = {
  getAll: () => adminApi.get('/admin/settings/'),
  getByKey: (key) => adminApi.get(`/admin/settings/${key}`),
  update: (key, data) => adminApi.put(`/admin/settings/${key}`, data),
  bulkUpdate: (data) => adminApi.post('/admin/settings/bulk-update', data),
  reset: () => adminApi.post('/admin/settings/reset'),
};

// ==================== LOGS ENDPOINTS ====================
export const logsApi = {
  getAll: (params = {}) => adminApi.get('/admin/logs/', { params }),
  getById: (id) => adminApi.get(`/admin/logs/${id}`),
  getByAdmin: (adminId, params = {}) => adminApi.get(`/admin/logs/admin/${adminId}`, { params }),
  getByAction: (action, params = {}) => adminApi.get(`/admin/logs/action/${action}`, { params }),
  clear: (days) => adminApi.delete(`/admin/logs/clear?days=${days}`),
};

// ==================== NOTIFICATIONS ENDPOINTS ====================
export const notificationsApi = {
  getAll: (params = {}) => adminApi.get('/admin/notifications/', { params }),
  markAsRead: (id) => adminApi.patch(`/admin/notifications/${id}/read`),
  markAllAsRead: () => adminApi.patch('/admin/notifications/read-all'),
  delete: (id) => adminApi.delete(`/admin/notifications/${id}`),
  getUnreadCount: () => adminApi.get('/admin/notifications/unread-count'),
};

export default adminApi;
