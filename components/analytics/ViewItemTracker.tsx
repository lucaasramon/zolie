'use client';

import { useEffect, useRef } from 'react';
import { trackViewItem, AnalyticsItem } from '@/lib/analytics';

/**
 * Dispara `view_item` ao abrir a página de produto. A página é um Server Component,
 * então o evento precisa deste componente client para acontecer no navegador.
 */
export function ViewItemTracker({ item }: { item: AnalyticsItem }) {
  const jaEnviado = useRef<string | null>(null);

  useEffect(() => {
    // Evita evento duplicado no remount do React em modo estrito (dev).
    if (jaEnviado.current === item.id) return;
    jaEnviado.current = item.id;
    trackViewItem(item);
  }, [item]);

  return null;
}
