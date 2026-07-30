export const CATEGORIES = (
  [
    ['Colares', 'colares'],
    ['Brincos', 'brincos'],
    ['Anéis', 'aneis'],
    ['Pulseiras', 'pulseiras'],
    ['Conjuntos', 'conjuntos'],
    ['Piercings', 'piercings'],
  ] as const
).map(([nome, slug], i) => ({ nome, slug, imagem: null, ordem: i, ativa: true }));
