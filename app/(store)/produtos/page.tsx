import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { list as listProducts } from '@/lib/services/product.service';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { reviewRepo } from '@/lib/repositories/review.repo';
import { listParaLoja, SLUG_PERSONALIZADOS } from '@/lib/services/category.service';
import { ZolieCard } from '@/components/product/ZolieCard';
import { ProductFiltersSidebar } from '@/components/product/ProductFiltersSidebar';
import { ProductSortSelect } from '@/components/product/ProductSortSelect';
import { FotoPersonalizado, PersonalizadosIntro } from '@/components/product/PersonalizadosIntro';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdScript } from '@/lib/utils/jsonLd';
import { OG_BASE } from '@/lib/utils/seo';

/** Quantas fotos a abertura dos Personalizados mostra (completa com fotos dos anúncios). */
const FOTOS_INTRO = 6;

// A listagem depende de `searchParams`, então o Next sempre a renderiza por
// requisição (e responde `Cache-Control: private, no-store`). Nada aqui lê
// cookies/sessão, por isso o HTML é cacheado no CDN da Vercel pelo header
// `Vercel-CDN-Cache-Control` definido em next.config.ts — chaveado pela URL
// completa, cada combinação de filtros tem sua própria cópia.

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;

  // Só a listagem "limpa", as de categoria e a paginação delas são indexáveis.
  // Combinações de filtro, ordenação e busca geram infinitas URLs de conteúdo
  // praticamente igual — indexá-las dilui a relevância e desperdiça crawl budget.
  const filtrosSecundarios = ['q', 'material', 'pedra', 'tamanho', 'notaMin', 'precoMin', 'precoMax', 'promocao', 'sort'];
  const temFiltroSecundario = filtrosSecundarios.some(f => sp[f]);
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);

  let titulo = 'Todas as peças em Prata 925 e Banho de Ouro 18k';
  let descricao =
    'Colares, brincos, anéis, pulseiras e conjuntos em prata 925 e banho de ouro 18k. Em até 12x sem juros, com envio para todo o Brasil.';
  let categoriaSlug: string | null = null;

  if (sp.categoria === SLUG_PERSONALIZADOS) {
    titulo = 'Semijoias Personalizadas com Foto, Nome ou Data';
    descricao =
      'Semijoias personalizadas com foto, nome ou data gravados a laser. Simule sua peça com IA antes de comprar — presente único, com envio para todo o Brasil.';
    categoriaSlug = SLUG_PERSONALIZADOS;
  } else if (sp.categoria) {
    const categoria = await categoryRepo.findBySlug(sp.categoria);
    if (categoria) {
      titulo = `${categoria.nome} em Prata 925 e Banho de Ouro 18k`;
      descricao = `${categoria.nome} em prata 925 e banho de ouro 18k da Zoliê Semijoias. Peças para usar no dia a dia e para presentear, em até 12x sem juros.`;
      categoriaSlug = categoria.slug;
    }
  }

  // Página 2+ aponta o canonical para ela mesma (não para a 1ª): o Google
  // trata cada página da série como única e assim chega a todos os produtos.
  const params = new URLSearchParams();
  if (categoriaSlug) params.set('categoria', categoriaSlug);
  if (page > 1) params.set('page', String(page));
  const canonical = params.size ? `/produtos?${params}` : '/produtos';
  if (page > 1) {
    titulo = `${titulo} — Página ${page}`;
    descricao = `Página ${page}. ${descricao}`;
  }

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical },
    openGraph: { ...OG_BASE, title: `${titulo} | Zoliê Semijoias`, description: descricao, url: canonical },
    ...(temFiltroSecundario && { robots: { index: false, follow: true } }),
  };
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProdutosPage({ searchParams }: Props) {
  const sp = await searchParams;
  // `?page=-1` ou `?page=abc` não podem virar OFFSET negativo/NaN na query.
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const perPage = 9;

  const filters = {
    q: sp.q,
    categoria: sp.categoria,
    material: sp.material,
    pedra: sp.pedra,
    tamanho: sp.tamanho,
    notaMin: sp.notaMin,
    precoMin: sp.precoMin,
    precoMax: sp.precoMax,
    promocao: sp.promocao === 'true',
  };
  const sort = sp.sort || 'relevancia';
  // A abertura só aparece na primeira página da categoria, sem busca: em filtros
  // e paginação a cliente já está escolhendo e ela só empurraria a lista para baixo.
  const comIntro = sp.categoria === SLUG_PERSONALIZADOS && page === 1 && !sp.q;

  const [{ total, items }, categorias, avaliacoesComFoto] = await Promise.all([
    listProducts(filters, sort, { skip: (page - 1) * perPage, take: perPage }),
    listParaLoja(),
    comIntro ? reviewRepo.listComFotoPersonalizados(FOTOS_INTRO) : Promise.resolve([]),
  ]);

  // Fotos de clientes primeiro; faltando, completa com a foto de uso (a 2ª) dos anúncios.
  const fotosIntro: FotoPersonalizado[] = [
    ...avaliacoesComFoto.map(r => ({
      id: r.id,
      url: r.imagens[0],
      legenda: `${(r.user.nome || 'Cliente').split(' ')[0]} · ${r.product.nome}`,
      slug: r.product.slug,
      daCliente: true,
    })),
    ...items.flatMap(p => {
      const url = p.imagens?.[1] ?? p.imagens?.[0];
      return url ? [{ id: p.id, url, legenda: p.nome, slug: p.slug, daCliente: false }] : [];
    }),
  ].slice(0, FOTOS_INTRO);

  const categoriaAtual = categorias.find(c => c.slug === sp.categoria);
  const titulo = sp.q ? `Resultados para "${sp.q}"` : categoriaAtual ? categoriaAtual.nome : 'Todas as peças';
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  // Página além da última viraria uma página vazia indexável (conteúdo ralo).
  if (page > totalPages) notFound();

  const trilha = [
    { nome: 'Início', url: '/' },
    { nome: 'Todas as peças', url: '/produtos' },
    ...(categoriaAtual ? [{ nome: categoriaAtual.nome, url: `/produtos?categoria=${categoriaAtual.slug}` }] : []),
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(trilha)) }} />
      {items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(items, (page - 1) * perPage)) }}
        />
      )}
      <div className="mb-2 flex items-center gap-1.5 text-xs text-ink-tertiary">
        <Link href="/" className="transition-colors hover:text-gold-text">Início</Link>
        <span className="text-border-soft">/</span>
        <span className="text-ink-muted">{titulo}</span>
      </div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="z-title text-[32px] sm:text-4xl">{titulo}</h1>
          <span className="text-sm font-light text-ink-tertiary">
            {total} peça{total === 1 ? '' : 's'} encontrada{total === 1 ? '' : 's'}
          </span>
        </div>
        <ProductSortSelect sort={sort} searchParams={sp} />
      </div>

      {comIntro && <PersonalizadosIntro fotos={fotosIntro} />}

      <div className="flex flex-col gap-8 lg:flex-row">
        <ProductFiltersSidebar categorias={categorias} searchParams={sp} />

        <div className="flex-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-soft bg-white/60 py-24 text-center">
              <span className="font-serif text-5xl text-gold/40">✦</span>
              <p className="z-title text-2xl">Nenhuma peça encontrada</p>
              <p className="text-sm font-light text-ink-tertiary">Tente ajustar os filtros ou buscar por outro termo.</p>
              <Link
                href="/produtos"
                className="mt-3 rounded-full border border-gold-soft px-6 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-gold-text transition-all hover:bg-gold hover:text-ink"
              >
                Limpar filtros
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {items.map(p => (
                <ZolieCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                const params = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
                params.set('page', String(n));
                return (
                  <Link
                    key={n}
                    href={`/produtos?${params.toString()}`}
                    prefetch={false}
                    className={`grid h-10 w-10 place-items-center rounded-full border text-sm transition-all ${
                      n === page
                        ? 'border-gold bg-gold font-medium text-ink shadow-sm'
                        : 'border-border-soft bg-white text-ink-muted hover:-translate-y-0.5 hover:border-gold-soft hover:text-gold-text'
                    }`}
                  >
                    {n}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
