export const canTeach = (user) =>
  user?.role === 'CREATOR' || (user?.role === 'ADMIN' && user.isTeacher !== false);
