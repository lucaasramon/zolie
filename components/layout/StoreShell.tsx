import { categoryRepo } from '@/lib/repositories/category.repo';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { linkWhatsApp } from '@/lib/loja';

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const categorias = await categoryRepo.list();
  const categoriasSimple = categorias.map(c => ({ nome: c.nome, slug: c.slug }));
  const whatsappHref = linkWhatsApp('Olá! Vim pelo site da Zoliê e gostaria de tirar uma dúvida.');

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header categorias={categoriasSimple} />
      <main className="flex-1">{children}</main>
      <Footer categorias={categoriasSimple} />
      {whatsappHref && <WhatsAppButton href={whatsappHref} />}
    </div>
  );
}
