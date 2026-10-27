require('../configuracao/ambiente.js');

const { AsyncLocalStorage } = require('node:async_hooks');
const pg = require('pg');

pg.types.setTypeParser(20, (valor) => Number(valor));
pg.types.setTypeParser(1700, (valor) => Number(valor));

let conjuntoLigacoes;
const transacaoContexto = new AsyncLocalStorage();

function obterConjuntoLigacoes() {
  if (conjuntoLigacoes) return conjuntoLigacoes;
  if (!process.env.DATABASE_URL)
    throw new Error('Configure DATABASE_URL com a ligação PostgreSQL.');
  const schema = process.env.DATABASE_SCHEMA || 'public';
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('DATABASE_SCHEMA inválido.');
  conjuntoLigacoes = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    options: `-c search_path=${schema},public`,
    ...(process.env.PGSSL === 'true'
      ? {
          ssl: {
            rejectUnauthorized: true,
          },
        }
      : {}),
  });
  conjuntoLigacoes.on('error', (erro) => console.error('Ligação PostgreSQL:', erro.message));

  return conjuntoLigacoes;
}

async function query(sql, parametros = []) {
  const client = transacaoContexto.getStore()?.client || obterConjuntoLigacoes();

  return client.query(sql, parametros);
}

async function consultarUm(sql, parametros = []) {
  return (await query(sql, parametros)).rows[0];
}

async function consultarTodos(sql, parametros = []) {
  return (await query(sql, parametros)).rows;
}

async function executar(sql, parametros = []) {
  const resultado = await query(sql, parametros);

  return {
    changes: resultado.rowCount,
    rowCount: resultado.rowCount,
  };
}

async function transacao(funcaoRetorno) {
  const atual = transacaoContexto.getStore();
  if (atual) {
    const savepoint = `nested_${++atual.sequence}`;

    await atual.client.query(`SAVEPOINT ${savepoint}`);
    try {
      const resultado = await funcaoRetorno();

      await atual.client.query(`RELEASE SAVEPOINT ${savepoint}`);

      return resultado;
    } catch (erro) {
      await atual.client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      throw erro;
    }
  }

  const client = await obterConjuntoLigacoes().connect();
  try {
    await client.query('BEGIN');

    const resultado = await transacaoContexto.run(
      {
        client,
        sequence: 0,
      },
      funcaoRetorno,
    );

    await client.query('COMMIT');

    return resultado;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}

async function bloquearTransacao(recurso) {
  const atual = transacaoContexto.getStore();
  if (!atual) throw new Error('O bloqueio exige uma transação ativa.');
  await atual.client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [recurso]);
}

async function fecharBaseDados() {
  if (conjuntoLigacoes) {
    await conjuntoLigacoes.end();
    conjuntoLigacoes = undefined;
  }
}

async function ligarBaseDados() {
  await obterConjuntoLigacoes().query('SELECT 1');

  const { executarMigracoes } = require('./esquema.js');

  await executarMigracoes();

  return obterConjuntoLigacoes();
}

exports.obterConjuntoLigacoes = obterConjuntoLigacoes;
exports.query = query;
exports.consultarUm = consultarUm;
exports.consultarTodos = consultarTodos;
exports.executar = executar;
exports.transacao = transacao;
exports.bloquearTransacao = bloquearTransacao;
exports.fecharBaseDados = fecharBaseDados;
exports.ligarBaseDados = ligarBaseDados;
