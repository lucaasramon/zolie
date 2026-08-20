'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { stars, MATERIAL_LABEL } from '@/lib/utils/format';
import { brl } from '@/lib/utils/money';
import { useAuth } from '@/components/providers/AuthProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';

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
}

function HeartSvg({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function ZolieCard({ product: p }: ZolieCardProps) {
  const [justWished, setJustWished] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { user } = useAuth();
  const { isWished, toggle } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();
  const wished = isWished(p.id);
  const segundaImagem = p.imagens?.[1];

  async function handleToggleWish() {
    if (!user) {
      router.push(`/login?next=/produtos/${p.slug}`);
      return;
    }
    if (!wished) setJustWished(true);
    try {
      await toggle(p.id);
    } catch {
      showToast('Não foi possível atualizar os favoritos');
    }
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-border-soft hover:shadow-lg">
      <div className="absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
        {p.temDesconto && (
          <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink shadow-xs">
            -{p.percentualDesconto}%
          </span>
        )}
        {p.lancamento && (
          <span className="rounded-full border border-gold/40 bg-white/92 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-gold-text backdrop-blur-sm">
            Novo
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggleWish}
        aria-label={wished ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        className={`absolute right-2.5 top-2.5 z-[2] grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-xs backdrop-blur-sm transition-all hover:scale-110 ${
          wished ? 'text-gold-text' : 'text-ink-tertiary hover:text-gold-text'
        }`}
      >
        <span className={justWished && wished ? 'animate-zpop inline-block' : 'inline-block'}>
          <HeartSvg filled={wished} className="h-[18px] w-[18px]" />
        </span>
      </button>

      <Link
        href={`/produtos/${p.slug}`}
        className={p.imagens?.[0] ? 'relative block aspect-[4/5] overflow-hidden bg-bg-alt' : 'img-placeholder grid aspect-[4/5] place-items-center p-3'}
      >
        {p.imagens?.[0] ? (
          <>
            {!imgLoaded && <div className="img-skeleton-shine absolute inset-0" aria-hidden="true" />}
            <Image
              src={p.imagens[0]}
              alt={p.nome}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              className={`object-cover transition-all duration-700 ease-out ${
                segundaImagem ? 'group-hover:opacity-0' : 'group-hover:scale-[1.06]'
              } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
            {segundaImagem && (
              <Image
                src={segundaImagem}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 300px"
                className="scale-[1.04] object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ink-tertiary">
            foto do produto
            <br />
            {p.slug}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3.5">
        <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-gold-text">
          {MATERIAL_LABEL[p.material] || p.material}
        </span>
        <Link
          href={`/produtos/${p.slug}`}
          className="min-h-[40px] font-serif text-[17px] font-medium leading-snug text-ink transition-colors hover:text-gold-text"
        >
          {p.nome}
        </Link>
        {p.totalAvaliacoes > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] tracking-[0.08em] text-gold-soft">{stars(Number(p.notaMedia))}</span>
            <span className="text-[10px] font-light text-ink-tertiary">({p.totalAvaliacoes})</span>
          </div>
        )}
        <div className="mt-0.5 flex flex-col gap-px">
          {p.temDesconto && (
            <span className="text-[11px] font-light text-ink-tertiary line-through">{brl(p.preco)}</span>
          )}
          <span className="text-lg font-medium leading-tight tracking-tight text-ink">{brl(p.precoEfetivo)}</span>
          {p.precoPix < p.precoEfetivo && (
            <span className="text-[10.5px] font-medium text-gold-text">{brl(p.precoPix)} no Pix</span>
          )}
          <span className="text-[10.5px] font-light text-ink-tertiary">
            ou {p.maxParcelas}x de {brl(p.parcela)}
          </span>
        </div>
        {p.estoqueBaixo && (
          <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-danger">Últimas {p.estoque} peças</span>
        )}
        <Link
          href={`/produtos/${p.slug}`}
          className="mt-auto rounded-full border border-border-soft bg-white pt-[11px] pb-[10px] text-center text-[10px] font-medium uppercase tracking-[0.16em] text-ink transition-all duration-300 hover:border-gold hover:bg-gold hover:shadow-sm active:scale-95 group-hover:border-gold group-hover:bg-gold"
        >
          Ver peça
        </Link>
      </div>
    </div>
  );
}
