'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';
import { OrderRowSkeleton } from '@/components/ui/Skeleton';

interface Order {
  id: string;
  numero: string;
  status: string;
  formaPagamento: string;
  total: number | string;
  createdAt: string;
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
    return <p className="text-sm text-ink-tertiary">Você ainda não fez nenhum pedido.</p>;
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 shadow-xs transition-shadow hover:shadow-md"
          >
            <div>
              <span className="font-medium text-ink">Pedido {o.numero}</span>
              <div className="text-xs text-ink-tertiary">
                {new Date(o.createdAt).toLocaleDateString('pt-BR')} · {itens} ite{itens === 1 ? 'm' : 'ns'}
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${style.text} ${style.border} ${style.bg}`}>
              {STATUS_LABEL[o.status]}
            </span>
            <span className="font-medium text-ink">{brl(o.total)}</span>
          </Link>
        );
      })}
    </div>
  );
}
