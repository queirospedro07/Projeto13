-- As contas ADMIN existentes conservam também o acesso de formador.
-- Nas restantes contas, o papel CREATOR é que concede acesso de formador.
ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS admin_formador INTEGER NOT NULL DEFAULT 1 CHECK (admin_formador IN (0, 1));
CREATE OR REPLACE VIEW users AS
SELECT id, email, nome_utilizador AS username, hash_palavra_passe AS "passwordHash", nome AS name,
  papel AS role, url_avatar AS "avatarUrl", biografia AS bio, localizacao AS location,
  meta_diaria_minutos AS "dailyGoalMinutes", minutos_hoje AS "minutesToday",
  minutos_totais AS "totalMinutes", 0 AS xp, 1 AS level, esta_suspenso AS "isSuspended",
  criado_em AS "createdAt", atualizado_em AS "updatedAt",
  (papel = 'CREATOR' OR (papel = 'ADMIN' AND admin_formador = 1)) AS "isTeacher"
FROM utilizadores;
