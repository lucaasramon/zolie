import { categoryRepo } from '@/lib/repositories/category.repo';
import * as siteConfig from '@/lib/services/site-config.service';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { linkWhatsApp } from '@/lib/loja';

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const [categorias] = await Promise.all([categoryRepo.list(), siteConfig.preparar()]);
  const { freteGratisAtivo, descontoPixAtivo } = siteConfig.get();
  const categoriasSimple = categorias.map(c => ({ nome: c.nome, slug: c.slug }));
  const whatsappHref = linkWhatsApp('Olá! Vim pelo site da Zoliê e gostaria de tirar uma dúvida.');

  const avisos = [
    ...(freteGratisAtivo ? ['Frete grátis acima de R$ 199'] : []),
    ...(descontoPixAtivo ? ['10% de desconto no Pix'] : []),
    'Até 12x sem juros',
  ];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header categorias={categoriasSimple} avisos={avisos} />
      <main className="flex-1">{children}</main>
      <Footer categorias={categoriasSimple} />
      {whatsappHref && <WhatsAppButton href={whatsappHref} />}
    </div>
  );
}
