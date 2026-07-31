'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('Erro não tratado capturado pelo error boundary', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-5 text-center">
      <span className="font-serif text-6xl text-border-soft">Ops</span>
      <h1 className="font-sans text-2xl font-semibold text-ink">Algo deu errado</h1>
      <p className="max-w-md text-sm text-ink-tertiary">
        Não conseguimos carregar esta página agora. Tente novamente em instantes.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover"
        >
          Tentar novamente
        </button>
        <Link href="/" className="rounded-full bg-bg-alt px-6 py-3 text-xs uppercase text-ink-muted shadow-xs hover:shadow-sm">
          Ir para a home
        </Link>
      </div>
    </div>
  );
}
