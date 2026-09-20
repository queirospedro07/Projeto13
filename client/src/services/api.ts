const envApiUrl = (import.meta as any).env?.VITE_API_URL;
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}/api` : '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('learnspace_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('learnspace_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('learnspace_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed with status ' + response.status);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  demoLogin: (role: string) => request<any>(`/auth/demo/${role}`),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (profile: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // Courses
  getCourses: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/courses${query ? '?' + query : ''}`);
  },
  getCourse: (id: string) => request<any>(`/courses/${id}`),
  getMyCourses: () => request<any[]>('/courses/my-learning'),
  enrollCourse: (id: string) => request<any>(`/courses/${id}/enroll`, { method: 'POST' }),
  completeLesson: (courseId: string, lessonId: string) => 
    request<any>(`/courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST' }),
  submitReview: (courseId: string, data: { rating: number; comment: string }) =>
    request<any>(`/courses/${courseId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),

  // Quizzes
  getLessonQuiz: (lessonId: string) => request<any>(`/quizzes/lesson/${lessonId}`),
  submitQuiz: (quizId: string, answers: Record<string, string>) =>
    request<any>(`/quizzes/${quizId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),

  // Spaces & Communities
  getSpaces: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/spaces${query ? '?' + query : ''}`);
  },
  getSpace: (id: string) => request<any>(`/spaces/${id}`),
  joinSpace: (id: string) => request<any>(`/spaces/${id}/join`, { method: 'POST' }),
  createSpace: (data: any) => request<any>('/spaces', { method: 'POST', body: JSON.stringify(data) }),
  createChannel: (spaceId: string, data: { name: string; topic?: string; type?: string; isPrivate?: boolean }) =>
    request<any>(`/spaces/${spaceId}/channels`, { method: 'POST', body: JSON.stringify(data) }),
  deleteChannel: (spaceId: string, channelId: string) =>
    request<any>(`/spaces/${spaceId}/channels/${channelId}`, { method: 'DELETE' }),

  // Chat & Social
  getChannelMessages: (channelId: string) => request<any[]>(`/channels/${channelId}/messages`),
  sendMessage: (channelId: string, data: { content: string; replyToId?: string; attachmentUrl?: string }) =>
    request<any>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  toggleReaction: (messageId: string, emoji: string) =>
    request<any>(`/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  togglePin: (messageId: string) =>
    request<any>(`/messages/${messageId}/pin`, { method: 'POST' }),

  // Social (Friends, Followers, DMs)
  getFriends: () => request<any>('/social/friends'),
  sendFriendRequest: (targetUserId: string) => request<any>(`/social/friends/request/${targetUserId}`, { method: 'POST' }),
  acceptFriendRequest: (friendshipId: string) => request<any>(`/social/friends/accept/${friendshipId}`, { method: 'POST' }),
  rejectFriendRequest: (friendshipId: string) => request<any>(`/social/friends/reject/${friendshipId}`, { method: 'POST' }),
  removeFriend: (targetUserId: string) => request<any>(`/social/friends/remove/${targetUserId}`, { method: 'DELETE' }),
  followUser: (targetUserId: string) => request<any>(`/social/follow/${targetUserId}`, { method: 'POST' }),
  unfollowUser: (targetUserId: string) => request<any>(`/social/unfollow/${targetUserId}`, { method: 'POST' }),
  getFollowers: (userId: string) => request<any>(`/social/followers/${userId}`),
  getFollowing: (userId: string) => request<any>(`/social/following/${userId}`),
  getSocialStatus: (targetUserId: string) => request<any>(`/social/status/${targetUserId}`),
  searchSocialUsers: (query: string = '') => request<any[]>(`/social/users/search?query=${encodeURIComponent(query)}`),
  getDirectConversations: () => request<any[]>('/social/dm/conversations'),
  getDirectMessages: (targetUserId: string) => request<any>(`/social/dm/messages/${targetUserId}`),
  sendDirectMessage: (receiverId: string, content: string) =>
    request<any>('/social/dm/send', { method: 'POST', body: JSON.stringify({ receiverId, content }) }),

  // Gamification
  getLeaderboard: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/gamification/leaderboard${query ? '?' + query : ''}`);
  },
  getAchievements: () => request<any[]>('/gamification/achievements'),
  getUserStats: () => request<any>('/gamification/stats'),

  // Creator
  getCreatorStats: () => request<any>('/creator/stats'),
  getCreatorCourses: () => request<any[]>('/creator/courses'),
  getCreatorCourse: (id: string) => request<any>(`/creator/courses/${id}`),
  createCourse: (data: any) => request<any>('/creator/courses', { method: 'POST', body: JSON.stringify(data) }),
  deleteCourse: (id: string) => request<any>(`/creator/courses/${id}`, { method: 'DELETE' }),
  getCreatorMembers: () => request<any[]>('/creator/members'),
  getCourseRoles: (courseId: string) => request<any[]>(`/creator/courses/${courseId}/roles`),
  createCourseRole: (courseId: string, data: any) =>
    request<any>(`/creator/courses/${courseId}/roles`, { method: 'POST', body: JSON.stringify(data) }),
  assignCourseMemberRole: (courseId: string, userId: string, roleId: string | null) =>
    request<any>(`/creator/courses/${courseId}/members/${userId}/role`, { method: 'PUT', body: JSON.stringify({ roleId }) }),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminUsers: () => request<any[]>('/admin/users'),
  toggleSuspendUser: (id: string) => request<any>(`/admin/users/${id}/suspend`, { method: 'PUT' }),
  getAdminReports: () => request<any[]>('/admin/reports'),
  updateReportStatus: (id: string, status: string) =>
    request<any>(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  submitReport: (data: any) => request<any>('/admin/report', { method: 'POST', body: JSON.stringify(data) }),

  // Notes
  getLessonNote: (lessonId: string) => request<any>(`/notes/${lessonId}`),
  saveLessonNote: (lessonId: string, content: string) =>
    request<any>(`/notes/${lessonId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  getAllNotes: () => request<any[]>('/notes'),

  // Q&A
  getCourseQA: (courseId: string) => request<any[]>(`/qa/course/${courseId}`),
  askCourseQuestion: (courseId: string, data: { title: string; content: string }) =>
    request<any>(`/qa/course/${courseId}`, { method: 'POST', body: JSON.stringify(data) }),
  answerQuestion: (questionId: string, content: string) =>
    request<any>(`/qa/questions/${questionId}/answers`, { method: 'POST', body: JSON.stringify({ content }) }),
  acceptSolution: (answerId: string) => request<any>(`/qa/answers/${answerId}/accept`, { method: 'POST' }),
  upvoteQuestion: (questionId: string) => request<any>(`/qa/questions/${questionId}/upvote`, { method: 'POST' }),

  // Certificates
  verifyCertificate: (id: string) => request<any>(`/certificates/verify/${id}`),
  getMyCertificates: () => request<any[]>('/certificates/my'),
  generateCertificate: (courseId: string) => request<any>(`/certificates/generate/${courseId}`, { method: 'POST' }),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
};
