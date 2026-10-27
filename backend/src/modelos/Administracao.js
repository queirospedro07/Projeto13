const { consultarUm, consultarTodos, executar } = require('../base-dados/ligacao.js');
const Administracao = {
  contarAtivoUtilizadores() {
    return consultarUm('SELECT COUNT(*) AS c FROM utilizadores WHERE esta_suspenso = 0');
  },
  contarUtilizadores(parametros = []) {
    return consultarUm('SELECT COUNT(*) as c FROM consulta_utilizadores', parametros);
  },
  contarCursos(parametros = []) {
    return consultarUm('SELECT COUNT(*) as c FROM consulta_cursos', parametros);
  },
  contarEspacos(parametros = []) {
    return consultarUm('SELECT COUNT(*) as c FROM consulta_espacos', parametros);
  },
  contarInscricoes(parametros = []) {
    return consultarUm('SELECT COUNT(*) as c FROM consulta_inscricoes', parametros);
  },
  contarFormadorCandidaturas(parametros = []) {
    return consultarUm(
      "SELECT COUNT(*) as c FROM consulta_candidaturas_formador WHERE status = 'PENDING'",
      parametros,
    );
  },
  contarCursosParaObterAdministracaoEstatisticas(parametros = []) {
    return consultarUm(
      'SELECT COUNT(*) as c FROM consulta_cursos WHERE "estadoAprovacao" = \'PENDING\'',
      parametros,
    );
  },
  contarUtilizadoresParaObterAdministracaoUtilizadores(parametros = []) {
    return consultarTodos(
      `SELECT id, name, username, email, role, "eFormador", "urlAvatar", "estaSuspenso", "criadoEm",
             (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idUtilizador" = consulta_utilizadores.id) as "enrollmentsCount",
             (SELECT COUNT(*) FROM consulta_cursos WHERE "idFormador" = consulta_utilizadores.id) as "createdCoursesCount"
      FROM consulta_utilizadores
      ORDER BY "criadoEm" DESC`,
      parametros,
    );
  },
  procurarDestinoUtilizadorPorId(parametros = []) {
    return consultarUm(
      'SELECT role, "estaSuspenso" FROM consulta_utilizadores WHERE id = $1',
      parametros,
    );
  },
  atualizarUtilizadoresPorEstaSuspensoAndId(parametros = []) {
    return executar(
      'UPDATE utilizadores SET esta_suspenso = $1, versao_sessao = versao_sessao + 1 WHERE id = $2',
      parametros,
    );
  },
  listarCandidaturas(parametros = []) {
    return consultarTodos(
      `SELECT ca.*,
             u.name as user_name, u.email as user_email, u.username as user_username, u."urlAvatar" as "user_avatarUrl", u.role as user_role
      FROM consulta_candidaturas_formador ca
      JOIN consulta_utilizadores u ON ca."idUtilizador" = u.id
      ORDER BY CASE WHEN ca.status = 'PENDING' THEN 0 ELSE 1 END, ca."criadoEm" DESC`,
      parametros,
    );
  },
  procurarCandidaturaPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_candidaturas_formador WHERE id = $1', parametros);
  },
  atualizarFormadorCandidaturasPorRevistoPorAndRevistoAtAndAtualizadoAtAndId(parametros = []) {
    return executar(
      "UPDATE candidaturas_criador SET estado = 'APPROVED', revisto_por = $1, revisto_em = $2, atualizado_em = $3 WHERE id = $4",
      parametros,
    );
  },
  atualizarUtilizadoresPorAtualizadoAtAndId(parametros = []) {
    return executar(
      "UPDATE utilizadores SET papel = CASE WHEN papel = 'ADMIN' THEN papel ELSE 'CREATOR' END, atualizado_em = $1 WHERE id = $2",
      parametros,
    );
  },
  inserirNotificacoes(parametros = []) {
    return executar(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'achievement', 'Candidatura a Criador Aprovada!', 'Parabéns! A sua candidatura foi aprovada. Já tem acesso ao Estúdio do Criador.', '/formador', 0, $3)",
      parametros,
    );
  },
  rejeitarFormadorCandidatura(parametros = []) {
    return executar(
      "UPDATE candidaturas_criador SET estado = 'REJECTED', parecer_admin = $1, revisto_por = $2, revisto_em = $3, atualizado_em = $4 WHERE id = $5",
      parametros,
    );
  },
  inserirNotificacoesParaLookup(parametros = []) {
    return executar(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'system', 'Atualização da Candidatura a Criador', $3, '/formador/apply', 0, $4)",
      parametros,
    );
  },
  pesquisar(filtros = {}) {
    const { status: estado } = filtros;
    let sql = `SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.email as creator_email, u."urlAvatar" as "creator_avatarUrl",
             (SELECT COUNT(*) FROM consulta_modulos_curso WHERE "idCurso" = c.id) as "modulesCount",
             (SELECT COUNT(*) FROM consulta_inscricoes WHERE "idCurso" = c.id) as "studentsCount"
      FROM consulta_cursos c
      JOIN consulta_utilizadores u ON c."idFormador" = u.id`;
    const parametros = [];
    if (estado && estado !== 'all') {
      sql += ` WHERE c."estadoAprovacao" = $1`;
      parametros.push(estado);
    }

    sql += ` ORDER BY CASE WHEN c."estadoAprovacao" = 'PENDING' THEN 0 ELSE 1 END, c."criadoEm" DESC`;

    return consultarTodos(sql, parametros);
  },
  procurarCursoPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_cursos WHERE id = $1', parametros);
  },
  atualizarCursosPorRevistoAtAndAtualizadoAtAndId(parametros = []) {
    return executar(
      "UPDATE cursos SET estado_aprovacao = 'APPROVED', e_publicado = 1, notas_admin = 'Aprovado pelo Administrador', revisto_em = $1, atualizado_em = $2 WHERE id = $3",
      parametros,
    );
  },
  criarCursoAprovacaoNotificacao(parametros = []) {
    return executar(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'achievement', 'Curso Aprovado e Publicado!', $3, $4, 0, $5)",
      parametros,
    );
  },
  atualizarCursosPorAdministracaoNotasAndRevistoAtAndAtualizadoAtAndId(parametros = []) {
    return executar(
      "UPDATE cursos SET estado_aprovacao = 'REJECTED', e_publicado = 0, notas_admin = $1, revisto_em = $2, atualizado_em = $3 WHERE id = $4",
      parametros,
    );
  },
  criarCursoRejeicaoNotificacao(parametros = []) {
    return executar(
      "INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em) VALUES ($1, $2, 'system', 'Curso Requer Revisão', $3, '/formador', 0, $4)",
      parametros,
    );
  },
};

module.exports = Administracao;
