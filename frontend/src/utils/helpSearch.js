export const normalizarPesquisar = (valor) =>
  String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-PT')
    .trim();

export function filtrarPerguntasFrequentes(categorias, consultar, categoria = 'all') {
  const termos = normalizarPesquisar(consultar).split(/\s+/).filter(Boolean);

  return categorias
    .filter((group) => categoria === 'all' || categoria === group.category)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const conteudo = normalizarPesquisar(`${group.category} ${item.q} ${item.a}`);

        return termos.every((term) => conteudo.includes(term));
      }),
    }))
    .filter((group) => group.items.length > 0);
}
