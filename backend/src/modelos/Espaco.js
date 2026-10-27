const { executar, consultarUm, consultarTodos } = require('../base-dados/ligacao.js');
const Espaco = {
  inserirCanais(parametros = []) {
    return executar(
      'INSERT INTO canais(id,id_espaco,nome,tipo,topico,e_voz,questao_orientadora) VALUES($1,$2,$3,$4,$5,$6,$7)',
      parametros,
    );
  },
  procurarCanaisPorId(parametros = []) {
    return consultarUm('SELECT * FROM consulta_canais WHERE id=$1', parametros);
  },
  procurarCanaisPorIdAndEspacoId(parametros = []) {
    return consultarUm('SELECT id FROM consulta_canais WHERE id=$1 AND "idEspaco"=$2', parametros);
  },
  atualizarCanal(parametros = []) {
    return executar(
      'UPDATE canais SET nome=$1,tipo=$2,topico=$3,e_voz=$4,questao_orientadora=$5 WHERE id=$6 AND id_espaco=$7',
      parametros,
    );
  },
  eliminarCanaisPorIdAndEspacoId(parametros = []) {
    return executar('DELETE FROM canais WHERE id=$1 AND id_espaco=$2', parametros);
  },
  pesquisar(filtros = {}) {
    const { category: categoria, search: pesquisar } = filtros;
    let sql = `SELECT s.*,
             u.id as owner_id, u.name as owner_name, u.username as owner_username, u."urlAvatar" as "owner_avatarUrl",
             (SELECT COUNT(*) FROM consulta_membros_espacos WHERE "idEspaco" = s.id) as "membersCount",
             (SELECT COUNT(*) FROM consulta_canais WHERE "idEspaco" = s.id) as "channelsCount",
             (SELECT COUNT(*) FROM consulta_cursos WHERE "idEspaco" = s.id) as "coursesCount"
      FROM consulta_espacos s
      JOIN consulta_utilizadores u ON s."idProprietario" = u.id
      WHERE 1=1
        AND NOT EXISTS (
          SELECT 1 FROM consulta_cursos c
          WHERE c."idEspaco" = s.id
            AND (c."estaPublicado" <> 1 OR (c."estadoAprovacao" IS NOT NULL AND c."estadoAprovacao" <> 'APPROVED'))
        )`;
    const parametros = [];
    if (categoria && categoria !== 'all') {
      sql += ` AND s.category = $1`;
      parametros.push(categoria);
    }

    if (pesquisar) {
      sql += ` AND (s.name LIKE $${parametros.length + 1} OR s.description LIKE $${parametros.length + 2})`;
      parametros.push(`%${pesquisar}%`, `%${pesquisar}%`);
    }

    sql += ` ORDER BY "membersCount" DESC`;

    return consultarTodos(sql, parametros);
  },
  procurarMemPorEspacoIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT role FROM consulta_membros_espacos WHERE "idEspaco" = $1 AND "idUtilizador" = $2',
      parametros,
    );
  },
  contarEspacoPorIdAndSlug(parametros = []) {
    return consultarUm(
      `SELECT s.*,
              u.id as owner_id, u.name as owner_name, u.username as owner_username, u."urlAvatar" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio,
              (SELECT COUNT(*) FROM consulta_membros_espacos WHERE "idEspaco" = s.id) as "membersCount",
              (SELECT COUNT(*) FROM consulta_canais WHERE "idEspaco" = s.id) as "channelsCount"
       FROM consulta_espacos s
       JOIN consulta_utilizadores u ON s."idProprietario" = u.id
       WHERE s.id = $1 OR s.slug = $2`,
      parametros,
    );
  },
  procurarCursoRegistoPorIdAndSlug(parametros = []) {
    return consultarUm(
      `SELECT c.*, u.id as owner_id, u.name as owner_name, u.username as owner_username, u."urlAvatar" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio
         FROM consulta_cursos c
         JOIN consulta_utilizadores u ON c."idFormador" = u.id
         WHERE c.id = $1 OR c.slug = $2`,
      parametros,
    );
  },
  contarAdesoesPorId(parametros = []) {
    return consultarUm(
      `SELECT s.*,
                    u.id as owner_id, u.name as owner_name, u.username as owner_username, u."urlAvatar" as "owner_avatarUrl", CASE WHEN NOT EXISTS (SELECT 1 FROM perfis privacy WHERE privacy.id_utilizador = u.id AND (privacy.e_publico = 0 OR privacy.mostrar_biografia = 0)) THEN u.bio ELSE NULL END as owner_bio,
                    (SELECT COUNT(*) FROM consulta_membros_espacos WHERE "idEspaco" = s.id) as "membersCount",
                    (SELECT COUNT(*) FROM consulta_canais WHERE "idEspaco" = s.id) as "channelsCount"
             FROM consulta_espacos s
             JOIN consulta_utilizadores u ON s."idProprietario" = u.id
             WHERE s.id = $1`,
      parametros,
    );
  },
  listarCanaisPorEspacoId(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_canais WHERE "idEspaco" = $1 ORDER BY "indiceOrdem" ASC',
      parametros,
    );
  },
  listarCursosPorEspacoId(parametros = []) {
    return consultarTodos(
      'SELECT id, title, slug, "urlMiniatura", difficulty, "duracaoHoras", price, "eGratuito" FROM consulta_cursos WHERE "idEspaco" = $1',
      parametros,
    );
  },
  listarMembrosPorEspacoIdAndId(parametros = []) {
    return consultarTodos(
      `SELECT u.id as user_id, u.name, u.username, u."urlAvatar", u.role as user_role,
              COALESCE(m.role, 'MEMBER') as role,
              COALESCE(m.id, 'mem-' || u.id) as id
       FROM (
         SELECT "idUtilizador" FROM consulta_membros_espacos WHERE "idEspaco" = $1
         UNION
         SELECT e."idUtilizador" FROM consulta_inscricoes e 
         JOIN consulta_cursos c ON e."idCurso" = c.id 
         WHERE c."idEspaco" = $2
       ) t
       JOIN consulta_utilizadores u ON t."idUtilizador" = u.id
       LEFT JOIN consulta_membros_espacos m ON m."idUtilizador" = u.id AND m."idEspaco" = $3
       ORDER BY (CASE WHEN u.id = $4 THEN 0 ELSE 1 END), u.name ASC
       LIMIT 50`,
      parametros,
    );
  },
  procurarEspacoPorIdAndSlug(parametros = []) {
    return consultarUm(
      'SELECT id, name, "ePrivado", "idProprietario" FROM consulta_espacos WHERE id = $1 OR slug = $2',
      parametros,
    );
  },
  procurarPendenteCursoPorEspacoId(parametros = []) {
    return consultarUm(
      `SELECT id FROM consulta_cursos
      WHERE "idEspaco" = $1
        AND ("estaPublicado" <> 1 OR ("estadoAprovacao" IS NOT NULL AND "estadoAprovacao" <> 'APPROVED'))
      LIMIT 1`,
      parametros,
    );
  },
  listarCursosPorEspacoIdParaEnviarEspacoPorIdAderir(parametros = []) {
    return consultarTodos(
      'SELECT * FROM consulta_cursos WHERE "idEspaco" = $1 AND "eGratuito" = 0 AND price > 0',
      parametros,
    );
  },
  procurarExistentePorEspacoIdAndUtilizadorId(parametros = []) {
    return consultarUm(
      'SELECT id FROM consulta_membros_espacos WHERE "idEspaco" = $1 AND "idUtilizador" = $2',
      parametros,
    );
  },
  inserirAdesoes(parametros = []) {
    return executar(
      "INSERT INTO membros_espacos (id, id_utilizador, id_espaco, papel, aderiu_em) VALUES ($1, $2, $3, 'MEMBER', $4)",
      parametros,
    );
  },
  listarAssociadoCursosPorEspacoIdAndId(parametros = []) {
    return consultarTodos(
      'SELECT id FROM consulta_cursos WHERE ("idEspaco" = $1 OR id = $2) AND "eGratuito" = 1 AND "estaPublicado" = 1 AND ("estadoAprovacao" = \'APPROVED\' OR "estadoAprovacao" IS NULL)',
      parametros,
    );
  },
  inserirInscricoes(parametros = []) {
    return executar(
      'INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso) VALUES ($1, $2, $3, $4, 0) ON CONFLICT DO NOTHING',
      parametros,
    );
  },
};

module.exports = Espaco;
