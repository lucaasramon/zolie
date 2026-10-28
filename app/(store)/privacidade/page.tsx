import type { Metadata } from 'next';
import { metadataPagina } from '@/lib/utils/seo';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';

export const metadata: Metadata = metadataPagina(
  'Política de privacidade',
  'Como a Zoliê coleta, usa e protege seus dados pessoais, seguindo as diretrizes da LGPD.',
  '/privacidade',
);

export default function PrivacidadePage() {
  return (
    <InstitutionalPage titulo="Política de privacidade">
      <p>Coletamos apenas os dados necessários para processar seu pedido e melhorar sua experiência de compra: nome, e-mail, CPF, telefone e endereço.</p>
      <p>Seus dados nunca são vendidos a terceiros e são armazenados com criptografia, seguindo as diretrizes da LGPD.</p>
      <p>Você pode solicitar a exclusão dos seus dados a qualquer momento pelo nosso canal de atendimento.</p>
    </InstitutionalPage>
  );
}
