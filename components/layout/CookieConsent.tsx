'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { analyticsAtivo, CONSENT_STORAGE_KEY, aplicarConsentimento } from '@/lib/analytics';

/**
 * Banner de consentimento (LGPD art. 7, I). Só aparece se houver analytics
 * configurado — sem GA/Pixel não há o que consentir.
 */
export function CookieConsent() {
  const [visivel, setVisivel] = useState(false);
  // Na página de story do anúncio (/s/...) o aviso cobriria os botões do story.
  // Sem decisão, nada é rastreado (padrão negado); ele aparece quando a pessoa
  // seguir para a loja.
  const noStory = usePathname()?.startsWith('/s/') ?? false;

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

  if (!visivel || noStory) return null;

  // Faixa fina: no celular o banner antigo cobria a parte de baixo da tela,
  // exatamente onde começam os produtos para quem chega pelo Instagram.
  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-soft bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm sm:p-4"
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
        <p className="text-[11px] leading-snug text-ink-muted sm:text-sm">
          <span className="sm:hidden">Usamos cookies para melhorar sua experiência. </span>
          <span className="hidden sm:inline">
            Usamos cookies para entender como você navega e melhorar sua experiência. Você pode recusar
            sem perder nenhuma funcionalidade da loja.{' '}
          </span>
          <Link href="/privacidade" className="text-gold-text underline hover:text-gold-text-hover">
            Saiba mais
          </Link>
        </p>
        <div className="flex flex-none gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => decidir(false)}
            className="rounded-full border border-border-soft px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:border-gold-text sm:px-5 sm:py-2.5 sm:text-xs"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => decidir(true)}
            className="rounded-full bg-gold px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover sm:px-5 sm:py-2.5 sm:text-xs"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
