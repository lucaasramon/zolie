'use client';

import { usePathname } from 'next/navigation';

interface Props {
  href: string;
}

const ROTAS_PERMITIDAS = ['/contato', '/faq', '/trocas'];

export function WhatsAppButton({ href }: Props) {
  const pathname = usePathname();
  const exibir = ROTAS_PERMITIDAS.some(
    rota => pathname === rota || pathname?.startsWith(`${rota}/`)
  );

  if (!exibir) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 animate-zfade items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40 group-hover:opacity-0" />
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="relative h-7 w-7 text-white"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.44 5.13L2 22l5.13-1.53a9.85 9.85 0 0 0 4.9 1.32h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.01h-.01a8.1 8.1 0 0 1-4.14-1.13l-.3-.18-3.05.91.91-2.96-.19-.31a8.08 8.08 0 0 1-1.23-4.33c0-4.48 3.63-8.11 8.11-8.11 2.17 0 4.2.85 5.73 2.38a8.05 8.05 0 0 1 2.38 5.73c0 4.48-3.65 8-8.21 8Zm4.46-6.07c-.24-.12-1.44-.71-1.67-.8-.22-.08-.38-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.95-1.2-.72-.65-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.33.98 2.49c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
      </svg>
    </a>
  );
}
