import type { Metadata } from 'next';
import { metadataPagina } from '@/lib/utils/seo';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';
import { jsonLdScript } from '@/lib/utils/jsonLd';

// Cache de 5 min em vez de `force-dynamic`; os toggles de /admin/config
// invalidam o cache na hora (revalidatePath na rota de site-config).
export const revalidate = 300;

export const metadata: Metadata = metadataPagina(
  'Perguntas frequentes',
  'Dúvidas sobre entrega, parcelamento em até 12x, trocas, garantia e cuidados com as semijoias em prata 925 e banho de ouro 18k da Zoliê.',
  '/faq',
);

export default async function FaqPage() {
  const perguntas = [
    { q: 'As peças enferrujam ou escurecem?', r: 'A prata 925 e o banho de ouro 18k reforçado são resistentes, mas recomendamos evitar contato com perfume, cloro e água do mar para prolongar o brilho.' },
    { q: 'Qual o prazo de entrega?', r: 'O prazo varia conforme a região e a modalidade de frete escolhida, exibido no checkout antes da confirmação do pedido.' },
    { q: 'Posso parcelar minha compra?', r: 'Sim, em até 12x sem juros no cartão de crédito. Também aceitamos Pix e boleto.' }
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
