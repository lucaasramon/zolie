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
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-5 py-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-white font-serif text-3xl text-gold-text shadow-xs">✦</span>
        <p className="z-title text-3xl">Sua sacola está vazia</p>
        <p className="max-w-xs text-sm font-light text-ink-tertiary">Que tal descobrir as peças que estão encantando outras clientes?</p>
        <Link
          href="/produtos"
          className="mt-2 rounded-full bg-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gold-hover hover:shadow-md"
        >
          Ver as peças
        </Link>
      </div>
    );
  }

  const { resumo } = cart;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <div className="mb-7 flex flex-col gap-1">
        <span className="z-eyebrow">Quase lá</span>
        <h1 className="z-title text-[32px] sm:text-4xl">Minha sacola</h1>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <Link href="/produtos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-text transition-colors hover:text-gold-text-hover">
            ← Continuar comprando
          </Link>
          <div className="flex flex-col gap-4">
            {cart.items.map(item => (
              <div key={item.id} className="z-card flex gap-4 p-4 transition-shadow hover:shadow-sm sm:gap-5">
                {item.imagem ? (
                  <Link href={`/produtos/${item.slug}`} className="relative h-28 w-24 flex-none overflow-hidden rounded-lg bg-bg-alt">
                    <Image src={item.imagem} alt={item.nome} fill sizes="96px" className="object-cover transition-transform duration-500 hover:scale-105" />
                  </Link>
                ) : (
                  <div className="img-placeholder h-28 w-24 flex-none rounded-lg" />
                )}
                <div className="flex flex-1 flex-col gap-1">
                  <Link href={`/produtos/${item.slug}`} className="font-serif text-lg font-medium leading-snug text-ink transition-colors hover:text-gold-text">
                    {item.nome}
                  </Link>
                  <span className="text-xs font-light text-ink-tertiary">
                    {item.tamanho || 'Tamanho único'}
                  </span>
                  <div className="mt-auto flex items-center gap-4 pt-2">
                    <div className="flex items-center rounded-full border border-border-soft bg-bg-alt">
                      <button type="button" onClick={() => updateQty(item.id, item.quantidade - 1)} className="grid h-8 w-8 place-items-center text-ink-muted transition-colors hover:text-gold-text active:scale-90">−</button>
                      <span className="w-7 text-center text-sm font-medium">{item.quantidade}</span>
                      <button type="button" onClick={() => updateQty(item.id, item.quantidade + 1)} className="grid h-8 w-8 place-items-center text-ink-muted transition-colors hover:text-gold-text active:scale-90">+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-ink-tertiary underline decoration-transparent transition-colors hover:text-danger hover:decoration-danger">
                      Remover
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between text-right">
                  <div className="text-xs font-light text-ink-tertiary">{brl(item.precoUnitario)} un.</div>
                  <div className="text-base font-medium text-ink">{brl(item.subtotal)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex-none lg:w-[340px]">
          <div className="z-card sticky top-24 flex flex-col gap-4 p-6">
            <h2 className="z-title text-xl">Resumo do pedido</h2>

            {!resumo.freteGratis && resumo.faltaParaFreteGratis > 0 && (
              <div className="flex flex-col gap-2 rounded-xl bg-bg-alt p-3.5">
                <span className="text-xs text-ink-muted">
                  Faltam <strong className="text-gold-text">{brl(resumo.faltaParaFreteGratis)}</strong> para ganhar frete grátis
                </span>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EADFC6]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold transition-all duration-500"
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
              {resumo.totalPix < resumo.total && (
                <span className="text-xs text-gold-text">{brl(resumo.totalPix)} no Pix</span>
              )}
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
              className="mt-2 rounded-full bg-gold py-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gold-hover hover:shadow-md active:translate-y-0 active:scale-[0.98]"
            >
              Finalizar compra
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-light text-ink-tertiary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-gold-text" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Compra 100% segura e protegida
            </p>
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
