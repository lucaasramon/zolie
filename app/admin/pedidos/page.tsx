import Link from 'next/link';
import { orderRepo } from '@/lib/repositories/order.repo';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL } from '@/lib/utils/format';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';

export const dynamic = 'force-dynamic';

const CHIPS = [
  { value: '', label: 'Todos' },
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando' },
  { value: 'PROCESSANDO', label: 'Processando' },
  { value: 'SEPARANDO', label: 'Separando' },
  { value: 'ENVIADO', label: 'Enviados' },
  { value: 'ENTREGUE', label: 'Entregues' },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = sp.status || '';

  const [{ items, total }, counts] = await Promise.all([
    orderRepo.listAll({ take: 50, status: status || undefined }),
    Promise.all(CHIPS.map(c => orderRepo.listAll({ take: 1, status: c.value || undefined }).then(r => r.total))),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c, i) => (
          <Link
            key={c.value || 'todos'}
            href={c.value ? `/admin/pedidos?status=${c.value}` : '/admin/pedidos'}
            className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
              status === c.value ? 'bg-[#FBF7EA] text-gold-text shadow-xs' : 'bg-bg-alt text-ink-muted hover:bg-hoverbg'
            }`}
          >
            {c.label} ({counts[i]})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o: any) => (
              <tr key={o.id} className="border-t border-border-subtle">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{o.numero}</div>
                  <div className="text-xs text-ink-tertiary">{new Date(o.createdAt).toLocaleDateString('pt-BR')} · {o.items.length} itens</div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{o.user?.nome}</td>
                <td className="px-4 py-3 text-ink-muted">{o.formaPagamento}</td>
                <td className="px-4 py-3 font-medium text-ink">{brl(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-xs text-gold-text hover:text-gold-text-hover">Detalhes</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="border-t border-dashed border-border-soft py-10 text-center text-sm text-ink-tertiary">Nenhum pedido encontrado.</div>
        )}
      </div>
      <span className="text-xs text-ink-tertiary">{total} pedido{total === 1 ? '' : 's'} no total</span>
    </div>
  );
}
