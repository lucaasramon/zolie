import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';
import { jsonLdScript } from '@/lib/utils/jsonLd';

export const metadata: Metadata = {
  title: 'Perguntas frequentes',
  description: 'Dúvidas sobre entrega, parcelamento, garantia e cuidados com as semijoias da Zoliê.',
  alternates: { canonical: '/faq' },
};

const PERGUNTAS = [
  { q: 'As peças enferrujam ou escurecem?', r: 'A prata 925 e o banho de ouro 18k reforçado são resistentes, mas recomendamos evitar contato com perfume, cloro e água do mar para prolongar o brilho.' },
  { q: 'Qual o prazo de entrega?', r: 'O prazo varia conforme a região e a modalidade de frete escolhida, exibido no checkout antes da confirmação do pedido.' },
  { q: 'Posso parcelar minha compra?', r: 'Sim, em até 12x sem juros no cartão de crédito, ou com 10% de desconto pagando via Pix.' },
  { q: 'Como funciona a garantia?', r: 'Todas as peças possuem garantia de 1 ano contra desgaste do banho, desde que seguidos os cuidados recomendados.' },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PERGUNTAS.map(p => ({
    '@type': 'Question',
    name: p.q,
    acceptedAnswer: { '@type': 'Answer', text: p.r },
  })),
};

export default function FaqPage() {
  return (
    <InstitutionalPage titulo="Perguntas frequentes">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      {PERGUNTAS.map(p => (
        <div key={p.q}>
          <p className="font-medium text-ink">{p.q}</p>
          <p>{p.r}</p>
        </div>
      ))}
    </InstitutionalPage>
  );
}
