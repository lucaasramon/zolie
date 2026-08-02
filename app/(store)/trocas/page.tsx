import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';

export const metadata: Metadata = {
  title: 'Trocas e devoluções',
  description: 'Até 30 dias para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.',
  alternates: { canonical: '/trocas' },
};

export default function TrocasPage() {
  return (
    <InstitutionalPage titulo="Trocas e devoluções">
      <p>Você tem até 30 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.</p>
      <p>Para iniciar uma troca, acesse Meus pedidos, selecione o pedido desejado e siga as instruções, ou entre em contato pelo nosso canal de atendimento.</p>
      <p>Peças usadas ou danificadas por mau uso não são elegíveis para troca.</p>
    </InstitutionalPage>
  );
}
