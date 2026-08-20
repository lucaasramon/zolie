'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';

interface Cliente {
  id: string;
  nome: string;
  email: string;
}

export function NotificationForm() {
  const [alvo, setAlvo] = useState<'cliente' | 'broadcast'>('cliente');
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [link, setLink] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (alvo !== 'cliente' || clienteSelecionado) return;
    const termo = busca.trim();
    if (termo.length < 2) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get<Cliente[]>(`/admin/customers?search=${encodeURIComponent(termo)}&perPage=8`)
        .then(({ data }) => setResultados(data))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [busca, alvo, clienteSelecionado]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (alvo === 'cliente' && !clienteSelecionado) {
      setErro('Selecione um cliente');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/admin/notifications', {
        ...(alvo === 'broadcast' ? { broadcast: true } : { userId: clienteSelecionado!.id }),
        titulo,
        mensagem,
        link: link || undefined,
      });
      showToast(alvo === 'broadcast' ? 'Notificação enviada para todos os clientes.' : 'Notificação enviada.');
      setTitulo('');
      setMensagem('');
      setLink('');
      setClienteSelecionado(null);
      setBusca('');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar a notificação');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
      <h3 className="font-sans text-sm font-semibold text-ink">Nova notificação</h3>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={alvo === 'cliente'} onChange={() => setAlvo('cliente')} />
          Cliente específico
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={alvo === 'broadcast'} onChange={() => setAlvo('broadcast')} />
          Todos os clientes
        </label>
      </div>

      {alvo === 'cliente' && (
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Buscar cliente por nome ou e-mail</span>
          {clienteSelecionado ? (
            <div className="flex items-center justify-between rounded-md border border-gold-soft bg-hoverbg px-3.5 py-2.5">
              <span>
                <span className="font-medium text-ink">{clienteSelecionado.nome}</span>{' '}
                <span className="text-ink-tertiary">{clienteSelecionado.email}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setClienteSelecionado(null);
                  setBusca('');
                }}
                className="text-xs uppercase tracking-wider text-gold-text hover:text-gold-text-hover"
              >
                Trocar
              </button>
            </div>
          ) : (
            <>
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Digite ao menos 2 letras..."
                className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
              />
              {resultados.length > 0 && (
                <div className="flex flex-col overflow-hidden rounded-md border border-border-subtle">
                  {resultados.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClienteSelecionado(c);
                        setResultados([]);
                      }}
                      className="flex flex-col items-start gap-0.5 px-3.5 py-2 text-left hover:bg-hoverbg"
                    >
                      <span className="font-medium text-ink">{c.nome}</span>
                      <span className="text-xs text-ink-tertiary">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Título</span>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          required
          maxLength={120}
          className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Mensagem</span>
        <textarea
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
          required
          rows={4}
          maxLength={2000}
          className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Link (opcional)</span>
        <input
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="/conta/pedidos"
          className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
        />
      </label>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Enviar notificação'}
      </button>
    </form>
  );
}
