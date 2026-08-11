'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { useToast } from '@/components/providers/ToastProvider';
import { Skeleton } from '@/components/ui/Skeleton';

interface Cupom {
  codigo: string;
  descricao: string | null;
  tipoDesconto: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING';
  valor: number;
  minimoPedido: number | null;
  validade: string | null;
}

function beneficio(c: Cupom) {
  if (c.tipoDesconto === 'PERCENT') return `${c.valor}% de desconto`;
  if (c.tipoDesconto === 'FIXED') return `${brl(c.valor)} de desconto`;
  return 'Frete grátis';
}

export default function MeusCuponsPage() {
  const [cupons, setCupons] = useState<Cupom[] | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    api.get<Cupom[]>('/coupons/available').then(({ data }) => setCupons(data));
  }, []);

  async function copiar(codigo: string) {
    await navigator.clipboard.writeText(codigo);
    showToast('Código copiado!');
  }

  if (!cupons) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (cupons.length === 0) {
    return <p className="text-sm text-ink-tertiary">Você não tem cupons disponíveis no momento.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {cupons.map(c => (
        <div key={c.codigo} className="flex items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-xs">
          <div>
            <span className="font-sans text-lg font-semibold text-gold-text">{beneficio(c)}</span>
            {c.descricao && <p className="text-sm text-ink-tertiary">{c.descricao}</p>}
            {c.minimoPedido != null && (
              <p className="text-xs text-ink-tertiary">Válido em pedidos acima de {brl(c.minimoPedido)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => copiar(c.codigo)}
            className="flex-none rounded-full border border-dashed border-gold-soft px-4 py-2 text-sm font-medium uppercase tracking-wide text-gold-text hover:bg-hoverbg"
          >
            {c.codigo}
          </button>
        </div>
      ))}
    </div>
  );
}
