export const ADDITIONAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS consentimentos_utilizador (
 id_utilizador TEXT PRIMARY KEY REFERENCES utilizadores(id) ON DELETE CASCADE,
 termos_aceites_em TEXT NOT NULL,
 versao_termos TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS resolucoes_mensagens (
 id_mensagem TEXT PRIMARY KEY REFERENCES mensagens(id) ON DELETE CASCADE,
 id_utilizador TEXT NOT NULL REFERENCES utilizadores(id),
 resolvido_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pedidos_suporte (
 id TEXT PRIMARY KEY,
 id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
 assunto TEXT NOT NULL,
 mensagem TEXT NOT NULL,
 estado TEXT NOT NULL DEFAULT 'OPEN',
 resposta TEXT NOT NULL DEFAULT '',
 criado_em TEXT NOT NULL,
 atualizado_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS submissoes_questionario (
  id TEXT PRIMARY KEY,
  id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  id_aula TEXT NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  respostas TEXT NOT NULL,
  resultado TEXT NOT NULL,
  nota INTEGER NOT NULL,
  aprovado INTEGER NOT NULL DEFAULT 0,
  pendente INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  revisto_por TEXT REFERENCES utilizadores(id),
  revisto_em TEXT
);
CREATE INDEX IF NOT EXISTS idx_submissoes_aluno_aula ON submissoes_questionario(id_utilizador, id_aula, criado_em);
CREATE TABLE IF NOT EXISTS submissoes_projeto (
 id TEXT PRIMARY KEY,
 id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
 id_aula TEXT NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
 url TEXT NOT NULL,
 estado TEXT NOT NULL DEFAULT 'SUBMITTED',
 parecer TEXT NOT NULL DEFAULT '',
 criado_em TEXT NOT NULL,
 revisto_por TEXT REFERENCES utilizadores(id),
 revisto_em TEXT
);
CREATE INDEX IF NOT EXISTS idx_projetos_aluno_aula ON submissoes_projeto(id_utilizador, id_aula, criado_em);
CREATE TABLE IF NOT EXISTS denuncias (
  id TEXT PRIMARY KEY,
  id_utilizador TEXT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  tipo_alvo TEXT NOT NULL,
  id_alvo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'OPEN',
  parecer TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
`;
