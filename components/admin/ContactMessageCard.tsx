'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

interface Props {
  id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  pedido: string | null;
  respondida: boolean;
  createdAt: string;
}

export function ContactMessageCard({ id, nome, email, assunto, mensagem, pedido, respondida, createdAt }: Props) {
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  async function alternar() {
    setSalvando(true);
    try {
      await api.patch(`/admin/contact/${id}`, { respondida: !respondida });
      router.refresh();
    } finally {
      setSalvando(false);
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

      <div className="flex gap-2">
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${assunto}`)}`}
          className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover"
        >
          Responder
        </a>
        <button
          type="button"
          onClick={alternar}
          disabled={salvando}
          className="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted hover:border-gold-text disabled:opacity-50"
        >
          {respondida ? 'Reabrir' : 'Marcar respondida'}
        </button>
      </div>
    </div>
  );
}
