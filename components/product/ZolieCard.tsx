'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { stars, MATERIAL_LABEL } from '@/lib/utils/format';
import { brl } from '@/lib/utils/money';

export interface DecoratedProduct {
  id: string;
  nome: string;
  slug: string;
  material: string;
  notaMedia: number | string;
  totalAvaliacoes: number;
  estoque: number;
  precoEfetivo: number;
  temDesconto: boolean;
  percentualDesconto: number;
  precoPix: number;
  parcela: number;
  maxParcelas: number;
  estoqueBaixo: boolean;
  preco: number | string;
  lancamento?: boolean;
  imagens?: string[];
}

interface ZolieCardProps {
  product: DecoratedProduct;
  wished?: boolean;
  onToggleWish?: (id: string) => void;
}

export function ZolieCard({ product: p, wished = false, onToggleWish }: ZolieCardProps) {
  const [justWished, setJustWished] = useState(false);

  function handleToggleWish() {
    setJustWished(true);
    onToggleWish?.(p.id);
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute left-[10px] top-[10px] z-[2] flex flex-col items-start gap-[5px]">
        {p.temDesconto && (
          <span className="rounded-sm bg-gold px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink">
            -{p.percentualDesconto}%
          </span>
        )}
        {p.lancamento && (
          <span className="rounded-sm border border-border-soft bg-white px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-gold-text">
            Lançamento
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggleWish}
        aria-label="Adicionar aos favoritos"
        className="absolute right-2 top-2 z-[2] grid h-[34px] w-[34px] place-items-center rounded-full bg-white/92 text-base leading-none text-gold-text transition-colors hover:bg-hoverbg"
      >
        {wished ? (
          <span className={justWished ? 'animate-zpop inline-block' : 'inline-block'}>♥</span>
        ) : (
          <span className="text-ink-tertiary">♡</span>
        )}
      </button>

      <Link
        href={`/produtos/${p.slug}`}
        className={p.imagens?.[0] ? 'relative block aspect-square overflow-hidden' : 'img-placeholder grid aspect-square place-items-center p-3'}
      >
        {p.imagens?.[0] ? (
          <Image
            src={p.imagens[0]}
            alt={p.nome}
            fill
            sizes="(max-width: 768px) 50vw, 300px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ink-tertiary">
            foto do produto
            <br />
            {p.slug}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-[5px] p-[13px] pb-[15px]">
        <span className="text-[9px] uppercase tracking-[0.13em] text-ink-tertiary">
          {MATERIAL_LABEL[p.material] || p.material}
        </span>
        <Link
          href={`/produtos/${p.slug}`}
          className="min-h-[36px] font-sans text-sm font-medium leading-tight text-ink hover:text-gold-text"
        >
          {p.nome}
        </Link>
        <div className="flex items-center gap-[5px]">
          <span className="text-[11px] tracking-wide text-gold-text">{stars(Number(p.notaMedia))}</span>
          <span className="text-[10px] font-light text-ink-tertiary">({p.totalAvaliacoes})</span>
        </div>
        <div className="mt-px flex flex-col gap-px">
          {p.temDesconto && (
            <span className="text-[11px] font-light text-ink-tertiary line-through">{brl(p.preco)}</span>
          )}
          <span className="text-lg font-medium leading-tight text-ink">{brl(p.precoEfetivo)}</span>
          {p.precoPix < p.precoEfetivo && (
            <span className="text-[10px] text-gold-text">{brl(p.precoPix)} no Pix</span>
          )}
          <span className="text-[10px] font-light text-ink-tertiary">
            ou {p.maxParcelas}x de {brl(p.parcela)}
          </span>
        </div>
        {p.estoqueBaixo && (
          <span className="text-[9px] uppercase tracking-wide text-danger">Últimas {p.estoque} peças</span>
        )}
        <Link
          href={`/produtos/${p.slug}`}
          className="mt-auto rounded-full bg-bg-alt py-[11px] text-center text-[10px] font-medium uppercase tracking-[0.08em] text-gold-text transition-all hover:bg-gold hover:text-ink active:scale-95"
        >
          Comprar
        </Link>
      </div>
    </div>
  );
}
