const {
  consultarUm,
  consultarTodos,
  executar,
  query: consultar,
} = require('../database/connection.js');
const Perfil = {
  procurarUtilizadorPorId(parametros = []) {
    return consultarUm(
      `SELECT u.id, u.name, u.username, u.role, u."urlAvatar", u.bio, u.location,
             u."objetivoDiarioMinutos", u."minutosHoje", u."minutosTotais", u."criadoEm",
             p.headline, p.website, p.github, p.linkedin, p."urlCapa", p."preferenciaTema",
             p."ePublico", p."mostrarBiografia", p."mostrarLocalizacao",
             p."mostrarRedesSociais", p."mostrarEstatisticas", p."mostrarCursos"
      FROM consulta_utilizadores u
      LEFT JOIN consulta_perfis p ON u.id = p."idUtilizador"
      WHERE LOWER(u.username) = $1 OR u.id = $2`,
      parametros,
    );
  },
  listarInscricaoRegistosPorUtilizadorId(parametros = []) {
    return consultarTodos(
      `SELECT e.id as "idInscricao", e."percentagemProgresso", e."concluidoEm", e."estaOculto",
                c.id, c.title, c.slug, c.description, c.category, c."urlMiniatura", c."urlCapa", c."duracaoHoras"
         FROM consulta_inscricoes e
         JOIN consulta_cursos c ON e."idCurso" = c.id
         WHERE e."idUtilizador" = $1
         ORDER BY e."inscritoEm" DESC`,
      parametros,
    );
  },
  atualizarUtilizadoresPorAtualizadoEmAndId(parametros = []) {
    return executar(
      `UPDATE utilizadores SET
          nome = COALESCE($1, nome),
          biografia = CASE WHEN $2 = 1 THEN $3 ELSE biografia END,
          localizacao = CASE WHEN $4 = 1 THEN $5 ELSE localizacao END,
          url_avatar = CASE WHEN $6 = 1 THEN $7 ELSE url_avatar END,
          atualizado_em = $8
         WHERE id = $9`,
      parametros,
    );
  },
  procurarPerfilExistsPorIdUtilizador(parametros = []) {
    return consultarUm('SELECT id FROM perfis WHERE id_utilizador = $1', parametros);
  },
  atualizarPerfisPorIdUtilizador(parametros = []) {
    return executar(
      `UPDATE perfis SET
          titulo_perfil = CASE WHEN $1 = 1 THEN $2 ELSE titulo_perfil END,
          github = CASE WHEN $3 = 1 THEN $4 ELSE github END,
          linkedin = CASE WHEN $5 = 1 THEN $6 ELSE linkedin END,
          website = CASE WHEN $7 = 1 THEN $8 ELSE website END,
          url_banner = CASE WHEN $9 = 1 THEN $10 ELSE url_banner END,
          preferencia_tema = COALESCE($11, preferencia_tema),
          e_publico = COALESCE($12, e_publico),
          mostrar_biografia = COALESCE($13, mostrar_biografia),
          mostrar_localizacao = COALESCE($14, mostrar_localizacao),
          mostrar_redes_sociais = COALESCE($15, mostrar_redes_sociais),
          mostrar_estatisticas = COALESCE($16, mostrar_estatisticas),
          mostrar_cursos = COALESCE($17, mostrar_cursos)
          WHERE id_utilizador = $18`,
      parametros,
    );
  },
  inserirPerfis(parametros = []) {
    return executar(
      `INSERT INTO perfis
          (id, id_utilizador, titulo_perfil, github, linkedin,
           website, url_banner, preferencia_tema,
           e_publico, mostrar_biografia, mostrar_localizacao, mostrar_redes_sociais, mostrar_estatisticas, mostrar_cursos)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      parametros,
    );
  },
  procurarAtualizadoPorId(parametros = []) {
    return consultarUm(
      `SELECT u.id, u.email, u.username, u.name, u.role, u."urlAvatar", u.bio, u.location,
             u."objetivoDiarioMinutos", u."minutosHoje", u."minutosTotais",
             u."estaSuspenso", u."criadoEm", u."atualizadoEm",
             p.headline, p.website, p.github, p.linkedin, p."urlCapa", p."preferenciaTema",
             p."ePublico", p."mostrarBiografia", p."mostrarLocalizacao",
             p."mostrarRedesSociais", p."mostrarEstatisticas", p."mostrarCursos"
      FROM consulta_utilizadores u LEFT JOIN consulta_perfis p ON u.id = p."idUtilizador"
      WHERE u.id = $1`,
      parametros,
    );
  },
  atualizarUtilizadoresPorAtualizadoEmAndIdParaEnviarPerfilPerfilClearCampo(parametros = []) {
    return executar(
      'UPDATE utilizadores SET url_avatar = NULL, atualizado_em = $1 WHERE id = $2',
      parametros,
    );
  },
  atualizarPerfisPorIdUtilizadorParaEnviarPerfilPerfilClearCampo(parametros = []) {
    return executar('UPDATE perfis SET url_banner = NULL WHERE id_utilizador = $1', parametros);
  },
};

module.exports = Perfil;
