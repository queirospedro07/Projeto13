// Compatibilidade limitada às versões conhecidas da migração 005.
// O checksum histórico fica intacto; a migração 006 adapta as vistas.
const RESUMO_ATUAL_005 = '95e07eaa2e725cd9cf9dfb5c60c7ac1c7f8b983bb591a03cd6330c7910545f2c';
const RESUMOS_ANTERIORES_005 = new Set([
  '6dbf7faca0c2283b7e948a93a844292ace80b788828e7484fb12f749c2313783',
  'c089ccc029acf71cf3a5d8ae24222436449b9d3993f81a6b64dbabdfd155f71b',
  'aead097777188542a9c21cc2a0b6657915e58d04e2960501cccc99f3db390fcb',
  '1fd6a2dc49dd0ab49f4b0597c207a90d17e0eaf5671637e320a045ef355478c4',
  '81d288defd6382a0fab49d7a26fafb0e7f2a74ec8e3667ce059ca9b5697c06ea',
  '7d2f595e00aa50c232d28368c0af709fa7cab75cfa85a540a7bca0e55b3fabba',
  'a48d3c6ea1d299910daf6f3ad7112991557ac3efa71235bf1533484ea2f443b6',
  '6bcf68b51195ba9d73c8c8f9d7d547eaf19aec95847173837910f36d8faf94a2',
  '088647db20b79b2b422846e471c69913f1e81d83ded86cda5b09f4d50cd12e9c',
  '3dbcf9109d25c1404d12b6c0172c9d99dd2ff0c07a3147ae2f8c46ce71c86834',
  '6f1f1df68d1e1241c9bebd50ac57fe02d4b1c513a26640ba4cd91253160d87e6',
]);

function reconhecerConsultaAnterior(nome, resumoAplicado, resumoAtual) {
  return (
    nome === '005_consultas_portugues.sql' &&
    resumoAtual === RESUMO_ATUAL_005 &&
    RESUMOS_ANTERIORES_005.has(resumoAplicado)
  );
}

module.exports = { reconhecerConsultaAnterior };
