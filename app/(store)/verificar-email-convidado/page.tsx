'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';

function VerificarEmailConvidadoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'sucesso' | 'erro'>(token ? 'loading' : 'erro');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .post('/auth/guest-email-verification/confirm', { token })
      .then(() => setStatus('sucesso'))
      .catch((err) => {
        setErro(err instanceof ApiError ? err.message : 'Não foi possível confirmar seu e-mail');
        setStatus('erro');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-14 text-center">
        <p className="text-sm text-ink-muted">Confirmando seu e-mail...</p>
      </div>
    );
  }

  if (status === 'erro') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-14 text-center">
        <p className="text-sm text-danger">{erro || 'Link inválido ou expirado.'}</p>
        <Link href="/checkout" className="text-xs text-gold-text hover:text-gold-text-hover">Voltar para o checkout</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-14 text-center">
      <p className="text-sm text-success">E-mail confirmado com sucesso!</p>
      <p className="text-xs text-ink-tertiary">Pode voltar para a aba onde estava comprando — sua compra já continua sozinha.</p>
      <Link href="/checkout" className="rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
        Ir para o checkout
      </Link>
    </div>
  );
}

export default function VerificarEmailConvidadoPage() {
  return (
    <Suspense>
      <VerificarEmailConvidadoContent />
    </Suspense>
  );
}
