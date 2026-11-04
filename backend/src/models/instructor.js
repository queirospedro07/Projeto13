const { consultarUm, executar, consultarTodos } = require('../database/connection.js');
const Formador = {
  somarAprovadoRevenuePorFormadorId(parametros = []) {
    return consultarUm(
      `SELECT COALESCE(SUM(p.montante_centimos), 0) AS "totalRevenueCents"
       FROM simulacoes_pagamento p
       JOIN cursos c ON c.id = p.id_curso
       WHERE c.id_criador = $1 AND p.estado = 'approved'`,
      parametros,
    );
  },
  procurarCandidaturaPorUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT * FROM consulta_candidaturas_formador WHERE "idUtilizador" = $1 ORDER BY "criadoEm" DESC LIMIT 1',
      parametros,
    );
  },
  procurarExistentePendentePorUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_candidaturas_formador WHERE "idUtilizador" = $1 AND status = \'PENDING\'',
      parametros,
    );
  },
  inserirFormadorCandidaturas(parametros = []) {
    return executar(
      `INSERT INTO candidaturas_criador (id, id_utilizador, nome_completo, biografia, especialidade, anos_experiencia, url_portfolio, motivacao, cursos_propostos, url_video_amostra, estado, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11, $12)`,
      parametros,
    );
  },
  listarAdministradores(parametros = []) {
    return consultarTodos("SELECT id FROM consulta_utilizadores WHERE role = 'ADMIN'", parametros);
  },
  inserirNotificacoes(parametros = []) {
    return executar(
      `INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
        VALUES ($1, $2, 'admin', 'Nova Candidatura a Formador', $3, '/administracao', 0, $4)`,
      parametros,
    );
  },
  procurarCandidaturaPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_candidaturas_formador WHERE id = $1', parametros);
  },
  contarCursosPorFormadorId(parametros = []) {
    return consultarTodos(
      `SELECT c.*,
              (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idCurso" = c.id AND "idUtilizador" != $1 AND "idUtilizador" != COALESCE(c."idFormador", '')) as "studentsCount"
       FROM consulta_cursos c
      WHERE c."idFormador" = $2`,
      parametros,
    );
  },
  listarRecentesInscricoesPorFormadorId(parametros = []) {
    return consultarTodos(
      `SELECT e.*, u.id as user_id, u.name, u.username, u."urlAvatar", u.email, c.title as course_title
       FROM consulta_inscricoes e
       JOIN consulta_cursos c ON e."idCurso" = c.id
       JOIN consulta_utilizadores u ON e."idUtilizador" = u.id
       WHERE c."idFormador" = $1 AND e."idUtilizador" != $2
       ORDER BY e."inscritoEm" DESC
       LIMIT 6`,
      parametros,
    );
  },
  contarInscricoesPorFormadorId(parametros = []) {
    return consultarUm(
      'SELECT COUNT(*) as c FROM consulta_inscricoes e JOIN consulta_cursos c ON e."idCurso" = c.id WHERE c."idFormador" = $1 AND e."idUtilizador" != $2 AND e."percentagemProgresso" >= 100',
      parametros,
    );
  },
  procurarClassificacaoRegistoPorFormadorId(parametros = []) {
    return consultarUm(
      'SELECT AVG(r.rating) as "avgRating" FROM consulta_avaliacoes r JOIN consulta_cursos c ON r."idCurso" = c.id WHERE c."idFormador" = $1',
      parametros,
    );
  },
  procurarQuestionarioRegistoPorFormadorId(parametros = []) {
    return consultarUm(
      'SELECT AVG(qa.nota) as "avgScore" FROM submissoes_questionario qa JOIN consulta_aulas l ON qa.id_aula = l.id JOIN consulta_modulos_curso cm ON l."idModulo" = cm.id JOIN consulta_cursos c ON cm."idCurso" = c.id WHERE c."idFormador" = $1 AND qa.pendente = 0',
      parametros,
    );
  },
  contarCursoPorIdAndFormadorIdAndIdUtilizador(parametros = []) {
    return consultarUm(
      `SELECT c.*,
              (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idCurso" = c.id) as "studentsCount",
              (SELECT COUNT(*) FROM consulta_modulos_curso WHERE "idCurso" = c.id) as "modulesCount"
       FROM consulta_cursos c
       WHERE c.id = $1 AND (c."idFormador" = $2 OR $3 = 'ADMIN' OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = c.id AND id_utilizador = $4))`,
      parametros,
    );
  },
  listarModulosPorCursoId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_modulos_curso WHERE "idCurso" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  listarAulasPorModuloId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_aulas WHERE "idModulo" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  procurarQPorAulaId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_questionarios WHERE "idAula" = $1', parametros);
  },
  listarPerguntasPorQuestionarioId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_perguntas_questionario WHERE "idQuestionario" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  listarCanaisPorEspacoId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_canais WHERE "idEspaco" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  eliminarCanalPorIdAndEspacoId(parametros = []) {
    return executar('DELETE FROM canais WHERE id = $1 AND id_espaco = $2', parametros);
  },
  procurarCursosPorIdAndFormadorIdAndIdCursoAndIdUtilizador(parametros = []) {
    return consultarUm(
      'SELECT * FROM consulta_cursos WHERE id = $1 AND ("idFormador" = $2 OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = $3 AND id_utilizador = $4))',
      parametros,
    );
  },
  procurarCursosPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_cursos WHERE id = $1', parametros);
  },
  atualizarCursoDetalhes(preserveAprovacao, parametros = []) {
    return executar(
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
      [...parametros, preserveAprovacao],
    );
  },
  atualizarEspacosPorNomeAndDescricaoAndId(parametros = []) {
    return executar('UPDATE espacos SET nome = $1, descricao = $2 WHERE id = $3', parametros);
  },
  listarExistenteModulosPorCursoId(parametros = []) {
    return consultarTodos('SELECT id FROM consulta_modulos_curso WHERE "idCurso" = $1', parametros);
  },
  listarExAulasPorModuloId(parametros = []) {
    return consultarTodos('SELECT id FROM consulta_aulas WHERE "idModulo" = $1', parametros);
  },
  eliminarQuestionarioPerguntasPorAulaId(parametros = []) {
    return executar(
      'DELETE FROM perguntas_quiz WHERE id_quiz IN (SELECT id FROM consulta_questionarios WHERE "idAula" = $1)',
      parametros,
    );
  },
  eliminarQuestionariosPorAulaId(parametros = []) {
    return executar('DELETE FROM questionarios WHERE id_aula = $1', parametros);
  },
  eliminarAulaProgressoPorAulaId(parametros = []) {
    return executar('DELETE FROM progresso_aulas WHERE id_aula = $1', parametros);
  },
  eliminarNotasPorAulaId(parametros = []) {
    return executar('DELETE FROM notas WHERE id_aula = $1', parametros);
  },
  eliminarAulasPorModuloId(parametros = []) {
    return executar('DELETE FROM aulas WHERE id_modulo = $1', parametros);
  },
  eliminarCursoModulosPorId(parametros = []) {
    return executar('DELETE FROM modulos_curso WHERE id = $1', parametros);
  },
  procurarCursoModulosPorIdAndCursoId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_modulos_curso WHERE id = $1 AND "idCurso" = $2',
      parametros,
    );
  },
  atualizarModulo(parametros = []) {
    return executar(
      'UPDATE modulos_curso SET titulo = $1, descricao = $2, indice_ordem = $3, modo_desbloqueio = $4 WHERE id = $5 AND id_curso = $6',
      parametros,
    );
  },
  procurarCursoModulosPorId(parametros = []) {
    return consultarUm('SELECT id FROM consulta_modulos_curso WHERE id = $1', parametros);
  },
  inserirCursoModulos(parametros = []) {
    return executar(
      'INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem, modo_desbloqueio) VALUES ($1, $2, $3, $4, $5, $6)',
      parametros,
    );
  },
  eliminarAulasPorId(parametros = []) {
    return executar('DELETE FROM aulas WHERE id = $1', parametros);
  },
  procurarAulasPorIdAndModuloId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_aulas WHERE id = $1 AND "idModulo" = $2',
      parametros,
    );
  },
  atualizarAula(parametros = []) {
    return executar(
      'UPDATE aulas SET titulo = $1, tipo = $2, conteudo = $3, url_video = $4, duracao_minutos = $5, indice_ordem = $6, recompensa_xp = $7 WHERE id = $8 AND id_modulo = $9',
      parametros,
    );
  },
  procurarAulasPorId(parametros = []) {
    return consultarUm('SELECT id FROM consulta_aulas WHERE id = $1', parametros);
  },
  inserirAulas(parametros = []) {
    return executar(
      'INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      parametros,
    );
  },
  procurarQExistsPorAulaId(parametros = []) {
    return consultarUm('SELECT id FROM consulta_questionarios WHERE "idAula" = $1', parametros);
  },
  atualizarQuestionariosPorTituloAndDescricaoAndAprovacaoPontuacaoAndExperienciaRewardAndId(
    parametros = [],
  ) {
    return executar(
      'UPDATE questionarios SET titulo = $1, descricao = $2, pontuacao_aprovacao = $3, recompensa_xp = $4 WHERE id = $5',
      parametros,
    );
  },
  eliminarQuestionarioPerguntasPorQuestionarioId(parametros = []) {
    return executar('DELETE FROM perguntas_quiz WHERE id_quiz = $1', parametros);
  },
  inserirQuestionarios(parametros = []) {
    return executar(
      'INSERT INTO questionarios (id, id_aula, titulo, descricao, pontuacao_aprovacao, recompensa_xp) VALUES ($1, $2, $3, $4, $5, $6)',
      parametros,
    );
  },
  inserirQuestionarioPerguntas(parametros = []) {
    return executar(
      'INSERT INTO perguntas_quiz (id, id_quiz, pergunta, opcoes, indice_opcao_correta, explicacao, indice_ordem) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      parametros,
    );
  },
  procurarCanaisPorIdAndEspacoId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_canais WHERE id = $1 AND "idEspaco" = $2',
      parametros,
    );
  },
  atualizarCanalDefinicoes(parametros = []) {
    return executar(
      'UPDATE canais SET nome = $1, tipo = $2, topico = $3, indice_ordem = $4, e_voz = $5, modo_acesso = $6, modo_voz = $7 WHERE id = $8',
      parametros,
    );
  },
  inserirCanais(parametros = []) {
    return executar(
      'INSERT INTO canais (id, id_espaco, nome, tipo, topico, indice_ordem, e_voz, esta_bloqueado, questao_orientadora, diretrizes, modo_acesso, modo_voz) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)',
      parametros,
    );
  },
  contarCursosPorFormadorIdAndIdUtilizador(parametros = []) {
    return consultarTodos(
      `SELECT c.*,
              (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idCurso" = c.id) as "studentsCount",
              (SELECT COUNT(*) FROM consulta_modulos_curso WHERE "idCurso" = c.id) as "modulesCount",
              (SELECT COUNT(*) FROM consulta_avaliacoes WHERE "idCurso" = c.id) as "reviewsCount",
              CASE WHEN c."idFormador" = $1 THEN 1 ELSE 0 END as "isOwner"
       FROM consulta_cursos c
       WHERE c."idFormador" = $2
          OR EXISTS (SELECT 1 FROM colaboradores_curso WHERE id_curso = c.id AND id_utilizador = $3)
       ORDER BY c."criadoEm" DESC`,
      parametros,
    );
  },
  procurarCursoPorId(parametros = []) {
    return consultarUm(
      `SELECT c.id, c."idFormador", c."idEspaco", s."idProprietario" AS "spaceOwnerId"
      FROM consulta_cursos c
      LEFT JOIN consulta_espacos s ON s.id = c."idEspaco"
      WHERE c.id = $1`,
      parametros,
    );
  },
  procurarCursosPorEspacoId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_cursos WHERE "idEspaco" = $1 AND id != $2 LIMIT 1',
      parametros,
    );
  },
  eliminarCursosPorId(parametros = []) {
    return executar('DELETE FROM cursos WHERE id = $1', parametros);
  },
  eliminarEspacosPorIdAndProprietarioId(parametros = []) {
    return executar('DELETE FROM espacos WHERE id = $1 AND id_proprietario = $2', parametros);
  },
  procurarEspacoPorId(parametros = []) {
    return consultarUm('SELECT "idProprietario" FROM consulta_espacos WHERE id = $1', parametros);
  },
  procurarCursosPorEspacoIdParaEnviarFormadorCursos(parametros = []) {
    return consultarUm('SELECT id FROM consulta_cursos WHERE "idEspaco" = $1', parametros);
  },
  inserirEspacos(parametros = []) {
    return executar(
      `INSERT INTO espacos (id, nome, slug, descricao, url_icone, url_banner, e_privado, categoria, id_proprietario, total_membros, criado_em)
           VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, 1, $9)`,
      parametros,
    );
  },
  inserirAdesoes(parametros = []) {
    return executar(
      "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'OWNER', $4)",
      parametros,
    );
  },
  inserirCanaisParaLookup(parametros = []) {
    return executar(
      `INSERT INTO canais (id, id_espaco, nome, tipo, topico, indice_ordem, e_voz, esta_bloqueado, questao_orientadora, diretrizes, modo_acesso, modo_voz)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)`,
      parametros,
    );
  },
  inserirCursos(parametros = []) {
    return executar(
      `INSERT INTO cursos (id, titulo, slug, descricao, categoria, dificuldade, url_miniatura, posicao_miniatura, url_banner, posicao_banner, preco, e_gratuito, e_publicado, estado_aprovacao, notas_admin, submetido_para_revisao_em, destaque, duracao_horas, idioma, id_criador, id_espaco, modo_chamada_padrao, permitir_partilha_ecra_aluno, permitir_camara_aluno, resultados_aprendizagem, requisitos, documentos, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NULL, $15, 0, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`,
      parametros,
    );
  },
  inserirCursoModulosParaLookup(parametros = []) {
    return executar(
      'INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem, modo_desbloqueio) VALUES ($1, $2, $3, $4, $5, $6)',
      parametros,
    );
  },
  inserirAulasParaLookup(parametros = []) {
    return executar(
      `INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      parametros,
    );
  },
  inserirQuestionariosParaLookup(parametros = []) {
    return executar(
      `INSERT INTO questionarios (id, id_aula, titulo, descricao, pontuacao_aprovacao, recompensa_xp)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
      parametros,
    );
  },
  inserirQuestionarioPerguntasParaLookup(parametros = []) {
    return executar(
      `INSERT INTO perguntas_quiz (id, id_quiz, pergunta, opcoes, indice_opcao_correta, explicacao, indice_ordem)
                       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      parametros,
    );
  },
  inserirInscricoes(parametros = []) {
    return executar(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0) ON CONFLICT DO NOTHING',
      parametros,
    );
  },
  listarMembrosPorFormadorIdAndUtilizadorId(parametros = []) {
    return consultarTodos(
      `SELECT e.id, e."idUtilizador", e."idCurso", e."inscritoEm", e."percentagemProgresso",
              u.id as user_id, u.name, u.username, u."urlAvatar", u.email,
              c.id as course_id, c.title as course_title,
              s.name as space_name,
              CASE WHEN col."idUtilizador" IS NOT NULL THEN 'COLABORADOR' ELSE 'ALUNO' END as member_type
       FROM consulta_inscricoes e
       JOIN consulta_cursos c ON e."idCurso" = c.id
       JOIN consulta_utilizadores u ON e."idUtilizador" = u.id
       LEFT JOIN consulta_espacos s ON c."idEspaco" = s.id
       LEFT JOIN consulta_colaboradores_curso col ON col."idCurso" = c.id AND col."idUtilizador" = u.id
       WHERE (c."idFormador" = $1 OR c.id IN (SELECT "idCurso" FROM consulta_colaboradores_curso WHERE "idUtilizador" = $2)) AND e."idUtilizador" != $3
       ORDER BY e."inscritoEm" DESC`,
      parametros,
    );
  },
  procurarAcessoPorIdAndFormadorIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_cursos WHERE id = $1 AND ("idFormador" = $2 OR id IN (SELECT "idCurso" FROM consulta_colaboradores_curso WHERE "idUtilizador" = $3))',
      parametros,
    );
  },
  listarColaboradoresPorCursoId(parametros = []) {
    return consultarTodos(
      `SELECT cc.id, cc."idCurso", cc."idUtilizador", cc."criadoEm",
             u.name, u.username, u.email, u."urlAvatar"
      FROM consulta_colaboradores_curso cc
      JOIN consulta_utilizadores u ON cc."idUtilizador" = u.id
      WHERE cc."idCurso" = $1
      ORDER BY cc."criadoEm" ASC`,
      parametros,
    );
  },
  procurarCursoPorIdParaEnviarFormadorCursosPorCursoIdColaboradores(parametros = []) {
    return consultarUm(
      'SELECT id, title, "idFormador" FROM consulta_cursos WHERE id = $1',
      parametros,
    );
  },
  procurarDestinoUtilizador(parametros = []) {
    return consultarUm(
      `SELECT id, name, username, email, "urlAvatar", role 
      FROM consulta_utilizadores 
      WHERE LOWER(email) = $1 OR LOWER(username) = $2`,
      parametros,
    );
  },
  procurarExistentePorCursoIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_colaboradores_curso WHERE "idCurso" = $1 AND "idUtilizador" = $2',
      parametros,
    );
  },
  inserirCursoColaboradores(parametros = []) {
    return executar(
      'INSERT INTO colaboradores_curso (id, id_curso, id_utilizador, criado_em) VALUES ($1, $2, $3, $4)',
      parametros,
    );
  },
  procurarEnrolledPorCursoIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_inscricoes WHERE "idCurso" = $1 AND "idUtilizador" = $2',
      parametros,
    );
  },
  inserirInscricoesParaEnviarFormadorCursosPorCursoIdColaboradores(parametros = []) {
    return executar(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, percentagem_progresso, inscrito_em) VALUES ($1, $2, $3, 100, $4)',
      parametros,
    );
  },
  inserirNotificacoesParaEnviarFormadorCursosPorCursoIdColaboradores(parametros = []) {
    return executar(
      `INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
      VALUES ($1, $2, 'course', 'Adicionado como Colaborador', $3, $4, 0, $5)`,
      parametros,
    );
  },
  procurarCursoParaColaboradorRemoval(parametros = []) {
    return consultarUm('SELECT id, "idFormador" FROM consulta_cursos WHERE id = $1', parametros);
  },
  eliminarCursoColaboradoresPorCursoIdAndUtilizadorId(parametros = []) {
    return executar(
      'DELETE FROM colaboradores_curso WHERE id_curso = $1 AND id_utilizador = $2',
      parametros,
    );
  },
  procurarPertencentePorIdAndFormadorIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_cursos WHERE id = $1 AND ("idFormador" = $2 OR id IN (SELECT "idCurso" FROM consulta_colaboradores_curso WHERE "idUtilizador" = $3))',
      parametros,
    );
  },
  eliminarInscricoesPorCursoIdAndUtilizadorId(parametros = []) {
    return executar(
      'DELETE FROM inscricoes WHERE id_curso = $1 AND id_utilizador = $2',
      parametros,
    );
  },
  procurarAluno(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_utilizadores WHERE (LOWER(username) = $1 OR LOWER(email) = $2) AND "estaSuspenso" = 0',
      parametros,
    );
  },
  inserirInscricoesParaLookup(parametros = []) {
    return executar(
      'INSERT INTO inscricoes (id,id_utilizador,id_curso,inscrito_em,percentagem_progresso) VALUES ($1,$2,$3,$4,0)',
      parametros,
    );
  },
  procurarAdesoesPorEspacoIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_membros_espacos WHERE "idEspaco" = $1 AND "idUtilizador" = $2',
      parametros,
    );
  },
  inserirAdesoesParaLookup(parametros = []) {
    return executar(
      "INSERT INTO membros_espacos (id,id_utilizador,id_espaco,papel,aderiu_em) VALUES ($1,$2,$3,'MEMBER',$4)",
      parametros,
    );
  },
  atualizarCursosPorSubmittedParaReverAtAndAtualizadoAtAndId(parametros = []) {
    return executar(
      `UPDATE cursos 
      SET estado_aprovacao = 'PENDING', e_publicado = 0, submetido_para_revisao_em = $1, atualizado_em = $2
      WHERE id = $3`,
      parametros,
    );
  },
};

module.exports = Formador;
