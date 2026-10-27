const { consultarTodos, consultarUm, executar } = require('../base-dados/ligacao.js');
const Projeto = {
  listarSubmissoesProjeto(parametros = []) {
    return consultarTodos(
      `SELECT s.*, u.name AS "studentName", u.username AS "studentUsername", l.title AS "lessonTitle", m."idCurso", c.title AS "tituloCurso"
       FROM submissoes_projeto s JOIN consulta_utilizadores u ON u.id=s.id_utilizador JOIN consulta_aulas l ON l.id=s.id_aula
       JOIN consulta_modulos_curso m ON m.id=l."idModulo" JOIN consulta_cursos c ON c.id=m."idCurso"
       WHERE s.estado = 'SUBMITTED' AND ($2::boolean OR c."idFormador"=$1 OR EXISTS (SELECT 1 FROM colaboradores_curso cc WHERE cc.id_curso=c.id AND cc.id_utilizador=$1))
       ORDER BY s.criado_em LIMIT 200`,
      parametros,
    );
  },
  procurarCursosPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_cursos WHERE id = $1', parametros);
  },
  procurarSubmissoesProjetoPorId(parametros = []) {
    return consultarUm('SELECT * FROM submissoes_projeto WHERE id = $1', parametros);
  },
  reverProjetoSubmissao(parametros = []) {
    return executar(
      'UPDATE submissoes_projeto SET estado = $1, parecer = $2, revisto_por = $3, revisto_em = $4 WHERE id = $5',
      parametros,
    );
  },
  procurarSubmissoesProjetoPorIdUtilizadorAndIdAula(parametros = []) {
    return consultarUm(
      'SELECT id, url, estado AS status, parecer AS feedback FROM submissoes_projeto WHERE id_utilizador = $1 AND id_aula = $2 ORDER BY criado_em DESC LIMIT 1',
      parametros,
    );
  },
  inserirSubmissoesProjeto(parametros = []) {
    return executar(
      'INSERT INTO submissoes_projeto (id, id_utilizador, id_aula, url, criado_em) VALUES ($1, $2, $3, $4, $5)',
      parametros,
    );
  },
};

module.exports = Projeto;
