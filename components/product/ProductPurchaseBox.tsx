'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { brl } from '@/lib/utils/money';

interface Props {
  productId: string;
  tamanhos: string[];
  estoque: number;
}

export function ProductPurchaseBox({ productId, tamanhos, estoque }: Props) {
  const [tamanho, setTamanho] = useState(tamanhos[0] || '');
  const [acabamento, setAcabamento] = useState('Polido');
  const [quantidade, setQuantidade] = useState(1);
  const [cep, setCep] = useState('');
  const [frete, setFrete] = useState<{ opcoes: { nome: string; prazoDias: number; valor: number }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useCart();
  const { showToast } = useToast();

  async function addToCart(buyNow = false) {
    if (!user) {
      router.push('/login?next=/checkout');
      return;
    }
    setLoading(true);
    try {
      await api.post('/cart/items', { productId, quantidade, tamanho: tamanho || null, acabamento });
      await refresh();
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
    <div className="flex flex-col gap-4">
      {tamanhos.length > 0 && tamanhos[0] !== 'Único' && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-ink">Tamanho</span>
          <div className="flex flex-wrap gap-2">
            {tamanhos.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTamanho(t)}
                className={`rounded-full border px-3.5 py-2 text-sm ${
                  tamanho === t ? 'border-gold bg-gold text-ink' : 'border-border-soft text-ink-muted hover:border-gold-text'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink">Acabamento</span>
        <div className="flex gap-2">
          {['Polido', 'Fosco'].map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAcabamento(a)}
              className={`rounded-full border px-3.5 py-2 text-sm ${
                acabamento === a ? 'border-gold bg-gold text-ink' : 'border-border-soft text-ink-muted hover:border-gold-text'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-ink">Quantidade</span>
        <div className="flex items-center rounded-full border border-border-soft">
          <button type="button" onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="px-3 py-1.5 text-ink-muted">−</button>
          <span className="w-8 text-center text-sm">{quantidade}</span>
          <button type="button" onClick={() => setQuantidade(q => Math.min(estoque, q + 1))} className="px-3 py-1.5 text-ink-muted">+</button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={loading || estoque === 0}
          onClick={() => addToCart(false)}
          className="flex-1 rounded-full border border-gold-soft bg-white py-3.5 text-xs font-medium uppercase tracking-wider text-gold-text shadow-xs transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          Adicionar à sacola
        </button>
        <button
          type="button"
          disabled={loading || estoque === 0}
          onClick={() => addToCart(true)}
          className="flex-1 rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
        >
          Comprar agora
        </button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
        <span className="text-xs font-medium uppercase tracking-wider text-ink">Calcular frete</span>
        <div className="flex gap-2">
          <input
            value={cep}
            onChange={e => setCep(e.target.value)}
            placeholder="00000-000"
            className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
          />
          <button type="button" onClick={calcularFrete} className="rounded-full border border-border-soft px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-muted hover:border-gold-text">
            Calcular
          </button>
        </div>
        {frete && (
          <div className="flex flex-col gap-1 text-sm text-ink-muted">
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
