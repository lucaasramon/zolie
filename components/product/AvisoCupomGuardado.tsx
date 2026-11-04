'use client';

import { useSyncExternalStore } from 'react';
import { lerCupomGuardado } from '@/lib/cupomGuardado';

const nadaParaAssinar = () => () => {};

/**
 * Lembra, na página do produto, que o cupom ganho no story do anúncio está
 * guardado e entra sozinho na sacola. Sem isso, quem sai do story para o
 * produto não vê mais o desconto e acha que perdeu o presente.
 */
export function AvisoCupomGuardado() {
  // Lido só no navegador (localStorage); no servidor e na hidratação não aparece.
  const cupom = useSyncExternalStore(
    nadaParaAssinar,
    () => lerCupomGuardado()?.codigo ?? null,
    () => null,
  );
  if (!cupom) return null;

  return (
    <div className="animate-zfade mb-4 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
      <span className="text-xl" aria-hidden="true">🎁</span>
      <p className="text-sm leading-snug text-ink">
        Seu cupom <strong className="font-semibold">{cupom}</strong> está guardado e entra sozinho na sacola.
      </p>
    </div>
  );
}
