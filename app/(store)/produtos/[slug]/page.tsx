import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { bySlug } from '@/lib/services/product.service';
import { list as listReviews } from '@/lib/services/review.service';
import { ZolieCard } from '@/components/product/ZolieCard';
import { ProductPurchaseBox } from '@/components/product/ProductPurchaseBox';
import { stars, MATERIAL_LABEL } from '@/lib/utils/format';
import { brl } from '@/lib/utils/money';
import { AppError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;

  let produto;
  try {
    produto = await bySlug(slug);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) return notFound();
    throw err;
  }

  const { items: reviews } = await listReviews(produto.id, { skip: 0, take: 5 });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <div className="mb-4 text-xs text-ink-tertiary">
        <Link href="/" className="hover:text-gold-text">Início</Link> /{' '}
        <Link href={`/produtos?categoria=${produto.categoria?.slug}`} className="hover:text-gold-text">{produto.categoria?.nome}</Link> /{' '}
        {produto.nome}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {produto.imagens?.[0] ? (
          <div className="relative aspect-square overflow-hidden rounded-xl shadow-xs">
            <Image src={produto.imagens[0]} alt={produto.nome} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
          </div>
        ) : (
          <div className="img-placeholder grid aspect-square place-items-center rounded-xl shadow-xs p-4">
            <span className="text-center font-mono text-xs uppercase tracking-[0.12em] text-ink-tertiary">
              foto do produto
              <br />
              {produto.slug}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-ink-tertiary">
              {MATERIAL_LABEL[produto.material] || produto.material}
            </span>
            <h1 className="mt-1 font-sans text-3xl font-semibold text-ink lg:text-4xl">{produto.nome}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gold-text">{stars(Number(produto.notaMedia))}</span>
              <span className="text-sm text-ink-tertiary">({produto.totalAvaliacoes} avaliações)</span>
              <span className={`text-xs ${produto.disponivel ? 'text-success' : 'text-danger'}`}>
                {produto.disponivel ? 'Em estoque' : 'Esgotado'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-y border-border-subtle py-4">
            {produto.temDesconto && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-tertiary line-through">{brl(produto.preco)}</span>
                <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium text-ink">-{produto.percentualDesconto}%</span>
              </div>
            )}
            <span className="text-[34px] font-medium leading-tight text-ink">{brl(produto.precoEfetivo)}</span>
            <span className="text-sm text-gold-text">{brl(produto.precoPix)} no Pix</span>
            <span className="text-sm text-ink-tertiary">ou {produto.maxParcelas}x de {brl(produto.parcela)} sem juros</span>
          </div>

          {produto.estoqueBaixo && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-danger">Corre! Restam {produto.estoque} peças</span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-danger-soft">
                <div className="h-full bg-danger" style={{ width: `${Math.min(100, (produto.estoque / 8) * 100)}%` }} />
              </div>
            </div>
          )}

          <ProductPurchaseBox productId={produto.id} tamanhos={produto.tamanhos || []} estoque={produto.estoque} />
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-sans text-xl font-semibold text-ink">Sobre esta peça</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{produto.descricao}</p>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-ink-tertiary">Material</dt>
            <dd className="text-ink">{MATERIAL_LABEL[produto.material] || produto.material}</dd>
            <dt className="text-ink-tertiary">Pedra</dt>
            <dd className="text-ink">{produto.pedra || 'Sem pedra'}</dd>
            <dt className="text-ink-tertiary">Peso</dt>
            <dd className="text-ink">{produto.pesoGramas ? `${Number(produto.pesoGramas).toFixed(1)}g` : '—'}</dd>
            <dt className="text-ink-tertiary">Garantia</dt>
            <dd className="text-ink">1 ano</dd>
            <dt className="text-ink-tertiary">Código</dt>
            <dd className="text-ink">{produto.slug}</dd>
          </dl>
        </div>
        {produto.cuidados && (
          <div className="rounded-xl bg-hoverbg p-5">
            <h2 className="mb-2 font-sans text-xl font-semibold text-ink">Cuidados com a peça</h2>
            <p className="text-sm leading-relaxed text-ink-muted">{produto.cuidados}</p>
          </div>
        )}
      </div>

      <div className="mt-14">
        <h2 className="mb-4 font-sans text-xl font-semibold text-ink">Avaliações</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-tertiary">Ainda não há avaliações para esta peça.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r: any) => (
              <div key={r.id} className="rounded-lg shadow-xs p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gold-text">{stars(r.nota)}</span>
                  <span className="text-sm font-medium text-ink">{r.user?.nome || 'Cliente Zoliê'}</span>
                </div>
                {r.titulo && <p className="mt-1 text-sm font-medium text-ink">{r.titulo}</p>}
                {r.comentario && <p className="mt-1 text-sm text-ink-muted">{r.comentario}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {produto.relacionados.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-4 font-sans text-xl font-semibold text-ink">Combina com esta peça</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {produto.relacionados.map((p: any) => (
              <ZolieCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
