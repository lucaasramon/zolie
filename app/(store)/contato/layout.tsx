import type { Metadata } from 'next';
import { OG_BASE } from '@/lib/utils/seo';

const DESCRICAO =
  'Fale com a Zoliê Semijoias: dúvidas sobre pedidos, trocas, personalizados e cuidados com as peças. Atendimento por WhatsApp, e-mail e formulário.';

// A página é client component (não exporta metadata); título e descrição vêm daqui.
export const metadata: Metadata = {
  title: 'Contato',
  description: DESCRICAO,
  alternates: { canonical: '/contato' },
  openGraph: { ...OG_BASE, title: 'Contato | Zoliê Semijoias', description: DESCRICAO, url: '/contato' },
};

export default function ContatoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
