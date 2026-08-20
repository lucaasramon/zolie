'use client';

import { useEffect, useState } from 'react';

interface Props {
  productId: string;
  estoqueBaixo?: boolean;
}

/**
 * Hash simples e determinístico só para semear o gerador — mesmo produto
 * sempre parte da mesma faixa de "pessoas vendo", varia suavemente a partir daí.
 */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function ProductSocialProof({ productId, estoqueBaixo }: Props) {
  const [viewers, setViewers] = useState<number | null>(null);
  const [recentSale, setRecentSale] = useState(false);

  useEffect(() => {
    const seed = seedFromId(productId);
    const base = 3 + (seed % 9); // faixa base: 3 a 11 pessoas
    setViewers(base);

    const interval = setInterval(() => {
      setViewers(v => {
        if (v == null) return v;
        const delta = Math.random() < 0.5 ? -1 : 1;
        const next = v + delta;
        return Math.min(19, Math.max(2, next));
      });
    }, 4500);

    // Notificação ocasional de "compra recente" para reforçar urgência sem exagerar.
    const saleInterval = setInterval(() => {
      if (Math.random() < 0.35) {
        setRecentSale(true);
        setTimeout(() => setRecentSale(false), 5000);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(saleInterval);
    };
  }, [productId]);

  if (viewers == null) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span>
          <strong className="font-medium text-ink">{viewers}</strong> {viewers === 1 ? 'pessoa está vendo' : 'pessoas estão vendo'} esta peça agora
        </span>
      </div>
      {recentSale && (
        <div className="animate-zfade flex items-center gap-1.5 text-xs text-gold-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 Z" />
          </svg>
          <span>Alguém comprou esta peça recentemente</span>
        </div>
      )}
      {estoqueBaixo && (
        <div className="flex items-center gap-1.5 text-xs text-danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M12 9v4M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>Estoque limitado — alta procura</span>
        </div>
      )}
    </div>
  );
}
