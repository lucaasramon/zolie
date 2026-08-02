import { env } from '@/lib/env';

/** Absolutiza caminhos de imagem: o Google exige URL completa no JSON-LD. */
export function urlAbsoluta(caminho?: string | null): string | undefined {
  if (!caminho) return undefined;
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${env.appUrl}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
}

interface ProdutoJsonLd {
  nome: string;
  slug: string;
  descricao: string;
  imagens?: string[];
  material: string;
  precoEfetivo: number;
  disponivel: boolean;
  notaMedia: number;
  totalAvaliacoes: number;
  categoria?: { nome: string } | null;
}

const MATERIAL_JSONLD: Record<string, string> = {
  PRATA_925: 'Prata 925',
  BANHADO_OURO: 'Banhado a ouro 18k',
};

/**
 * Schema.org Product — alimenta o rich result do Google (preço, estoque, estrelas).
 * `aggregateRating` só entra quando há avaliação: declará-lo com 0 avaliações é
 * violação das diretrizes e pode custar o rich result da página inteira.
 */
export function produtoJsonLd(p: ProdutoJsonLd) {
  const imagens = (p.imagens || []).map(urlAbsoluta).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nome,
    description: p.descricao,
    ...(imagens.length && { image: imagens }),
    ...(p.material && { material: MATERIAL_JSONLD[p.material] || p.material }),
    ...(p.categoria?.nome && { category: p.categoria.nome }),
    brand: { '@type': 'Brand', name: 'Zoliê Semijoias' },
    offers: {
      '@type': 'Offer',
      url: `${env.appUrl}/produtos/${p.slug}`,
      priceCurrency: 'BRL',
      price: p.precoEfetivo.toFixed(2),
      availability: p.disponivel
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Zoliê Semijoias' },
    },
    ...(p.totalAvaliacoes > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(p.notaMedia).toFixed(1),
        reviewCount: p.totalAvaliacoes,
      },
    }),
  };
}

/** Trilha de navegação — o Google usa para exibir o caminho no lugar da URL crua. */
export function breadcrumbJsonLd(itens: { nome: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.nome,
      item: `${env.appUrl}${item.url}`,
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zoliê Semijoias',
    url: env.appUrl,
    logo: urlAbsoluta('/images/zolie-logo.png'),
    description:
      'Semijoias em prata 925 e banho de ouro 18k — colares, brincos, anéis, pulseiras e conjuntos.',
  };
}

/** Serializa com escape de `<` para impedir quebra do bloco <script>. */
export function jsonLdScript(dados: unknown) {
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}
