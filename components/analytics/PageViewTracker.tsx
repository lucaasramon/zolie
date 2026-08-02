'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_ID, META_PIXEL_ID } from '@/lib/analytics';

/**
 * Dispara pageview a cada mudança de rota. A navegação do Next é client-side, então
 * os scripts só contariam o primeiro carregamento — todo o resto da sessão ficaria
 * invisível nos relatórios.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');

    if (GA_ID && window.gtag) {
      window.gtag('event', 'page_view', { page_path: url, page_location: window.location.href });
    }
    if (META_PIXEL_ID && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}
