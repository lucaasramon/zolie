'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

const CONFIRMACAO = 'EXCLUIR';

export function PrivacyPanel() {
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();

  async function onExportar() {
    setErro('');
    try {
      // Baixa via fetch (e não link direto) para que o cookie httpOnly seja
      // enviado e a resposta vire download sem sair da página.
      const res = await fetch('/api/v1/account/data-export', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zolie-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro('Não foi possível exportar seus dados agora. Tente novamente.');
    }
  }

  async function onExcluir() {
    setProcessando(true);
    setErro('');
    try {
      await api.delete('/account');
      router.push('/');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível excluir a conta');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle p-5">
      <div>
        <h3 className="font-sans text-lg font-semibold text-ink">Seus dados</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Você pode baixar tudo o que guardamos sobre você ou encerrar sua conta a qualquer momento.
        </p>
      </div>

      <button
        type="button"
        onClick={onExportar}
        className="self-start rounded-full border border-border-soft px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink-muted transition-colors hover:border-gold-text"
      >
        Baixar meus dados
      </button>

      <div className="border-t border-border-subtle pt-4">
        {!confirmando ? (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="text-xs text-ink-tertiary underline hover:text-danger"
          >
            Excluir minha conta
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-muted">
              Seus dados pessoais serão removidos e esta ação não pode ser desfeita. Seus pedidos são
              mantidos de forma anônima porque a lei exige a guarda de documentos fiscais.
            </p>
            <label className="text-xs text-ink-tertiary">
              Digite <strong className="text-ink">{CONFIRMACAO}</strong> para confirmar:
              <input
                value={texto}
                onChange={e => setTexto(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-danger"
              />
            </label>

            {erro && <p className="text-xs text-danger">{erro}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onExcluir}
                disabled={processando || texto !== CONFIRMACAO}
                className="rounded-full bg-danger px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {processando ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmando(false); setTexto(''); setErro(''); }}
                disabled={processando}
                className="rounded-full border border-border-soft px-5 py-2.5 text-xs uppercase tracking-wider text-ink-muted"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
