'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

interface Props {
  variantId: string;
  initialEstoque: number;
  rotulo: string;
}

/**
 * Ajusta o estoque de UMA variação. O total do produto é recalculado no servidor
 * a partir da soma das variações — o admin nunca escreve o total diretamente.
 */
export function StockRow({ variantId, initialEstoque, rotulo }: Props) {
  const [estoque, setEstoque] = useState(initialEstoque);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);
  const router = useRouter();

  async function ajustar(delta: number) {
    const anterior = estoque;
    const novo = Math.max(0, estoque + delta);
    if (novo === anterior) return;

    setEstoque(novo);
    setSalvando(true);
    setErro(false);
    try {
      await api.patch(`/admin/variants/${variantId}`, { estoque: novo });
      router.refresh();
    } catch (err) {
      // Reverte o otimismo: mostrar um número que não foi salvo levaria o admin
      // a achar que repôs estoque que continua zerado.
      setEstoque(anterior);
      setErro(true);
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setSalvando(false);
    }
  }

  const cor = estoque === 0 ? 'text-danger' : estoque <= 3 ? 'text-gold-text' : 'text-ink';

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-28 flex-none text-xs text-ink-tertiary">{rotulo}</span>
      <button
        type="button"
        disabled={salvando}
        onClick={() => ajustar(-1)}
        className="rounded-full bg-bg-alt px-2 py-1 text-xs text-ink-muted hover:bg-hoverbg disabled:opacity-40"
      >
        −
      </button>
      <span className={`w-8 text-center font-medium ${cor}`}>{estoque}</span>
      <button
        type="button"
        disabled={salvando}
        onClick={() => ajustar(1)}
        className="rounded-full bg-bg-alt px-2 py-1 text-xs text-ink-muted hover:bg-hoverbg disabled:opacity-40"
      >
        +
      </button>
      <button
        type="button"
        disabled={salvando}
        onClick={() => ajustar(10)}
        className="rounded-full bg-[#FBF7EA] px-2 py-1 text-xs text-gold-text hover:bg-[#F5EFD9] disabled:opacity-40"
      >
        +10
      </button>
      {erro && <span className="text-xs text-danger">falhou</span>}
    </div>
  );
}
