'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { STATUS_LABEL } from '@/lib/utils/format';

const OPTIONS = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'];

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const router = useRouter();

  async function onChange(novoStatus: string) {
    setCurrent(novoStatus);
    await api.patch(`/orders/${orderId}/status`, { status: novoStatus });
    router.refresh();
  }

  return (
    <select value={current} onChange={e => onChange(e.target.value)} className="rounded-md border border-border-subtle px-2 py-1.5 text-xs outline-none transition-colors focus:border-gold">
      {OPTIONS.map(o => (
        <option key={o} value={o}>{STATUS_LABEL[o]}</option>
      ))}
    </select>
  );
}
