-- Preço anterior opcional, sem alterar as vistas ou migrações existentes.
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS preco_referencia NUMERIC(12,2);
ALTER TABLE cursos ADD CONSTRAINT cursos_preco_referencia_valido CHECK (preco_referencia IS NULL OR (preco_referencia > preco AND preco >= 0));
