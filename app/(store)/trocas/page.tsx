import type { Metadata } from 'next';
import Link from 'next/link';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';

export const metadata: Metadata = {
  title: 'Trocas e devoluções',
  description: 'Até 30 dias para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.',
  alternates: { canonical: '/trocas' },
};

export default function TrocasPage() {
  return (
    <InstitutionalPage titulo="Trocas e devoluções">
      <p>
        O Código de Defesa do Consumidor garante 7 dias para
        arrependimento em compras online.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">Como solicitar</h2>
      <ol className="ml-4 list-decimal space-y-1.5">
        <li>
          Acesse <Link href="/conta/pedidos" className="text-gold-text underline">Meus pedidos</Link> e
          abra o pedido entregue.
        </li>
        <li>Clique em <strong>Solicitar troca ou devolução</strong>, escolha o motivo e envie.</li>
        <li>Analisamos em até 2 dias úteis e respondemos por e-mail.</li>
        <li>Aprovada a solicitação, enviamos as instruções para o envio da peça de volta.</li>
      </ol>
      <p className="text-sm text-ink-tertiary">
        O botão aparece na página do pedido assim que ele consta como entregue. Pedidos
        ainda a caminho podem ser cancelados na mesma tela.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">O que é aceito</h2>
      <p>
        A peça precisa estar sem sinais de uso, com a embalagem original sempre que
        possível. Peças usadas ou danificadas por mau uso — contato com perfume, cloro,
        água do mar ou impacto — não são elegíveis.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">Prazos de reembolso</h2>
      <p>
        Em devoluções aprovadas, o estorno é solicitado após recebermos e conferirmos a
        peça. No Pix costuma cair em poucos dias úteis; no cartão de crédito pode levar
        até duas faturas, conforme a operadora.
      </p>

      <p className="mt-6 text-sm">
        Ficou com dúvida? Fale com a gente pelo{' '}
        <Link href="/contato" className="text-gold-text underline">formulário de contato</Link>.
      </p>
    </InstitutionalPage>
  );
}
