'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { brl } from '@/lib/utils/money';
import { trackAddToCart } from '@/lib/analytics';
import { fireGoldConfetti } from '@/components/ui/GoldConfetti';

interface Props {
  productId: string;
  tamanhos: string[];
  estoque: number;
  /** Dados usados só para os eventos de analytics. */
  nome?: string;
  preco?: number;
  categoria?: string | null;
}

export function ProductPurchaseBox({ productId, tamanhos, estoque, nome, preco, categoria }: Props) {
  const [tamanho, setTamanho] = useState(tamanhos[0] || '');
  const [quantidade, setQuantidade] = useState(1);
  const [cep, setCep] = useState('');
  const [frete, setFrete] = useState<{ opcoes: { nome: string; prazoDias: number; valor: number }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useCart();
  const { showToast } = useToast();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  async function addToCart(buyNow = false) {
    setLoading(true);
    try {
      await api.post('/cart/items', { productId, quantidade, tamanho: tamanho || null });
      await refresh();

      // Só depois do sucesso: registrar antes contaria carrinho que nunca existiu.
      if (nome && preco != null) {
        trackAddToCart({
          id: productId,
          nome,
          preco,
          quantidade,
          categoria,
          variante: tamanho || null,
        });
      }

      fireGoldConfetti((buyNow ? buyButtonRef : addButtonRef).current);

      if (buyNow) {
        router.push('/checkout');
      } else {
        showToast('Peça adicionada à sacola', { actionLabel: 'Ver sacola', actionHref: '/carrinho' });
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível adicionar à sacola');
    } finally {
      setLoading(false);
    }
  }

  async function calcularFrete() {
    if (!cep.trim()) return;
    try {
      const { data } = await api.post<{ opcoes: { nome: string; prazoDias: number; valor: number }[] }>('/shipping/quote', { cep });
      setFrete(data);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'CEP inválido');
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      {tamanhos.length > 0 && tamanhos[0] !== 'Único' && (
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-ink">Tamanho</span>
          <div className="flex flex-wrap gap-2">
            {tamanhos.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTamanho(t)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                  tamanho === t
                    ? 'border-gold bg-gold text-ink shadow-xs'
                    : 'border-border-soft text-ink-muted hover:border-gold-text hover:text-gold-text'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-ink">Quantidade</span>
        <div className="flex items-center rounded-full border border-border-soft bg-bg-alt">
          <button
            type="button"
            onClick={() => setQuantidade(q => Math.max(1, q - 1))}
            className="grid h-9 w-9 place-items-center text-ink-muted transition-colors hover:text-gold-text active:scale-90"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium text-ink">{quantidade}</span>
          <button
            type="button"
            onClick={() => setQuantidade(q => Math.min(estoque, q + 1))}
            className="grid h-9 w-9 place-items-center text-ink-muted transition-colors hover:text-gold-text active:scale-90"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          ref={addButtonRef}
          type="button"
          disabled={loading || estoque === 0}
          onClick={() => addToCart(false)}
          className="flex-1 rounded-full border border-gold-soft bg-white py-3.5 text-xs font-medium uppercase tracking-wider text-gold-text shadow-xs transition-all hover:bg-gold hover:text-ink active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          Adicionar à sacola
        </button>
        <button
          ref={buyButtonRef}
          type="button"
          disabled={loading || estoque === 0}
          onClick={() => addToCart(true)}
          className="flex-1 rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink shadow-sm transition-all hover:bg-gold-hover hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          Comprar agora
        </button>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-5">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gold-text" aria-hidden="true">
            <path d="M3 7h11v10H3z" />
            <path d="M14 10h4l3 3v4h-7z" />
            <circle cx="7" cy="19" r="1.6" />
            <circle cx="17.5" cy="19" r="1.6" />
          </svg>
          Calcular frete
        </span>
        <div className="flex gap-2">
          <input
            value={cep}
            onChange={e => setCep(e.target.value)}
            placeholder="00000-000"
            className="flex-1 rounded-full border border-border-subtle bg-bg-alt px-4 py-2.5 text-sm outline-none transition-all focus:border-gold-soft focus:bg-white"
          />
          <button
            type="button"
            onClick={calcularFrete}
            className="rounded-full border border-border-soft px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ink-muted transition-colors hover:border-gold-text hover:text-gold-text active:scale-95"
          >
            Calcular
          </button>
        </div>
        {frete && (
          <div className="flex flex-col gap-1.5 rounded-lg bg-bg-alt p-3 text-sm text-ink-muted animate-zfade">
            {frete.opcoes.map(o => (
              <div key={o.nome} className="flex justify-between">
                <span>{o.nome} · até {o.prazoDias} dias úteis</span>
                <span className="font-medium text-ink">{o.valor === 0 ? 'Grátis' : brl(o.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
