const envApiUrl = import.meta.env?.VITE_API_URL;
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}/api` : '/api';
export function getAuthToken() {
  return localStorage.getItem('learnspace_token');
}
export function setAuthToken(token) {
  localStorage.setItem('learnspace_token', token);
}
export function removeAuthToken() {
  localStorage.removeItem('learnspace_token');
}
async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed with status ' + response.status);
  }
  return data;
}
export const api = {
  login: credentials => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  register: userData => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  demoLogin: role => request(`/auth/demo/${role}`),
  getMe: () => request('/auth/me'),
  updateProfile: profile => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }),
  clearProfileField: field => request('/auth/profile/clear-field', {
    method: 'POST',
    body: JSON.stringify({
      field
    })
  }),
  forgotPassword: email => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email
    })
  }),
  getCourses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/courses${query ? '?' + query : ''}`);
  },
  getCourse: id => request(`/courses/${id}`),
  getMyCourses: () => request('/courses/my-learning'),
  enrollCourse: id => request(`/courses/${id}/enroll`, {
    method: 'POST'
  }),
  completeLesson: (courseId, lessonId) => request(`/courses/${courseId}/lessons/${lessonId}/complete`, {
    method: 'POST'
  }),
  submitReview: (courseId, data) => request(`/courses/${courseId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getLessonQuiz: lessonId => request(`/quizzes/lesson/${lessonId}`),
  submitQuiz: (quizId, answers) => request(`/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      answers
    })
  }),
  getSpaces: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/spaces${query ? '?' + query : ''}`);
  },
  getSpace: id => request(`/spaces/${id}`),
  joinSpace: id => request(`/spaces/${id}/join`, {
    method: 'POST'
  }),
  createSpace: data => request('/spaces', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createChannel: (spaceId, data) => request(`/spaces/${spaceId}/channels`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteChannel: (spaceId, channelId) => request(`/spaces/${spaceId}/channels/${channelId}`, {
    method: 'DELETE'
  }),
  getChannelMessages: channelId => request(`/channels/${channelId}/messages`),
  sendMessage: (channelId, data) => request(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  toggleReaction: (messageId, emoji) => request(`/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({
      emoji
    })
  }),
  togglePin: messageId => request(`/messages/${messageId}/pin`, {
    method: 'POST'
  }),
  getFriends: () => request('/social/friends'),
  sendFriendRequest: targetUserId => request(`/social/friends/request/${targetUserId}`, {
    method: 'POST'
  }),
  acceptFriendRequest: friendshipId => request(`/social/friends/accept/${friendshipId}`, {
    method: 'POST'
  }),
  rejectFriendRequest: friendshipId => request(`/social/friends/reject/${friendshipId}`, {
    method: 'POST'
  }),
  removeFriend: targetUserId => request(`/social/friends/remove/${targetUserId}`, {
    method: 'DELETE'
  }),
  followUser: targetUserId => request(`/social/follow/${targetUserId}`, {
    method: 'POST'
  }),
  unfollowUser: targetUserId => request(`/social/unfollow/${targetUserId}`, {
    method: 'POST'
  }),
  getFollowers: userId => request(`/social/followers/${userId}`),
  getFollowing: userId => request(`/social/following/${userId}`),
  getSocialStatus: targetUserId => request(`/social/status/${targetUserId}`),
  searchSocialUsers: (query = '') => request(`/social/users/search?query=${encodeURIComponent(query)}`),
  getDirectConversations: () => request('/social/dm/conversations'),
  getDirectMessages: targetUserId => request(`/social/dm/messages/${targetUserId}`),
  sendDirectMessage: (receiverId, content) => request('/social/dm/send', {
    method: 'POST',
    body: JSON.stringify({
      receiverId,
      content
    })
  }),
  getLeaderboard: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/gamification/leaderboard${query ? '?' + query : ''}`);
  },
  getAchievements: () => request('/gamification/achievements'),
  getUserStats: () => request('/gamification/stats'),
  getCreatorStats: () => request('/creator/stats'),
  getCreatorCourses: () => request('/creator/courses'),
  getCreatorCourse: id => request(`/creator/courses/${id}`),
  createCourse: data => request('/creator/courses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCourse: (id, data) => request(`/creator/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteCourse: id => request(`/creator/courses/${id}`, {
    method: 'DELETE'
  }),
  getCreatorMembers: () => request('/creator/members'),
  getCourseRoles: courseId => request(`/creator/courses/${courseId}/roles`),
  createCourseRole: (courseId, data) => request(`/creator/courses/${courseId}/roles`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  assignCourseMemberRole: (courseId, userId, roleId) => request(`/creator/courses/${courseId}/members/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({
      roleId
    })
  }),
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  toggleSuspendUser: id => request(`/admin/users/${id}/suspend`, {
    method: 'PUT'
  }),
  getAdminReports: () => request('/admin/reports'),
  updateReportStatus: (id, status) => request(`/admin/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      status
    })
  }),
  submitReport: data => request('/admin/report', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getLessonNote: lessonId => request(`/notes/${lessonId}`),
  saveLessonNote: (lessonId, content) => request(`/notes/${lessonId}`, {
    method: 'POST',
    body: JSON.stringify({
      content
    })
  }),
  getAllNotes: () => request('/notes'),
  getCourseQA: courseId => request(`/qa/course/${courseId}`),
  askCourseQuestion: (courseId, data) => request(`/qa/course/${courseId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  answerQuestion: (questionId, content) => request(`/qa/questions/${questionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({
      content
    })
  }),
  acceptSolution: answerId => request(`/qa/answers/${answerId}/accept`, {
    method: 'POST'
  }),
  upvoteQuestion: questionId => request(`/qa/questions/${questionId}/upvote`, {
    method: 'POST'
  }),
  verifyCertificate: id => request(`/certificates/verify/${id}`),
  getMyCertificates: () => request('/certificates/my'),
  generateCertificate: courseId => request(`/certificates/generate/${courseId}`, {
    method: 'POST'
  }),
  getNotifications: () => request('/notifications'),
  markAllNotificationsRead: () => request('/notifications/read-all', {
    method: 'PUT'
  }),
  markNotificationRead: id => request(`/notifications/${id}/read`, {
    method: 'PUT'
  })
};