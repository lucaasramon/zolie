'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

const NAO_CANCELAVEL = ['ENVIADO', 'ENTREGUE', 'CANCELADO'];

interface Props {
  orderId: string;
  status: string;
  /** Pedido já pago: o admin precisa decidir se devolve o dinheiro. */
  pago: boolean;
}

export function CancelOrderButton({ orderId, status, pago }: Props) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [estornar, setEstornar] = useState(pago);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();

  if (NAO_CANCELAVEL.includes(status)) return null;

  async function onConfirmar() {
    setEnviando(true);
    setErro('');
    try {
      await api.post(`/admin/orders/${orderId}/cancel`, { motivo: motivo.trim() || undefined, estornar });
      setAberto(false);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível cancelar o pedido');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-full border border-danger px-4 py-2 text-xs uppercase tracking-wider text-danger transition-colors hover:bg-danger hover:text-white"
      >
        Cancelar pedido
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-danger/40 p-3">
      <p className="text-xs text-ink-muted">
        O estoque volta para o catálogo e o cliente é avisado por e-mail. Esta ação não pode ser desfeita.
      </p>

      <input
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
        placeholder="Motivo (opcional, aparece no e-mail)"
        className="rounded-md border border-border-subtle px-2 py-1.5 text-xs outline-none transition-colors focus:border-gold"
      />

      {pago && (
        <label className="flex items-start gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={estornar}
            onChange={e => setEstornar(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Estornar o valor para o cliente.
            <span className="block text-ink-tertiary">
              Desmarque em cancelamento apenas logístico (reenvio, troca), em que o dinheiro não volta.
            </span>
          </span>
        </label>
      )}

      {erro && <p className="text-xs text-danger">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirmar}
          disabled={enviando}
          className="rounded-full bg-danger px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? 'Cancelando...' : pago && estornar ? 'Cancelar e estornar' : 'Confirmar cancelamento'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          disabled={enviando}
          className="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
