'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { CartItemSkeleton, Skeleton } from '@/components/ui/Skeleton';

interface CartItem {
  id: string;
  productId: string;
  nome: string;
  slug: string;
  imagem: string | null;
  material: string;
  tamanho: string | null;
  acabamento: string | null;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

interface CartData {
  items: CartItem[];
  resumo: {
    subtotal: number;
    frete: number;
    freteGratis: boolean;
    faltaParaFreteGratis: number;
    desconto: number;
    total: number;
    totalPix: number;
    parcelamento: { maxParcelas: number; valorParcela: number };
  };
  cupom: { codigo: string; descricao: string } | null;
}

export default function CarrinhoPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [cep, setCep] = useState('');
  const [cupomInput, setCupomInput] = useState('');
  const [cupomMsg, setCupomMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [freteMsg, setFreteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const router = useRouter();
  const { refresh } = useCart();
  const { showToast } = useToast();

  const load = useCallback(async (opts?: { cep?: string; cupom?: string }) => {
    const sp = new URLSearchParams();
    if (opts?.cep) sp.set('cep', opts.cep);
    if (opts?.cupom) sp.set('cupom', opts.cupom);
    const qs = sp.toString();
    const { data } = await api.get<CartData>(`/cart${qs ? `?${qs}` : ''}`);
    setCart(data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function updateQty(itemId: string, quantidade: number) {
    if (quantidade < 1) return;
    await api.patch(`/cart/items/${itemId}`, { quantidade });
    await load({ cep, cupom: cart?.cupom?.codigo });
    await refresh();
  }

  async function removeItem(itemId: string) {
    await api.delete(`/cart/items/${itemId}`);
    await load({ cep, cupom: cart?.cupom?.codigo });
    await refresh();
  }

  async function aplicarCupom() {
    if (!cupomInput.trim()) return;
    try {
      await api.post('/cart/coupon', { codigo: cupomInput });
      setCupomMsg({ ok: true, text: 'Cupom aplicado com sucesso!' });
      await load({ cep, cupom: cupomInput });
    } catch (err) {
      setCupomMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Cupom inválido' });
    }
  }

  async function calcularFrete() {
    if (!cep.trim()) return;
    setCalculandoFrete(true);
    setFreteMsg(null);
    try {
      await load({ cep, cupom: cart?.cupom?.codigo });
      setFreteMsg({ ok: true, text: 'Frete calculado com sucesso!' });
    } catch (err) {
      setFreteMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Não foi possível calcular o frete' });
    } finally {
      setCalculandoFrete(false);
    }
  }

  if (!cart) {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-8">
        <Skeleton className="mb-6 h-9 w-56" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4">
            <CartItemSkeleton />
            <CartItemSkeleton />
            <CartItemSkeleton />
          </div>
          <div className="w-full flex-none lg:w-[340px]">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-5 py-20 text-center">
        <p className="font-sans text-2xl font-semibold text-ink">Sua sacola está vazia</p>
        <Link href="/produtos" className="rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
          Ver ofertas
        </Link>
      </div>
    );
  }

  const { resumo } = cart;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <h1 className="mb-6 font-sans text-3xl font-semibold text-ink">Minha sacola</h1>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <Link href="/produtos" className="mb-4 inline-block text-sm text-gold-text hover:text-gold-text-hover">← Continuar comprando</Link>
          <div className="flex flex-col gap-4">
            {cart.items.map(item => (
              <div key={item.id} className="flex gap-4 rounded-lg shadow-xs p-4">
                {item.imagem ? (
                  <div className="relative h-24 w-24 flex-none overflow-hidden rounded-md">
                    <Image src={item.imagem} alt={item.nome} fill sizes="96px" className="object-cover" />
                  </div>
                ) : (
                  <div className="img-placeholder h-24 w-24 flex-none rounded-md" />
                )}
                <div className="flex flex-1 flex-col gap-1">
                  <span className="font-sans text-base font-medium text-ink">{item.nome}</span>
                  <span className="text-xs text-ink-tertiary">
                    {[item.tamanho, item.acabamento].filter(Boolean).join(' · ') || 'Tamanho único'}
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-border-soft">
                      <button type="button" onClick={() => updateQty(item.id, item.quantidade - 1)} className="px-2.5 py-1 text-ink-muted">−</button>
                      <span className="w-7 text-center text-sm">{item.quantidade}</span>
                      <button type="button" onClick={() => updateQty(item.id, item.quantidade + 1)} className="px-2.5 py-1 text-ink-muted">+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-danger hover:underline">
                      Remover
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-ink-tertiary">{brl(item.precoUnitario)} un.</div>
                  <div className="font-medium text-ink">{brl(item.subtotal)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex-none lg:w-[340px]">
          <div className="sticky top-24 flex flex-col gap-4 rounded-xl shadow-xs p-5">
            <h2 className="font-sans text-lg font-semibold text-ink">Resumo</h2>

            {!resumo.freteGratis && resumo.faltaParaFreteGratis > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-ink-muted">Faltam {brl(resumo.faltaParaFreteGratis)} para frete grátis</span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EADFC6]">
                  <div
                    className="h-full bg-gold-soft"
                    style={{ width: `${Math.min(100, ((resumo.subtotal) / (resumo.subtotal + resumo.faltaParaFreteGratis)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-sm">
              <Row label="Subtotal" value={brl(resumo.subtotal)} />
              <Row label="Frete" value={resumo.frete === 0 ? 'Grátis' : brl(resumo.frete)} />
              {resumo.desconto > 0 && <Row label="Desconto" value={`- ${brl(resumo.desconto)}`} />}
              <div className="mt-1 flex justify-between border-t border-border-subtle pt-2 text-base font-medium text-ink">
                <span>Total</span>
                <span>{brl(resumo.total)}</span>
              </div>
              <span className="text-xs text-gold-text">{brl(resumo.totalPix)} no Pix</span>
              <span className="text-xs text-ink-tertiary">
                ou {resumo.parcelamento.maxParcelas}x de {brl(resumo.parcelamento.valorParcela)}
              </span>
            </div>

            <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
              <span className="text-xs font-medium uppercase tracking-wider text-ink">Cupom de desconto</span>
              <div className="flex gap-2">
                <input
                  value={cupomInput}
                  onChange={e => setCupomInput(e.target.value.toUpperCase())}
                  placeholder="Código do cupom"
                  className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
                />
                <button type="button" onClick={aplicarCupom} className="rounded-full border border-border-soft px-3 py-2 text-xs font-medium uppercase text-ink-muted hover:border-gold-text">
                  Aplicar
                </button>
              </div>
              {cupomMsg && <span className={`text-xs ${cupomMsg.ok ? 'text-success' : 'text-danger'}`}>{cupomMsg.text}</span>}
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
                <button type="button" onClick={calcularFrete} disabled={calculandoFrete} className="rounded-full border border-border-soft px-3 py-2 text-xs font-medium uppercase text-ink-muted hover:border-gold-text disabled:opacity-50">
                  {calculandoFrete ? 'Calculando...' : 'Calcular'}
                </button>
              </div>
              {freteMsg && <span className={`text-xs ${freteMsg.ok ? 'text-success' : 'text-danger'}`}>{freteMsg.text}</span>}
            </div>

            <button
              type="button"
              onClick={() => router.push('/checkout')}
              className="mt-2 rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover"
            >
              Finalizar compra
            </button>
            <p className="text-center text-[11px] text-ink-tertiary">Compra 100% segura e protegida</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
