'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';
import { Skeleton } from '@/components/ui/Skeleton';

interface Notificacao {
  id: string;
  tipo: 'ADMIN_MANUAL' | 'CONTATO_RESPONDIDO' | 'PEDIDO_STATUS';
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const carregar = useCallback(async (p: number) => {
    const { data, meta: m } = await api.get<Notificacao[]>(`/notifications?page=${p}`);
    setNotificacoes(data);
    setMeta(m as Meta);
  }, []);

  useEffect(() => {
    carregar(page);
  }, [carregar, page]);

  async function abrir(n: Notificacao) {
    if (!n.lida) {
      setNotificacoes(prev => prev?.map(x => (x.id === n.id ? { ...x, lida: true } : x)) ?? prev);
      try {
        await api.patch(`/notifications/${n.id}/read`);
      } catch {
        // silencioso: marcar como lida é secundário à navegação
      }
    }
  }

  async function marcarTodasLidas() {
    try {
      await api.patch('/notifications/read-all');
      setNotificacoes(prev => prev?.map(x => ({ ...x, lida: true })) ?? prev);
      showToast('Todas as notificações foram marcadas como lidas.');
    } catch {
      showToast('Não foi possível marcar as notificações como lidas.');
    }
  }

  if (!notificacoes) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  const temNaoLida = notificacoes.some(n => !n.lida);

  return (
    <div className="flex flex-col gap-4">
      {temNaoLida && (
        <button
          type="button"
          onClick={marcarTodasLidas}
          className="self-start text-xs font-medium uppercase tracking-wider text-gold-text hover:text-gold-text-hover"
        >
          Marcar todas como lidas
        </button>
      )}

      {notificacoes.length === 0 ? (
        <p className="text-sm text-ink-tertiary">Você ainda não tem notificações.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notificacoes.map(n => {
            const conteudo = (
              <div
                className={`flex flex-col gap-1.5 rounded-xl bg-white p-5 shadow-xs transition-colors ${
                  n.lida ? '' : 'ring-1 ring-inset ring-gold-soft'
                }`}
              >
                <div className="flex items-center gap-2">
                  {!n.lida && <span className="h-2 w-2 flex-none rounded-full bg-gold" aria-hidden="true" />}
                  <span className="font-sans text-sm font-semibold text-ink">{n.titulo}</span>
                  <span className="ml-auto text-xs text-ink-tertiary">{new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink-muted">{n.mensagem}</p>
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link} onClick={() => abrir(n)}>
                {conteudo}
              </Link>
            ) : (
              <button key={n.id} type="button" onClick={() => abrir(n)} className="text-left">
                {conteudo}
              </button>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs text-ink-tertiary">
            Página {meta.page} de {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
