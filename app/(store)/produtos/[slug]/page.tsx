import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { produtoJsonLd, breadcrumbJsonLd, jsonLdScript, urlAbsoluta } from '@/lib/utils/jsonLd';
import { ViewItemTracker } from '@/components/analytics/ViewItemTracker';
import { bySlug, resolveRedirect } from '@/lib/services/product.service';
import { productRepo } from '@/lib/repositories/product.repo';
import { list as listReviews } from '@/lib/services/review.service';
import { ZolieCard } from '@/components/product/ZolieCard';
import { SetSuggestion } from '@/components/product/SetSuggestion';
import { ProductPurchaseBox } from '@/components/product/ProductPurchaseBox';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductSocialProof } from '@/components/product/ProductSocialProof';
import { ReviewForm } from '@/components/product/ReviewForm';
import Image from 'next/image';
import { stars, MATERIAL_LABEL } from '@/lib/utils/format';
import { brl } from '@/lib/utils/money';
import { AppError } from '@/lib/utils/errors';

// Revalidação por tempo em vez de `force-dynamic`: a página passa a ser cacheável
// (melhor para indexação e Core Web Vitals) sem servir preço/estoque defasados.
export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Pré-renderiza os produtos ativos no build. Sem isso a rota é sempre resolvida
 * sob demanda. Produtos criados depois continuam funcionando: `dynamicParams`
 * (padrão true) os renderiza na primeira visita e passa a servi-los do cache.
 */
