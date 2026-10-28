import { env } from '@/lib/env';
import { LOJA, formatarCnpj } from '@/lib/loja';

const NOME_LOJA = 'Zoliê Semijoias';
const DESCRICAO_LOJA =
  'Semijoias em prata 925 e banho de ouro 18k — colares, brincos, anéis, pulseiras e conjuntos.';

/** URL base sem barra final, para não gerar `//` ao concatenar caminhos. */
function base(): string {
  return env.appUrl.replace(/\/$/, '');
}

/**
 * `@id` estáveis: permitem que produto, site e oferta apontem para a mesma
 * entidade da loja em vez de repetir os dados (o Google cruza pelo id).
 */
const idOrganizacao = () => `${base()}/#organizacao`;
const idSite = () => `${base()}/#site`;

/** Absolutiza caminhos de imagem: o Google exige URL completa no JSON-LD. */
export function urlAbsoluta(caminho?: string | null): string | undefined {
  if (!caminho) return undefined;
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${base()}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
}

/**
 * Política de devolução declarada no Merchant Center/Search: sem ela o Google
 * marca o produto com aviso em "Listagens do comerciante". 30 dias é o prazo da
 * loja exibido em /trocas e /termos e validado em return.service.ts.
 */
function politicaDevolucao() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'BR',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 30,
    returnMethod: 'https://schema.org/ReturnByMail',
    merchantReturnLink: `${base()}/trocas`,
  };
}

interface AvaliacaoJsonLd {
  nota: number;
  titulo?: string | null;
  comentario?: string | null;
  createdAt: Date | string;
  user?: { nome?: string | null } | null;
}

interface ProdutoJsonLd {
  nome: string;
  slug: string;
  sku?: string | null;
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
  PRATA_750: 'Prata 750',
  BANHADO_OURO: 'Banhado a ouro 18k',
  ACO: 'Aço',
};

/**
 * Schema.org Product — alimenta o rich result do Google (preço, estoque, estrelas).
 * `aggregateRating` só entra quando há avaliação: declará-lo com 0 avaliações é
 * violação das diretrizes e pode custar o rich result da página inteira.
 * `avaliacoes` são as exibidas na página — o Google exige que o review marcado
 * esteja visível para o usuário.
 */
export function produtoJsonLd(p: ProdutoJsonLd, avaliacoes: AvaliacaoJsonLd[] = []) {
  const url = `${base()}/produtos/${p.slug}`;
  const imagens = (p.imagens || []).map(urlAbsoluta).filter(Boolean);
  const reviews = avaliacoes
    .filter(r => r.comentario || r.titulo)
    .slice(0, 5)
    .map(r => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.nota, bestRating: 5, worstRating: 1 },
      // Só o primeiro nome: o JSON-LD é público e indexável.
      author: { '@type': 'Person', name: (r.user?.nome || 'Cliente').split(' ')[0] },
      datePublished: new Date(r.createdAt).toISOString().slice(0, 10),
      ...(r.titulo && { name: r.titulo }),
      ...(r.comentario && { reviewBody: r.comentario }),
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#produto`,
    url,
    name: p.nome,
    description: p.descricao,
    sku: p.sku || p.slug,
    ...(imagens.length && { image: imagens }),
    ...(p.material && { material: MATERIAL_JSONLD[p.material] || p.material }),
    ...(p.categoria?.nome && { category: p.categoria.nome }),
    brand: { '@type': 'Brand', name: NOME_LOJA },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: p.precoEfetivo.toFixed(2),
      availability: p.disponivel
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', '@id': idOrganizacao(), name: NOME_LOJA },
      hasMerchantReturnPolicy: politicaDevolucao(),
    },
    ...(p.totalAvaliacoes > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(p.notaMedia).toFixed(1),
        reviewCount: p.totalAvaliacoes,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(reviews.length && { review: reviews }),
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
      item: `${base()}${item.url}`,
    })),
  };
}

/** Lista de produtos de uma página de categoria/listagem, na ordem exibida. */
export function itemListJsonLd(produtos: { slug: string; nome: string }[], posicaoInicial = 0) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: produtos.map((p, i) => ({
      '@type': 'ListItem',
      position: posicaoInicial + i + 1,
      url: `${base()}/produtos/${p.slug}`,
      name: p.nome,
    })),
  };
}

/**
 * A loja como entidade (OnlineStore é o subtipo de Organization que o Google
 * recomenda para e-commerce). Dados legais e de contato só entram quando
 * configurados — o mesmo critério do rodapé.
 */
export function organizationJsonLd() {
  const instagram = LOJA.instagram ? `https://instagram.com/${LOJA.instagram.replace(/^@/, '')}` : null;
  const whatsapp = LOJA.whatsapp ? `+${LOJA.whatsapp.startsWith('55') ? '' : '55'}${LOJA.whatsapp}` : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': idOrganizacao(),
    name: NOME_LOJA,
    alternateName: 'Zoliê',
    url: `${base()}/`,
    logo: urlAbsoluta('/images/zolie-logo.png'),
    image: urlAbsoluta('/images/zolie-logo.png'),
    description: DESCRICAO_LOJA,
    areaServed: { '@type': 'Country', name: 'BR' },
    ...(LOJA.razaoSocial && { legalName: LOJA.razaoSocial }),
    ...(LOJA.cnpj && { taxID: formatarCnpj(LOJA.cnpj) }),
    ...(LOJA.endereco && { address: LOJA.endereco }),
    ...(LOJA.email && { email: LOJA.email }),
    ...(instagram && { sameAs: [instagram] }),
    ...((whatsapp || LOJA.email) && {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: 'Portuguese',
        ...(whatsapp && { telephone: whatsapp }),
        ...(LOJA.email && { email: LOJA.email }),
      },
    }),
    hasMerchantReturnPolicy: politicaDevolucao(),
  };
}

/** Define o nome do site exibido pelo Google acima do título nos resultados. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': idSite(),
    url: `${base()}/`,
    name: NOME_LOJA,
    alternateName: ['Zoliê', 'Zolie Semijoias'],
    inLanguage: 'pt-BR',
    publisher: { '@id': idOrganizacao() },
  };
}

/** Serializa com escape de `<` para impedir quebra do bloco <script>. */
export function jsonLdScript(dados: unknown) {
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}
