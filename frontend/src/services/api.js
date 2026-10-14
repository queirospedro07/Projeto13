import axios from 'axios';

const envApiUrl = import.meta.env?.VITE_API_URL;
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}` : '/api';

// Create central Axios instance matching PW-P-LAB-TRABALHO-PRATICO
export const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('nexo_token') || localStorage.getItem('learnspace_token');
}

export function setAuthToken(token) {
  localStorage.setItem('token', token);
  localStorage.setItem('nexo_token', token);
  localStorage.setItem('learnspace_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('nexo_token');
  localStorage.removeItem('learnspace_token');
}

// Request Interceptor: inject Bearer JWT token into headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 Unauthorized and expired tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthEndpoint) {
        removeAuthToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erro no pedido';
    return Promise.reject(new Error(message));
  }
);

// Standardized request adapter
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toLowerCase();
  let data = undefined;

  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        data = JSON.parse(options.body);
      } catch (_) {
        data = options.body;
      }
    } else {
      data = options.body;
    }
  }

  const response = await axiosInstance({
    url: endpoint,
    method,
    data,
    params: options.params,
    headers: options.headers,
  });

  return response.data;
}

export const api = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  demoLogin: (role) => request(`/auth/demo/${role}`),
  getMe: () => request('/auth/me'),
  getUserProfile: (identifier) => request(`/auth/user/${encodeURIComponent(identifier)}`),
  updateProfile: (profile) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  clearProfileField: (field) =>
    request('/auth/profile/clear-field', {
      method: 'POST',
      body: JSON.stringify({ field }),
    }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, password) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  getCourses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/courses${query ? '?' + query : ''}`);
  },
  getCourse: (id) => request(`/courses/${id}`),
  getMyCourses: () => request('/courses/my-learning'),
  toggleHideCourse: (courseId) =>
    request(`/courses/${courseId}/toggle-hide`, {
      method: 'POST',
    }),
  enrollCourse: (id) =>
    request(`/courses/${id}/enroll`, {
      method: 'POST',
    }),
  completeLesson: (courseId, lessonId) =>
    request(`/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
    }),
  submitReview: (courseId, data) =>
    request(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLessonQuiz: (lessonId) => request(`/quizzes/lesson/${lessonId}`),
  submitQuiz: (quizId, answers) =>
    request(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  getSpaces: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/spaces${query ? '?' + query : ''}`);
  },
  getSpace: (id) => request(`/spaces/${id}`),
  joinSpace: (id) =>
    request(`/spaces/${id}/join`, {
      method: 'POST',
    }),
  createSpace: (data) =>
    request('/spaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createChannel: (spaceId, data) =>
    request(`/spaces/${spaceId}/channels`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteChannel: (spaceId, channelId) =>
    request(`/spaces/${spaceId}/channels/${channelId}`, {
      method: 'DELETE',
    }),
  getChannelMessages: (channelId) => request(`/channels/${channelId}/messages`),
  sendMessage: (channelId, data) =>
    request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  togglePin: (messageId) =>
    request(`/messages/${messageId}/pin`, {
      method: 'POST',
    }),
  getFriends: () => request('/social/friends'),
  sendFriendRequest: (targetUserId) =>
    request(`/social/friends/request/${targetUserId}`, {
      method: 'POST',
    }),
  acceptFriendRequest: (friendshipId) =>
    request(`/social/friends/accept/${friendshipId}`, {
      method: 'POST',
    }),
  rejectFriendRequest: (friendshipId) =>
    request(`/social/friends/reject/${friendshipId}`, {
      method: 'POST',
    }),
  removeFriend: (targetUserId) =>
    request(`/social/friends/remove/${targetUserId}`, {
      method: 'DELETE',
    }),
  followUser: (targetUserId) =>
    request(`/social/follow/${targetUserId}`, {
      method: 'POST',
    }),
  unfollowUser: (targetUserId) =>
    request(`/social/unfollow/${targetUserId}`, {
      method: 'POST',
    }),
  getFollowers: (userId) => request(`/social/followers/${userId}`),
  getFollowing: (userId) => request(`/social/following/${userId}`),
  getSocialStatus: (targetUserId) => request(`/social/status/${targetUserId}`),
  searchSocialUsers: (query = '') =>
    request(`/social/users/search?query=${encodeURIComponent(query)}`),
  getDirectConversations: () => request('/social/dm/conversations'),
  getDirectMessages: (targetUserId) => request(`/social/dm/messages/${targetUserId}`),
  sendDirectMessage: (receiverId, content) =>
    request('/social/dm/send', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    }),
  getNotifications: () => request('/notifications'),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', {
      method: 'PUT',
    }),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  // Suporte (FAQ)
  getSupportFaq: () => request('/support/faq'),

  // Certificados
  verifyCertificate: (id) => request(`/certificates/verify/${encodeURIComponent(id)}`),
  getMyCertificates: () => request('/certificates/my'),
  generateCertificate: (courseId) =>
    request(`/certificates/generate/${courseId}`, {
      method: 'POST',
    }),

  // Apontamentos / Notas
  saveLessonNote: (lessonId, content) =>
    request(`/notes/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getLessonNote: (lessonId) => request(`/notes/${lessonId}`),
  getMyNotes: () => request('/notes'),

  // Painel de Administração e Moderação
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  getAdminReports: () => request('/admin/reports'),
  getAdminCreatorApplications: () => request('/admin/creator-applications'),
  getAdminCourses: (status = 'all') =>
    request(`/admin/courses${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  toggleSuspendUser: (userId) =>
    request(`/admin/users/${userId}/suspend`, {
      method: 'PUT',
    }),
  approveCreatorApplication: (appId) =>
    request(`/admin/creator-applications/${appId}/approve`, {
      method: 'PUT',
    }),
  rejectCreatorApplication: (appId, feedback) =>
    request(`/admin/creator-applications/${appId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ feedback }),
    }),
  approveCourse: (courseId) =>
    request(`/admin/courses/${courseId}/approve`, {
      method: 'PUT',
    }),
  rejectCourse: (courseId, notes) =>
    request(`/admin/courses/${courseId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),

  // Estúdio do Criador / Formador
  getCreatorApplicationStatus: () => request('/creator/application-status'),
  applyCreator: (data) =>
    request('/creator/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCreatorStats: () => request('/creator/stats'),
  getCreatorCourses: () => request('/creator/courses'),
  getCreatorCourse: (courseId) => request(`/creator/courses/${courseId}`),
  createCourse: (data) =>
    request('/creator/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCourse: (courseId, data) =>
    request(`/creator/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCourse: (courseId) =>
    request(`/creator/courses/${courseId}`, {
      method: 'DELETE',
    }),
  submitCourseForReview: (courseId) =>
    request(`/creator/courses/${courseId}/submit-review`, {
      method: 'POST',
    }),
  getCreatorMembers: () => request('/creator/members'),
  getCourseCollaborators: (courseId) => request(`/creator/courses/${courseId}/collaborators`),
  addCourseCollaborator: (courseId, identifier) =>
    request(`/creator/courses/${courseId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),
  removeCourseCollaborator: (courseId, userId) =>
    request(`/creator/courses/${courseId}/collaborators/${userId}`, {
      method: 'DELETE',
    }),
  removeCourseMember: (courseId, userId) =>
    request(`/creator/courses/${courseId}/members/${userId}`, {
      method: 'DELETE',
    }),
};

export default api;