const { aliasesForCategory } = require('../utils/courseCategories');
const { queryAll, queryOne, execute } = require('../database/connection.js');
const Course = {
  findCertificateByUserAndCourse(params = []) {
    return queryOne(
      'SELECT id, "credentialId", "issuedAt" FROM certificates WHERE "userId" = $1 AND "courseId" = $2',
      params,
    );
  },
  listEnrollmentsByUserId(params = []) {
    return queryAll(
      `SELECT DISTINCT 
              c.id as course_id, c.title, c.slug, c.description, c.category, c.difficulty, c."thumbnailUrl", c."bannerUrl", c.price, c."isFree", c."durationHours", c.language, c."creatorId", c."spaceId",
              e.id as enrollment_id, e."userId" as "enrollment_userId", e."enrolledAt", e."completedAt", e."progressPercent", e."lastLessonId", e."isHidden",
              u.id as creator_id, u.name as creator_name, u.username as creator_username, u."avatarUrl" as "creator_avatarUrl"
       FROM enrollments e
       JOIN courses c ON e."courseId" = c.id
       LEFT JOIN users u ON c."creatorId" = u.id
       WHERE e."userId" = $1
       ORDER BY e."enrolledAt" DESC`,
      params,
    );
  },
  listModulesByCourseId(params = []) {
    return queryAll(
      `SELECT m.id, m.title, m.description, m."orderIndex"
         FROM course_modules m
         WHERE m."courseId" = $1
         ORDER BY m."orderIndex" ASC`,
      params,
    );
  },
  listLessonsByModuleId(params = []) {
    return queryAll(
      'SELECT id, title, "durationMin", type, "orderIndex" FROM lessons WHERE "moduleId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  listLessonProgressByEnrollmentId(params = []) {
    return queryAll('SELECT * FROM lesson_progress WHERE "enrollmentId" = $1', params);
  },
  findEnrollmentByUserIdAndCourseIdAndSlug(params = []) {
    return queryOne(
      'SELECT * FROM enrollments WHERE "userId" = $1 AND ("courseId" = $2 OR "courseId" IN (SELECT id FROM courses WHERE slug = $3))',
      params,
    );
  },
  updateEnrollmentsByIsHiddenAndId(params = []) {
    return execute('UPDATE inscricoes SET esta_oculto = $1 WHERE id = $2', params);
  },
  search(filters = {}) {
    const { search, category, difficulty, isFree, sort } = filters;
    let sql = `SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.username as creator_username, u."avatarUrl" as "creator_avatarUrl",
             (SELECT COUNT(*) FROM enrollments WHERE "courseId" = c.id) as "studentsCount",
             (SELECT COUNT(*) FROM course_modules WHERE "courseId" = c.id) as "modulesCount",
             (SELECT COUNT(*) FROM channels WHERE "spaceId" = c."spaceId") as "channelsCount",
             (SELECT COUNT(*) FROM reviews WHERE "courseId" = c.id) as "reviewsCount",
             COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE "courseId" = c.id), 0.0) as "averageRating"
      FROM courses c
      JOIN users u ON c."creatorId" = u.id
      WHERE c."isPublished" = 1 AND (c."approvalStatus" = 'APPROVED' OR c."approvalStatus" IS NULL)`;
    const params = [];
    if (search) {
      sql += ` AND (c.title LIKE $1 OR c.description LIKE $2)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'all') {
      params.push(aliasesForCategory(category));
      sql += ` AND LOWER(c.category) = ANY($${params.length}::text[])`;
    }
    if (difficulty && difficulty !== 'all') {
      sql += ` AND c.difficulty = $${params.length + 1}`;
      params.push(difficulty);
    }
    if (isFree === 'true') {
      sql += ` AND c."isFree" = 1`;
    } else if (isFree === 'false') {
      sql += ` AND c."isFree" = 0`;
    }
    if (sort === 'popular') sql += ` ORDER BY "studentsCount" DESC`;
    else if (sort === 'price-low') sql += ` ORDER BY c.price ASC`;
    else if (sort === 'price-high') sql += ` ORDER BY c.price DESC`;
    else sql += ` ORDER BY c."createdAt" DESC`;
    return queryAll(sql, params);
  },
  findEnrollmentsByUserIdAndCourseId(params = []) {
    return queryOne(
      'SELECT "progressPercent", "completedAt" FROM enrollments WHERE "userId" = $1 AND "courseId" = $2',
      params,
    );
  },
  countCourseByIdAndSlugAndSpaceId(params = []) {
    return queryOne(
      `SELECT c.*,
              u.id as creator_id, u.name as creator_name, u.username as creator_username, u."avatarUrl" as "creator_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as creator_bio,
              (SELECT COUNT(*) FROM enrollments WHERE "courseId" = c.id) as "studentsCount"
       FROM courses c
       LEFT JOIN users u ON c."creatorId" = u.id
       WHERE c.id = $1 OR c.slug = $2 OR c."spaceId" = $3 OR LOWER(c.id) = LOWER($4) OR LOWER(c.slug) = LOWER($5)`,
      params,
    );
  },
  findSpacesByIdAndSlug(params = []) {
    return queryOne(
      `SELECT s.*,
                u.id as owner_id, u.name as owner_name, u.username as owner_username, u."avatarUrl" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio
         FROM spaces s
         LEFT JOIN users u ON s."ownerId" = u.id
         WHERE s.id = $1 OR s.slug = $2 OR LOWER(s.id) = LOWER($3) OR LOWER(s.slug) = LOWER($4)`,
      params,
    );
  },
  countLinkedCourseBySpaceIdAndId(params = []) {
    return queryOne(
      `SELECT c.*,
                  u.id as creator_id, u.name as creator_name, u.username as creator_username, u."avatarUrl" as "creator_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as creator_bio,
                  (SELECT COUNT(*) FROM enrollments WHERE "courseId" = c.id) as "studentsCount"
           FROM courses c
           LEFT JOIN users u ON c."creatorId" = u.id
           WHERE c."spaceId" = $1 OR c.id = $2`,
      params,
    );
  },
  findCourseCollaboratorsByCourseIdAndUserId(params = []) {
    return queryOne(
      'SELECT id FROM course_collaborators WHERE "courseId" = $1 AND "userId" = $2',
      params,
    );
  },
  listModulesByCourseIdForGetCourseById(params = []) {
    return queryAll(
      'SELECT * FROM course_modules WHERE "courseId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  listLessonsByModuleIdForLessons(params = []) {
    return queryAll(
      `SELECT l.*, q.id as quiz_id, q.title as quiz_title, q."xpReward" as "quiz_xpReward"
         FROM lessons l
         LEFT JOIN quizzes q ON q."lessonId" = l.id
         WHERE l."moduleId" = $1
         ORDER BY l."orderIndex" ASC`,
      params,
    );
  },
  listQuestionsByQuizId(params = []) {
    return queryAll(
      'SELECT * FROM quiz_questions WHERE "quizId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  findOtherCourseWithSameSpaceBySpaceId(params = []) {
    return queryOne('SELECT id FROM courses WHERE "spaceId" = $1 AND id != $2 LIMIT 1', params);
  },
  findSpaceRowById(params = []) {
    return queryOne('SELECT * FROM spaces WHERE id = $1', params);
  },
  listChannelsBySpaceId(params = []) {
    return queryAll(
      'SELECT * FROM channels WHERE "spaceId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  listMembersBySpaceId(params = []) {
    return queryAll(
      `SELECT m.*, u.name, u.username, u."avatarUrl", u.role
           FROM memberships m
           JOIN users u ON m."userId" = u.id
           WHERE m."spaceId" = $1
           LIMIT 20`,
      params,
    );
  },
  findEnrollmentRowByUserIdAndCourseId(params = []) {
    return queryOne('SELECT * FROM enrollments WHERE "userId" = $1 AND "courseId" = $2', params);
  },
  listLessonProgressByEnrollmentIdForGetCourseById(params = []) {
    return queryAll('SELECT * FROM lesson_progress WHERE "enrollmentId" = $1', params);
  },
  listClassmatesByCourseIdAndSpaceId(params = []) {
    return queryAll(
      `SELECT u.id, u.name, u.username, u."avatarUrl", u.role
       FROM (
         SELECT "userId" FROM enrollments WHERE "courseId" = $1
         UNION
         SELECT "userId" FROM memberships WHERE "spaceId" = $2
       ) t
       JOIN users u ON t."userId" = u.id
       WHERE u.id != $3
       ORDER BY (CASE WHEN u.role = 'CREATOR' THEN 0 ELSE 1 END), u.name ASC
       LIMIT 50`,
      params,
    );
  },
  listReviewsRowsByCourseId(params = []) {
    return queryAll(
      `SELECT r.*, u.name as user_name, u.username as user_username, u."avatarUrl" as "user_avatarUrl"
         FROM reviews r
         JOIN users u ON r."userId" = u.id
         WHERE r."courseId" = $1
         ORDER BY r."createdAt" DESC`,
      params,
    );
  },
  findCourseByIdAndSlug(params = []) {
    return queryOne(
      'SELECT id, "creatorId", "spaceId" FROM courses WHERE id = $1 OR slug = $2',
      params,
    );
  },
  listClassmatesByCourseIdAndSpaceIdForGetCourseByIdClassmates(params = []) {
    return queryAll(
      `SELECT DISTINCT u.id, u.name, u.username, u."avatarUrl", u.role,
              COALESCE(e."progressPercent", 0) as "progressPercent"
       FROM (
         SELECT "userId" FROM enrollments WHERE "courseId" = $1
         UNION
         SELECT "userId" FROM memberships WHERE "spaceId" = $2
       ) t
       JOIN users u ON t."userId" = u.id
       LEFT JOIN enrollments e ON e."userId" = u.id AND e."courseId" = $3
       WHERE u.id != $4
       ORDER BY u.name ASC
       LIMIT 50`,
      params,
    );
  },
  findCourseByIdAndSlugAndSpaceId(params = []) {
    return queryOne(
      'SELECT id, title, "spaceId", "isPublished", "approvalStatus", "creatorId", price, "isFree" FROM courses WHERE id = $1 OR slug = $2 OR "spaceId" = $3 OR LOWER(id) = LOWER($4) OR LOWER(slug) = LOWER($5)',
      params,
    );
  },
  insertEnrollments(params = []) {
    return execute(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0)',
      params,
    );
  },
  findMemExistsByUserIdAndSpaceId(params = []) {
    return queryOne('SELECT id FROM memberships WHERE "userId" = $1 AND "spaceId" = $2', params);
  },
  insertMemberships(params = []) {
    return execute(
      "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'MEMBER', $4)",
      params,
    );
  },
  insertNotifications(params = []) {
    return execute(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'course_update', $3, $4, $5, 0, $6)",
      params,
    );
  },
  findNewEnrollmentById(params = []) {
    return queryOne('SELECT * FROM enrollments WHERE id = $1', params);
  },
  findCourseByIdAndSlugForPostCourseByCourseIdReviews(params = []) {
    return queryOne('SELECT id, "creatorId" FROM courses WHERE id = $1 OR slug = $2', params);
  },
  findEnrollmentsByUserIdAndCourseIdForPostCourseByCourseIdReviews(params = []) {
    return queryOne('SELECT id FROM enrollments WHERE "userId" = $1 AND "courseId" = $2', params);
  },
  findExistingReviewByCourseIdAndUserId(params = []) {
    return queryOne('SELECT id FROM reviews WHERE "courseId" = $1 AND "userId" = $2', params);
  },
  updateReviewsByRatingAndCommentAndId(params = []) {
    return execute(
      'UPDATE avaliacoes SET classificacao = $1, comentario = $2 WHERE id = $3',
      params,
    );
  },
  insertReviews(params = []) {
    return execute(
      `INSERT INTO avaliacoes (id, id_curso, id_utilizador, classificacao, comentario, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      params,
    );
  },
};
module.exports = Course;
