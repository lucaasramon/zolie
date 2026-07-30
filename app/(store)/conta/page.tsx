'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { api, ApiError } from '@/lib/api-client';

export default function MeusDadosPage() {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ nome: user?.nome || '', telefone: user?.telefone || '', cpf: user?.cpf || '' });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/me', form);
      await refresh();
      showToast('Dados atualizados com sucesso');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4 rounded-xl shadow-xs p-5">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Nome completo</span>
        <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">E-mail</span>
        <input value={user?.email} disabled className="rounded-md border border-border-subtle bg-hoverbg px-3.5 py-2.5 text-ink-tertiary" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">CPF</span>
        <input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Celular</span>
        <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
      </label>
      <button type="submit" disabled={loading} className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50">
        Salvar
      </button>
    </form>
  );
}
