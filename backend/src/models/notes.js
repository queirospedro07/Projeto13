const { consultarUm, executar, consultarTodos } = require('../database/connection.js');
const Notas = {
  procurarCursosPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_cursos WHERE id = $1', parametros);
  },
  procurarNotaPorUtilizadorIdAndAulaId(parametros = []) {
    return consultarUm(
      'SELECT * FROM consulta_notas WHERE "idUtilizador" = $1 AND "idAula" = $2',
      parametros,
    );
  },
  procurarExistentePorUtilizadorIdAndAulaId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_notas WHERE "idUtilizador" = $1 AND "idAula" = $2',
      parametros,
    );
  },
  atualizarNotasPorConteudoAndAtualizadoAtAndId(parametros = []) {
    return executar('UPDATE notas SET conteudo = $1, atualizado_em = $2 WHERE id = $3', parametros);
  },
  inserirNotas(parametros = []) {
    return executar(
      'INSERT INTO notas (id, id_utilizador, id_aula, conteudo, criado_em, atualizado_em) VALUES ($1, $2, $3, $4, $5, $6)',
      parametros,
    );
  },
  listarNotasPorUtilizadorId(parametros = []) {
    return consultarTodos(
      `SELECT n.*, l.title as lesson_title, m.title as module_title, c.title as course_title, c.id as course_id
       FROM consulta_notas n
       JOIN consulta_aulas l ON n."idAula" = l.id
       JOIN consulta_modulos_curso m ON l."idModulo" = m.id
       JOIN consulta_cursos c ON m."idCurso" = c.id
       WHERE n."idUtilizador" = $1
       ORDER BY n."atualizadoEm" DESC`,
      parametros,
    );
  },
};

module.exports = Notas;
