'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { ZodIssue } from 'zod';
import { brl } from '@/lib/utils/money';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import { tokenizeCard } from '@/lib/asaasJs';

interface Address {
  id: string;
  apelido: string | null;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

interface CartData {
  items: { id: string; nome: string; quantidade: number; precoUnitario: number; subtotal: number; tamanho: string | null; acabamento: string | null }[];
  resumo: { subtotal: number; frete: number; desconto: number; total: number; totalPix: number };
}

interface ShippingOption {
  id: string;
  nome: string;
  prazoDias: number;
  valor: number;
}

const STEPS = ['Identificação', 'Entrega', 'Pagamento', 'Confirmação'];

const EMPTY_ADDRESS_FORM = { apelido: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' };

function describeError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  const issues = err.issues as ZodIssue[] | undefined;
  if (Array.isArray(issues) && issues.length > 0) {
    return issues.map(i => (i.path?.length ? `${i.path.join('.')}: ${i.message}` : i.message)).join(' · ');
  }
  return err.message || fallback;
}

export default function CheckoutPage() {
  const { user, loading: authLoading, refresh: refreshUser } = useAuth();
  const { refresh: refreshCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [enderecoId, setEnderecoId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [envioId, setEnvioId] = useState('pac');
  const [formaPagamento, setFormaPagamento] = useState<'CARTAO_CREDITO' | 'PIX' | 'BOLETO'>('CARTAO_CREDITO');
  const [parcelas, setParcelas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pedidoConcluido, setPedidoConcluido] = useState<{ numero: string; pagamento: any } | null>(null);
  const [cpfInput, setCpfInput] = useState('');
  const [salvandoCpf, setSalvandoCpf] = useState(false);
  const [cartao, setCartao] = useState({ numero: '', nomeImpresso: '', validadeMes: '', validadeAno: '', cvv: '' });

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/checkout');
  }, [authLoading, user, router]);

  const loadCart = useCallback(async () => {
    const { data } = await api.get<CartData>('/cart');
    setCart(data);
    if (data.items.length === 0 && !pedidoConcluido) router.replace('/carrinho');
  }, [router, pedidoConcluido]);

  const loadAddresses = useCallback(async () => {
    const { data } = await api.get<Address[]>('/addresses');
    setAddresses(data);
    const principal = data.find(a => a.principal) || data[0];
    if (principal) setEnderecoId(principal.id);
  }, []);

  useEffect(() => {
    if (user) {
      loadCart();
      loadAddresses();
    }
  }, [user, loadCart, loadAddresses]);

  async function onCreateAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post<Address>('/addresses', addressForm);
      await loadAddresses();
      setEnderecoId(data.id);
      setShowAddressForm(false);
      setAddressForm(EMPTY_ADDRESS_FORM);
    } catch (err) {
      setErro(describeError(err, 'Não foi possível salvar o endereço'));
    }
  }

  async function onSaveCpf() {
    if (!cpfInput.trim()) return;
    setSalvandoCpf(true);
    setErro('');
    try {
      await api.put('/auth/me', { cpf: cpfInput.replace(/\D/g, '') });
      await refreshUser();
    } catch (err) {
      setErro(describeError(err, 'Não foi possível salvar o CPF'));
    } finally {
      setSalvandoCpf(false);
    }
  }

  async function onAdvanceToPayment() {
    const endereco = addresses.find(a => a.id === enderecoId);
    if (!endereco) {
      setErro('Selecione ou cadastre um endereço de entrega');
      return;
    }
    setErro('');
    try {
      const { data } = await api.post<{ opcoes: ShippingOption[] }>('/shipping/quote', { cep: endereco.cep, subtotal: cart?.resumo.subtotal });
      setShippingOptions(data.opcoes);
      setStep(3);
    } catch (err) {
      setErro(describeError(err, 'Não foi possível calcular o frete'));
    }
  }

  async function onConfirm() {
    if (!user) return;
    setLoading(true);
    setErro('');
    try {
      const endereco = addresses.find(a => a.id === enderecoId);

      let creditCardToken: string | undefined;
      let cartaoFallback: typeof cartao | undefined;
      if (formaPagamento === 'CARTAO_CREDITO' && endereco) {
        try {
          const { data: customerData } = await api.post<{ asaasCustomerId: string }>('/payments/asaas-customer', { enderecoId });
          creditCardToken = await tokenizeCard({
            customerId: customerData.asaasCustomerId,
            cartao,
            titular: {
              nome: user.nome,
              email: user.email,
              cpf: user.cpf || '',
              cep: endereco.cep,
              numero: endereco.numero,
              telefone: user.telefone || undefined,
            },
          });
        } catch {
          // Tokenização indisponível (ex: script bloqueado por adblock) — segue com o fluxo
          // anterior, que envia os dados do cartão ao backend para repassar ao Asaas.
          cartaoFallback = cartao;
        }
      }

      const { data } = await api.post<{ order: { numero: string }; pagamento: any }>('/orders', {
        enderecoId,
        formaPagamento,
        parcelas: formaPagamento === 'CARTAO_CREDITO' ? parcelas : 1,
        cep: endereco?.cep,
        envioId,
        creditCardToken,
        cartao: cartaoFallback,
      });
      setPedidoConcluido({ numero: data.order.numero, pagamento: data.pagamento });
      setStep(5);
      await refreshCart();
    } catch (err) {
      setErro(describeError(err, 'Não foi possível concluir o pedido'));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user || !cart) {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-8">
        <Skeleton className="mb-6 h-9 w-56" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <Skeleton className="h-96 flex-1 rounded-xl" />
          <Skeleton className="h-72 w-full flex-none rounded-xl lg:w-[340px]" />
        </div>
      </div>
    );
  }

  if (step === 5 && pedidoConcluido) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-20 text-center">
        <div className="w-full rounded-xl border border-success-soft bg-success-bg p-6">
          <p className="font-sans text-2xl font-semibold text-ink">Pedido confirmado!</p>
          <p className="mt-2 text-sm text-ink-muted">Número do pedido: <strong>{pedidoConcluido.numero}</strong></p>
          {pedidoConcluido.pagamento?.metodo === 'PIX' && (
            <div className="mt-3 flex flex-col items-center gap-2">
              {pedidoConcluido.pagamento.qrCode && (
                <img src={`data:image/png;base64,${pedidoConcluido.pagamento.qrCode}`} alt="QR Code Pix" className="h-40 w-40" />
              )}
              <p className="text-xs text-ink-tertiary">Copia e cola:</p>
              <input readOnly value={pedidoConcluido.pagamento.copiaECola || ''} onFocus={e => e.target.select()} className="w-full rounded-md border border-border-subtle px-3 py-2 text-xs" />
            </div>
          )}
          {pedidoConcluido.pagamento?.metodo === 'BOLETO' && (
            <div className="mt-2 flex flex-col items-center gap-1 text-xs text-ink-tertiary">
              {pedidoConcluido.pagamento.url && (
                <a href={pedidoConcluido.pagamento.url} target="_blank" rel="noreferrer" className="text-gold-text hover:text-gold-text-hover">
                  Ver boleto
                </a>
              )}
              {pedidoConcluido.pagamento.linhaDigitavel && <span>{pedidoConcluido.pagamento.linhaDigitavel}</span>}
            </div>
          )}
          {pedidoConcluido.pagamento?.metodo === 'CARTAO_CREDITO' && (
            <p className="mt-2 text-xs text-ink-tertiary">Status do pagamento: {pedidoConcluido.pagamento.status}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link href="/conta/pedidos" className="rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
            Ver meus pedidos
          </Link>
          <Link href="/produtos" className="rounded-full border border-border-soft px-5 py-2.5 text-xs uppercase text-ink-muted">
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  const { resumo } = cart;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <div className="mb-6 flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`text-xs font-medium uppercase tracking-wider ${step >= i + 1 ? 'text-gold-text' : 'text-ink-tertiary'}`}>
              {i + 1}. {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border-soft" />}
          </div>
        ))}
      </div>

      {erro && <p className="mb-4 text-sm text-danger">{erro}</p>}

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          {step === 1 && (
            <div className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
              <h2 className="font-sans text-xl font-semibold text-ink">Identificação</h2>
              <p className="text-sm text-ink-muted">Olá, {user.nome}! Confirme seus dados para continuar.</p>
              <div className="text-sm text-ink-muted">
                <div>E-mail: {user.email}</div>
                {user.cpf && <div>CPF: {user.cpf}</div>}
                {user.telefone && <div>Celular: {user.telefone}</div>}
              </div>
              {!user.cpf && (
                <div className="flex flex-col gap-2 rounded-md border border-border-subtle p-3">
                  <span className="text-xs text-ink-muted">Precisamos do seu CPF para processar o pagamento.</span>
                  <div className="flex gap-2">
                    <input
                      value={cpfInput}
                      onChange={e => setCpfInput(e.target.value)}
                      placeholder="000.000.000-00"
                      className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={onSaveCpf}
                      disabled={salvandoCpf}
                      className="rounded-full border border-border-soft px-3 py-2 text-xs font-medium uppercase text-ink-muted hover:border-gold-text disabled:opacity-50"
                    >
                      {salvandoCpf ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!user.cpf}
                className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
              <h2 className="font-sans text-xl font-semibold text-ink">Entrega</h2>
              {addresses.map(a => (
                <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${enderecoId === a.id ? 'border-gold' : 'border-border-soft'}`}>
                  <input type="radio" checked={enderecoId === a.id} onChange={() => setEnderecoId(a.id)} className="mt-1" />
                  <span>
                    <strong>{a.apelido || 'Endereço'}</strong>
                    <br />
                    {a.rua}, {a.numero} · {a.bairro} · {a.cidade}/{a.estado} · {a.cep}
                  </span>
                </label>
              ))}

              {showAddressForm ? (
                <form onSubmit={onCreateAddress} className="grid grid-cols-2 gap-3 rounded-md border border-border-subtle p-3">
                  <Field label="Apelido" value={addressForm.apelido} onChange={v => setAddressForm(f => ({ ...f, apelido: v }))} />
                  <Field label="CEP" value={addressForm.cep} onChange={v => setAddressForm(f => ({ ...f, cep: v }))} required />
                  <Field label="Rua" value={addressForm.rua} onChange={v => setAddressForm(f => ({ ...f, rua: v }))} required className="col-span-2" />
                  <Field label="Número" value={addressForm.numero} onChange={v => setAddressForm(f => ({ ...f, numero: v }))} required />
                  <Field label="Complemento" value={addressForm.complemento} onChange={v => setAddressForm(f => ({ ...f, complemento: v }))} />
                  <Field label="Bairro" value={addressForm.bairro} onChange={v => setAddressForm(f => ({ ...f, bairro: v }))} required />
                  <Field label="Cidade" value={addressForm.cidade} onChange={v => setAddressForm(f => ({ ...f, cidade: v }))} required />
                  <Field label="Estado (UF)" value={addressForm.estado} onChange={v => setAddressForm(f => ({ ...f, estado: v.toUpperCase() }))} required />
                  <button type="submit" className="col-span-2 self-start rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs">Salvar endereço</button>
                </form>
              ) : (
                <button type="button" onClick={() => setShowAddressForm(true)} className="self-start text-xs text-gold-text hover:text-gold-text-hover">
                  + Adicionar novo endereço
                </button>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="self-start rounded-full border border-border-soft px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted hover:border-gold-text">
                  Voltar
                </button>
                <button type="button" onClick={onAdvanceToPayment} className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
              <h2 className="font-sans text-xl font-semibold text-ink">Forma de envio</h2>
              {shippingOptions.map(o => (
                <label key={o.id} className={`flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm ${envioId === o.id ? 'border-gold' : 'border-border-soft'}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" checked={envioId === o.id} onChange={() => setEnvioId(o.id)} />
                    {o.nome} · até {o.prazoDias} dias úteis
                  </span>
                  <span className="font-medium text-ink">{o.valor === 0 ? 'Grátis' : brl(o.valor)}</span>
                </label>
              ))}

              <h2 className="mt-2 font-sans text-xl font-semibold text-ink">Pagamento</h2>
              <div className="flex gap-2">
                {(['CARTAO_CREDITO', 'PIX', 'BOLETO'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormaPagamento(m)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium uppercase ${formaPagamento === m ? 'border-gold bg-gold text-ink' : 'border-border-soft text-ink-muted'}`}
                  >
                    {m === 'CARTAO_CREDITO' ? 'Cartão' : m === 'PIX' ? 'Pix' : 'Boleto'}
                  </button>
                ))}
              </div>
              {formaPagamento === 'CARTAO_CREDITO' && (
                <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                  <span className="text-ink-muted">Parcelas</span>
                  <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="rounded-md border border-border-subtle px-3 py-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}x de {brl(resumo.total / n)}</option>
                    ))}
                  </select>
                </label>
              )}
              {formaPagamento === 'CARTAO_CREDITO' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Número do cartão" value={cartao.numero} onChange={v => setCartao(c => ({ ...c, numero: v.replace(/\D/g, '').slice(0, 19) }))} className="col-span-2" />
                  <Field label="Nome impresso no cartão" value={cartao.nomeImpresso} onChange={v => setCartao(c => ({ ...c, nomeImpresso: v }))} className="col-span-2" />
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-ink-muted">Mês</span>
                    <select value={cartao.validadeMes} onChange={e => setCartao(c => ({ ...c, validadeMes: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5">
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-ink-muted">Ano</span>
                    <select value={cartao.validadeAno} onChange={e => setCartao(c => ({ ...c, validadeAno: e.target.value }))} className="rounded-md border border-border-subtle px-3.5 py-2.5">
                      <option value="">AAAA</option>
                      {Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() + i)).map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                  <Field label="CVV" value={cartao.cvv} onChange={v => setCartao(c => ({ ...c, cvv: v.replace(/\D/g, '').slice(0, 4) }))} />
                </div>
              )}
              {formaPagamento === 'PIX' && <p className="text-sm text-gold-text">{brl(resumo.totalPix)} no Pix (10% de desconto), QR gerado após confirmar.</p>}
              {formaPagamento === 'BOLETO' && <p className="text-sm text-ink-muted">Vencimento em 3 dias úteis após a confirmação.</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="self-start rounded-full border border-border-soft px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted hover:border-gold-text">
                  Voltar
                </button>
                <button type="button" onClick={() => setStep(4)} className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
                  Revisar pedido
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
              <h2 className="font-sans text-xl font-semibold text-ink">Confirmação</h2>
              <div className="flex flex-col gap-2">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-ink-muted">
                    <span>{item.quantidade}x {item.nome}</span>
                    <span>{brl(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} disabled={loading} className="self-start rounded-full border border-border-soft px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted hover:border-gold-text disabled:opacity-50">
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={onConfirm}
                  className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
                >
                  {loading ? 'Processando...' : `Confirmar e pagar ${brl(resumo.total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex-none lg:w-[320px]">
          <div className="sticky top-24 flex flex-col gap-2 rounded-xl shadow-xs p-5 text-sm">
            <h2 className="font-sans text-lg font-semibold text-ink">Resumo</h2>
            <Row label="Subtotal" value={brl(resumo.subtotal)} />
            <Row label="Frete" value={resumo.frete === 0 ? 'Grátis' : brl(resumo.frete)} />
            {resumo.desconto > 0 && <Row label="Desconto" value={`- ${brl(resumo.desconto)}`} />}
            <div className="mt-1 flex justify-between border-t border-border-subtle pt-2 text-base font-medium text-ink">
              <span>Total</span>
              <span>{brl(resumo.total)}</span>
            </div>
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

function Field({
  label,
  value,
  onChange,
  required = false,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="text-ink-muted">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} required={required} className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold" />
    </label>
  );
}
