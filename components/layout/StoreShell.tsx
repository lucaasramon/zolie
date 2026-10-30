import { listParaLoja, SLUG_PERSONALIZADOS } from '@/lib/services/category.service';
import * as siteConfig from '@/lib/services/site-config.service';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { FaixaDataComemorativa } from '@/components/layout/FaixaDataComemorativa';
import { ConsultoriaButton } from '@/components/consultoria/ConsultoriaButton';
import { linkWhatsApp } from '@/lib/loja';

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const [categorias] = await Promise.all([listParaLoja(), siteConfig.preparar()]);
  const { freteGratisAtivo, faixaDatasAtiva } = siteConfig.get();
  const categoriasSimple = categorias.map(c => ({ nome: c.nome, slug: c.slug }));
  const whatsappHref = linkWhatsApp('Olá! Vim pelo site da Zoliê e gostaria de tirar uma dúvida.');

  const avisos = [
    ...(freteGratisAtivo ? ['Frete grátis acima de R$ 199'] : []),
    'Até 12x sem juros',
  ];

  return (
    // `clip` (e não `hidden`): corta o que passar da tela sem virar contêiner de
    // rolagem, o que quebraria o `sticky` do cabeçalho. O Safari do iOS nem sempre
    // respeita só o overflow do body.
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      {faixaDatasAtiva && <FaixaDataComemorativa slugPersonalizados={SLUG_PERSONALIZADOS} />}
      <Header categorias={categoriasSimple} avisos={avisos} />
      <main className="flex-1">{children}</main>
      <Footer categorias={categoriasSimple} />
      {whatsappHref && <WhatsAppButton href={whatsappHref} />}
      <ConsultoriaButton whatsappHref={whatsappHref} />
    </div>
  );
}
