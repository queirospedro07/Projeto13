const { queryOne, queryAll } = require('../database/connection.js');
const Certificate = {
  findCertByIdAndCredentialId(params = []) {
    return queryOne(
      `SELECT c.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u."avatarUrl" as "user_avatarUrl",
              co.id as course_id, co.title as course_title, co.slug as course_slug, co."durationHours" as "course_durationHours"
       FROM certificates c
       JOIN users u ON c."userId" = u.id
       JOIN courses co ON c."courseId" = co.id
       WHERE c.id = $1 OR c."credentialId" = $2`,
      params,
    );
  },
  listCertsByUserId(params = []) {
    return queryAll(
      `SELECT c.*, co.title as course_title, co."thumbnailUrl"
       FROM certificates c
       JOIN courses co ON c."courseId" = co.id
       WHERE c."userId" = $1
       ORDER BY c."issuedAt" DESC`,
      params,
    );
  },
};

module.exports = Certificate;
