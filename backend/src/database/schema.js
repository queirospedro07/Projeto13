const { reconhecerConsultaAnterior } = require('./migrationCompatibility.js');
const {
  readFileSync: lerFicheiroSincronizar,
  readdirSync: readdirSincronizar,
} = require('node:fs');
const { createHash: criarResumo } = require('node:crypto');
const { obterConjuntoLigacoes } = require('./connection.js');

async function executarMigracoes(conjuntoLigacoes = obterConjuntoLigacoes()) {
  const client = await conjuntoLigacoes.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(63842915)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS nexo_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );

    const diretorio = require('node:path').resolve(__dirname, './migrations/');
    for (const nome of readdirSincronizar(diretorio)
      .filter((ficheiro) => ficheiro.endsWith('.sql'))
      .sort()) {
      const sql = lerFicheiroSincronizar(
        require('node:path').resolve(__dirname, `./migrations/${nome}`),
        'utf8',
      );
      const checksum = criarResumo('sha256').update(sql).digest('hex');
      const existente = (
        await client.query('SELECT checksum FROM nexo_migrations WHERE name = $1', [nome])
      ).rows[0];
      if (existente && existente.checksum !== checksum) {
        const atualizacaoDisponivel = require('node:fs').existsSync(
          require('node:path').join(diretorio, '006_atualizar_consultas_portugues.sql'),
        );
        if (
          !atualizacaoDisponivel ||
          !reconhecerConsultaAnterior(nome, existente.checksum, checksum)
        )
          throw new Error(
            `A migração ${nome} foi alterada depois de aplicada. Resumo aplicado: ${existente.checksum}; resumo do ficheiro: ${checksum}.`,
          );
      }

      if (!existente) {
        await client.query(sql);
        await client.query('INSERT INTO nexo_migrations(name, checksum) VALUES ($1, $2)', [
          nome,
          checksum,
        ]);
      }
    }

    await client.query('COMMIT');
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}

exports.executarMigracoes = executarMigracoes;
