import type { Metadata } from 'next';
import Link from 'next/link';
import { organizationJsonLd, jsonLdScript } from '@/lib/utils/jsonLd';
import { list as listProducts } from '@/lib/services/product.service';
import { list as listBanners } from '@/lib/services/banner.service';
import { categoryRepo } from '@/lib/repositories/category.repo';
import * as siteConfig from '@/lib/services/site-config.service';
import { ZolieCard, DecoratedProduct } from '@/components/product/ZolieCard';
import { CategoryIcon } from '@/components/product/CategoryIcon';
import { HeroCarousel } from '@/components/layout/HeroCarousel';
import { Reveal } from '@/components/layout/Reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  await siteConfig.preparar();
  const { descontoPixAtivo } = siteConfig.get();
  return {
    // A home usa o title padrão (sem o sufixo do template) por ser a raiz da marca.
    title: 'Zoliê Semijoias — Prata 925 e Banho de Ouro 18k',
    description: `Semijoias em prata 925 e banho de ouro 18k. Colares, brincos, anéis e pulseiras com envio para todo o Brasil${descontoPixAtivo ? ' e 10% de desconto no Pix' : ''}.`,
    alternates: { canonical: '/' },
  };
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 17h-9v-11h9v11Z" />
      <path d="M14 8h4l3 3v6h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3.5" y="8" width="17" height="4" />
      <path d="M5 12v8h14v-8M12 8v12" />
      <path d="M12 8c-1.5 0-4.5-.5-4.5-2.7C7.5 3.6 9 3 10 3c1.8 0 2 2.6 2 5Zm0 0c1.5 0 4.5-.5 4.5-2.7C16.5 3.6 15 3 14 3c-1.8 0-2 2.6-2 5Z" />
    </svg>
  );
}

const DIFERENCIAIS_BASE = [
  { icone: SparkleIcon, titulo: 'Banho de ouro 18k', texto: 'Camada reforçada, brilho que dura.' },
  { icone: ShieldIcon, titulo: 'Compra segura', texto: 'Pagamento protegido e dados criptografados.' },
  { icone: GiftIcon, titulo: 'Embalagem presente', texto: 'Cada peça chega pronta para presentear.' },
];

const DEPOIMENTOS = [
  { nome: 'Marina S.', local: 'São Paulo, SP', texto: 'As peças são lindas e chegaram muito bem embaladas. Já é a terceira compra!' },
  { nome: 'Camila R.', local: 'Belo Horizonte, MG', texto: 'O banho de ouro não desbota, uso todos os dias e continua brilhando.' },
  { nome: 'Fernanda A.', local: 'Curitiba, PR', texto: 'Atendimento excelente e entrega rápida. Recomendo demais a Zoliê.' },
];

