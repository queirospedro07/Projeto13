const { consultarUm, executar } = require('../base-dados/ligacao');

function validarPrecoReferencia(valor, preco, gratuito) {
  if (gratuito || valor === null || valor === '') return null;
  const numero = Math.round(Number(valor) * 100) / 100;
  if (!Number.isFinite(numero) || numero <= Number(preco) || numero > 9999999999.99)
    throw Object.assign(new Error('O preço anterior deve ser superior ao preço atual.'), {
      status: 400,
    });

  return numero;
}

async function guardarPrecoReferencia(id, dados, preco, gratuito) {
  if (dados.precoReferencia === undefined && !gratuito) return;
  const valor = validarPrecoReferencia(dados.precoReferencia, preco, gratuito);

  await executar('UPDATE cursos SET preco_referencia = $1 WHERE id = $2', [valor, id]);
}

async function obterPrecoReferencia(id) {
  const curso = await consultarUm('SELECT preco_referencia FROM cursos WHERE id = $1', [id]);

  return curso?.preco_referencia == null ? null : Number(curso.preco_referencia);
}

module.exports = { validarPrecoReferencia, guardarPrecoReferencia, obterPrecoReferencia };
