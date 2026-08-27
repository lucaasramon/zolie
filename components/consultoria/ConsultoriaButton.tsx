'use client';

import { useState } from 'react';
import { ConsultoriaPanel } from '@/components/consultoria/ConsultoriaPanel';

interface Props {
  whatsappHref: string | null;
}

export function ConsultoriaButton({ whatsappHref }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente de compras"
        className="group fixed bottom-5 left-5 z-50 flex h-14 animate-zfade items-center justify-center gap-2 rounded-full bg-gold pl-3.5 pr-4 shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:left-6"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 shrink-0 text-ink" aria-hidden="true">
          <path d="M12 3a5 5 0 0 0-5 5c0 2.1 1.2 3.4 2.1 4.3.6.6.9 1.4.9 2.2v.5h4v-.5c0-.8.3-1.6.9-2.2.9-.9 2.1-2.2 2.1-4.3a5 5 0 0 0-5-5Z" />
          <path d="M10 18h4M11 21h2" />
        </svg>
        <span className="hidden text-[12.5px] font-medium uppercase tracking-[0.06em] text-ink sm:inline">
          Assistente de compras
        </span>
      </button>

      {open && <ConsultoriaPanel onClose={() => setOpen(false)} whatsappHref={whatsappHref} />}
    </>
  );
}
