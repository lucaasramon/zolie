'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsAtivo, CONSENT_STORAGE_KEY, aplicarConsentimento } from '@/lib/analytics';

/**
 * Banner de consentimento (LGPD art. 7, I). Só aparece se houver analytics
 * configurado — sem GA/Pixel não há o que consentir.
 */
export function CookieConsent() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!analyticsAtivo) return;
    // Lido no efeito, não na renderização: localStorage não existe no servidor.
    if (!localStorage.getItem(CONSENT_STORAGE_KEY)) setVisivel(true);
  }, []);

  function decidir(aceito: boolean) {
    localStorage.setItem(CONSENT_STORAGE_KEY, aceito ? 'granted' : 'denied');
    aplicarConsentimento(aceito);
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-soft bg-white p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          Usamos cookies para entender como você navega e melhorar sua experiência. Você pode recusar
          sem perder nenhuma funcionalidade da loja.{' '}
          <Link href="/privacidade" className="text-gold-text underline hover:text-gold-text-hover">
            Política de privacidade
          </Link>
        </p>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={() => decidir(false)}
            className="rounded-full border border-border-soft px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink-muted transition-colors hover:border-gold-text"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => decidir(true)}
            className="rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
