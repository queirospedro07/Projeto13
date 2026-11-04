const { assincronoAlgum } = require('../utils/asyncCollections.js');
const { consultarUm, consultarTodos } = require('../database/connection.js');

async function podeGerirCurso(utilizador, curso) {
  if (!utilizador?.id || !curso) return false;

  return (
    utilizador.role === 'ADMIN' ||
    utilizador.id === curso.idFormador ||
    Boolean(
      await consultarUm(
        'SELECT id FROM colaboradores_curso WHERE id_curso = $1 AND id_utilizador = $2',
        [curso.id, utilizador.id],
      ),
    )
  );
}

async function podeEstudarCurso(utilizador, curso) {
  if (!utilizador?.id || !curso) return false;
  if (await podeGerirCurso(utilizador, curso)) return true;

  return Boolean(
    await consultarUm(
      'SELECT id FROM consulta_inscricoes WHERE "idCurso" = $1 AND "idUtilizador" = $2',
      [curso.id, utilizador.id],
    ),
  );
}

async function aulaComCurso(aulaId) {
  return await consultarUm(
    'SELECT l.*, m."idCurso" FROM consulta_aulas l JOIN consulta_modulos_curso m ON m.id = l."idModulo" WHERE l.id = $1',
    [aulaId],
  );
}

async function podeAcessoEspaco(utilizador, espacoId) {
  if (!utilizador?.id) return false;
  const espaco = await consultarUm(
    'SELECT id, "idProprietario", "ePrivado" FROM consulta_espacos WHERE id = $1',
    [espacoId],
  );
  if (!espaco) return false;
  if (utilizador.role === 'ADMIN' || utilizador.id === espaco.idProprietario) return true;
  const cursos = await consultarTodos('SELECT * FROM consulta_cursos WHERE "idEspaco" = $1', [
    espaco.id,
  ]);
  if (cursos.length)
    return await assincronoAlgum(
      cursos,
      async (curso) => await podeEstudarCurso(utilizador, curso),
    );

  return Boolean(
    await consultarUm(
      'SELECT id FROM consulta_membros_espacos WHERE "idEspaco" = $1 AND "idUtilizador" = $2',
      [espaco.id, utilizador.id],
    ),
  );
}

async function podeModerateEspaco(utilizador, espacoId) {
  if (!utilizador?.id) return false;
  const espaco = await consultarUm('SELECT "idProprietario" FROM consulta_espacos WHERE id = $1', [
    espacoId,
  ]);
  if (!espaco) return false;

  return (
    utilizador.role === 'ADMIN' ||
    utilizador.id === espaco.idProprietario ||
    (await assincronoAlgum(
      await consultarTodos('SELECT * FROM consulta_cursos WHERE "idEspaco" = $1', [espacoId]),
      async (curso) => await podeGerirCurso(utilizador, curso),
    ))
  );
}

exports.podeGerirCurso = podeGerirCurso;
exports.podeEstudarCurso = podeEstudarCurso;
exports.aulaComCurso = aulaComCurso;
exports.podeAcessoEspaco = podeAcessoEspaco;
exports.podeModerateEspaco = podeModerateEspaco;
