const { queryOne, execute, queryAll } = require('../database/connection.js');
const Creator = {
  sumApprovedRevenueByCreatorId(params = []) {
    return queryOne(
      `SELECT COALESCE(SUM(p.montante_centimos), 0) AS "totalRevenueCents"
       FROM simulacoes_pagamento p
       JOIN cursos c ON c.id = p.id_curso
       WHERE c.id_criador = $1 AND p.estado = 'approved'`,
      params,
    );
  },
  findApplicationByUserId(params = []) {
    return queryOne(
      'SELECT * FROM creator_applications WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
      params,
    );
  },
  findExistingPendingByUserId(params = []) {
    return queryOne(
      'SELECT id FROM creator_applications WHERE "userId" = $1 AND status = \'PENDING\'',
      params,
    );
  },
  insertCreatorApplications(params = []) {
    return execute(
      `INSERT INTO candidaturas_criador (id, id_utilizador, nome_completo, biografia, especialidade, anos_experiencia, url_portfolio, motivacao, cursos_propostos, url_video_amostra, estado, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11, $12)`,
      params,
    );
  },
  listAdmins(params = []) {
    return queryAll("SELECT id FROM users WHERE role = 'ADMIN'", params);
  },
  insertNotifications(params = []) {
    return execute(
      `INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
        VALUES ($1, $2, 'admin', 'Nova Candidatura a Formador', $3, '/admin', 0, $4)`,
      params,
    );
  },
  findApplicationById(params = []) {
    return queryOne('SELECT * FROM creator_applications WHERE id = $1', params);
  },
  countCoursesByCreatorId(params = []) {
    return queryAll(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE "courseId" = c.id AND "userId" != $1 AND "userId" != COALESCE(c."creatorId", '')) as "studentsCount"
       FROM courses c
      WHERE c."creatorId" = $2`,
      params,
    );
  },
  listRecentEnrollmentsByCreatorId(params = []) {
    return queryAll(
      `SELECT e.*, u.id as user_id, u.name, u.username, u."avatarUrl", u.email, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e."courseId" = c.id
       JOIN users u ON e."userId" = u.id
       WHERE c."creatorId" = $1 AND e."userId" != $2
       ORDER BY e."enrolledAt" DESC
       LIMIT 6`,
      params,
    );
  },
  countEnrollmentsByCreatorId(params = []) {
    return queryOne(
      'SELECT COUNT(*) as c FROM enrollments e JOIN courses c ON e."courseId" = c.id WHERE c."creatorId" = $1 AND e."userId" != $2 AND e."progressPercent" >= 100',
      params,
    );
  },
  findRatingRowByCreatorId(params = []) {
    return queryOne(
      'SELECT AVG(r.rating) as "avgRating" FROM reviews r JOIN courses c ON r."courseId" = c.id WHERE c."creatorId" = $1',
      params,
    );
  },
  findQuizRowByCreatorId(params = []) {
    return queryOne(
      'SELECT AVG(qa.nota) as "avgScore" FROM submissoes_questionario qa JOIN lessons l ON qa.id_aula = l.id JOIN course_modules cm ON l."moduleId" = cm.id JOIN courses c ON cm."courseId" = c.id WHERE c."creatorId" = $1 AND qa.pendente = 0',
      params,
    );
  },
  countCourseByIdAndCreatorIdAndIdUtilizador(params = []) {
    return queryOne(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE "courseId" = c.id) as "studentsCount",
              (SELECT COUNT(*) FROM course_modules WHERE "courseId" = c.id) as "modulesCount"
       FROM courses c
       WHERE c.id = $1 AND (c."creatorId" = $2 OR $3 = 'ADMIN' OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = c.id AND id_utilizador = $4))`,
      params,
    );
  },
  listModulesByCourseId(params = []) {
    return queryAll(
      'SELECT * FROM course_modules WHERE "courseId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  listLessonsByModuleId(params = []) {
    return queryAll(
      'SELECT * FROM lessons WHERE "moduleId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  findQByLessonId(params = []) {
    return queryOne('SELECT * FROM quizzes WHERE "lessonId" = $1', params);
  },
  listQuestionsByQuizId(params = []) {
    return queryAll(
      'SELECT * FROM quiz_questions WHERE "quizId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  listChannelsBySpaceId(params = []) {
    return queryAll(
      'SELECT * FROM channels WHERE "spaceId" = $1 ORDER BY "orderIndex" ASC',
      params,
    );
  },
  deleteChannelByIdAndSpaceId(params = []) {
    return execute('DELETE FROM canais WHERE id = $1 AND id_espaco = $2', params);
  },
  findCoursesByIdAndCreatorIdAndIdCursoAndIdUtilizador(params = []) {
    return queryOne(
      'SELECT * FROM courses WHERE id = $1 AND ("creatorId" = $2 OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = $3 AND id_utilizador = $4))',
      params,
    );
  },
  findCoursesById(params = []) {
    return queryOne('SELECT * FROM courses WHERE id = $1', params);
  },
  updateCourseDetails(preserveApproval, params = []) {
    return execute(
      `UPDATE cursos SET
          titulo = COALESCE($1, titulo),
          descricao = COALESCE($2, descricao),
          categoria = COALESCE($3, categoria),
          dificuldade = COALESCE($4, dificuldade),
          idioma = COALESCE($5, idioma),
          preco = $6,
          e_gratuito = $7,
          e_publicado = COALESCE($8, e_publicado),
          estado_aprovacao = CASE WHEN $22 THEN estado_aprovacao ELSE 'DRAFT' END,
          url_miniatura = COALESCE($9, url_miniatura),
          posicao_miniatura = COALESCE($10, posicao_miniatura),
          url_banner = COALESCE($11, url_banner),
          posicao_banner = COALESCE($12, posicao_banner),
          duracao_horas = $13,
          modo_chamada_padrao = COALESCE($14, modo_chamada_padrao),
          permitir_partilha_ecra_aluno = $15,
          permitir_camara_aluno = $16,
          resultados_aprendizagem = COALESCE($17, resultados_aprendizagem),
          requisitos = COALESCE($18, requisitos),
          documentos = COALESCE($19, documentos),
          atualizado_em = $20
         WHERE id = $21`,
      [...params, preserveApproval],
    );
  },
  updateSpacesByNameAndDescriptionAndId(params = []) {
    return execute('UPDATE espacos SET nome = $1, descricao = $2 WHERE id = $3', params);
  },
  listExistingModulesByCourseId(params = []) {
    return queryAll('SELECT id FROM course_modules WHERE "courseId" = $1', params);
  },
  listExLessonsByModuleId(params = []) {
    return queryAll('SELECT id FROM lessons WHERE "moduleId" = $1', params);
  },
  deleteQuizQuestionsByLessonId(params = []) {
    return execute(
      'DELETE FROM perguntas_quiz WHERE id_quiz IN (SELECT id FROM quizzes WHERE "lessonId" = $1)',
      params,
    );
  },
  deleteQuizzesByLessonId(params = []) {
    return execute('DELETE FROM questionarios WHERE id_aula = $1', params);
  },
  deleteLessonProgressByLessonId(params = []) {
    return execute('DELETE FROM progresso_aulas WHERE id_aula = $1', params);
  },
  deleteNotesByLessonId(params = []) {
    return execute('DELETE FROM notas WHERE id_aula = $1', params);
  },
  deleteLessonsByModuleId(params = []) {
    return execute('DELETE FROM aulas WHERE id_modulo = $1', params);
  },
  deleteCourseModulesById(params = []) {
    return execute('DELETE FROM modulos_curso WHERE id = $1', params);
  },
  findCourseModulesByIdAndCourseId(params = []) {
    return queryOne('SELECT id FROM course_modules WHERE id = $1 AND "courseId" = $2', params);
  },
  updateModule(params = []) {
    return execute(
      'UPDATE modulos_curso SET titulo = $1, descricao = $2, indice_ordem = $3, modo_desbloqueio = $4 WHERE id = $5 AND id_curso = $6',
      params,
    );
  },
  findCourseModulesById(params = []) {
    return queryOne('SELECT id FROM course_modules WHERE id = $1', params);
  },
  insertCourseModules(params = []) {
    return execute(
      'INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem, modo_desbloqueio) VALUES ($1, $2, $3, $4, $5, $6)',
      params,
    );
  },
  deleteLessonsById(params = []) {
    return execute('DELETE FROM aulas WHERE id = $1', params);
  },
  findLessonsByIdAndModuleId(params = []) {
    return queryOne('SELECT id FROM lessons WHERE id = $1 AND "moduleId" = $2', params);
  },
  updateLesson(params = []) {
    return execute(
      'UPDATE aulas SET titulo = $1, tipo = $2, conteudo = $3, url_video = $4, duracao_minutos = $5, indice_ordem = $6, recompensa_xp = $7 WHERE id = $8 AND id_modulo = $9',
      params,
    );
  },
  findLessonsById(params = []) {
    return queryOne('SELECT id FROM lessons WHERE id = $1', params);
  },
  insertLessons(params = []) {
    return execute(
      'INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      params,
    );
  },
  findQExistsByLessonId(params = []) {
    return queryOne('SELECT id FROM quizzes WHERE "lessonId" = $1', params);
  },
  updateQuizzesByTitleAndDescriptionAndPassingScoreAndXpRewardAndId(params = []) {
    return execute(
      'UPDATE questionarios SET titulo = $1, descricao = $2, pontuacao_aprovacao = $3, recompensa_xp = $4 WHERE id = $5',
      params,
    );
  },
  deleteQuizQuestionsByQuizId(params = []) {
    return execute('DELETE FROM perguntas_quiz WHERE id_quiz = $1', params);
  },
  insertQuizzes(params = []) {
    return execute(
      'INSERT INTO questionarios (id, id_aula, titulo, descricao, pontuacao_aprovacao, recompensa_xp) VALUES ($1, $2, $3, $4, $5, $6)',
      params,
    );
  },
  insertQuizQuestions(params = []) {
    return execute(
      'INSERT INTO perguntas_quiz (id, id_quiz, pergunta, opcoes, indice_opcao_correta, explicacao, indice_ordem) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      params,
    );
  },
  findChannelsByIdAndSpaceId(params = []) {
    return queryOne('SELECT id FROM channels WHERE id = $1 AND "spaceId" = $2', params);
  },
  updateChannelSettings(params = []) {
    return execute(
      'UPDATE canais SET nome = $1, tipo = $2, topico = $3, indice_ordem = $4, e_voz = $5, modo_acesso = $6, modo_voz = $7 WHERE id = $8',
      params,
    );
  },
  insertChannels(params = []) {
    return execute(
      'INSERT INTO canais (id, id_espaco, nome, tipo, topico, indice_ordem, e_voz, esta_bloqueado, questao_orientadora, diretrizes, modo_acesso, modo_voz) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)',
      params,
    );
  },
  countCoursesByCreatorIdAndIdUtilizador(params = []) {
    return queryAll(
      `SELECT c.*,
              (SELECT COUNT(*) FROM enrollments WHERE "courseId" = c.id) as "studentsCount",
              (SELECT COUNT(*) FROM course_modules WHERE "courseId" = c.id) as "modulesCount",
              (SELECT COUNT(*) FROM reviews WHERE "courseId" = c.id) as "reviewsCount",
              CASE WHEN c."creatorId" = $1 THEN 1 ELSE 0 END as "isOwner"
       FROM courses c
       WHERE c."creatorId" = $2
          OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = c.id AND id_utilizador = $3)
       ORDER BY c."createdAt" DESC`,
      params,
    );
  },
  findCourseById(params = []) {
    return queryOne(
      `SELECT c.id, c."creatorId", c."spaceId", s."ownerId" AS "spaceOwnerId"
      FROM courses c
      LEFT JOIN spaces s ON s.id = c."spaceId"
      WHERE c.id = $1`,
      params,
    );
  },
  findCoursesBySpaceId(params = []) {
    return queryOne('SELECT id FROM courses WHERE "spaceId" = $1 AND id != $2 LIMIT 1', params);
  },
  deleteCoursesById(params = []) {
    return execute('DELETE FROM cursos WHERE id = $1', params);
  },
  deleteSpacesByIdAndOwnerId(params = []) {
    return execute('DELETE FROM espacos WHERE id = $1 AND id_proprietario = $2', params);
  },
  findSpaceById(params = []) {
    return queryOne('SELECT "ownerId" FROM spaces WHERE id = $1', params);
  },
  findCoursesBySpaceIdForPostCreatorCourses(params = []) {
    return queryOne('SELECT id FROM courses WHERE "spaceId" = $1', params);
  },
  insertSpaces(params = []) {
    return execute(
      `INSERT INTO espacos (id, nome, slug, descricao, url_icone, url_banner, e_privado, categoria, id_proprietario, total_membros, criado_em)
           VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, 1, $9)`,
      params,
    );
  },
  insertMemberships(params = []) {
    return execute(
      "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'OWNER', $4)",
      params,
    );
  },
  insertChannelsForLookup(params = []) {
    return execute(
      `INSERT INTO canais (id, id_espaco, nome, tipo, topico, indice_ordem, e_voz, esta_bloqueado, questao_orientadora, diretrizes, modo_acesso, modo_voz)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)`,
      params,
    );
  },
  insertCourses(params = []) {
    return execute(
      `INSERT INTO cursos (id, titulo, slug, descricao, categoria, dificuldade, url_miniatura, posicao_miniatura, url_banner, posicao_banner, preco, e_gratuito, e_publicado, estado_aprovacao, notas_admin, submetido_para_revisao_em, destaque, duracao_horas, idioma, id_criador, id_espaco, modo_chamada_padrao, permitir_partilha_ecra_aluno, permitir_camara_aluno, resultados_aprendizagem, requisitos, documentos, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NULL, $15, 0, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`,
      params,
    );
  },
  insertCourseModulesForLookup(params = []) {
    return execute(
      'INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem, modo_desbloqueio) VALUES ($1, $2, $3, $4, $5, $6)',
      params,
    );
  },
  insertLessonsForLookup(params = []) {
    return execute(
      `INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      params,
    );
  },
  insertQuizzesForLookup(params = []) {
    return execute(
      `INSERT INTO questionarios (id, id_aula, titulo, descricao, pontuacao_aprovacao, recompensa_xp)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
      params,
    );
  },
  insertQuizQuestionsForLookup(params = []) {
    return execute(
      `INSERT INTO perguntas_quiz (id, id_quiz, pergunta, opcoes, indice_opcao_correta, explicacao, indice_ordem)
                       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      params,
    );
  },
  insertEnrollments(params = []) {
    return execute(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0) ON CONFLICT DO NOTHING',
      params,
    );
  },
  listMembersByCreatorIdAndUserId(params = []) {
    return queryAll(
      `SELECT e.id, e."userId", e."courseId", e."enrolledAt", e."progressPercent",
              u.id as user_id, u.name, u.username, u."avatarUrl", u.email,
              c.id as course_id, c.title as course_title,
              s.name as space_name,
              CASE WHEN col."userId" IS NOT NULL THEN 'COLABORADOR' ELSE 'ALUNO' END as member_type
       FROM enrollments e
       JOIN courses c ON e."courseId" = c.id
       JOIN users u ON e."userId" = u.id
       LEFT JOIN spaces s ON c."spaceId" = s.id
       LEFT JOIN course_collaborators col ON col."courseId" = c.id AND col."userId" = u.id
       WHERE (c."creatorId" = $1 OR c.id IN (SELECT "courseId" FROM course_collaborators WHERE "userId" = $2)) AND e."userId" != $3
       ORDER BY e."enrolledAt" DESC`,
      params,
    );
  },
  findAccessByIdAndCreatorIdAndUserId(params = []) {
    return queryOne(
      'SELECT id FROM courses WHERE id = $1 AND ("creatorId" = $2 OR id IN (SELECT "courseId" FROM course_collaborators WHERE "userId" = $3))',
      params,
    );
  },
  listCollaboratorsByCourseId(params = []) {
    return queryAll(
      `SELECT cc.id, cc."courseId", cc."userId", cc."createdAt",
             u.name, u.username, u.email, u."avatarUrl"
      FROM course_collaborators cc
      JOIN users u ON cc."userId" = u.id
      WHERE cc."courseId" = $1
      ORDER BY cc."createdAt" ASC`,
      params,
    );
  },
  findCourseByIdForPostCreatorCoursesByCourseIdCollaborators(params = []) {
    return queryOne('SELECT id, title, "creatorId" FROM courses WHERE id = $1', params);
  },
  findTargetUser(params = []) {
    return queryOne(
      `SELECT id, name, username, email, "avatarUrl", role 
      FROM users 
      WHERE LOWER(email) = $1 OR LOWER(username) = $2`,
      params,
    );
  },
  findExistingByCourseIdAndUserId(params = []) {
    return queryOne(
      'SELECT id FROM course_collaborators WHERE "courseId" = $1 AND "userId" = $2',
      params,
    );
  },
  insertCourseCollaborators(params = []) {
    return execute(
      'INSERT INTO colaboradores_curso (id, id_curso, id_utilizador, criado_em) VALUES ($1, $2, $3, $4)',
      params,
    );
  },
  findEnrolledByCourseIdAndUserId(params = []) {
    return queryOne('SELECT id FROM enrollments WHERE "courseId" = $1 AND "userId" = $2', params);
  },
  insertEnrollmentsForPostCreatorCoursesByCourseIdCollaborators(params = []) {
    return execute(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, percentagem_progresso, inscrito_em) VALUES ($1, $2, $3, 100, $4)',
      params,
    );
  },
  insertNotificationsForPostCreatorCoursesByCourseIdCollaborators(params = []) {
    return execute(
      `INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
      VALUES ($1, $2, 'course', 'Adicionado como Colaborador', $3, $4, 0, $5)`,
      params,
    );
  },
  findCourseForCollaboratorRemoval(params = []) {
    return queryOne('SELECT id, "creatorId" FROM courses WHERE id = $1', params);
  },
  deleteCourseCollaboratorsByCourseIdAndUserId(params = []) {
    return execute(
      'DELETE FROM colaboradores_curso WHERE id_curso = $1 AND id_utilizador = $2',
      params,
    );
  },
  findOwnedByIdAndCreatorIdAndUserId(params = []) {
    return queryOne(
      'SELECT id FROM courses WHERE id = $1 AND ("creatorId" = $2 OR id IN (SELECT "courseId" FROM course_collaborators WHERE "userId" = $3))',
      params,
    );
  },
  deleteEnrollmentsByCourseIdAndUserId(params = []) {
    return execute('DELETE FROM inscricoes WHERE id_curso = $1 AND id_utilizador = $2', params);
  },
  findStudent(params = []) {
    return queryOne(
      'SELECT id FROM users WHERE (LOWER(username) = $1 OR LOWER(email) = $2) AND "isSuspended" = 0',
      params,
    );
  },
  insertEnrollmentsForLookup(params = []) {
    return execute(
      'INSERT INTO inscricoes (id,id_utilizador,id_curso,inscrito_em,percentagem_progresso) VALUES ($1,$2,$3,$4,0)',
      params,
    );
  },
  findMembershipsBySpaceIdAndUserId(params = []) {
    return queryOne('SELECT id FROM memberships WHERE "spaceId" = $1 AND "userId" = $2', params);
  },
  insertMembershipsForLookup(params = []) {
    return execute(
      "INSERT INTO membros_espacos (id,id_utilizador,id_espaco,papel,aderiu_em) VALUES ($1,$2,$3,'MEMBER',$4)",
      params,
    );
  },
  updateCoursesBySubmittedForReviewAtAndUpdatedAtAndId(params = []) {
    return execute(
      `UPDATE cursos 
      SET estado_aprovacao = 'PENDING', e_publicado = 0, submetido_para_revisao_em = $1, atualizado_em = $2
      WHERE id = $3`,
      params,
    );
  },
};
module.exports = Creator;