export async function generateStaticParams() {
  try {
    const produtos = await productRepo.listSlugsAtivos();
    return produtos.map(p => ({ slug: p.slug }));
  } catch {
    // Banco indisponível no build não pode quebrar o deploy — as páginas passam
    // a ser geradas sob demanda.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let produto;
  try {
    produto = await bySlug(slug);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) {
      const alvo = await resolveRedirect(slug);
      if (alvo) permanentRedirect(`/produtos/${alvo.novoSlug}`);
    }
    return { title: 'Produto não encontrado' };
  }

  const material = MATERIAL_LABEL[produto.material] || produto.material;
  const descricao =
    `${produto.nome} em ${material}. ${produto.descricao}`.slice(0, 155).trim() + '…';
  const imagem = urlAbsoluta(produto.imagens?.[0]);

  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/produtos/${produto.slug}` },
    openGraph: {
      type: 'website',
      title: `${produto.nome} — Zoliê Semijoias`,
      description: descricao,
      url: `/produtos/${produto.slug}`,
      ...(imagem && { images: [{ url: imagem, alt: produto.nome }] }),
    },
    // Produto esgotado sai do índice para não gastar crawl budget nem levar o
    // usuário a uma página onde ele não pode comprar. Volta sozinho ao repor estoque.
    ...(produto.disponivel ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;

  let produto;
  let redirectAlvo: string | null = null;
  try {
    produto = await bySlug(slug);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) {
      const alvo = await resolveRedirect(slug);
      redirectAlvo = alvo?.novoSlug ?? null;
    } else {
      throw err;
    }
  }

  if (redirectAlvo) permanentRedirect(`/produtos/${redirectAlvo}`);
  if (!produto) return notFound();

  const { items: reviews } = await listReviews(produto.id, { skip: 0, take: 5 });

  const trilha = [
    { nome: 'Início', url: '/' },
    ...(produto.categoria
      ? [{ nome: produto.categoria.nome, url: `/produtos?categoria=${produto.categoria.slug}` }]
      : []),
    { nome: produto.nome, url: `/produtos/${produto.slug}` },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(produtoJsonLd(produto)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(trilha)) }}
      />
      <ViewItemTracker
        item={{
          id: produto.id,
          nome: produto.nome,
          preco: produto.precoEfetivo,
          categoria: produto.categoria?.nome,
        }}
      />

      <div className="mb-5 flex items-center gap-1.5 text-xs text-ink-tertiary">
        <Link href="/" className="transition-colors hover:text-gold-text">Início</Link>
        <span className="text-border-soft">/</span>
        <Link href={`/produtos?categoria=${produto.categoria?.slug}`} className="transition-colors hover:text-gold-text">
          {produto.categoria?.nome}
        </Link>
        <span className="text-border-soft">/</span>
        <span className="text-ink-muted">{produto.nome}</span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery imagens={produto.imagens || []} nome={produto.nome} slug={produto.slug} />

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-white">
            <div className="px-5 pt-4">
              <span className="text-xs font-medium uppercase tracking-wider text-gold-text">
                {MATERIAL_LABEL[produto.material] || produto.material}
              </span>
              <h1 className="mt-1.5 font-serif text-3xl leading-tight text-ink lg:text-[40px]">{produto.nome}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                {produto.totalAvaliacoes > 0 && (
                  <>
                    <span className="flex items-center gap-1 text-sm text-gold-text">{stars(Number(produto.notaMedia))}</span>
                    <span className="text-sm text-ink-tertiary">({produto.totalAvaliacoes} avaliações)</span>
                  </>
                )}
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
                    produto.disponivel ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${produto.disponivel ? 'bg-success' : 'bg-danger'}`} />
                  {produto.disponivel ? 'Em estoque' : 'Esgotado'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1 border-t border-border-subtle px-5 py-4">
              {produto.temDesconto && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-tertiary line-through">{brl(produto.preco)}</span>
                  <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-semibold text-ink">-{produto.percentualDesconto}%</span>
                </div>
              )}
              <span className="text-[36px] font-medium leading-tight text-ink">{brl(produto.precoEfetivo)}</span>
              {produto.precoPix < produto.precoEfetivo && (
                <span className="text-sm font-medium text-gold-text">{brl(produto.precoPix)} no Pix</span>
              )}
              <span className="text-sm text-ink-tertiary">ou {produto.maxParcelas}x de {brl(produto.parcela)} sem juros</span>
            </div>
          </div>

          {produto.estoqueBaixo && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-danger">Corre! Restam {produto.estoque} peças</span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-danger-soft">
                <div className="h-full rounded-full bg-danger transition-all" style={{ width: `${Math.min(100, (produto.estoque / 8) * 100)}%` }} />
              </div>
            </div>
          )}

          <ProductSocialProof productId={produto.id} />

          <ProductPurchaseBox
            productId={produto.id}
            tamanhos={produto.tamanhos || []}
            estoque={produto.estoque}
            nome={produto.nome}
            preco={produto.precoEfetivo}
            categoria={produto.categoria?.nome}
          />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-xs">
          <h2 className="mb-3 font-serif text-2xl text-ink">Sobre esta peça</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{produto.descricao}</p>
          <dl className="mt-5 grid grid-cols-2 gap-y-3 border-t border-border-subtle pt-4 text-sm">
            <dt className="text-ink-tertiary">Material</dt>
            <dd className="text-right font-medium text-ink">{MATERIAL_LABEL[produto.material] || produto.material}</dd>
            <dt className="text-ink-tertiary">Pedra</dt>
            <dd className="text-right font-medium text-ink">{produto.pedra || 'Sem pedra'}</dd>
            <dt className="text-ink-tertiary">Código</dt>
            <dd className="text-right font-medium text-ink">{produto.slug}</dd>
          </dl>
        </div>
        {produto.cuidados && (
          <div className="rounded-2xl bg-white p-6">
            <h2 className="mb-2 font-serif text-2xl text-ink">Cuidados com a peça</h2>
            <p className="text-sm leading-relaxed text-ink-muted">{produto.cuidados}</p>
          </div>
        )}
      </div>

      <SetSuggestion produto={produto} sugestoes={produto.sugestoesConjunto} />

      <div className="mt-14 rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink">Avaliações</h2>
          <ReviewForm productId={produto.id} />
        </div>
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-soft py-12 text-center">
            <p className="text-sm text-ink-tertiary">Ainda não há avaliações para esta peça.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-border-subtle p-4 transition-shadow hover:shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gold-text">{stars(r.nota)}</span>
                  <span className="text-sm font-medium text-ink">{r.user?.nome || 'Cliente Zoliê'}</span>
                  {r.compraVerificada && (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-success">
                      Compra verificada
                    </span>
                  )}
                </div>
                {r.titulo && <p className="mt-1.5 text-sm font-medium text-ink">{r.titulo}</p>}
                {r.comentario && <p className="mt-1 text-sm text-ink-muted">{r.comentario}</p>}
                {r.imagens?.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {r.imagens.map((url: string) => (
                      <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg">
                        <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {produto.relacionados.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-4 font-serif text-2xl text-ink">Combina com esta peça</h2>
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
