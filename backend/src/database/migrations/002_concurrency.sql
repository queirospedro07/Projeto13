CREATE UNIQUE INDEX IF NOT EXISTS idx_certificados_utilizador_curso
  ON certificados(id_utilizador, id_curso);
CREATE UNIQUE INDEX IF NOT EXISTS idx_simulacoes_aprovadas_utilizador_curso
  ON simulacoes_pagamento(id_utilizador, id_curso) WHERE estado = 'approved';
