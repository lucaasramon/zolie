import { categoryRepo } from '@/lib/repositories/category.repo';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const categorias = await categoryRepo.list();
  const categoriasSimple = categorias.map(c => ({ nome: c.nome, slug: c.slug }));

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header categorias={categoriasSimple} />
      <main className="flex-1">{children}</main>
      <Footer categorias={categoriasSimple} />
    </div>
  );
}
