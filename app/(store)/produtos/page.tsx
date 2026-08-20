import type { Metadata } from 'next';
import Link from 'next/link';
import { list as listProducts } from '@/lib/services/product.service';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { ZolieCard } from '@/components/product/ZolieCard';
import { ProductFiltersSidebar } from '@/components/product/ProductFiltersSidebar';
import { ProductSortSelect } from '@/components/product/ProductSortSelect';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;

  // Só a listagem "limpa" e as de categoria são indexáveis. Combinações de filtro
  // e ordenação geram infinitas URLs de conteúdo praticamente igual — indexá-las
  // dilui a relevância e desperdiça crawl budget.
  const filtrosSecundarios = ['q', 'material', 'pedra', 'tamanho', 'notaMin', 'precoMin', 'precoMax', 'promocao', 'sort', 'page'];
  const temFiltroSecundario = filtrosSecundarios.some(f => sp[f]);

  if (sp.categoria) {
    const categoria = await categoryRepo.findBySlug(sp.categoria);
    if (categoria) {
      return {
        title: categoria.nome,
        description: `${categoria.nome} em prata 925 e banho de ouro 18k. Peças da Zoliê Semijoias com envio para todo o Brasil.`,
        alternates: { canonical: `/produtos?categoria=${categoria.slug}` },
        ...(temFiltroSecundario && { robots: { index: false, follow: true } }),
      };
    }
  }

  return {
    title: 'Todas as peças',
    description: 'Colares, brincos, anéis, pulseiras e conjuntos em prata 925 e banho de ouro 18k.',
    alternates: { canonical: '/produtos' },
    ...(temFiltroSecundario && { robots: { index: false, follow: true } }),
  };
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProdutosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
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

  const [{ total, items }, categorias] = await Promise.all([
    listProducts(filters, sort, { skip: (page - 1) * perPage, take: perPage }),
    categoryRepo.list(),
  ]);

  const categoriaAtual = categorias.find(c => c.slug === sp.categoria);
  const titulo = sp.q ? `Resultados para "${sp.q}"` : categoriaAtual ? categoriaAtual.nome : 'Todas as peças';
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
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
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                const params = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
                params.set('page', String(n));
                return (
                  <Link
                    key={n}
                    href={`/produtos?${params.toString()}`}
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
