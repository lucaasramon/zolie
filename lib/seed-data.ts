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

/**
 * Produtos fictícios do seed original foram removidos em favor do catálogo real
 * (fotos reais, criado via prisma/seed-fotos-reais.ts — script já descartado
 * após uso único). Interface mantida caso um novo lote de seed seja necessário.
 */
export interface SeedProduct {
  nome: string;
  slug: string;
  descricao: string;
  cuidados: string;
  preco: number;
  precoPromocional?: number;
  material: 'PRATA_925' | 'BANHADO_OURO';
  categoria: string;
  estoque: number;
  pesoGramas: number;
  pedra?: string;
  tamanhos?: string[];
  destaque?: boolean;
  lancamento?: boolean;
  notaMedia: number;
  totalAvaliacoes: number;
}

export const PRODUCTS: SeedProduct[] = [];
