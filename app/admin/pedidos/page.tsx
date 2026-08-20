import Link from 'next/link';
import { OrderStatus } from '@prisma/client';
import { orderRepo } from '@/lib/repositories/order.repo';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL } from '@/lib/utils/format';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { PrevisaoEntrega } from '@/components/ui/PrevisaoEntrega';

export const dynamic = 'force-dynamic';

const EM_ANDAMENTO: OrderStatus[] = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO'];

// Cada aba representa uma fase do pedido — não um status isolado — para separar
// de fato "o que ainda precisa de atenção" de "o que já terminou", em vez de
// listar todos os status lado a lado sem hierarquia.
const TABS: { value: string; label: string; status?: OrderStatus[] }[] = [
  { value: 'andamento', label: 'Em andamento', status: EM_ANDAMENTO },
  { value: 'ENTREGUE', label: 'Entregues', status: ['ENTREGUE'] },
  { value: 'CANCELADO', label: 'Cancelados', status: ['CANCELADO'] },
  { value: '', label: 'Todos', status: undefined },
];

// Sub-filtro dentro da aba "Em andamento" — permite focar numa etapa específica
// sem perder a visão geral do que está em progresso.
const SUBFILTROS_ANDAMENTO = [
  { value: '', label: 'Todas as etapas' },
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando pagamento' },
  { value: 'PROCESSANDO', label: 'Processando' },
  { value: 'SEPARANDO', label: 'Separando' },
  { value: 'ENVIADO', label: 'Enviado' },
];

interface Props {
  searchParams: Promise<{ aba?: string; status?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const aba = TABS.some(t => t.value === sp.aba) ? sp.aba! : 'andamento';
  const tabAtiva = TABS.find(t => t.value === aba)!;

  // Dentro de "Em andamento", um sub-filtro pode restringir a uma única etapa;
  // nas demais abas o sub-filtro não se aplica.
  const subStatus = aba === 'andamento' && sp.status ? (sp.status as OrderStatus) : undefined;
  const statusQuery = subStatus ? [subStatus] : tabAtiva.status;

  const [{ items, total }, counts] = await Promise.all([
    orderRepo.listAll({ take: 100, status: statusQuery }),
    Promise.all(TABS.map(t => orderRepo.listAll({ take: 1, status: t.status }).then(r => r.total))),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Pedidos</h1>
        <p className="text-sm text-ink-tertiary">Acompanhe o que está em andamento e o que já foi finalizado.</p>
      </div>

      {/* Abas por fase do pedido */}
      <div className="flex gap-1 border-b border-border-subtle">
        {TABS.map((t, i) => (
          <Link
            key={t.value || 'todos'}
            href={t.value ? `/admin/pedidos?aba=${t.value}` : '/admin/pedidos'}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              aba === t.value ? 'text-gold-text' : 'text-ink-tertiary hover:text-ink'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                aba === t.value ? 'bg-gold text-ink' : 'bg-bg-alt text-ink-tertiary'
              }`}
            >
              {counts[i]}
            </span>
            {aba === t.value && <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-gold-text" />}
          </Link>
        ))}
      </div>

      {/* Sub-filtro de etapa, só faz sentido dentro de "Em andamento" */}
      {aba === 'andamento' && (
        <div className="flex flex-wrap gap-2">
          {SUBFILTROS_ANDAMENTO.map(f => (
            <Link
              key={f.value || 'todas'}
              href={f.value ? `/admin/pedidos?aba=andamento&status=${f.value}` : '/admin/pedidos?aba=andamento'}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                (sp.status || '') === f.value ? 'bg-[#FBF7EA] text-gold-text shadow-xs' : 'bg-bg-alt text-ink-muted hover:bg-hoverbg'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Previsão de entrega</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map(o => (
              <tr key={o.id} className="border-t border-border-subtle transition-colors hover:bg-hoverbg/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-medium text-ink hover:text-gold-text">
                    {o.numero}
                  </Link>
                  <div className="text-xs text-ink-tertiary">
                    {new Date(o.createdAt).toLocaleDateString('pt-BR')} · {o.items.length} ite{o.items.length === 1 ? 'm' : 'ns'}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    {o.user?.nome ?? o.guestNome ?? '-'}
                    {!o.user && (
                      <span className="rounded-full bg-hoverbg px-1.5 py-0.5 text-[10px] uppercase text-ink-tertiary">Convidado</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{PAGAMENTO_LABEL[o.formaPagamento] || o.formaPagamento}</td>
                <td className="px-4 py-3 font-medium text-ink">{brl(Number(o.total))}</td>
                <td className="px-4 py-3 text-ink-muted">
                  <PrevisaoEntrega createdAt={o.createdAt} prazoDiasEnvio={o.prazoDiasEnvio} status={o.status} compact />
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge orderId={o.id} status={o.status} codigoRastreio={o.codigoRastreio} transportadora={o.transportadora} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-xs text-gold-text hover:text-gold-text-hover">
                    Ver detalhes →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="border-t border-dashed border-border-soft py-14 text-center text-sm text-ink-tertiary">
            Nenhum pedido {aba === 'andamento' ? 'em andamento' : aba ? `com status "${STATUS_LABEL[aba] || aba}"` : ''} encontrado.
          </div>
        )}
      </div>
      <span className="text-xs text-ink-tertiary">{total} pedido{total === 1 ? '' : 's'} nesta visão</span>
    </div>
  );
}

const PAGAMENTO_LABEL: Record<string, string> = {
  CARTAO_CREDITO: 'Cartão de crédito',
  PIX: 'Pix',
  BOLETO: 'Boleto',
};