export default async function HomePage() {
  await siteConfig.preparar();
  const { freteGratisAtivo } = siteConfig.get();
  const [categorias, banners, ofertas, maisAmadas, lancamentos] = await Promise.all([
    categoryRepo.list(),
    listBanners(),
    listProducts({ promocao: true }, 'relevancia', { skip: 0, take: 4 }),
    listProducts({ destaque: true }, 'mais_vendidos', { skip: 0, take: 4 }),
    listProducts({ lancamento: true }, 'lancamentos', { skip: 0, take: 4 }),
  ]);
  const diferenciais = freteGratisAtivo
    ? [{ icone: TruckIcon, titulo: 'Frete grátis', texto: 'Acima de R$ 199 em todo o Brasil.' }, ...DIFERENCIAIS_BASE]
    : DIFERENCIAIS_BASE;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
      />
      <HeroCarousel banners={banners} />

      <Reveal>
        <section className="mx-auto max-w-[1280px] px-5 pt-12">
          <div className="mb-6 flex flex-col gap-1.5">
            <span className="z-eyebrow">Navegue pelo universo Zoliê</span>
            <h2 className="z-title text-[28px] sm:text-3xl">Escolha por categoria</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {categorias.map(c => (
              <Link
                key={c.id}
                href={`/produtos?categoria=${c.slug}`}
                className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-border-subtle bg-white px-2 py-4 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-gold-soft hover:shadow-md sm:py-5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full border border-border-soft bg-bg-alt text-gold-text transition-all duration-300 group-hover:scale-105 group-hover:border-gold group-hover:bg-gold group-hover:text-ink sm:h-[52px] sm:w-[52px]">
                  <CategoryIcon slug={c.slug} className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="font-sans text-[10px] font-medium leading-tight tracking-wide text-ink sm:text-xs">{c.nome}</span>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {ofertas.items.length > 0 && (
        <Reveal>
          <ProductRow
            eyebrow="Só por tempo limitado"
            title="Ofertas da semana"
            href="/produtos?promocao=true"
            products={ofertas.items}
          />
        </Reveal>
      )}
      {maisAmadas.items.length > 0 && (
        <Reveal>
          <ProductRow
            eyebrow="As queridinhas de quem já comprou"
            title="As mais amadas"
            href="/produtos"
            products={maisAmadas.items}
          />
        </Reveal>
      )}
      {lancamentos.items.length > 0 && (
        <Reveal>
          <ProductRow
            eyebrow="Acabaram de chegar"
            title="Lançamentos"
            href="/produtos?sort=lancamentos"
            products={lancamentos.items}
          />
        </Reveal>
      )}

      <Reveal>
        <section className="mt-16 border-y border-border-subtle bg-white">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {diferenciais.map(d => (
              <div key={d.titulo} className="flex items-start gap-4">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-full border border-gold/30 bg-bg-alt text-gold-text">
                  <d.icone className="h-[22px] w-[22px]" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-serif text-lg font-medium text-ink">{d.titulo}</span>
                  <span className="text-[13px] font-light leading-relaxed text-ink-tertiary">{d.texto}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-[1280px] px-5 py-16">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="z-eyebrow">Depoimentos reais</span>
            <h2 className="z-title text-[28px] sm:text-3xl">Quem já brilha com a Zoliê</h2>
            <span className="z-rule mt-2" />
          </div>
          <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
            {DEPOIMENTOS.map(d => (
              <figure
                key={d.nome}
                className="relative flex flex-col gap-3 rounded-2xl border border-border-subtle bg-white p-6 pt-8 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <span className="pointer-events-none absolute left-5 top-2 font-serif text-[64px] leading-none text-gold/25" aria-hidden="true">
                  &ldquo;
                </span>
                <span className="text-[13px] tracking-[0.2em] text-gold-soft">★★★★★</span>
                <blockquote className="font-serif text-[17px] italic leading-relaxed text-ink">{d.texto}</blockquote>
                <figcaption className="mt-auto flex items-center gap-2 pt-1">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-bg-alt font-serif text-sm text-gold-text">
                    {d.nome.charAt(0)}
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    <span className="font-medium text-ink">{d.nome}</span> · {d.local}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="z-dark-glow">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-5 px-5 py-16 text-center">
            <span className="z-eyebrow !text-gold">Clube Zoliê</span>
            <h2 className="z-title max-w-xl !text-white text-3xl sm:text-4xl">
              Receba novidades e ofertas exclusivas
            </h2>
            <p className="max-w-md text-sm font-light leading-relaxed text-[#BDB4A6]">
              Cadastre seu e-mail e ganhe cupons especiais em primeira mão — sem spam, só brilho.
            </p>
            <form className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 rounded-full border border-white/12 bg-white/8 px-5 py-3.5 text-sm text-white placeholder:text-white/45 outline-none transition-all focus:border-gold/60 focus:bg-white/12 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-full bg-gold px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink shadow-md transition-all hover:-translate-y-0.5 hover:bg-gold-hover hover:shadow-lg active:translate-y-0 active:scale-95"
              >
                Quero receber
              </button>
            </form>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

function ProductRow({
  eyebrow,
  title,
  href,
  products,
}: {
  eyebrow: string;
  title: string;
  href: string;
  products: DecoratedProduct[];
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-5 pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="z-eyebrow">{eyebrow}</span>
          <h2 className="z-title text-[28px] sm:text-3xl">{title}</h2>
        </div>
        <Link
          href={href}
          className="group mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gold-text transition-colors hover:text-gold-text-hover"
        >
          Ver tudo
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {products.map(p => (
          <ZolieCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
