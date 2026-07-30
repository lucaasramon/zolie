import Link from 'next/link';
import Image from 'next/image';
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';
import { orderRepo } from '@/lib/repositories/order.repo';
import { reviewRepo } from '@/lib/repositories/review.repo';
import { productRepo } from '@/lib/repositories/product.repo';

export async function AdminSidebar() {
  const [aguardando, { total: reviewsPendentes }, { items: produtos }] = await Promise.all([
    orderRepo.listAll({ status: 'AGUARDANDO_PAGAMENTO', take: 1 }),
    reviewRepo.listPending({ take: 1 }),
    productRepo.search({}, 'relevancia', { skip: 0, take: 1000 }),
  ]);
  const semEstoque = produtos.filter(p => p.estoque === 0).length;
  const estoqueBaixo = produtos.filter(p => p.estoque > 0 && p.estoque <= 8).length;

  const groups = [
    {
      title: 'Loja',
      items: [
        { href: '/admin/dashboard', label: 'Visão geral' },
        { href: '/admin/pedidos', label: 'Pedidos', badge: aguardando.total || undefined },
        { href: '/admin/clientes', label: 'Clientes' },
      ],
    },
    {
      title: 'Catálogo',
      items: [
        { href: '/admin/produtos', label: 'Anúncios' },
        { href: '/admin/categorias', label: 'Categorias' },
        { href: '/admin/estoque', label: 'Estoque', badge: semEstoque + estoqueBaixo || undefined },
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
    <aside className="flex w-[232px] flex-none flex-col bg-adminbg text-[#E3DBCC]">
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
  );
}
