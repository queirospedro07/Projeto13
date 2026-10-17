export const normalizeSearch = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-PT')
    .trim();
export function filterFaq(categories, query, category = 'all') {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return categories
    .filter((group) => category === 'all' || category === group.category)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const content = normalizeSearch(`${group.category} ${item.q} ${item.a}`);
        return terms.every((term) => content.includes(term));
      }),
    }))
    .filter((group) => group.items.length > 0);
}
