import { StoreShell } from '@/components/layout/StoreShell';

// O shell só carrega a lista de categorias — não lê cookies nem headers, então
// `force-dynamic` aqui era desnecessário e anulava o `revalidate` das páginas
// filhas (layout sobrepõe página), impedindo o cache da loja inteira.
export const revalidate = 300;

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
