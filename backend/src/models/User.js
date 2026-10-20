const bcrypt = require('bcryptjs');
const { queryOne, queryAll, execute, transaction } = require('../database/connection.js');
const User = {
  async findByEmail(email) {
    return await queryOne(
      `SELECT id, email, nome_utilizador AS username,
             nome AS name, papel AS role, url_avatar AS "avatarUrl", biografia AS bio,
             localizacao AS location, meta_diaria_minutos AS "dailyGoalMinutes", minutos_hoje AS "minutesToday",
             minutos_totais AS "totalMinutes", esta_suspenso AS "isSuspended",
             criado_em AS "createdAt", atualizado_em AS "updatedAt"
      FROM utilizadores
      WHERE LOWER(email) = $1`,
      [email.toLowerCase().trim()],
    );
  },
  async findByUsername(username) {
    return await queryOne(
      `SELECT id, email, nome_utilizador AS username,
             nome AS name, papel AS role, url_avatar AS "avatarUrl", biografia AS bio,
             localizacao AS location, meta_diaria_minutos AS "dailyGoalMinutes", minutos_hoje AS "minutesToday",
             minutos_totais AS "totalMinutes", esta_suspenso AS "isSuspended",
             criado_em AS "createdAt", atualizado_em AS "updatedAt"
      FROM utilizadores
      WHERE LOWER(nome_utilizador) = $1`,
      [username.toLowerCase().trim()],
    );
  },
  async findById(id) {
    return await queryOne(
      `SELECT id, nome AS name, nome_utilizador AS username, email, papel AS role,
             url_avatar AS "avatarUrl", biografia AS bio, localizacao AS location,
             esta_suspenso AS "isSuspended",
             criado_em AS "createdAt"
      FROM utilizadores
      WHERE id = $1`,
      [id],
    );
  },
  async create({ name, username, email, password, role = 'STUDENT', acceptedTerms = false }) {
    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const selectedAvatarUrl = null;
    const targetRole = role === 'CREATOR' ? 'CREATOR' : 'STUDENT';

    await transaction(async () => {
      await execute(
        `INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, meta_diaria_minutos, minutos_hoje, minutos_totais, esta_suspenso, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '', '', 45, 0, 0, 0, $8, $9)`,
        [
          userId,
          cleanEmail,
          cleanUsername,
          passwordHash,
          name.trim(),
          targetRole,
          selectedAvatarUrl,
          now,
          now,
        ],
      );
      if (acceptedTerms)
        await execute(
          'INSERT INTO consentimentos_utilizador(id_utilizador,termos_aceites_em,versao_termos) VALUES($1,$2,$3)',
          [userId, now, '2026-10-15'],
        );
      await execute(
        `INSERT INTO perfis (id, id_utilizador, titulo_perfil, e_publico, mostrar_classificacao, preferencia_tema)
         VALUES ($1, $2, '', 1, 1, 'light')`,
        [`prof-${userId}`, userId],
      );
      await execute(
        `INSERT INTO notificacoes (id, id_utilizador, tipo, titulo, conteudo, ligacao, esta_lida, criado_em)
         VALUES ($1, $2, 'welcome', 'Bem-vindo ao NEXO!', 'Explore o catálogo de cursos e conecte-se com a comunidade.', '/explore', 0, $3)`,
        [`notif-${Date.now()}`, userId, now],
      );
    });

    return {
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role: targetRole,
      avatarUrl: selectedAvatarUrl,
    };
  },
  async comparePassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },
  async update(id, fields = {}) {
    const COLUMN_MAP = {
      name: 'nome',
      bio: 'biografia',
      location: 'localizacao',
      avatarUrl: 'url_avatar',
      role: 'papel',
      dailyGoalMinutes: 'meta_diaria_minutos',
      minutesToday: 'minutos_hoje',
      totalMinutes: 'minutos_totais',
      isSuspended: 'esta_suspenso',
    };
    const safeKeys = Object.keys(fields).filter((k) => COLUMN_MAP[k]);
    if (safeKeys.length === 0) return;
    const setClauses = safeKeys.map((k, index) => `${COLUMN_MAP[k]} = $${index + 1}`).join(', ');
    const values = safeKeys.map((k) => fields[k]);

    await execute(
      `UPDATE utilizadores SET ${setClauses}, atualizado_em = $${safeKeys.length + 1} WHERE id = $${safeKeys.length + 2}`,
      [...values, new Date().toISOString(), id],
    );

    return this.findById(id);
  },
  async listAll(limit = 100, offset = 0) {
    return await queryAll(
      `SELECT id, nome AS name, nome_utilizador AS username, email, papel AS role,
             esta_suspenso AS "isSuspended", criado_em AS "createdAt"
      FROM utilizadores
      ORDER BY criado_em DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  },
};

module.exports = User;
