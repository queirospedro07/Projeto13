import { queryOne, queryAll } from '../database/connection.js';

export function canManageCourse(user, course) {
  if (!user?.id || !course) return false;
  return (
    user.role === 'ADMIN' ||
    user.id === course.creatorId ||
    Boolean(
      queryOne('SELECT id FROM colaboradores_curso WHERE id_curso = ? AND id_utilizador = ?', [
        course.id,
        user.id,
      ]),
    )
  );
}

export function canStudyCourse(user, course) {
  if (!user?.id || !course) return false;
  if (canManageCourse(user, course)) return true;
  return Boolean(
    queryOne('SELECT id FROM enrollments WHERE courseId = ? AND userId = ?', [course.id, user.id]),
  );
}

export function lessonWithCourse(lessonId) {
  return queryOne(
    `SELECT l.*, m.courseId FROM lessons l JOIN course_modules m ON m.id = l.moduleId WHERE l.id = ?`,
    [lessonId],
  );
}

export function canAccessSpace(user, spaceId) {
  if (!user?.id) return false;
  const space = queryOne('SELECT id, ownerId, isPrivate FROM spaces WHERE id = ?', [spaceId]);
  if (!space) return false;
  if (user.role === 'ADMIN' || user.id === space.ownerId) return true;
  const courses = queryAll('SELECT * FROM courses WHERE spaceId = ?', [space.id]);
  if (courses.length) return courses.some((course) => canStudyCourse(user, course));
  return Boolean(
    queryOne('SELECT id FROM memberships WHERE spaceId = ? AND userId = ?', [space.id, user.id]),
  );
}

export function canModerateSpace(user, spaceId) {
  if (!user?.id) return false;
  const space = queryOne('SELECT ownerId FROM spaces WHERE id = ?', [spaceId]);
  if (!space) return false;
  return (
    user.role === 'ADMIN' ||
    user.id === space.ownerId ||
    queryAll('SELECT * FROM courses WHERE spaceId = ?', [spaceId]).some((course) =>
      canManageCourse(user, course),
    )
  );
}
