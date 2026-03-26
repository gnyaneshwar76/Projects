import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Auth API endpoints
 */
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login: (credentials) => api.post('/auth/login', credentials),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  toggle2FA: () => api.post('/auth/2fa/toggle'),
  getCurrentUser: () => api.get('/auth/me'),
  getUserProfile: (userId) => api.get(`/auth/profile/${userId}`),
  updateProfile: (data) => api.put('/auth/profile', data),
};

/**
 * Notification API endpoints
 */
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notifId) => api.put(`/notifications/${notifId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

/**
 * Bug API endpoints
 */
export const bugAPI = {
  // Create a new bug
  createBug: (bugData) => api.post('/bugs', bugData),

  // Get all bugs with optional filters
  getAllBugs: (filters = {}) => api.get('/bugs', { params: filters }),

  // Get a single bug by ID
  getBugById: (bugId) => api.get(`/bugs/${bugId}`),

  // Update a bug
  updateBug: (bugId, bugData) => api.put(`/bugs/${bugId}`, bugData),

  // Delete a bug
  deleteBug: (bugId) => api.delete(`/bugs/${bugId}`),

  // Find similar bugs
  findSimilarBugs: (bugId, topN = 3) => 
    api.get(`/bugs/${bugId}/similar`, { params: { topN } }),

  // Get clustering analysis
  getClusteringAnalysis: (numClusters = 3) =>
    api.get('/bugs/analysis/cluster', { params: { numClusters } }),

  // Get dashboard statistics
  getDashboardStats: () => api.get('/bugs/stats/dashboard'),

  // Search bugs
  searchBugs: (query) => api.get('/bugs/search', { params: { query } }),

  // Get all unique tags with counts
  getTags: () => api.get('/bugs/tags'),

  // Comments & Engagement
  addComment: (bugId, text, parentId = null) => api.post(`/bugs/${bugId}/comments`, { text, parentId }),
  getComments: (bugId) => api.get(`/bugs/${bugId}/comments`),
  voteOnComment: (bugId, commentId) => api.post(`/bugs/${bugId}/comments/${commentId}/vote`),
  voteOnBug: (bugId, type) => api.post(`/bugs/${bugId}/vote`, { type }),
  markAsSolved: (bugId, commentId) => api.put(`/bugs/${bugId}/solve`, { commentId }),

  // AI Chat — NVIDIA-powered (also keep old endpoint for bug-specific analysis)
  chatWithAI: (message, bugContext = null) => api.post('/bugs/chat/ai', { message, bugContext }),

  // NVIDIA AI Chat — real AI responses
  aiChat: (message, bugContext = null, history = []) => api.post('/ai-chat', { message, bugContext, history }),

  // Suggest improvements for a draft bug report
  suggestBugImprovements: (title, description, tags) => api.post('/bugs/suggest', { title, description, tags }),

  // Bookmarks
  toggleBookmark: (bugId) => api.post(`/bugs/${bugId}/bookmark`),
};

/**
 * Admin API endpoints
 */
export const adminAPI = {
  getReports: (status = 'pending') => api.get('/admin/reports', { params: { status } }),
  updateReportStatus: (id, status) => api.put(`/admin/reports/${id}`, { status }),
  deleteBug: (id) => api.delete(`/admin/bugs/${id}`),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),
  toggleBanUser: (id) => api.post(`/admin/users/${id}/ban`),
};

/**
 * Report API endpoints
 */
export const reportAPI = {
  submitReport: (data) => api.post('/reports', data),
};

export default api;
