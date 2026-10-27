const { lerJsonCompativel } = require('../utilitarios/compatibilidadeCampos.js');
const { consultarUm, executar } = require('../base-dados/ligacao.js');
const SUPPORTED = new Set([
  'website',
  'github',
  'linkedin',
  'instagram',
  'twitter',
  'youtube',
  'tiktok',
  'twitch',
  'discord',
  'facebook',
]);

function validarSocialLigacoes(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada))
    throw new Error('As redes sociais devem ser um objeto.');
  const resultado = {};
  for (const [chave, raw] of Object.entries(entrada)) {
    if (!SUPPORTED.has(chave)) throw new Error('Rede social não suportada.');
    if (typeof raw !== 'string' || raw.length > 500)
      throw new Error('Cada link deve ter até 500 caracteres.');
    const valor = raw.trim();
    if (!valor) continue;
    let url;
    try {
      url = new URL(valor);
    } catch {
      throw new Error('Introduza links http ou https válidos.');
    }

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname.includes('.') ||
      url.username ||
      url.password ||
      /\s/.test(valor)
    ) {
      throw new Error('Introduza links http ou https válidos.');
    }

    resultado[chave] = url.href;
  }

  return resultado;
}

async function obterPerfilSocialLigacoes(utilizadorId) {
  const registo = await consultarUm(
    'SELECT ligacoes FROM ligacoes_sociais_perfil WHERE id_utilizador = $1',
    [utilizadorId],
  );
  try {
    return registo ? validarSocialLigacoes(lerJsonCompativel(registo.ligacoes)) : {};
  } catch {
    return {};
  }
}

async function guardarPerfilSocialLigacoes(utilizadorId, ligacoes) {
  await executar(
    `INSERT INTO ligacoes_sociais_perfil (id_utilizador, ligacoes) VALUES ($1, $2)
    ON CONFLICT (id_utilizador) DO UPDATE SET ligacoes = excluded.ligacoes`,
    [utilizadorId, JSON.stringify(ligacoes)],
  );
}

exports.validarSocialLigacoes = validarSocialLigacoes;
exports.obterPerfilSocialLigacoes = obterPerfilSocialLigacoes;
exports.guardarPerfilSocialLigacoes = guardarPerfilSocialLigacoes;
