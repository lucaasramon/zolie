import { describe, expect, it } from 'vitest';
import {
  produtoJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  urlAbsoluta,
  jsonLdScript,
} from './jsonLd';

const BASE = {
  nome: 'Colar Aurora',
  slug: 'colar-aurora',
  descricao: 'Colar delicado em prata 925.',
  imagens: ['/uploads/colar.png'],
  material: 'PRATA_925',
  precoEfetivo: 149.9,
  disponivel: true,
  notaMedia: 4.5,
  totalAvaliacoes: 12,
  categoria: { nome: 'Colares' },
};

describe('produtoJsonLd', () => {
  it('monta a oferta com preço em BRL e duas casas decimais', () => {
    const ld = produtoJsonLd(BASE) as any;
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.priceCurrency).toBe('BRL');
    // O Google rejeita preço com formatação de moeda ou vírgula decimal.
    expect(ld.offers.price).toBe('149.90');
  });

  it('marca disponibilidade conforme o estoque', () => {
    expect((produtoJsonLd(BASE) as any).offers.availability).toBe('https://schema.org/InStock');
    expect((produtoJsonLd({ ...BASE, disponivel: false }) as any).offers.availability).toBe(
      'https://schema.org/OutOfStock',
    );
  });

  it('inclui aggregateRating quando existem avaliações', () => {
    const ld = produtoJsonLd(BASE) as any;
    expect(ld.aggregateRating.ratingValue).toBe('4.5');
    expect(ld.aggregateRating.reviewCount).toBe(12);
  });

  it('OMITE aggregateRating quando não há avaliação', () => {
    // Declarar rating com 0 avaliações viola as diretrizes do Google e pode
    // custar o rich result da página inteira.
    const ld = produtoJsonLd({ ...BASE, totalAvaliacoes: 0, notaMedia: 0 }) as any;
    expect(ld.aggregateRating).toBeUndefined();
  });

  it('absolutiza as imagens', () => {
    const ld = produtoJsonLd(BASE) as any;
    expect(ld.image[0]).toMatch(/^https?:\/\/.+\/uploads\/colar\.png$/);
  });

  it('omite o campo image quando o produto não tem foto', () => {
    const ld = produtoJsonLd({ ...BASE, imagens: [] }) as any;
    expect(ld.image).toBeUndefined();
  });

  it('usa o slug como sku quando o produto não tem sku cadastrado', () => {
    expect((produtoJsonLd(BASE) as any).sku).toBe('colar-aurora');
    expect((produtoJsonLd({ ...BASE, sku: 'ZL-001' }) as any).sku).toBe('ZL-001');
  });

  it('declara a política de devolução na oferta', () => {
    const politica = (produtoJsonLd(BASE) as any).offers.hasMerchantReturnPolicy;
    expect(politica.applicableCountry).toBe('BR');
    expect(politica.merchantReturnDays).toBe(30);
  });

  it('marca só avaliações com texto e expõe apenas o primeiro nome', () => {
    const ld = produtoJsonLd(BASE, [
      { nota: 5, comentario: 'Linda!', createdAt: '2026-10-01T12:00:00Z', user: { nome: 'Maria Souza' } },
      { nota: 4, createdAt: '2026-10-02T12:00:00Z', user: { nome: 'Ana' } },
    ]) as any;
    expect(ld.review).toHaveLength(1);
    expect(ld.review[0].author.name).toBe('Maria');
    expect(ld.review[0].datePublished).toBe('2026-10-01');
  });

  it('omite review quando não há avaliação com texto', () => {
    expect((produtoJsonLd(BASE) as any).review).toBeUndefined();
  });

  it('traduz o enum de material para texto legível', () => {
    expect((produtoJsonLd(BASE) as any).material).toBe('Prata 925');
    expect((produtoJsonLd({ ...BASE, material: 'BANHADO_OURO' }) as any).material).toBe(
      'Banhado a ouro 18k',
    );
  });
});

describe('breadcrumbJsonLd', () => {
  it('numera as posições a partir de 1 e absolutiza as URLs', () => {
    const ld = breadcrumbJsonLd([
      { nome: 'Início', url: '/' },
      { nome: 'Colares', url: '/produtos?categoria=colares' },
    ]) as any;
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[1].item).toMatch(/^https?:\/\//);
  });
});

describe('itemListJsonLd', () => {
  it('continua a numeração a partir da página atual', () => {
    const ld = itemListJsonLd([{ slug: 'a', nome: 'A' }, { slug: 'b', nome: 'B' }], 9) as any;
    expect(ld.itemListElement[0].position).toBe(10);
    expect(ld.itemListElement[1].url).toMatch(/^https?:\/\/.+\/produtos\/b$/);
  });
});

describe('organizationJsonLd / websiteJsonLd', () => {
  it('ligam site e loja pelo mesmo @id', () => {
    const org = organizationJsonLd() as any;
    const site = websiteJsonLd() as any;
    expect(org['@type']).toBe('OnlineStore');
    expect(site.publisher['@id']).toBe(org['@id']);
  });
});

describe('urlAbsoluta', () => {
  it('preserva URLs que já são absolutas', () => {
    expect(urlAbsoluta('https://cdn.exemplo.com/a.png')).toBe('https://cdn.exemplo.com/a.png');
  });

  it('devolve undefined para valor vazio', () => {
    expect(urlAbsoluta(null)).toBeUndefined();
    expect(urlAbsoluta('')).toBeUndefined();
  });
});

describe('jsonLdScript', () => {
  it('escapa < para impedir fechamento prematuro do <script>', () => {
    const saida = jsonLdScript({ nome: '</script><img onerror=alert(1)>' });
    expect(saida).not.toContain('</script>');
    expect(saida).toContain('\\u003c');
  });
});
