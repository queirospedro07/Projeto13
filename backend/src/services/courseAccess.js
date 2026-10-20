const { asyncSome } = require('../utils/asyncCollections.js');
const { queryOne, queryAll } = require('../database/connection.js');

async function canManageCourse(user, course) {
  if (!user?.id || !course) return false;

  return (
    user.role === 'ADMIN' ||
    user.id === course.creatorId ||
    Boolean(
      await queryOne(
        'SELECT id FROM colaboradores_curso WHERE id_curso = $1 AND id_utilizador = $2',
        [course.id, user.id],
      ),
    )
  );
}

async function canStudyCourse(user, course) {
  if (!user?.id || !course) return false;
  if (await canManageCourse(user, course)) return true;

  return Boolean(
    await queryOne('SELECT id FROM enrollments WHERE "courseId" = $1 AND "userId" = $2', [
      course.id,
      user.id,
    ]),
  );
}

async function lessonWithCourse(lessonId) {
  return await queryOne(
    'SELECT l.*, m."courseId" FROM lessons l JOIN course_modules m ON m.id = l."moduleId" WHERE l.id = $1',
    [lessonId],
  );
}

async function canAccessSpace(user, spaceId) {
  if (!user?.id) return false;
  const space = await queryOne('SELECT id, "ownerId", "isPrivate" FROM spaces WHERE id = $1', [
    spaceId,
  ]);
  if (!space) return false;
  if (user.role === 'ADMIN' || user.id === space.ownerId) return true;
  const courses = await queryAll('SELECT * FROM courses WHERE "spaceId" = $1', [space.id]);
  if (courses.length)
    return await asyncSome(courses, async (course) => await canStudyCourse(user, course));

  return Boolean(
    await queryOne('SELECT id FROM memberships WHERE "spaceId" = $1 AND "userId" = $2', [
      space.id,
      user.id,
    ]),
  );
}

async function canModerateSpace(user, spaceId) {
  if (!user?.id) return false;
  const space = await queryOne('SELECT "ownerId" FROM spaces WHERE id = $1', [spaceId]);
  if (!space) return false;

  return (
    user.role === 'ADMIN' ||
    user.id === space.ownerId ||
    (await asyncSome(
      await queryAll('SELECT * FROM courses WHERE "spaceId" = $1', [spaceId]),
      async (course) => await canManageCourse(user, course),
    ))
  );
}

exports.canManageCourse = canManageCourse;
exports.canStudyCourse = canStudyCourse;
exports.lessonWithCourse = lessonWithCourse;
exports.canAccessSpace = canAccessSpace;
exports.canModerateSpace = canModerateSpace;
