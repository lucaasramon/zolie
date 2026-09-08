'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

interface Props {
  productId: string;
}

export function NotifyStockForm({ productId }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post(`/products/${productId}/notify-stock`, { email: email.trim() });
      setEnviado(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível registrar seu aviso');
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-success-bg bg-success-bg/60 p-5 text-center">
        <span className="text-sm font-medium text-success">Combinado! Você será avisada por e-mail assim que esta peça chegar.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-ink">Esgotado no momento</span>
        <p className="text-sm text-ink-muted">Deixe seu e-mail e avisamos assim que esta peça voltar ao estoque.</p>
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="flex-1 rounded-full border border-border-subtle bg-bg-alt px-4 py-2.5 text-sm outline-none transition-all focus:border-gold-soft focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gold px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-sm transition-all hover:bg-gold-hover active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          Avise-me
        </button>
      </div>
    </form>
  );
}
