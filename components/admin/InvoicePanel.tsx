'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

interface Props {
  orderId: string;
  notaFiscalUrl: string | null;
  notaFiscalChave: string | null;
  notaFiscalNumero: string | null;
}

export function InvoicePanel({ orderId, notaFiscalUrl, notaFiscalChave, notaFiscalNumero }: Props) {
  const [url, setUrl] = useState(notaFiscalUrl || '');
  const [chave, setChave] = useState(notaFiscalChave || '');
  const [numero, setNumero] = useState(notaFiscalNumero || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();

  const alterou =
    url !== (notaFiscalUrl || '') || chave !== (notaFiscalChave || '') || numero !== (notaFiscalNumero || '');

  async function onSalvar() {
    setSalvando(true);
    setErro('');
    try {
      await api.patch(`/admin/orders/${orderId}/invoice`, {
        notaFiscalUrl: url.trim() || null,
        notaFiscalChave: chave.trim(),
        notaFiscalNumero: numero.trim(),
      });
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a nota fiscal');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-xs">
      <h3 className="font-sans text-lg font-semibold text-ink">Nota fiscal</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="nf-numero" className="text-xs text-ink-tertiary">Número</label>
        <input
          id="nf-numero"
          value={numero}
          onChange={e => setNumero(e.target.value)}
          placeholder="Ex: 000123"
          className="rounded-md border border-border-subtle px-2 py-1.5 text-xs outline-none transition-colors focus:border-gold"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nf-chave" className="text-xs text-ink-tertiary">Chave de acesso (44 dígitos)</label>
        <input
          id="nf-chave"
          value={chave}
          onChange={e => setChave(e.target.value)}
          placeholder="0000 0000 0000 ..."
          className="rounded-md border border-border-subtle px-2 py-1.5 font-mono text-xs outline-none transition-colors focus:border-gold"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nf-url" className="text-xs text-ink-tertiary">Link do PDF (DANFE)</label>
        <input
          id="nf-url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-md border border-border-subtle px-2 py-1.5 text-xs outline-none transition-colors focus:border-gold"
        />
      </div>

      {erro && <p className="text-xs text-danger">{erro}</p>}

      <button
        type="button"
        onClick={onSalvar}
        disabled={salvando || !alterou}
        className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar nota fiscal'}
      </button>
    </div>
  );
}
