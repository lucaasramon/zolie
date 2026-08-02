'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { api, ApiError } from '@/lib/api-client';
import { cpfValido, formatarCpf, normalizarCpf } from '@/lib/utils/cpf';
import { PrivacyPanel } from '@/components/account/PrivacyPanel';

export default function MeusDadosPage() {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    nome: user?.nome || '',
    telefone: user?.telefone || '',
    cpf: user?.cpf ? formatarCpf(user.cpf) : '',
  });
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  async function onResendVerification() {
    setReenviando(true);
    try {
      await api.post('/auth/resend-verification', {});
      showToast('E-mail de confirmação reenviado.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível reenviar o e-mail');
    } finally {
      setReenviando(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cpf = normalizarCpf(form.cpf);
    if (cpf && !cpfValido(cpf)) {
      showToast('CPF inválido. Confira os números digitados.');
      return;
    }

    setLoading(true);
    try {
      // Campos opcionais vazios são omitidos: o schema rejeita string vazia.
      await api.put('/auth/me', {
        nome: form.nome || undefined,
        telefone: form.telefone || undefined,
        cpf: cpf || undefined,
      });
      await refresh();
      showToast('Dados atualizados com sucesso');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Nome completo</span>
        <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">E-mail</span>
        <input value={user?.email} disabled className="rounded-md border border-border-subtle bg-hoverbg px-3.5 py-2.5 text-ink-tertiary" />
        {user && !user.emailVerified && (
          <span className="text-xs text-ink-muted">
            E-mail ainda não confirmado.{' '}
            <button type="button" onClick={onResendVerification} disabled={reenviando} className="text-gold-text underline hover:text-gold-text-hover disabled:opacity-50">
              {reenviando ? 'Enviando...' : 'Reenviar confirmação'}
            </button>
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">CPF</span>
        <input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: formatarCpf(e.target.value) }))} inputMode="numeric" maxLength={14} placeholder="000.000.000-00" className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Celular</span>
        <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
      </label>
      <button type="submit" disabled={loading} className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50">
        Salvar
      </button>
    </form>

    <PrivacyPanel />
    </div>
  );
}
