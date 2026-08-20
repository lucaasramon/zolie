'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';
import { OrderRowSkeleton } from '@/components/ui/Skeleton';
import { PrevisaoEntrega } from '@/components/ui/PrevisaoEntrega';

interface Order {
  id: string;
  numero: string;
  status: string;
  formaPagamento: string;
  total: number | string;
  createdAt: string;
  prazoDiasEnvio: number | null;
  items: { quantidade: number }[];
}

export default function MeusPedidosPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api.get<Order[]>('/orders?perPage=20').then(({ data }) => setOrders(data));
  }, []);

  if (!orders) {
    return (
      <div className="flex flex-col gap-3">
        <OrderRowSkeleton />
        <OrderRowSkeleton />
        <OrderRowSkeleton />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-soft bg-white px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hoverbg text-gold-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M2.25 8.25h19.5M2.25 8.25v9a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-9M2.25 8.25v-1.5A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v1.5M6 15h3" />
          </svg>
        </div>
        <p className="text-sm text-ink-muted">Você ainda não fez nenhum pedido.</p>
        <Link
          href="/produtos"
          className="mt-1 rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map(o => {
        const style = STATUS_STYLE[o.status];
        const itens = o.items.reduce((a, i) => a + i.quantidade, 0);
        return (
          <Link
            key={o.id}
            href={`/conta/pedidos/${o.id}`}
            className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-gold-soft hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-hoverbg text-gold-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M2.25 8.25h19.5M2.25 8.25v9a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-9M2.25 8.25v-1.5A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v1.5M6 15h3" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-ink">Pedido {o.numero}</span>
                <div className="mt-0.5 text-xs text-ink-tertiary">
                  {new Date(o.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · {itens} ite{itens === 1 ? 'm' : 'ns'}
                </div>
                <div className="mt-1 text-xs">
                  <PrevisaoEntrega createdAt={o.createdAt} prazoDiasEnvio={o.prazoDiasEnvio} status={o.status} />
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex flex-col items-end gap-1.5">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${style.text} ${style.border} ${style.bg}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <span className="text-sm font-semibold text-ink">{brl(o.total)}</span>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 flex-none text-ink-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-gold-text"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
