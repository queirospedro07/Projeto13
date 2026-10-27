const { consultarUm } = require('../base-dados/ligacao.js');
const Autenticacao = {
  procurarUtilizador(parametros = []) {
    return consultarUm(
      `SELECT id, email, nome_utilizador AS username, hash_palavra_passe AS "hashPalavraPasse",
               nome AS name, papel AS role, (papel = 'CREATOR' OR (papel = 'ADMIN' AND admin_formador = 1)) AS "eFormador", url_avatar AS "urlAvatar", biografia AS bio,
               localizacao AS location, meta_diaria_minutos AS "objetivoDiarioMinutos", minutos_hoje AS "minutosHoje",
               minutos_totais AS "minutosTotais", esta_suspenso AS "estaSuspenso", versao_sessao AS "versaoSessao"
        FROM utilizadores
        WHERE LOWER(email) = $1 OR LOWER(nome_utilizador) = $2`,
      parametros,
    );
  },
  procurarUtilizadorPorId(parametros = []) {
    return consultarUm(
      `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, (papel = 'CREATOR' OR (papel = 'ADMIN' AND admin_formador = 1)) AS "eFormador",
              url_avatar AS "urlAvatar", biografia AS bio, localizacao AS location,
              meta_diaria_minutos AS "objetivoDiarioMinutos",
              minutos_hoje AS "minutosHoje", minutos_totais AS "minutosTotais",
              esta_suspenso AS "estaSuspenso"
       FROM utilizadores
       WHERE id = $1`,
      parametros,
    );
  },
  procurarPerfisPorIdUtilizador(parametros = []) {
    return consultarUm(
      `SELECT titulo_perfil AS headline, website, github, linkedin, url_banner AS "urlCapa",
              e_publico AS "ePublico", mostrar_biografia AS "mostrarBiografia", mostrar_localizacao AS "mostrarLocalizacao", mostrar_redes_sociais AS "mostrarRedesSociais",
              mostrar_estatisticas AS "mostrarEstatisticas", mostrar_cursos AS "mostrarCursos", preferencia_tema AS "preferenciaTema"
       FROM perfis
       WHERE id_utilizador = $1`,
      parametros,
    );
  },
  procurarUtilizadorPorPapelAndId(parametros = []) {
    return consultarUm(
      `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role, (papel = 'CREATOR' OR (papel = 'ADMIN' AND admin_formador = 1)) AS "eFormador",
              url_avatar AS "urlAvatar", versao_sessao AS "versaoSessao"
     FROM utilizadores
       WHERE papel = $1 AND esta_suspenso = 0 AND id = $2
     LIMIT 1`,
      parametros,
    );
  },
};

module.exports = Autenticacao;
