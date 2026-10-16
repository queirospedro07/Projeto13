const { queryOne } = require('../database/connection.js');
const Auth = {
  findUser(params = []) {
    return queryOne(
      `SELECT id, email, nome_utilizador AS username, hash_palavra_passe AS "passwordHash",
               nome AS name, papel AS role, url_avatar AS "avatarUrl", biografia AS bio,
               localizacao AS location, meta_diaria_minutos AS "dailyGoalMinutes", minutos_hoje AS "minutesToday",
               minutos_totais AS "totalMinutes", esta_suspenso AS "isSuspended", versao_sessao AS "authVersion"
        FROM utilizadores
        WHERE LOWER(email) = $1 OR LOWER(nome_utilizador) = $2`,
      params,
    );
  },
  findUserById(params = []) {
    return queryOne(
      `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role,
              url_avatar AS "avatarUrl", biografia AS bio, localizacao AS location,
              meta_diaria_minutos AS "dailyGoalMinutes",
              minutos_hoje AS "minutesToday", minutos_totais AS "totalMinutes",
              esta_suspenso AS "isSuspended"
       FROM utilizadores
       WHERE id = $1`,
      params,
    );
  },
  findPerfisByIdUtilizador(params = []) {
    return queryOne(
      `SELECT titulo_perfil AS headline, website, github, linkedin, url_banner AS "bannerUrl",
              e_publico AS "isPublic", mostrar_biografia AS "showBio", mostrar_localizacao AS "showLocation", mostrar_redes_sociais AS "showSocials",
              mostrar_estatisticas AS "showStats", mostrar_cursos AS "showCourses", preferencia_tema AS "themePreference"
       FROM perfis
       WHERE id_utilizador = $1`,
      params,
    );
  },
  findUserByPapelAndId(params = []) {
    return queryOne(
      `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role,
              url_avatar AS "avatarUrl", versao_sessao AS "authVersion"
     FROM utilizadores
       WHERE papel = $1 AND esta_suspenso = 0 AND id = $2
     LIMIT 1`,
      params,
    );
  },
};
module.exports = Auth;
