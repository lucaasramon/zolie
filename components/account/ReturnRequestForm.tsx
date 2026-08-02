'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api-client';

const MOTIVOS = [
  'Peça com defeito',
  'Peça diferente do anunciado',
  'Tamanho não serviu',
  'Recebi o item errado',
  'Não gostei / mudei de ideia',
  'Outro motivo',
];

interface Props {
  orderId: string;
  /** Solicitação já existente, se houver — bloqueia abrir outra. */
  solicitacaoAberta?: { tipo: string; status: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  SOLICITADA: 'Em análise',
  APROVADA: 'Aprovada',
  RECUSADA: 'Não aprovada',
  RECEBIDA: 'Peça recebida',
  CONCLUIDA: 'Concluída',
};

export function ReturnRequestForm({ orderId, solicitacaoAberta }: Props) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<'TROCA' | 'DEVOLUCAO'>('TROCA');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviada, setEnviada] = useState(false);

  if (solicitacaoAberta) {
    return (
      <div className="rounded-lg border border-gold-soft bg-hoverbg p-4">
        <p className="text-sm text-ink-muted">
          Solicitação de {solicitacaoAberta.tipo === 'TROCA' ? 'troca' : 'devolução'}:{' '}
          <strong className="text-ink">{STATUS_LABEL[solicitacaoAberta.status] || solicitacaoAberta.status}</strong>
        </p>
        <p className="mt-1 text-xs text-ink-tertiary">
          Avisamos por e-mail assim que houver novidade.
        </p>
      </div>
    );
  }

  if (enviada) {
    return (
      <div className="rounded-lg border border-gold-soft bg-hoverbg p-4">
        <p className="text-sm text-ink-muted">
          Solicitação enviada! Vamos analisar e responder em até 2 dias úteis.
        </p>
      </div>
    );
  }

  async function onEnviar() {
    setEnviando(true);
    setErro('');
    try {
      await api.post(`/orders/${orderId}/return`, { tipo, motivo, descricao: descricao.trim() || undefined });
      setEnviada(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar sua solicitação');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="self-start text-sm text-gold-text underline hover:text-gold-text-hover"
      >
        Solicitar troca ou devolução
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-soft p-4">
      <h3 className="font-sans text-base font-semibold text-ink">Troca ou devolução</h3>
      <p className="text-xs text-ink-tertiary">
        Você tem até 30 dias após o recebimento. Peças usadas ou danificadas por mau uso não são elegíveis.
      </p>

      <div className="flex gap-2">
        {(['TROCA', 'DEVOLUCAO'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider ${
              tipo === t ? 'border-gold bg-gold text-ink' : 'border-border-soft text-ink-muted'
            }`}
          >
            {t === 'TROCA' ? 'Trocar' : 'Devolver'}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Motivo</span>
        <select
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          className="rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-gold"
        >
          {MOTIVOS.map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Conte um pouco mais (opcional)</span>
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          rows={3}
          className="rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </label>

      {erro && <p className="text-xs text-danger">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEnviar}
          disabled={enviando}
          className="rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Enviar solicitação'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          disabled={enviando}
          className="rounded-full border border-border-soft px-5 py-2.5 text-xs uppercase tracking-wider text-ink-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
