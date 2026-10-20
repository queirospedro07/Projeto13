const { queryAll, queryOne, execute } = require('../database/connection.js');
const Project = {
  listSubmissoesProjeto(params = []) {
    return queryAll(
      `SELECT s.*, u.name AS "studentName", l.title AS "lessonTitle", m."courseId", c.title AS "courseTitle"
       FROM submissoes_projeto s JOIN users u ON u.id=s.id_utilizador JOIN lessons l ON l.id=s.id_aula
       JOIN course_modules m ON m.id=l."moduleId" JOIN courses c ON c.id=m."courseId"
       WHERE s.estado = 'SUBMITTED' AND ($2::boolean OR c."creatorId"=$1 OR EXISTS (SELECT 1 FROM colaboradores_curso cc WHERE cc.id_curso=c.id AND cc.id_utilizador=$1))
       ORDER BY s.criado_em LIMIT 200`,
      params,
    );
  },
  findCoursesById(params = []) {
    return queryOne('SELECT * FROM courses WHERE id = $1', params);
  },
  findSubmissoesProjetoById(params = []) {
    return queryOne('SELECT * FROM submissoes_projeto WHERE id = $1', params);
  },
  reviewProjectSubmission(params = []) {
    return execute(
      'UPDATE submissoes_projeto SET estado = $1, parecer = $2, revisto_por = $3, revisto_em = $4 WHERE id = $5',
      params,
    );
  },
  findSubmissoesProjetoByIdUtilizadorAndIdAula(params = []) {
    return queryOne(
      'SELECT id, url, estado AS status, parecer AS feedback FROM submissoes_projeto WHERE id_utilizador = $1 AND id_aula = $2 ORDER BY criado_em DESC LIMIT 1',
      params,
    );
  },
  insertSubmissoesProjeto(params = []) {
    return execute(
      'INSERT INTO submissoes_projeto (id, id_utilizador, id_aula, url, criado_em) VALUES ($1, $2, $3, $4, $5)',
      params,
    );
  },
};

module.exports = Project;
