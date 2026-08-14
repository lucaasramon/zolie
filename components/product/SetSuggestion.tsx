'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { MATERIAL_LABEL } from '@/lib/utils/format';
import { brl } from '@/lib/utils/money';

export interface SetPiece {
  id: string;
  nome: string;
  slug: string;
  material: string;
  precoEfetivo: number;
  preco: number | string;
  temDesconto: boolean;
  percentualDesconto: number;
  precoPix: number;
  parcela: number;
  maxParcelas: number;
  estoque: number;
  estoqueBaixo: boolean;
  lancamento?: boolean;
  imagens?: string[];
}

/** Card de peça dentro da sugestão de conjunto: mesma linguagem visual do
 * ZolieCard do catálogo, mas com "Adicionar à sacola" direto (sem sair da
 * página) em vez de "Comprar" — aqui o objetivo é fechar o conjunto inteiro. */
function SetPieceCard({ piece, destaque = false }: { piece: SetPiece; destaque?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { refresh } = useCart();
  const { showToast } = useToast();

  async function handleAdd() {
    setLoading(true);
    try {
      await api.post('/cart/items', { productId: piece.id, quantidade: 1, tamanho: null });
      await refresh();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível adicionar à sacola');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`group relative flex w-[168px] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-[192px] ${
        destaque ? 'ring-2 ring-gold' : ''
      }`}
    >
      <div className="absolute left-2 top-2 z-[2] flex flex-col items-start gap-1">
        {piece.temDesconto && (
          <span className="rounded-sm bg-gold px-1.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-ink">
            -{piece.percentualDesconto}%
          </span>
        )}
        {piece.lancamento && (
          <span className="rounded-sm border border-border-soft bg-white px-1.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-gold-text">
            Lançamento
          </span>
        )}
      </div>

      <Link
        href={`/produtos/${piece.slug}`}
        className={piece.imagens?.[0] ? 'relative block aspect-square overflow-hidden' : 'img-placeholder grid aspect-square place-items-center p-3'}
      >
        {piece.imagens?.[0] ? (
          <Image
            src={piece.imagens[0]}
            alt={piece.nome}
            fill
            sizes="(max-width: 768px) 40vw, 192px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ink-tertiary">
            foto do produto
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3 pb-3.5">
        <span className="text-[9px] uppercase tracking-[0.13em] text-ink-tertiary">
          {MATERIAL_LABEL[piece.material] || piece.material}
        </span>
        <Link href={`/produtos/${piece.slug}`} className="min-h-[32px] font-sans text-[13px] font-medium leading-tight text-ink hover:text-gold-text">
          {piece.nome}
        </Link>
        <div className="mt-px flex flex-col gap-px">
          {piece.temDesconto && (
            <span className="text-[10px] font-light text-ink-tertiary line-through">{brl(piece.preco)}</span>
          )}
          <span className="text-base font-medium leading-tight text-ink">{brl(piece.precoEfetivo)}</span>
          <span className="text-[10px] font-light text-ink-tertiary">ou {piece.maxParcelas}x de {brl(piece.parcela)}</span>
        </div>
        {piece.estoqueBaixo && (
          <span className="text-[9px] uppercase tracking-wide text-danger">Últimas {piece.estoque} peças</span>
        )}
        <button
          type="button"
          disabled={loading || piece.estoque === 0}
          onClick={handleAdd}
          className={`mt-auto rounded-full py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.08em] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
            added ? 'bg-success text-white' : 'bg-bg-alt text-gold-text hover:bg-gold hover:text-ink'
          }`}
        >
          {added ? 'Adicionado ✓' : 'Adicionar à sacola'}
        </button>
      </div>
    </div>
  );
}

export function SetSuggestion({ produto, sugestoes }: { produto: SetPiece; sugestoes: SetPiece[] }) {
  const [addingAll, setAddingAll] = useState(false);
  const { refresh } = useCart();
  const { showToast } = useToast();

  if (sugestoes.length === 0) return null;

  const pecas = [produto, ...sugestoes];
  const total = pecas.reduce((acc, p) => acc + p.precoEfetivo, 0);

  async function handleAddAll() {
    setAddingAll(true);
    try {
      await Promise.all(
        pecas.map(p => api.post('/cart/items', { productId: p.id, quantidade: 1, tamanho: null })),
      );
      await refresh();
      showToast('Conjunto adicionado à sacola', { actionLabel: 'Ver sacola', actionHref: '/carrinho' });
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível adicionar o conjunto');
    } finally {
      setAddingAll(false);
    }
  }

  return (
    <div className="mt-14 overflow-hidden rounded-2xl border border-border-subtle bg-white px-4 py-6 shadow-xs sm:px-8 sm:py-7">
      <div className="text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold-text">Sugestão de estilo</span>
        <h2 className="mt-1.5 font-serif text-xl text-ink sm:text-2xl">Combine e monte o conjunto perfeito</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-tertiary">
          Estas peças foram escolhidas a dedo para usar junto — o mesmo material, o mesmo estilo.
        </p>
      </div>

      <div className="-mx-4 mt-6 flex items-stretch gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-7 sm:flex-wrap sm:justify-center sm:gap-4 sm:overflow-visible sm:px-0">
        <SetPieceCard piece={produto} destaque />
        {sugestoes.map(s => (
          <span key={s.id} className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="text-xl font-light text-gold-text sm:text-2xl">+</span>
            <SetPieceCard piece={s} />
          </span>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-3 border-t border-border-subtle pt-5 sm:mt-7">
        <div className="flex items-center gap-2 text-sm">
          <span className="uppercase tracking-wide text-ink-tertiary">Conjunto completo</span>
          <span className="font-serif text-lg text-ink">{brl(total)}</span>
        </div>
        <button
          type="button"
          disabled={addingAll}
          onClick={handleAddAll}
          className="w-full rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink shadow-sm transition-all hover:bg-gold-hover hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:active:scale-100 sm:w-auto sm:px-8"
        >
          {addingAll ? 'Adicionando...' : `Adicionar as ${pecas.length} peças à sacola`}
        </button>
      </div>
    </div>
  );
}
