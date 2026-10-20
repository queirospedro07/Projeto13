const { queryAll, queryOne, execute } = require('../database/connection.js');
const Quiz = {
  listSubmissoesQuestionario(params = []) {
    return queryAll(
      `SELECT s.*, u.name AS "studentName", l.title AS "lessonTitle", m."courseId", c.title AS "courseTitle"
       FROM submissoes_questionario s JOIN users u ON u.id=s.id_utilizador JOIN lessons l ON l.id=s.id_aula
       JOIN course_modules m ON m.id=l."moduleId" JOIN courses c ON c.id=m."courseId"
       WHERE s.pendente = 1 AND ($2::boolean OR c."creatorId"=$1 OR EXISTS (SELECT 1 FROM colaboradores_curso cc WHERE cc.id_curso=c.id AND cc.id_utilizador=$1))
       ORDER BY s.criado_em LIMIT 200`,
      params,
    );
  },
  findCoursesById(params = []) {
    return queryOne('SELECT * FROM courses WHERE id = $1', params);
  },
  findAttemptById(params = []) {
    return queryOne('SELECT * FROM submissoes_questionario WHERE id = $1', params);
  },
  reviewQuizSubmission(params = []) {
    return execute(
      'UPDATE submissoes_questionario SET nota = $1, aprovado = $2, pendente = 0, resultado = $3, revisto_por = $4, revisto_em = $5 WHERE id = $6',
      params,
    );
  },
  findLatestByIdUtilizadorAndIdAula(params = []) {
    return queryOne(
      'SELECT resultado FROM submissoes_questionario WHERE id_utilizador = $1 AND id_aula = $2 ORDER BY criado_em DESC LIMIT 1',
      params,
    );
  },
  findStoredById(params = []) {
    return queryOne('SELECT "lessonId" FROM quizzes WHERE id = $1', params);
  },
};
module.exports = Quiz;
