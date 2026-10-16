const { queryOne, execute, queryAll } = require('../database/connection.js');
const Notes = {
  findCoursesById(params = []) {
    return queryOne('SELECT * FROM courses WHERE id = $1', params);
  },
  findNoteByUserIdAndLessonId(params = []) {
    return queryOne('SELECT * FROM notes WHERE "userId" = $1 AND "lessonId" = $2', params);
  },
  findExistingByUserIdAndLessonId(params = []) {
    return queryOne('SELECT id FROM notes WHERE "userId" = $1 AND "lessonId" = $2', params);
  },
  updateNotesByContentAndUpdatedAtAndId(params = []) {
    return execute('UPDATE notas SET conteudo = $1, atualizado_em = $2 WHERE id = $3', params);
  },
  insertNotes(params = []) {
    return execute(
      'INSERT INTO notas (id, id_utilizador, id_aula, conteudo, criado_em, atualizado_em) VALUES ($1, $2, $3, $4, $5, $6)',
      params,
    );
  },
  listNotesByUserId(params = []) {
    return queryAll(
      `SELECT n.*, l.title as lesson_title, m.title as module_title, c.title as course_title, c.id as course_id
       FROM notes n
       JOIN lessons l ON n."lessonId" = l.id
       JOIN course_modules m ON l."moduleId" = m.id
       JOIN courses c ON m."courseId" = c.id
       WHERE n."userId" = $1
       ORDER BY n."updatedAt" DESC`,
      params,
    );
  },
};
module.exports = Notes;
