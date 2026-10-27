const { aliasesParaCategoria } = require('../utilitarios/categoriasCurso');
const { consultarTodos, consultarUm, executar } = require('../base-dados/ligacao.js');
const Curso = {
  procurarCertificadoPorUtilizadorAndCurso(parametros = []) {
    return consultarUm(
      'SELECT id, "idCredencial", "emitidoEm" FROM consulta_certificados WHERE "idUtilizador" = $1 AND "idCurso" = $2',
      parametros,
    );
  },
  listarInscricoesPorUtilizadorId(parametros = []) {
    return consultarTodos(
      `SELECT DISTINCT 
              c.id as course_id, c.title, c.slug, c.description, c.category, c.difficulty, c."urlMiniatura", c."urlCapa", c.price, c."eGratuito", c."duracaoHoras", c.language, c."idFormador", c."idEspaco",
              e.id as enrollment_id, e."idUtilizador" as "enrollment_userId", e."inscritoEm", e."concluidoEm", e."percentagemProgresso", e."idUltimaAula", e."estaOculto",
              u.id as creator_id, u.name as creator_name, u.username as creator_username, u."urlAvatar" as "creator_avatarUrl"
       FROM consulta_inscricoes e
       JOIN consulta_cursos c ON e."idCurso" = c.id
       LEFT JOIN consulta_utilizadores u ON c."idFormador" = u.id
       WHERE e."idUtilizador" = $1
       ORDER BY e."inscritoEm" DESC`,
      parametros,
    );
  },
  listarModulosPorCursoId(parametros = []) {
    return consultarTodos(
      `SELECT m.id, m.title, m.description, m."indiceOrdem"
         FROM consulta_modulos_curso m
         WHERE m."idCurso" = $1
         ORDER BY m."indiceOrdem" ASC`,
      parametros,
    );
  },
  listarAulasPorModuloId(parametros = []) {
    return consultarTodos(
      'SELECT id, title, "duracaoMinutos", type, "indiceOrdem" FROM consulta_aulas WHERE "idModulo" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  listarAulaProgressoPorInscricaoId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_progresso_aulas WHERE "idInscricao" = $1',
      parametros,
    );
  },
  procurarInscricaoPorUtilizadorIdAndCursoIdAndSlug(parametros = []) {
    return consultarUm(
      'SELECT * FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND ("idCurso" = $2 OR "idCurso" IN (SELECT id FROM consulta_cursos WHERE slug = $3))',
      parametros,
    );
  },
  atualizarInscricoesPorIsOcultoAndId(parametros = []) {
    return executar('UPDATE inscricoes SET esta_oculto = $1 WHERE id = $2', parametros);
  },
  pesquisar(filtros = {}) {
    const {
      search: pesquisar,
      category: categoria,
      difficulty: dificuldade,
      eGratuito: isGratuito,
      sort,
    } = filtros;
    let sql = `SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.username as creator_username, u."urlAvatar" as "creator_avatarUrl",
             (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idCurso" = c.id) as "studentsCount",
             (SELECT COUNT(*) FROM consulta_modulos_curso WHERE "idCurso" = c.id) as "modulesCount",
             (SELECT COUNT(*) FROM consulta_canais WHERE "idEspaco" = c."idEspaco") as "channelsCount",
             (SELECT COUNT(*) FROM consulta_avaliacoes WHERE "idCurso" = c.id) as "reviewsCount",
             COALESCE((SELECT ROUND(AVG(rating), 1) FROM consulta_avaliacoes WHERE "idCurso" = c.id), 0.0) as "averageRating"
      FROM consulta_cursos c
      JOIN consulta_utilizadores u ON c."idFormador" = u.id
      WHERE c."estaPublicado" = 1 AND (c."estadoAprovacao" = 'APPROVED' OR c."estadoAprovacao" IS NULL)`;
    const parametros = [];
    if (pesquisar) {
      sql += ` AND (c.title LIKE $1 OR c.description LIKE $2)`;
      parametros.push(`%${pesquisar}%`, `%${pesquisar}%`);
    }

    if (categoria && categoria !== 'all') {
      parametros.push(aliasesParaCategoria(categoria));
      sql += ` AND LOWER(c.category) = ANY($${parametros.length}::text[])`;
    }

    if (dificuldade && dificuldade !== 'all') {
      sql += ` AND c.difficulty = $${parametros.length + 1}`;
      parametros.push(dificuldade);
    }

    if (isGratuito === 'true') {
      sql += ` AND c."eGratuito" = 1`;
    } else if (isGratuito === 'false') {
      sql += ` AND c."eGratuito" = 0`;
    }

    if (sort === 'popular') sql += ` ORDER BY "studentsCount" DESC`;
    else if (sort === 'price-low') sql += ` ORDER BY c.price ASC`;
    else if (sort === 'price-high') sql += ` ORDER BY c.price DESC`;
    else sql += ` ORDER BY c."criadoEm" DESC`;

    return consultarTodos(sql, parametros);
  },
  procurarInscricoesPorUtilizadorIdAndCursoId(parametros = []) {
    return consultarUm(
      'SELECT "percentagemProgresso", "concluidoEm" FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND "idCurso" = $2',
      parametros,
    );
  },
  contarCursoPorIdAndSlugAndEspacoId(parametros = []) {
    return consultarUm(
      `SELECT c.*,
              u.id as creator_id, u.name as creator_name, u.username as creator_username, u."urlAvatar" as "creator_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as creator_bio,
              (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idCurso" = c.id) as "studentsCount"
       FROM consulta_cursos c
       LEFT JOIN consulta_utilizadores u ON c."idFormador" = u.id
       WHERE c.id = $1 OR c.slug = $2 OR c."idEspaco" = $3 OR LOWER(c.id) = LOWER($4) OR LOWER(c.slug) = LOWER($5)`,
      parametros,
    );
  },
  procurarEspacosPorIdAndSlug(parametros = []) {
    return consultarUm(
      `SELECT s.*,
                u.id as owner_id, u.name as owner_name, u.username as owner_username, u."urlAvatar" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio
         FROM consulta_espacos s
         LEFT JOIN consulta_utilizadores u ON s."idProprietario" = u.id
         WHERE s.id = $1 OR s.slug = $2 OR LOWER(s.id) = LOWER($3) OR LOWER(s.slug) = LOWER($4)`,
      parametros,
    );
  },
  contarAssociadoCursoPorEspacoIdAndId(parametros = []) {
    return consultarUm(
      `SELECT c.*,
                  u.id as creator_id, u.name as creator_name, u.username as creator_username, u."urlAvatar" as "creator_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as creator_bio,
                  (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idCurso" = c.id) as "studentsCount"
           FROM consulta_cursos c
           LEFT JOIN consulta_utilizadores u ON c."idFormador" = u.id
           WHERE c."idEspaco" = $1 OR c.id = $2`,
      parametros,
    );
  },
  procurarCursoColaboradoresPorCursoIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_colaboradores_curso WHERE "idCurso" = $1 AND "idUtilizador" = $2',
      parametros,
    );
  },
  listarModulosPorCursoIdParaObterCursoPorId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_modulos_curso WHERE "idCurso" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  listarAulasPorModuloIdParaAulas(parametros = []) {
    return consultarTodos(
      `SELECT l.*, q.id as quiz_id, q.title as quiz_title, q."recompensaExperiencia" as "quiz_xpReward"
         FROM consulta_aulas l
         LEFT JOIN consulta_questionarios q ON q."idAula" = l.id
         WHERE l."idModulo" = $1
         ORDER BY l."indiceOrdem" ASC`,
      parametros,
    );
  },
  listarPerguntasPorQuestionarioId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_perguntas_questionario WHERE "idQuestionario" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  procurarOutroCursoComMesmoEspacoPorEspacoId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_cursos WHERE "idEspaco" = $1 AND id != $2 LIMIT 1',
      parametros,
    );
  },
  procurarEspacoRegistoPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_espacos WHERE id = $1', parametros);
  },
  listarCanaisPorEspacoId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_canais WHERE "idEspaco" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  listarMembrosPorEspacoId(parametros = []) {
    return consultarTodos(
      `SELECT m.*, u.name, u.username, u."urlAvatar", u.role
           FROM consulta_membros_espacos m
           JOIN consulta_utilizadores u ON m."idUtilizador" = u.id
           WHERE m."idEspaco" = $1
           LIMIT 20`,
      parametros,
    );
  },
  procurarInscricaoRegistoPorUtilizadorIdAndCursoId(parametros = []) {
    return consultarUm(
      'SELECT * FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND "idCurso" = $2',
      parametros,
    );
  },
  listarAulaProgressoPorInscricaoIdParaObterCursoPorId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_progresso_aulas WHERE "idInscricao" = $1',
      parametros,
    );
  },
  listarColegasPorCursoIdAndEspacoId(parametros = []) {
    return consultarTodos(
      `SELECT u.id, u.name, u.username, u."urlAvatar", u.role
       FROM (
         SELECT "idUtilizador" FROM consulta_inscricoes WHERE "idCurso" = $1
         UNION
         SELECT "idUtilizador" FROM consulta_membros_espacos WHERE "idEspaco" = $2
       ) t
       JOIN consulta_utilizadores u ON t."idUtilizador" = u.id
       WHERE u.id != $3
       ORDER BY (CASE WHEN u.role = 'CREATOR' THEN 0 ELSE 1 END), u.name ASC
       LIMIT 50`,
      parametros,
    );
  },
  listarAvaliacoesRegistosPorCursoId(parametros = []) {
    return consultarTodos(
      `SELECT r.*, u.name as user_name, u.username as user_username, u."urlAvatar" as "user_avatarUrl"
         FROM consulta_avaliacoes r
         JOIN consulta_utilizadores u ON r."idUtilizador" = u.id
         WHERE r."idCurso" = $1
         ORDER BY r."criadoEm" DESC`,
      parametros,
    );
  },
  procurarCursoPorIdAndSlug(parametros = []) {
    return consultarUm(
      'SELECT id, "idFormador", "idEspaco" FROM consulta_cursos WHERE id = $1 OR slug = $2',
      parametros,
    );
  },
  listarColegasPorCursoIdAndEspacoIdParaObterCursoPorIdColegas(parametros = []) {
    return consultarTodos(
      `SELECT DISTINCT u.id, u.name, u.username, u."urlAvatar", u.role,
              COALESCE(e."percentagemProgresso", 0) as "percentagemProgresso"
       FROM (
         SELECT "idUtilizador" FROM consulta_inscricoes WHERE "idCurso" = $1
         UNION
         SELECT "idUtilizador" FROM consulta_membros_espacos WHERE "idEspaco" = $2
       ) t
       JOIN consulta_utilizadores u ON t."idUtilizador" = u.id
       LEFT JOIN consulta_inscricoes e ON e."idUtilizador" = u.id AND e."idCurso" = $3
       WHERE u.id != $4
       ORDER BY u.name ASC
       LIMIT 50`,
      parametros,
    );
  },
  procurarCursoPorIdAndSlugAndEspacoId(parametros = []) {
    return consultarUm(
      'SELECT id, title, "idEspaco", "estaPublicado", "estadoAprovacao", "idFormador", price, "eGratuito" FROM consulta_cursos WHERE id = $1 OR slug = $2 OR "idEspaco" = $3 OR LOWER(id) = LOWER($4) OR LOWER(slug) = LOWER($5)',
      parametros,
    );
  },
  inserirInscricoes(parametros = []) {
    return executar(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0)',
      parametros,
    );
  },
  procurarMemExistsPorUtilizadorIdAndEspacoId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_membros_espacos WHERE "idUtilizador" = $1 AND "idEspaco" = $2',
      parametros,
    );
  },
  inserirAdesoes(parametros = []) {
    return executar(
      "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'MEMBER', $4)",
      parametros,
    );
  },
  inserirNotificacoes(parametros = []) {
    return executar(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'course_update', $3, $4, $5, 0, $6)",
      parametros,
    );
  },
  procurarNovoInscricaoPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_inscricoes WHERE id = $1', parametros);
  },
  procurarCursoPorIdAndSlugParaEnviarCursoPorCursoIdAvaliacoes(parametros = []) {
    return consultarUm(
      'SELECT id, "idFormador" FROM consulta_cursos WHERE id = $1 OR slug = $2',
      parametros,
    );
  },
  procurarInscricoesPorUtilizadorIdAndCursoIdParaEnviarCursoPorCursoIdAvaliacoes(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_inscricoes WHERE "idUtilizador" = $1 AND "idCurso" = $2',
      parametros,
    );
  },
  procurarExistenteReverPorCursoIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_avaliacoes WHERE "idCurso" = $1 AND "idUtilizador" = $2',
      parametros,
    );
  },
  atualizarAvaliacoesPorClassificacaoAndComentarioAndId(parametros = []) {
    return executar(
      'UPDATE avaliacoes SET classificacao = $1, comentario = $2 WHERE id = $3',
      parametros,
    );
  },
  inserirAvaliacoes(parametros = []) {
    return executar(
      `INSERT INTO avaliacoes (id, id_curso, id_utilizador, classificacao, comentario, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      parametros,
    );
  },
};

module.exports = Curso;
