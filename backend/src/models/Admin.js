const { queryOne, queryAll, execute } = require('../database/connection.js');
const Admin = {
  countActiveUsers() {
    return queryOne('SELECT COUNT(*) AS c FROM utilizadores WHERE esta_suspenso = 0');
  },
  countOpenReports() {
    return queryOne("SELECT COUNT(*) AS c FROM denuncias WHERE estado = 'OPEN'");
  },
  countUsers(params = []) {
    return queryOne('SELECT COUNT(*) as c FROM users', params);
  },
  countCourses(params = []) {
    return queryOne('SELECT COUNT(*) as c FROM courses', params);
  },
  countSpaces(params = []) {
    return queryOne('SELECT COUNT(*) as c FROM spaces', params);
  },
  countEnrollments(params = []) {
    return queryOne('SELECT COUNT(*) as c FROM enrollments', params);
  },
  countCreatorApplications(params = []) {
    return queryOne(
      "SELECT COUNT(*) as c FROM creator_applications WHERE status = 'PENDING'",
      params,
    );
  },
  countCoursesForGetAdminStats(params = []) {
    return queryOne(
      'SELECT COUNT(*) as c FROM courses WHERE "approvalStatus" = \'PENDING\'',
      params,
    );
  },
  countUsersForGetAdminUsers(params = []) {
    return queryAll(
      `SELECT id, name, username, email, role, "avatarUrl", "isSuspended", "createdAt",
             (SELECT COUNT(*) FROM enrollments WHERE "userId" = users.id) as "enrollmentsCount",
             (SELECT COUNT(*) FROM courses WHERE "creatorId" = users.id) as "createdCoursesCount"
      FROM users
      ORDER BY "createdAt" DESC`,
      params,
    );
  },
  findTargetUserById(params = []) {
    return queryOne('SELECT role, "isSuspended" FROM users WHERE id = $1', params);
  },
  updateUtilizadoresByEstaSuspensoAndId(params = []) {
    return execute(
      'UPDATE utilizadores SET esta_suspenso = $1, versao_sessao = versao_sessao + 1 WHERE id = $2',
      params,
    );
  },
  listApplications(params = []) {
    return queryAll(
      `SELECT ca.*,
             u.name as user_name, u.email as user_email, u.username as user_username, u."avatarUrl" as "user_avatarUrl", u.role as user_role
      FROM creator_applications ca
      JOIN users u ON ca."userId" = u.id
      ORDER BY CASE WHEN ca.status = 'PENDING' THEN 0 ELSE 1 END, ca."createdAt" DESC`,
      params,
    );
  },
  findApplicationById(params = []) {
    return queryOne('SELECT * FROM creator_applications WHERE id = $1', params);
  },
  updateCreatorApplicationsByReviewedByAndReviewedAtAndUpdatedAtAndId(params = []) {
    return execute(
      "UPDATE candidaturas_criador SET estado = 'APPROVED', revisto_por = $1, revisto_em = $2, atualizado_em = $3 WHERE id = $4",
      params,
    );
  },
  updateUsersByUpdatedAtAndId(params = []) {
    return execute(
      "UPDATE utilizadores SET papel = CASE WHEN papel = 'ADMIN' THEN papel ELSE 'CREATOR' END, atualizado_em = $1 WHERE id = $2",
      params,
    );
  },
  insertNotifications(params = []) {
    return execute(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'achievement', 'Candidatura a Criador Aprovada!', 'Parabéns! A sua candidatura foi aprovada. Já tem acesso ao Estúdio do Criador.', '/creator', 0, $3)",
      params,
    );
  },
  rejectCreatorApplication(params = []) {
    return execute(
      "UPDATE candidaturas_criador SET estado = 'REJECTED', parecer_admin = $1, revisto_por = $2, revisto_em = $3, atualizado_em = $4 WHERE id = $5",
      params,
    );
  },
  insertNotificationsForLookup(params = []) {
    return execute(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'system', 'Atualização da Candidatura a Criador', $3, '/creator/apply', 0, $4)",
      params,
    );
  },
  search(filters = {}) {
    const { status } = filters;
    let sql = `SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.email as creator_email, u."avatarUrl" as "creator_avatarUrl",
             (SELECT COUNT(*) FROM course_modules WHERE "courseId" = c.id) as "modulesCount",
             (SELECT COUNT(*) FROM enrollments WHERE "courseId" = c.id) as "studentsCount"
      FROM courses c
      JOIN users u ON c."creatorId" = u.id`;
    const params = [];
    if (status && status !== 'all') {
      sql += ` WHERE c."approvalStatus" = $1`;
      params.push(status);
    }
    sql += ` ORDER BY CASE WHEN c."approvalStatus" = 'PENDING' THEN 0 ELSE 1 END, c."createdAt" DESC`;
    return queryAll(sql, params);
  },
  findCourseById(params = []) {
    return queryOne('SELECT * FROM courses WHERE id = $1', params);
  },
  updateCoursesByReviewedAtAndUpdatedAtAndId(params = []) {
    return execute(
      "UPDATE cursos SET estado_aprovacao = 'APPROVED', e_publicado = 1, notas_admin = 'Aprovado pelo Administrador', revisto_em = $1, atualizado_em = $2 WHERE id = $3",
      params,
    );
  },
  createCourseApprovalNotification(params = []) {
    return execute(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'achievement', 'Curso Aprovado e Publicado!', $3, $4, 0, $5)",
      params,
    );
  },
  updateCoursesByAdminNotesAndReviewedAtAndUpdatedAtAndId(params = []) {
    return execute(
      "UPDATE cursos SET estado_aprovacao = 'REJECTED', e_publicado = 0, notas_admin = $1, revisto_em = $2, atualizado_em = $3 WHERE id = $4",
      params,
    );
  },
  createCourseRejectionNotification(params = []) {
    return execute(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'system', 'Curso Requer Revisão', $3, '/creator', 0, $4)",
      params,
    );
  },
  listDenuncias(params = []) {
    return queryAll(
      'SELECT d.*, u.name AS "reporterName" FROM denuncias d JOIN users u ON u.id = d.id_utilizador ORDER BY d.criado_em DESC LIMIT 200',
      params,
    );
  },
  findDenunciasById(params = []) {
    return queryOne('SELECT id FROM denuncias WHERE id = $1', params);
  },
  updateDenunciasByEstadoAndParecerAndAtualizadoEmAndId(params = []) {
    return execute(
      'UPDATE denuncias SET estado = $1, parecer = $2, atualizado_em = $3 WHERE id = $4',
      params,
    );
  },
};
module.exports = Admin;
