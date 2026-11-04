const { randomUUID } = require('node:crypto');
const { consultarUm, executar, transacao, bloquearTransacao } = require('../database/connection');
const { podeGerirCurso } = require('./courseAccess');

async function garantirCursoCommunity(utilizador, cursoId) {
  return transacao(async () => {
    await bloquearTransacao(`course-community:${cursoId}`);

    const curso = await consultarUm('SELECT * FROM consulta_cursos WHERE id = $1', [cursoId]);
    if (!curso)
      throw Object.assign(new Error('Curso não encontrado.'), {
        status: 404,
      });
    if (!(await podeGerirCurso(utilizador, curso)))
      throw Object.assign(new Error('Sem permissão para configurar a comunidade.'), {
        status: 403,
      });
    if (
      curso.idEspaco &&
      !(await consultarUm(
        'SELECT id FROM consulta_cursos WHERE "idEspaco" = $1 AND id <> $2 LIMIT 1',
        [curso.idEspaco, curso.id],
      ))
    )
      return curso.idEspaco;
    const espacoId = randomUUID();
    const agora = new Date().toISOString();

    await executar(
      `INSERT INTO espacos (id,nome,slug,descricao,url_icone,url_banner,e_privado,categoria,id_proprietario,total_membros,criado_em)
       VALUES ($1,$2,$3,$4,$5,$6,1,$7,$8,1,$9)`,
      [
        espacoId,
        `Comunidade ${curso.title}`,
        `comunidade-${espacoId}`,
        curso.description,
        curso.urlMiniatura,
        curso.urlCapa,
        curso.category,
        curso.idFormador,
        agora,
      ],
    );
    await executar('UPDATE cursos SET id_espaco = $1, atualizado_em = $2 WHERE id = $3', [
      espacoId,
      agora,
      curso.id,
    ]);
    await executar(
      "INSERT INTO membros_espacos(id,id_utilizador,id_espaco,papel,aderiu_em) VALUES($1,$2,$3,'OWNER',$4) ON CONFLICT DO NOTHING",
      [randomUUID(), curso.idFormador, espacoId, agora],
    );
    await executar(
      `INSERT INTO membros_espacos(id,id_utilizador,id_espaco,papel,aderiu_em)
       SELECT 'member-' || $1 || '-' || id_utilizador, id_utilizador, $1, 'MEMBER', $2
       FROM inscricoes WHERE id_curso = $3 AND id_utilizador <> $4 ON CONFLICT DO NOTHING`,
      [espacoId, agora, curso.id, curso.idFormador],
    );

    return espacoId;
  });
}

exports.garantirCursoCommunity = garantirCursoCommunity;
