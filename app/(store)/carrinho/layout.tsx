import type { Metadata } from 'next';

// A página é client component (não exporta metadata); o título e o noindex
// vêm deste layout. Área privada: não deve aparecer no Google.
export const metadata: Metadata = {
  title: 'Carrinho',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
