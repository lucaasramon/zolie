'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';

const OPTIONS = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'];

interface Props {
  orderId: string;
  status: string;
  codigoRastreio?: string | null;
  transportadora?: string | null;
}

/**
 * Badge compacto de status na listagem — abre um popover só com o essencial
 * para mudar de status (e código de rastreio quando aplicável), em vez de
 * inflar cada linha da tabela com o formulário inteiro sempre visível.
 */
export function OrderStatusBadge({ orderId, status, codigoRastreio, transportadora }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(status);
  const [rastreio, setRastreio] = useState(codigoRastreio || '');
  const [transp, setTransp] = useState(transportadora || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const style = STATUS_STYLE[status];

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

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
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível atualizar o pedido');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-95 ${style.text} ${style.border} ${style.bg}`}
      >
        {STATUS_LABEL[status]}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 opacity-60">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border-subtle bg-white p-4 shadow-lg animate-zfade">
          <label className="flex flex-col gap-1.5 text-xs">
            <span className="text-ink-tertiary">Status do pedido</span>
            <select
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="rounded-md border border-border-subtle px-2.5 py-2 text-sm outline-none transition-colors focus:border-gold"
            >
              {OPTIONS.map(o => (
                <option key={o} value={o}>{STATUS_LABEL[o]}</option>
              ))}
            </select>
          </label>

          {(current === 'ENVIADO' || codigoRastreio) && (
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs">
                <span className="text-ink-tertiary">
                  Código de rastreio {exigeRastreio && <span className="text-danger">*</span>}
                </span>
                <input
                  value={rastreio}
                  onChange={e => setRastreio(e.target.value)}
                  placeholder="Ex: AA123456789BR"
                  className="rounded-md border border-border-subtle px-2.5 py-2 font-mono text-xs uppercase outline-none transition-colors focus:border-gold"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs">
                <span className="text-ink-tertiary">Transportadora</span>
                <input
                  value={transp}
                  onChange={e => setTransp(e.target.value)}
                  placeholder="Ex: Correios PAC"
                  className="rounded-md border border-border-subtle px-2.5 py-2 text-xs outline-none transition-colors focus:border-gold"
                />
              </label>
            </div>
          )}

          {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}

          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3.5 py-2 text-xs text-ink-tertiary hover:text-ink">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSalvar}
              disabled={salvando || !podeSalvar}
              className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
