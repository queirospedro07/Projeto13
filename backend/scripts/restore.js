const fs = require('node:fs');
const { connectDB, getPool, closeDatabase } = require('../src/database/connection.js');

async function main() {
  try {
    if (!process.argv[2]) throw new Error('Utilização: npm run restore -- caminho/do/backup.json');
    const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    if (
      snapshot.format !== 'nexo-postgresql-v1' ||
      !snapshot.tables ||
      Array.isArray(snapshot.tables)
    )
      throw new Error('Formato de backup inválido.');
    await connectDB();

    const schema = fs.readFileSync(
      require('node:path').resolve(__dirname, '../src/database/migrations/001_initial.sql'),
      'utf8',
    );
    const names = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(
      (match) => match[1],
    );
    if (Object.keys(snapshot.tables).some((name) => !names.includes(name)))
      throw new Error('O backup contém tabelas desconhecidas.');
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      for (const name of names) {
        const count = Number((await client.query(`SELECT COUNT(*) AS n FROM "${name}"`)).rows[0].n);
        if (count)
          throw new Error(
            'O restauro exige uma base de dados vazia. Os dados existentes foram conservados.',
          );
      }

      for (const name of names) {
        const rows = snapshot.tables[name] || [];
        if (!Array.isArray(rows)) throw new Error(`Tabela inválida: ${name}`);
        const allowed = (
          await client.query(
            'SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1',
            [name],
          )
        ).rows.map((row) => row.column_name);
        for (const row of rows) {
          const columns = Object.keys(row);
          if (!columns.length || columns.some((column) => !allowed.includes(column)))
            throw new Error(`Colunas inválidas: ${name}`);
          await client.query(
            `INSERT INTO "${name}" (${columns.map((column) => `"${column}"`).join(',')}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(',')})`,
            columns.map((column) => row[column]),
          );
        }

        const count = Number((await client.query(`SELECT COUNT(*) AS n FROM "${name}"`)).rows[0].n);
        if (count !== rows.length) throw new Error(`Falhou a verificação de ${name}.`);
      }

      await client.query('COMMIT');
      console.log('Backup PostgreSQL restaurado e contagens verificadas.');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
