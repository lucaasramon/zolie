'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, novaSenha });
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-14 text-center">
        <p className="text-sm text-danger">Link inválido. Solicite um novo link de recuperação.</p>
        <Link href="/login" className="text-xs text-gold-text hover:text-gold-text-hover">Voltar para o login</Link>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-14 text-center">
        <p className="text-sm text-success">Senha redefinida com sucesso!</p>
        <Link href="/login" className="rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-14">
      <h1 className="z-title text-3xl">Redefinir senha</h1>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Nova senha</span>
          <input
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            required
            minLength={8}
            className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Confirmar nova senha</span>
          <input
            type="password"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            required
            minLength={8}
            className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
          />
        </label>
        <button type="submit" disabled={loading} className="rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50">
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
