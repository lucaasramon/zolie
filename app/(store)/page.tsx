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

const DIFERENCIAIS_BASE = [
  { titulo: 'Garantia de 1 ano', texto: 'Cobertura total contra desgaste do banho.' },
  { titulo: 'Troca facilitada', texto: 'Até 30 dias para trocar sem burocracia.' },
  { titulo: 'Banho de ouro 18k', texto: 'Camada reforçada, brilho duradouro.' },
  { titulo: 'Compra segura', texto: 'Pagamento protegido e dados criptografados.' },
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
    ? [{ titulo: 'Frete grátis', texto: 'Acima de R$ 199 em todo o Brasil.' }, ...DIFERENCIAIS_BASE]
    : DIFERENCIAIS_BASE;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
      />
      <HeroCarousel banners={banners} />

      <Reveal>
        <section className="mx-auto max-w-[1280px] px-5 pt-9">
          <h2 className="mb-4 font-sans text-2xl font-semibold text-ink">Escolha por categoria</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {categorias.map(c => (
              <Link
                key={c.id}
                href={`/produtos?categoria=${c.slug}`}
                className="group flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CategoryIcon slug={c.slug} className="h-6 w-6 text-gold-text transition-transform group-hover:scale-110" />
                <span className="font-sans text-xs font-medium text-ink">{c.nome}</span>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {ofertas.items.length > 0 && (
        <Reveal>
          <ProductRow title="Ofertas da semana" products={ofertas.items} />
        </Reveal>
      )}
      {maisAmadas.items.length > 0 && (
        <Reveal>
          <ProductRow title="As mais amadas" products={maisAmadas.items} />
        </Reveal>
      )}
      {lancamentos.items.length > 0 && (
        <Reveal>
          <ProductRow title="Lançamentos" products={lancamentos.items} />
        </Reveal>
      )}

      <Reveal>
        <section className="mx-auto max-w-[1280px] px-5 py-14">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {diferenciais.map(d => (
              <div key={d.titulo} className="flex flex-col gap-2">
                <span className="h-[2px] w-8 rounded-full bg-gold" />
                <span className="font-sans text-lg font-semibold text-ink">{d.titulo}</span>
                <span className="text-sm font-light text-ink-tertiary">{d.texto}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-[1280px] px-5 pb-14">
          <h2 className="mb-6 font-sans text-2xl font-semibold text-ink">Quem já brilha com a Zoliê</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {DEPOIMENTOS.map(d => (
              <div key={d.nome} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md">
                <span className="text-sm text-gold-text">★★★★★</span>
                <p className="font-sans text-base italic leading-relaxed text-ink">&ldquo;{d.texto}&rdquo;</p>
                <span className="text-xs text-ink-tertiary">{d.nome} · {d.local}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-ink">
          <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-4 px-5 py-14">
            <h2 className="font-sans text-2xl font-semibold text-white">Receba novidades e ofertas exclusivas</h2>
            <p className="text-sm font-light text-[#BDB4A6]">Cadastre seu e-mail e ganhe cupons especiais em primeira mão.</p>
            <form className="flex w-full max-w-md gap-2">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 rounded-full border-none bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(212,175,55,0.4)]"
              />
              <button type="submit" className="whitespace-nowrap rounded-full bg-gold px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-hover active:translate-y-0 active:scale-95">
                Quero receber
              </button>
            </form>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

function ProductRow({ title, products }: { title: string; products: DecoratedProduct[] }) {
  return (
    <section className="mx-auto max-w-[1280px] px-5 pt-9">
      <h2 className="mb-4 font-sans text-2xl font-semibold text-ink">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {products.map(p => (
          <ZolieCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
