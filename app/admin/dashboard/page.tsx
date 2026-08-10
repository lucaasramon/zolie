import Link from 'next/link';
import { dashboard } from '@/lib/services/admin.service';
import { orderRepo } from '@/lib/repositories/order.repo';
import { reviewRepo } from '@/lib/repositories/review.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [data, { items: recentOrders }, { total: pendingReviewsTotal }, { items: produtos }] = await Promise.all([
    dashboard(),
    orderRepo.listAll({ take: 4 }),
    reviewRepo.listPending({ take: 1 }),
    productRepo.search({}, 'relevancia', { skip: 0, take: 1000 }),
  ]);

  const semEstoque = produtos.filter(p => p.estoque === 0);
  const estoqueBaixo = produtos.filter(p => p.estoque > 0 && p.estoque <= 8);
  const maxVenda = Math.max(1, ...data.vendasPorDia.map(v => v.total));
  const aguardandoPagamento = recentOrders.filter(o => o.status === 'AGUARDANDO_PAGAMENTO').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Faturamento" value={brl(data.vendas.faturamento)} />
        <KpiCard label="Pedidos" value={String(data.vendas.pedidos)} />
        <KpiCard label="Ticket médio" value={brl(data.vendas.ticketMedio)} />
        <KpiCard label="Categorias ativas" value={String(data.catalogo.totalCategorias)} />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-xs">
        <h2 className="mb-4 font-sans text-lg font-semibold text-ink">Faturamento dos últimos 7 dias</h2>
        {data.vendasPorDia.length === 0 ? (
          <p className="text-sm text-ink-tertiary">Ainda não há vendas registradas.</p>
        ) : (
          <div className="flex h-32 items-end gap-3">
            {data.vendasPorDia.map(v => (
              <div key={v.dia} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-sm ${v.total === maxVenda ? 'bg-gold' : 'bg-border-soft'}`}
                  style={{ height: `${Math.max(4, (v.total / maxVenda) * 100)}%` }}
                />
                <span className="text-[11px] text-ink-tertiary">{v.dia}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sans text-lg font-semibold text-ink">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs text-gold-text hover:text-gold-text-hover">Ver todos →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentOrders.map((o: any) => {
              const style = STATUS_STYLE[o.status];
              return (
                <div key={o.id} className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3 first:border-0 first:pt-0">
                  <div>
                    <span className="text-sm font-medium text-ink">{o.numero}</span>
                    <div className="text-xs text-ink-tertiary">{o.user?.nome} · {o.items.length} itens</div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${style.text} ${style.border} ${style.bg}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="text-sm font-medium text-ink">{brl(o.total)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-danger-soft bg-danger-bg p-5 shadow-xs">
          <h2 className="mb-3 font-sans text-lg font-semibold text-ink">Precisa de atenção</h2>
          <div className="flex flex-col gap-2 text-sm">
            {semEstoque.length > 0 && (
              <Link href="/admin/produtos" className="flex justify-between text-ink-muted hover:text-danger">
                <span>Peças sem estoque</span><span className="font-medium">{semEstoque.length}</span>
              </Link>
            )}
            {estoqueBaixo.length > 0 && (
              <Link href="/admin/produtos" className="flex justify-between text-ink-muted hover:text-danger">
                <span>Peças com estoque baixo</span><span className="font-medium">{estoqueBaixo.length}</span>
              </Link>
            )}
            {pendingReviewsTotal > 0 && (
              <Link href="/admin/avaliacoes" className="flex justify-between text-ink-muted hover:text-danger">
                <span>Avaliações pendentes</span><span className="font-medium">{pendingReviewsTotal}</span>
              </Link>
            )}
            {aguardandoPagamento > 0 && (
              <Link href="/admin/pedidos?status=AGUARDANDO_PAGAMENTO" className="flex justify-between text-ink-muted hover:text-danger">
                <span>Pedidos aguardando pagamento</span><span className="font-medium">{aguardandoPagamento}</span>
              </Link>
            )}
            {semEstoque.length === 0 && estoqueBaixo.length === 0 && pendingReviewsTotal === 0 && aguardandoPagamento === 0 && (
              <span className="text-ink-tertiary">Tudo em ordem por aqui.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-xs">
      <span className="text-xs uppercase tracking-wider text-ink-tertiary">{label}</span>
      <div className="mt-1 font-sans text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
