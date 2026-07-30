import { InstitutionalPage } from '@/components/layout/InstitutionalPage';

const PERGUNTAS = [
  { q: 'As peças enferrujam ou escurecem?', r: 'A prata 925 e o banho de ouro 18k reforçado são resistentes, mas recomendamos evitar contato com perfume, cloro e água do mar para prolongar o brilho.' },
  { q: 'Qual o prazo de entrega?', r: 'O prazo varia conforme a região e a modalidade de frete escolhida, exibido no checkout antes da confirmação do pedido.' },
  { q: 'Posso parcelar minha compra?', r: 'Sim, em até 12x sem juros no cartão de crédito, ou com 10% de desconto pagando via Pix.' },
  { q: 'Como funciona a garantia?', r: 'Todas as peças possuem garantia de 1 ano contra desgaste do banho, desde que seguidos os cuidados recomendados.' },
];

export default function FaqPage() {
  return (
    <InstitutionalPage titulo="Perguntas frequentes">
      {PERGUNTAS.map(p => (
        <div key={p.q}>
          <p className="font-medium text-ink">{p.q}</p>
          <p>{p.r}</p>
        </div>
      ))}
    </InstitutionalPage>
  );
}
