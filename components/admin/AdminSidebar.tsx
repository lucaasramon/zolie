import Link from 'next/link';
import Image from 'next/image';
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';
import { AdminSidebarShell } from '@/components/admin/AdminSidebarShell';
import { orderRepo } from '@/lib/repositories/order.repo';
import { reviewRepo } from '@/lib/repositories/review.repo';
import { prisma } from '@/lib/prisma';

const LIMITE_ESTOQUE_BAIXO = 3;

export async function AdminSidebar() {
  // O alerta é por variação, não por produto: um produto com 20 peças pode estar
  // sem nenhuma no tamanho mais vendido.
  const [aguardando, { total: reviewsPendentes }, variacoesEmFalta, mensagensPendentes, trocasPendentes] =
    await Promise.all([
      orderRepo.listAll({ status: 'AGUARDANDO_PAGAMENTO', take: 1 }),
      reviewRepo.listPending({ take: 1 }),
      prisma.productVariant.count({
        where: { ativo: true, estoque: { lte: LIMITE_ESTOQUE_BAIXO }, product: { ativo: true } },
      }),
      prisma.contactMessage.count({ where: { respondida: false } }),
      prisma.returnRequest.count({ where: { status: 'SOLICITADA' } }),
    ]);

  const groups = [
    {
      title: 'Loja',
      items: [
        { href: '/admin/dashboard', label: 'Visão geral' },
        { href: '/admin/pedidos', label: 'Pedidos', badge: aguardando.total || undefined },
        { href: '/admin/trocas', label: 'Trocas e devoluções', badge: trocasPendentes || undefined },
        { href: '/admin/mensagens', label: 'Mensagens', badge: mensagensPendentes || undefined },
        { href: '/admin/clientes', label: 'Clientes' },
      ],
    },
    {
      title: 'Catálogo',
      items: [
        { href: '/admin/produtos', label: 'Anúncios' },
        { href: '/admin/categorias', label: 'Categorias' },
        { href: '/admin/estoque', label: 'Estoque', badge: variacoesEmFalta || undefined },
        { href: '/admin/precificacao', label: 'Precificação' },
      ],
    },
    {
      title: 'Marketing',
      items: [
        { href: '/admin/cupons', label: 'Cupons' },
        { href: '/admin/banners', label: 'Banners da home' },
        { href: '/admin/avaliacoes', label: 'Avaliações', badge: reviewsPendentes || undefined },
      ],
    },
    {
      title: 'Sistema',
      items: [{ href: '/admin/config', label: 'Configurações' }],
    },
  ];

  return (
    <AdminSidebarShell>
      <aside className="flex h-full w-full flex-col bg-adminbg text-[#E3DBCC]">
        <div className="flex items-center gap-2.5 p-5">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gold">
            <Image src="/images/zolie-logo-transparent.png" alt="Zoliê" width={28} height={28} className="object-contain" />
          </span>
          <div className="flex flex-col">
            <span className="font-serif text-lg tracking-[0.14em] text-white">ZOLIÊ</span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-gold">administração</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          {groups.map(g => (
            <div key={g.title} className="flex flex-col gap-1">
              <span className="px-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-[#8F857C]">{g.title}</span>
              <AdminSidebarNav items={g.items} />
            </div>
          ))}
        </nav>

        <div className="p-4">
          <Link href="/" className="text-xs text-[#D4AF37] hover:text-white">Ver a loja ↗</Link>
        </div>
      </aside>
    </AdminSidebarShell>
  );
}
