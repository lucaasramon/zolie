import type { Metadata } from 'next';
import Link from 'next/link';
import { organizationJsonLd, jsonLdScript } from '@/lib/utils/jsonLd';
import { list as listProducts } from '@/lib/services/product.service';
import { list as listBanners } from '@/lib/services/banner.service';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { ZolieCard, DecoratedProduct } from '@/components/product/ZolieCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  // A home usa o title padrão (sem o sufixo do template) por ser a raiz da marca.
  title: 'Zoliê Semijoias — Prata 925 e Banho de Ouro 18k',
  description:
    'Semijoias em prata 925 e banho de ouro 18k. Colares, brincos, anéis e pulseiras com envio para todo o Brasil e 10% de desconto no Pix.',
  alternates: { canonical: '/' },
};

const DIFERENCIAIS = [
  { titulo: 'Frete grátis', texto: 'Acima de R$ 199 em todo o Brasil.' },
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
  const [categorias, banners, ofertas, maisAmadas, lancamentos] = await Promise.all([
    categoryRepo.list(),
    listBanners(),
    listProducts({ promocao: true }, 'relevancia', { skip: 0, take: 4 }),
    listProducts({ destaque: true }, 'mais_vendidos', { skip: 0, take: 4 }),
    listProducts({ lancamento: true }, 'lancamentos', { skip: 0, take: 4 }),
  ]);

  const banner = banners[0];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
      />
      {banner && (
        <section className="relative overflow-hidden bg-[linear-gradient(115deg,#2E2A24_0%,#5A4B33_46%,#C0A03C_100%)] animate-zfade">
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(125deg,rgba(255,255,255,0.05)_0_2px,transparent_2px_12px)]" />
          <div className="relative mx-auto flex w-full max-w-[1280px] flex-col items-start gap-5 px-6 py-14">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#F0E4C4]">{banner.tag}</span>
            <h1 className="max-w-[520px] font-serif text-4xl leading-tight text-white">{banner.titulo}</h1>
            <p className="max-w-[400px] font-light text-[15px] leading-relaxed text-[#E3D9C4]">{banner.subtitulo}</p>
            <Link
              href={banner.link || '/produtos'}
              className="mt-1.5 rounded-full bg-white px-[30px] py-4 text-xs font-medium uppercase tracking-[0.14em] text-ink shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              {banner.cta}
            </Link>
          </div>
          <div className="relative flex justify-center gap-1.5 pb-5">
            {banners.map((b, i) => (
              <span key={b.id} className={`h-[3px] w-[26px] rounded-full ${i === 0 ? 'bg-white' : 'bg-white/35'}`} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-ink">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-[30px] gap-y-2.5 px-5 py-3.5">
          {['Prata 925 legítima', 'Banho de ouro 18k reforçado', 'Embalagem-presente inclusa', 'Compra 100% segura'].map(t => (
            <span key={t} className="whitespace-nowrap text-[11px] text-[#F2EEE7]">{t}</span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-9">
        <h2 className="mb-4 font-sans text-2xl font-semibold text-ink">Escolha por categoria</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categorias.map(c => (
            <Link
              key={c.id}
              href={`/produtos?categoria=${c.slug}`}
              className="img-placeholder flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-white p-2 text-center shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="font-sans text-base font-medium text-ink">{c.nome}</span>
            </Link>
          ))}
        </div>
      </section>

      {ofertas.items.length > 0 && <ProductRow title="Ofertas da semana" products={ofertas.items} />}
      {maisAmadas.items.length > 0 && <ProductRow title="As mais amadas" products={maisAmadas.items} />}
      {lancamentos.items.length > 0 && <ProductRow title="Lançamentos" products={lancamentos.items} />}

      <section className="mx-auto max-w-[1280px] px-5 py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {DIFERENCIAIS.map(d => (
            <div key={d.titulo} className="flex flex-col gap-2">
              <span className="h-[2px] w-8 rounded-full bg-gold" />
              <span className="font-sans text-lg font-semibold text-ink">{d.titulo}</span>
              <span className="text-sm font-light text-ink-tertiary">{d.texto}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pb-14">
        <h2 className="mb-6 font-sans text-2xl font-semibold text-ink">Quem já brilha com a Zoliê</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {DEPOIMENTOS.map(d => (
            <div key={d.nome} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs">
              <span className="text-sm text-gold-text">★★★★★</span>
              <p className="font-sans text-base italic leading-relaxed text-ink">&ldquo;{d.texto}&rdquo;</p>
              <span className="text-xs text-ink-tertiary">{d.nome} · {d.local}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-4 px-5 py-14">
          <h2 className="font-sans text-2xl font-semibold text-white">Receba novidades e ofertas exclusivas</h2>
          <p className="text-sm font-light text-[#BDB4A6]">Cadastre seu e-mail e ganhe cupons especiais em primeira mão.</p>
          <form className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 rounded-full border-none bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none"
            />
            <button type="submit" className="whitespace-nowrap rounded-full bg-gold px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover">
              Quero receber
            </button>
          </form>
        </div>
      </section>
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
