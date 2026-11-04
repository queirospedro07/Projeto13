const { consultarUm, consultarTodos } = require('../database/connection.js');
const Certificado = {
  procurarCertificadoPorIdAndCredencialId(parametros = []) {
    return consultarUm(
      `SELECT c.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u."urlAvatar" as "user_avatarUrl",
              co.id as course_id, co.title as course_title, co.slug as course_slug, co."duracaoHoras" as "course_durationHours"
       FROM consulta_certificados c
       JOIN consulta_utilizadores u ON c."idUtilizador" = u.id
       JOIN consulta_cursos co ON c."idCurso" = co.id
       WHERE c.id = $1 OR c."idCredencial" = $2`,
      parametros,
    );
  },
  listarCertificadosPorUtilizadorId(parametros = []) {
    return consultarTodos(
      `SELECT c.*, co.title as course_title, co."urlMiniatura"
       FROM consulta_certificados c
       JOIN consulta_cursos co ON c."idCurso" = co.id
       WHERE c."idUtilizador" = $1
       ORDER BY c."emitidoEm" DESC`,
      parametros,
    );
  },
};

module.exports = Certificado;
