import type { Metadata } from 'next';
import { metadataPagina } from '@/lib/utils/seo';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';

export const metadata: Metadata = metadataPagina(
  'Sobre a Zoliê',
  'Conheça a Zoliê Semijoias: peças em prata 925 legítima e banho de ouro 18k reforçado, com acabamento delicado, qualidade e preço acessível.',
  '/sobre',
);

export default function SobrePage() {
  return (
    <InstitutionalPage titulo="Sobre a Zoliê">
      <p>
        A Zoliê nasceu do amor por semijoias que combinam qualidade e acessibilidade. Trabalhamos com prata 925
        legítima e banho de ouro 18k reforçado, para que cada peça brilhe por muito tempo sem pesar no bolso.
      </p>
      <p>
        Cada peça é inspecionada antes de sair do nosso estoque e chega até você em embalagem-presente, pronta
        para ser usada ou dada de presente.
      </p>
    </InstitutionalPage>
  );
}
