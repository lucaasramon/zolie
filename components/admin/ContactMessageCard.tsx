'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';

interface Props {
  id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  pedido: string | null;
  respondida: boolean;
  resposta: string | null;
  respondidaEm: string | null;
  createdAt: string;
}

export function ContactMessageCard({ id, nome, email, assunto, mensagem, pedido, respondida, resposta, respondidaEm, createdAt }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [respondendo, setRespondendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [texto, setTexto] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  async function alternar() {
    setSalvando(true);
    try {
      await api.patch(`/admin/contact/${id}`, { respondida: !respondida });
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  async function enviarResposta(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/admin/contact/${id}/responder`, { resposta: texto });
      showToast('Resposta enviada ao cliente.');
      setRespondendo(false);
      setTexto('');
      router.refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível enviar a resposta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`flex flex-col gap-2 rounded-xl bg-white p-4 shadow-xs ${respondida ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-hoverbg px-2.5 py-1 text-xs text-gold-text">{assunto}</span>
        {pedido && <span className="text-xs text-ink-tertiary">Pedido {pedido}</span>}
        <span className="ml-auto text-xs text-ink-tertiary">
          {new Date(createdAt).toLocaleString('pt-BR')}
        </span>
      </div>

      <div className="text-sm">
        <span className="font-medium text-ink">{nome}</span>{' '}
        <a href={`mailto:${email}`} className="text-gold-text underline">{email}</a>
      </div>

      <p className="whitespace-pre-wrap text-sm text-ink-muted">{mensagem}</p>

      {resposta && (
        <div className="rounded-lg border-l-2 border-gold bg-hoverbg px-3.5 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wider text-gold-text">
            Sua resposta{respondidaEm && ` · ${new Date(respondidaEm).toLocaleString('pt-BR')}`}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{resposta}</p>
        </div>
      )}

      {respondendo ? (
        <form onSubmit={enviarResposta} className="flex flex-col gap-2">
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Escreva a resposta para o cliente..."
            className="rounded-md border border-border-subtle px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gold"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar resposta'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRespondendo(false);
                setTexto('');
              }}
              className="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted hover:border-gold-text"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRespondendo(true)}
            className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover"
          >
            {resposta ? 'Responder novamente' : 'Responder'}
          </button>
          <button
            type="button"
            onClick={alternar}
            disabled={salvando}
            className="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted hover:border-gold-text disabled:opacity-50"
          >
            {respondida ? 'Reabrir' : 'Marcar respondida'}
          </button>
        </div>
      )}
    </div>
  );
}
