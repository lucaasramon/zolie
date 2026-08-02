'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

const STATUS_LABEL: Record<string, string> = {
  SOLICITADA: 'Em análise',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  RECEBIDA: 'Peça recebida',
  CONCLUIDA: 'Concluída',
};

const STATUS_STYLE: Record<string, string> = {
  SOLICITADA: 'bg-hoverbg text-gold-text border-border-soft',
  APROVADA: 'bg-[#F5F7EE] text-success border-[#D8DEC4]',
  RECUSADA: 'bg-danger-soft text-danger border-danger/30',
  RECEBIDA: 'bg-hoverbg text-gold-text border-border-soft',
  CONCLUIDA: 'bg-[#F5F7EE] text-success border-[#D8DEC4]',
};

interface Props {
  id: string;
  numero: string;
  cliente: string;
  clienteEmail: string;
  tipo: string;
  status: string;
  motivo: string;
  descricao: string | null;
  respostaAdmin: string | null;
  itens: { nomeProduto: string; tamanho: string | null; acabamento: string | null; quantidade: number }[];
  createdAt: string;
}

export function ReturnRequestCard(props: Props) {
  const { id, numero, cliente, clienteEmail, tipo, status, motivo, descricao, respostaAdmin, itens, createdAt } = props;
  const [resposta, setResposta] = useState(respostaAdmin || '');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();

  const encerrada = status === 'CONCLUIDA' || status === 'RECUSADA';

  async function decidir(novoStatus: string) {
    setProcessando(true);
    setErro('');
    try {
      await api.patch(`/admin/returns/${id}`, {
        status: novoStatus,
        respostaAdmin: resposta.trim() || undefined,
      });
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível atualizar a solicitação');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink">Pedido {numero}</span>
        <span className="rounded-full bg-hoverbg px-2.5 py-1 text-xs text-gold-text">
          {tipo === 'TROCA' ? 'Troca' : 'Devolução'}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${STATUS_STYLE[status] || ''}`}>
          {STATUS_LABEL[status] || status}
        </span>
        <span className="ml-auto text-xs text-ink-tertiary">
          {new Date(createdAt).toLocaleString('pt-BR')}
        </span>
      </div>

      <div className="text-sm text-ink-muted">
        {cliente} · <a href={`mailto:${clienteEmail}`} className="text-gold-text underline">{clienteEmail}</a>
      </div>

      <div className="rounded-lg bg-bg-alt p-3 text-sm">
        <div className="font-medium text-ink">{motivo}</div>
        {descricao && <p className="mt-1 whitespace-pre-wrap text-ink-muted">{descricao}</p>}
      </div>

      <div className="flex flex-col gap-1 text-xs text-ink-muted">
        {itens.map((i, idx) => (
          <span key={idx}>
            {i.quantidade}x {i.nomeProduto}
            {[i.tamanho, i.acabamento].filter(Boolean).length > 0 &&
              ` (${[i.tamanho, i.acabamento].filter(Boolean).join(' · ')})`}
          </span>
        ))}
      </div>

      {!encerrada && (
        <>
          <textarea
            value={resposta}
            onChange={e => setResposta(e.target.value)}
            rows={2}
            placeholder="Mensagem ao cliente (vai no e-mail)"
            className="rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-gold"
          />

          {erro && <p className="text-xs text-danger">{erro}</p>}

          <div className="flex flex-wrap gap-2">
            {status === 'SOLICITADA' && (
              <>
                <button
                  type="button"
                  onClick={() => decidir('APROVADA')}
                  disabled={processando}
                  className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => decidir('RECUSADA')}
                  disabled={processando}
                  className="rounded-full border border-danger px-4 py-2 text-xs uppercase tracking-wider text-danger hover:bg-danger hover:text-white disabled:opacity-50"
                >
                  Recusar
                </button>
              </>
            )}
            {status === 'APROVADA' && (
              <button
                type="button"
                onClick={() => decidir('RECEBIDA')}
                disabled={processando}
                className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
              >
                Marcar peça recebida
              </button>
            )}
            {status === 'RECEBIDA' && (
              <button
                type="button"
                onClick={() => decidir('CONCLUIDA')}
                disabled={processando}
                className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
              >
                Concluir
              </button>
            )}
          </div>
        </>
      )}

      {encerrada && respostaAdmin && (
        <p className="text-xs text-ink-tertiary">Resposta enviada: {respostaAdmin}</p>
      )}
    </div>
  );
}
