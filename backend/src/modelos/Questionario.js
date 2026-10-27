const { consultarTodos, consultarUm, executar } = require('../base-dados/ligacao.js');
const Questionario = {
  listarSubmissoesQuestionario(parametros = []) {
    return consultarTodos(
      `SELECT s.*, u.name AS "studentName", u.username AS "studentUsername", l.title AS "lessonTitle", m."idCurso", c.title AS "tituloCurso"
       FROM submissoes_questionario s JOIN consulta_utilizadores u ON u.id=s.id_utilizador JOIN consulta_aulas l ON l.id=s.id_aula
       JOIN consulta_modulos_curso m ON m.id=l."idModulo" JOIN consulta_cursos c ON c.id=m."idCurso"
       WHERE s.pendente = 1 AND ($2::boolean OR c."idFormador"=$1 OR EXISTS (SELECT 1 FROM colaboradores_curso cc WHERE cc.id_curso=c.id AND cc.id_utilizador=$1))
       ORDER BY s.criado_em LIMIT 200`,
      parametros,
    );
  },
  procurarCursosPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_cursos WHERE id = $1', parametros);
  },
  procurarTentativaPorId(parametros = []) {
    return consultarUm('SELECT * FROM submissoes_questionario WHERE id = $1', parametros);
  },
  reverQuestionarioSubmissao(parametros = []) {
    return executar(
      'UPDATE submissoes_questionario SET nota = $1, aprovado = $2, pendente = 0, resultado = $3, revisto_por = $4, revisto_em = $5 WHERE id = $6',
      parametros,
    );
  },
  procurarRecentePorIdUtilizadorAndIdAula(parametros = []) {
    return consultarUm(
      'SELECT resultado FROM submissoes_questionario WHERE id_utilizador = $1 AND id_aula = $2 ORDER BY criado_em DESC LIMIT 1',
      parametros,
    );
  },
  procurarGuardadoPorId(parametros = []) {
    return consultarUm('SELECT "idAula" FROM consulta_questionarios WHERE id = $1', parametros);
  },
};

module.exports = Questionario;
