import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';
import { jsonLdScript } from '@/lib/utils/jsonLd';
import * as siteConfig from '@/lib/services/site-config.service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Perguntas frequentes',
  description: 'Dúvidas sobre entrega, parcelamento, garantia e cuidados com as semijoias da Zoliê.',
  alternates: { canonical: '/faq' },
};

export default async function FaqPage() {
  await siteConfig.preparar();
  const { descontoPixAtivo } = siteConfig.get();

  const perguntas = [
    { q: 'As peças enferrujam ou escurecem?', r: 'A prata 925 e o banho de ouro 18k reforçado são resistentes, mas recomendamos evitar contato com perfume, cloro e água do mar para prolongar o brilho.' },
    { q: 'Qual o prazo de entrega?', r: 'O prazo varia conforme a região e a modalidade de frete escolhida, exibido no checkout antes da confirmação do pedido.' },
    { q: 'Posso parcelar minha compra?', r: `Sim, em até 12x sem juros no cartão de crédito${descontoPixAtivo ? ', ou com 10% de desconto pagando via Pix' : ''}.` }
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map(p => ({
      '@type': 'Question',
      name: p.q,
      acceptedAnswer: { '@type': 'Answer', text: p.r },
    })),
  };

  return (
    <InstitutionalPage titulo="Perguntas frequentes">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      {perguntas.map(p => (
        <div key={p.q} className="border-b border-border-subtle pb-4 last:border-b-0 last:pb-0">
          <p className="mb-1.5 flex items-start gap-2 font-serif text-lg font-medium leading-snug text-ink">
            <span className="mt-0.5 text-sm text-gold" aria-hidden="true">✦</span>
            {p.q}
          </p>
          <p className="pl-6">{p.r}</p>
        </div>
      ))}
    </InstitutionalPage>
  );
}
