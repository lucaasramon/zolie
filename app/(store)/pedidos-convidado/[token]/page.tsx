'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';
import { OrderRowSkeleton } from '@/components/ui/Skeleton';
import { PrevisaoEntrega } from '@/components/ui/PrevisaoEntrega';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

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

export default function PedidosConvidadoPage() {
  const { token } = useParams<{ token: string }>();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .get<Order[]>(`/orders/publico/meus-pedidos?token=${encodeURIComponent(token)}&perPage=20`)
      .then(({ data }) => setOrders(data))
      .catch(err => setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar seus pedidos'));
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Meus pedidos</h1>
      <p className="mb-6 text-sm text-ink-muted">Pedidos feitos como convidado com este e-mail.</p>

      {erro && <ErrorMessage>{erro}</ErrorMessage>}

      {!erro && !orders && (
        <div className="flex flex-col gap-3">
          <OrderRowSkeleton />
          <OrderRowSkeleton />
          <OrderRowSkeleton />
        </div>
      )}

      {orders && orders.length === 0 && <p className="text-sm text-ink-tertiary">Nenhum pedido encontrado para este e-mail.</p>}

      {orders && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map(o => {
            const style = STATUS_STYLE[o.status];
            const itens = o.items.reduce((a, i) => a + i.quantidade, 0);
            return (
              <Link
                key={o.id}
                href={`/pedidos-convidado/${token}/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <span className="font-medium text-ink">Pedido {o.numero}</span>
                  <div className="text-xs text-ink-tertiary">
                    {new Date(o.createdAt).toLocaleDateString('pt-BR')} · {itens} ite{itens === 1 ? 'm' : 'ns'}
                  </div>
                  <div className="mt-0.5 text-xs">
                    <PrevisaoEntrega createdAt={o.createdAt} prazoDiasEnvio={o.prazoDiasEnvio} status={o.status} />
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
      )}
    </div>
  );
}
