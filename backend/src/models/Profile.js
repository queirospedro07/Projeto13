const { queryOne, queryAll, execute, query } = require('../database/connection.js');
const Profile = {
  findUserById(params = []) {
    return queryOne(
      `SELECT u.id, u.name, u.username, u.role, u."avatarUrl", u.bio, u.location,
             u."dailyGoalMinutes", u."minutesToday", u."totalMinutes", u."createdAt",
             p.headline, p.website, p.github, p.linkedin, p."bannerUrl", p."themePreference",
             p."isPublic", p."showBio", p."showLocation",
             p."showSocials", p."showStats", p."showCourses"
      FROM users u
      LEFT JOIN profiles p ON u.id = p."userId"
      WHERE LOWER(u.username) = $1 OR u.id = $2`,
      params,
    );
  },
  listEnrollmentRowsByUserId(params = []) {
    return queryAll(
      `SELECT e.id as "enrollmentId", e."progressPercent", e."completedAt", e."isHidden",
                c.id, c.title, c.slug, c.description, c.category, c."thumbnailUrl", c."bannerUrl", c."durationHours"
         FROM enrollments e
         JOIN courses c ON e."courseId" = c.id
         WHERE e."userId" = $1
         ORDER BY e."enrolledAt" DESC`,
      params,
    );
  },
  updateUtilizadoresByAtualizadoEmAndId(params = []) {
    return execute(
      `UPDATE utilizadores SET
          nome = COALESCE($1, nome),
          biografia = CASE WHEN $2 = 1 THEN $3 ELSE biografia END,
          localizacao = CASE WHEN $4 = 1 THEN $5 ELSE localizacao END,
          url_avatar = CASE WHEN $6 = 1 THEN $7 ELSE url_avatar END,
          atualizado_em = $8
         WHERE id = $9`,
      params,
    );
  },
  findProfileExistsByIdUtilizador(params = []) {
    return queryOne('SELECT id FROM perfis WHERE id_utilizador = $1', params);
  },
  updatePerfisByIdUtilizador(params = []) {
    return execute(
      `UPDATE perfis SET
          titulo_perfil = CASE WHEN $1 = 1 THEN $2 ELSE titulo_perfil END,
          github = CASE WHEN $3 = 1 THEN $4 ELSE github END,
          linkedin = CASE WHEN $5 = 1 THEN $6 ELSE linkedin END,
          website = CASE WHEN $7 = 1 THEN $8 ELSE website END,
          url_banner = CASE WHEN $9 = 1 THEN $10 ELSE url_banner END,
          preferencia_tema = COALESCE($11, preferencia_tema),
          e_publico = COALESCE($12, e_publico),
          mostrar_biografia = COALESCE($13, mostrar_biografia),
          mostrar_localizacao = COALESCE($14, mostrar_localizacao),
          mostrar_redes_sociais = COALESCE($15, mostrar_redes_sociais),
          mostrar_estatisticas = COALESCE($16, mostrar_estatisticas),
          mostrar_cursos = COALESCE($17, mostrar_cursos)
          WHERE id_utilizador = $18`,
      params,
    );
  },
  insertProfiles(params = []) {
    return execute(
      `INSERT INTO perfis
          (id, id_utilizador, titulo_perfil, github, linkedin,
           website, url_banner, preferencia_tema,
           e_publico, mostrar_biografia, mostrar_localizacao, mostrar_redes_sociais, mostrar_estatisticas, mostrar_cursos)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      params,
    );
  },
  findUpdatedById(params = []) {
    return queryOne(
      `SELECT u.id, u.email, u.username, u.name, u.role, u."avatarUrl", u.bio, u.location,
             u."dailyGoalMinutes", u."minutesToday", u."totalMinutes",
             u."isSuspended", u."createdAt", u."updatedAt",
             p.headline, p.website, p.github, p.linkedin, p."bannerUrl", p."themePreference",
             p."isPublic", p."showBio", p."showLocation",
             p."showSocials", p."showStats", p."showCourses"
      FROM users u LEFT JOIN profiles p ON u.id = p."userId"
      WHERE u.id = $1`,
      params,
    );
  },
  updateUtilizadoresByAtualizadoEmAndIdForPostProfileProfileClearField(params = []) {
    return execute(
      'UPDATE utilizadores SET url_avatar = NULL, atualizado_em = $1 WHERE id = $2',
      params,
    );
  },
  updatePerfisByIdUtilizadorForPostProfileProfileClearField(params = []) {
    return execute('UPDATE perfis SET url_banner = NULL WHERE id_utilizador = $1', params);
  },
  findUserResult(params = []) {
    return query('SELECT id, name, email FROM users WHERE LOWER(email) = $1 LIMIT 1', params);
  },
  findPasswordResetTokensByUserId(params = []) {
    return query('DELETE FROM tokens_recuperacao_palavra_passe WHERE id_utilizador = $1', params);
  },
  findPasswordResetTokens(params = []) {
    return query(
      `INSERT INTO tokens_recuperacao_palavra_passe (id, id_utilizador, hash_token, expira_em, criado_em)
       VALUES ($1, $2, $3, $4, $5)`,
      params,
    );
  },
  findPasswordResetTokensByTokenHash(params = []) {
    return query('DELETE FROM tokens_recuperacao_palavra_passe WHERE hash_token = $1', params);
  },
  findTokenResultByTokenHash(params = []) {
    return query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1',
      params,
    );
  },
  deleteConsumedByHashToken(params = []) {
    return execute(
      'DELETE FROM tokens_recuperacao_palavra_passe WHERE hash_token = $1 AND expira_em > $2',
      params,
    );
  },
  updateUtilizadoresByHashPalavraPasseAndAtualizadoEmAndId(params = []) {
    return execute(
      'UPDATE utilizadores SET hash_palavra_passe = $1, versao_sessao = versao_sessao + 1, atualizado_em = $2 WHERE id = $3',
      params,
    );
  },
};

module.exports = Profile;
