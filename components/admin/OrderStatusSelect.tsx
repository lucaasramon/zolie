'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { STATUS_LABEL } from '@/lib/utils/format';

const OPTIONS = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'];

interface Props {
  orderId: string;
  status: string;
  codigoRastreio?: string | null;
  transportadora?: string | null;
}

export function OrderStatusSelect({ orderId, status, codigoRastreio, transportadora }: Props) {
  const [current, setCurrent] = useState(status);
  const [rastreio, setRastreio] = useState(codigoRastreio || '');
  const [transp, setTransp] = useState(transportadora || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();

  // O código só é obrigatório ao marcar como ENVIADO e quando ainda não há um gravado.
  const exigeRastreio = current === 'ENVIADO' && !codigoRastreio;
  const alterouRastreio = rastreio !== (codigoRastreio || '') || transp !== (transportadora || '');
  const podeSalvar = current !== status || alterouRastreio;

  async function onSalvar() {
    if (exigeRastreio && !rastreio.trim()) {
      setErro('Informe o código de rastreio para marcar como enviado.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status: current,
        ...(alterouRastreio && { codigoRastreio: rastreio.trim(), transportadora: transp.trim() }),
      });
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível atualizar o pedido');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={current}
        onChange={e => setCurrent(e.target.value)}
        className="rounded-md border border-border-subtle px-2 py-1.5 text-xs outline-none transition-colors focus:border-gold"
      >
        {OPTIONS.map(o => (
          <option key={o} value={o}>{STATUS_LABEL[o]}</option>
        ))}
      </select>

      <div className="flex flex-col gap-1">
        <label htmlFor="rastreio" className="text-xs text-ink-tertiary">
          Código de rastreio {exigeRastreio && <span className="text-danger">*</span>}
        </label>
        <input
          id="rastreio"
          value={rastreio}
          onChange={e => setRastreio(e.target.value)}
          placeholder="Ex: AA123456789BR"
          className="rounded-md border border-border-subtle px-2 py-1.5 font-mono text-xs uppercase outline-none transition-colors focus:border-gold"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="transportadora" className="text-xs text-ink-tertiary">Transportadora</label>
        <input
          id="transportadora"
          value={transp}
          onChange={e => setTransp(e.target.value)}
          placeholder="Ex: Correios PAC"
          className="rounded-md border border-border-subtle px-2 py-1.5 text-xs outline-none transition-colors focus:border-gold"
        />
      </div>

      {erro && <p className="text-xs text-danger">{erro}</p>}

      <button
        type="button"
        onClick={onSalvar}
        disabled={salvando || !podeSalvar}
        className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </div>
  );
}
