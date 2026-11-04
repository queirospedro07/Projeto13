const { sortearAvatarInicial } = require('../services/defaultAvatar');
const bcrypt = require('bcryptjs');
const { consultarUm, consultarTodos, executar, transacao } = require('../database/connection.js');
const Utilizador = {
  async procurarPorEmail(email) {
    return await consultarUm(
      `SELECT id, email, nome_utilizador AS username,
             nome AS name, papel AS role, url_avatar AS "urlAvatar", biografia AS bio,
             localizacao AS location, meta_diaria_minutos AS "objetivoDiarioMinutos", minutos_hoje AS "minutosHoje",
             minutos_totais AS "minutosTotais", esta_suspenso AS "estaSuspenso",
             criado_em AS "criadoEm", atualizado_em AS "atualizadoEm"
      FROM utilizadores
      WHERE LOWER(email) = $1`,
      [email.toLowerCase().trim()],
    );
  },
  async procurarPorNomeUtilizador(nomeUtilizador) {
    return await consultarUm(
      `SELECT id, email, nome_utilizador AS username,
             nome AS name, papel AS role, url_avatar AS "urlAvatar", biografia AS bio,
             localizacao AS location, meta_diaria_minutos AS "objetivoDiarioMinutos", minutos_hoje AS "minutosHoje",
             minutos_totais AS "minutosTotais", esta_suspenso AS "estaSuspenso",
             criado_em AS "criadoEm", atualizado_em AS "atualizadoEm"
      FROM utilizadores
      WHERE LOWER(nome_utilizador) = $1`,
      [nomeUtilizador.toLowerCase().trim()],
    );
  },
  async procurarPorId(id) {
    return await consultarUm(
      `SELECT id, nome AS name, nome_utilizador AS username, email, papel AS role,
             url_avatar AS "urlAvatar", biografia AS bio, localizacao AS location,
             esta_suspenso AS "estaSuspenso",
             criado_em AS "criadoEm"
      FROM utilizadores
      WHERE id = $1`,
      [id],
    );
  },
  async criar({
    name: nome,
    username: nomeUtilizador,
    email,
    password: palavraPasse,
    role: cargo = 'STUDENT',
    termosAceites: aceiteTermos = false,
  }) {
    const cleanNomeUtilizador = nomeUtilizador.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();
    const palavraPasseResumo = await bcrypt.hash(palavraPasse, 10);
    const utilizadorId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const agora = new Date().toISOString();
    const selecionadoAvatarUrl = sortearAvatarInicial();
    const destinoCargo = cargo === 'CREATOR' ? 'CREATOR' : 'STUDENT';

    await transacao(async () => {
      await executar(
        `INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, meta_diaria_minutos, minutos_hoje, minutos_totais, esta_suspenso, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '', '', 45, 0, 0, 0, $8, $9)`,
        [
          utilizadorId,
          cleanEmail,
          cleanNomeUtilizador,
          palavraPasseResumo,
          nome.trim(),
          destinoCargo,
          selecionadoAvatarUrl,
          agora,
          agora,
        ],
      );
      if (aceiteTermos)
        await executar(
          'INSERT INTO consentimentos_utilizador(id_utilizador,termos_aceites_em,versao_termos) VALUES($1,$2,$3)',
          [utilizadorId, agora, '2026-10-15'],
        );
      await executar(
        `INSERT INTO perfis (id, id_utilizador, titulo_perfil, e_publico, mostrar_classificacao, preferencia_tema)
         VALUES ($1, $2, '', 1, 1, 'light')`,
        [`prof-${utilizadorId}`, utilizadorId],
      );
      await executar(
        `INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
         VALUES ($1, $2, 'welcome', 'Bem-vindo ao NEXO!', 'Explore o catálogo de cursos e conecte-se com a comunidade.', '/explore', 0, $3)`,
        [`notif-${Date.now()}`, utilizadorId, agora],
      );
    });

    return {
      id: utilizadorId,
      name: nome.trim(),
      username: cleanNomeUtilizador,
      email: cleanEmail,
      role: destinoCargo,
      urlAvatar: selecionadoAvatarUrl,
    };
  },
  async compararPalavraPasse(simplesPalavraPasse, resumo) {
    return bcrypt.compare(simplesPalavraPasse, resumo);
  },
  async atualizar(id, campos = {}) {
    const COLUMN_MAP = {
      name: 'nome',
      bio: 'biografia',
      location: 'localizacao',
      urlAvatar: 'url_avatar',
      role: 'papel',
      objetivoDiarioMinutos: 'meta_diaria_minutos',
      minutosHoje: 'minutos_hoje',
      minutosTotais: 'minutos_totais',
      estaSuspenso: 'esta_suspenso',
    };
    const seguroKeys = Object.keys(campos).filter((k) => COLUMN_MAP[k]);
    if (seguroKeys.length === 0) return;
    const definirClauses = seguroKeys
      .map((k, indice) => `${COLUMN_MAP[k]} = $${indice + 1}`)
      .join(', ');
    const values = seguroKeys.map((k) => campos[k]);

    await executar(
      `UPDATE utilizadores SET ${definirClauses}, atualizado_em = $${seguroKeys.length + 1} WHERE id = $${seguroKeys.length + 2}`,
      [...values, new Date().toISOString(), id],
    );

    return this.procurarPorId(id);
  },
  async listarTodos(limite = 100, offset = 0) {
    return await consultarTodos(
      `SELECT id, nome AS name, nome_utilizador AS username, email, papel AS role,
             esta_suspenso AS "estaSuspenso", criado_em AS "criadoEm"
      FROM utilizadores
      ORDER BY criado_em DESC
      LIMIT $1 OFFSET $2`,
      [limite, offset],
    );
  },
};

module.exports = Utilizador;
