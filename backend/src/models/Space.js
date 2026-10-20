const { execute, queryOne, queryAll } = require('../database/connection.js');
const Space = {
  insertChannels(params = []) {
    return execute(
      'INSERT INTO canais(id,id_espaco,nome,tipo,topico,e_voz,questao_orientadora) VALUES($1,$2,$3,$4,$5,$6,$7)',
      params,
    );
  },
  findChannelsById(params = []) {
    return queryOne('SELECT * FROM channels WHERE id=$1', params);
  },
  findChannelsByIdAndSpaceId(params = []) {
    return queryOne('SELECT id FROM channels WHERE id=$1 AND "spaceId"=$2', params);
  },
  updateChannel(params = []) {
    return execute(
      'UPDATE canais SET nome=$1,tipo=$2,topico=$3,e_voz=$4,questao_orientadora=$5 WHERE id=$6 AND id_espaco=$7',
      params,
    );
  },
  deleteChannelsByIdAndSpaceId(params = []) {
    return execute('DELETE FROM canais WHERE id=$1 AND id_espaco=$2', params);
  },
  search(filters = {}) {
    const { category, search } = filters;
    let sql = `SELECT s.*,
             u.id as owner_id, u.name as owner_name, u.username as owner_username, u."avatarUrl" as "owner_avatarUrl",
             (SELECT COUNT(*) FROM memberships WHERE "spaceId" = s.id) as "membersCount",
             (SELECT COUNT(*) FROM channels WHERE "spaceId" = s.id) as "channelsCount",
             (SELECT COUNT(*) FROM courses WHERE "spaceId" = s.id) as "coursesCount"
      FROM spaces s
      JOIN users u ON s."ownerId" = u.id
      WHERE 1=1
        AND NOT EXISTS (
          SELECT 1 FROM courses c
          WHERE c."spaceId" = s.id
            AND (c."isPublished" <> 1 OR (c."approvalStatus" IS NOT NULL AND c."approvalStatus" <> 'APPROVED'))
        )`;
    const params = [];
    if (category && category !== 'all') {
      sql += ` AND s.category = $1`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (s.name LIKE $${params.length + 1} OR s.description LIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY "membersCount" DESC`;

    return queryAll(sql, params);
  },
  findMemBySpaceIdAndUserId(params = []) {
    return queryOne('SELECT role FROM memberships WHERE "spaceId" = $1 AND "userId" = $2', params);
  },
  countSpaceByIdAndSlug(params = []) {
    return queryOne(
      `SELECT s.*,
              u.id as owner_id, u.name as owner_name, u.username as owner_username, u."avatarUrl" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio,
              (SELECT COUNT(*) FROM memberships WHERE "spaceId" = s.id) as "membersCount",
              (SELECT COUNT(*) FROM channels WHERE "spaceId" = s.id) as "channelsCount"
       FROM spaces s
       JOIN users u ON s."ownerId" = u.id
       WHERE s.id = $1 OR s.slug = $2`,
      params,
    );
  },
  findCourseRowByIdAndSlug(params = []) {
    return queryOne(
      `SELECT c.*, u.id as owner_id, u.name as owner_name, u.username as owner_username, u."avatarUrl" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio
         FROM courses c
         JOIN users u ON c."creatorId" = u.id
         WHERE c.id = $1 OR c.slug = $2`,
      params,
    );
  },
  countMembershipsById(params = []) {
    return queryOne(
      `SELECT s.*,
                    u.id as owner_id, u.name as owner_name, u.username as owner_username, u."avatarUrl" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio,
                    (SELECT COUNT(*) FROM memberships WHERE "spaceId" = s.id) as "membersCount",
                    (SELECT COUNT(*) FROM channels WHERE "spaceId" = s.id) as "channelsCount"
             FROM spaces s
             JOIN users u ON s."ownerId" = u.id
             WHERE s.id = $1`,
      params,
    );
  },
  listChannelsBySpaceId(params = []) {
    return queryAll(
      'SELECT * FROM channels WHERE "spaceId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  listCoursesBySpaceId(params = []) {
    return queryAll(
      'SELECT id, title, slug, "thumbnailUrl", difficulty, "durationHours", price, "isFree" FROM courses WHERE "spaceId" = $1',
      params,
    );
  },
  listMembersBySpaceIdAndId(params = []) {
    return queryAll(
      `SELECT u.id as user_id, u.name, u.username, u."avatarUrl", u.role as user_role,
              COALESCE(m.role, 'MEMBER') as role,
              COALESCE(m.id, 'mem-' || u.id) as id
       FROM (
         SELECT "userId" FROM memberships WHERE "spaceId" = $1
         UNION
         SELECT e."userId" FROM enrollments e 
         JOIN courses c ON e."courseId" = c.id 
         WHERE c."spaceId" = $2
       ) t
       JOIN users u ON t."userId" = u.id
       LEFT JOIN memberships m ON m."userId" = u.id AND m."spaceId" = $3
       ORDER BY (CASE WHEN u.id = $4 THEN 0 ELSE 1 END), u.name ASC
       LIMIT 50`,
      params,
    );
  },
  findSpaceByIdAndSlug(params = []) {
    return queryOne(
      'SELECT id, name, "isPrivate", "ownerId" FROM spaces WHERE id = $1 OR slug = $2',
      params,
    );
  },
  findPendingCourseBySpaceId(params = []) {
    return queryOne(
      `SELECT id FROM courses
      WHERE "spaceId" = $1
        AND ("isPublished" <> 1 OR ("approvalStatus" IS NOT NULL AND "approvalStatus" <> 'APPROVED'))
      LIMIT 1`,
      params,
    );
  },
  listCoursesBySpaceIdForPostSpaceByIdJoin(params = []) {
    return queryAll(
      'SELECT * FROM courses WHERE "spaceId" = $1 AND "isFree" = 0 AND price > 0',
      params,
    );
  },
  findExistingBySpaceIdAndUserId(params = []) {
    return queryOne('SELECT id FROM memberships WHERE "spaceId" = $1 AND "userId" = $2', params);
  },
  insertMemberships(params = []) {
    return execute(
      "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'MEMBER', $4)",
      params,
    );
  },
  listLinkedCoursesBySpaceIdAndId(params = []) {
    return queryAll(
      'SELECT id FROM courses WHERE ("spaceId" = $1 OR id = $2) AND "isFree" = 1 AND "isPublished" = 1 AND ("approvalStatus" = \'APPROVED\' OR "approvalStatus" IS NULL)',
      params,
    );
  },
  insertEnrollments(params = []) {
    return execute(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0) ON CONFLICT DO NOTHING',
      params,
    );
  },
};

module.exports = Space;
