'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { ZodIssue } from 'zod';
import { brl } from '@/lib/utils/money';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import { tokenizeCard } from '@/lib/asaasJs';
import { cpfValido, formatarCpf, normalizarCpf } from '@/lib/utils/cpf';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics';

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

type Modo = 'escolha' | 'convidado' | 'conta';

const STEPS = ['Identificação', 'Entrega', 'Pagamento', 'Confirmação'];

const EMPTY_ADDRESS_FORM = { apelido: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' };
const EMPTY_GUEST_CONTATO = { nome: '', email: '', telefone: '', cpf: '' };

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

  const [modo, setModo] = useState<Modo>('escolha');
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [enderecoId, setEnderecoId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [guestContato, setGuestContato] = useState(EMPTY_GUEST_CONTATO);
  const [guestEndereco, setGuestEndereco] = useState(EMPTY_ADDRESS_FORM);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [freteEstimado, setFreteEstimado] = useState(false);
  const [envioId, setEnvioId] = useState('pac');
  const [formaPagamento, setFormaPagamento] = useState<'CARTAO_CREDITO' | 'PIX' | 'BOLETO'>('CARTAO_CREDITO');
  const [parcelas, setParcelas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pedidoConcluido, setPedidoConcluido] = useState<{ numero: string; pagamento: any } | null>(null);
  const [cpfInput, setCpfInput] = useState('');
  const [salvandoCpf, setSalvandoCpf] = useState(false);
  const [reenviandoEmail, setReenviandoEmail] = useState(false);
  const [emailReenviado, setEmailReenviado] = useState(false);
  const [cartao, setCartao] = useState({ numero: '', nomeImpresso: '', validadeMes: '', validadeAno: '', cvv: '' });

  // Usuário já logado ao entrar no checkout: pula a tela de escolha.
  useEffect(() => {
    if (authLoading || !user || modo !== 'escolha') return;
    const timer = setTimeout(() => setModo('conta'), 0);
    return () => clearTimeout(timer);
  }, [authLoading, user, modo]);

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
    if (modo === 'escolha') return;
    (async () => {
      await loadCart();
      if (modo === 'conta') await loadAddresses();
    })();
  }, [modo, loadCart, loadAddresses]);

  // `begin_checkout` uma única vez por sessão de checkout. O ref é necessário
  // porque `cart` é recarregado a cada mudança de frete/endereço, e sem a guarda
  // o evento inflaria a contagem de inícios de checkout.
  const beginCheckoutEnviado = useRef(false);
  useEffect(() => {
    if (beginCheckoutEnviado.current || !cart?.items.length || pedidoConcluido) return;
    beginCheckoutEnviado.current = true;
    trackBeginCheckout(
      cart.items.map(i => ({
        id: i.id,
        nome: i.nome,
        preco: i.precoUnitario,
        quantidade: i.quantidade,
        variante: [i.tamanho, i.acabamento].filter(Boolean).join(' / ') || null,
      })),
    );
  }, [cart, pedidoConcluido]);

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
    if (!cpfValido(cpfInput)) {
      setErro('CPF inválido. Confira os números digitados.');
      return;
    }
    setSalvandoCpf(true);
    setErro('');
    try {
      await api.put('/auth/me', { cpf: normalizarCpf(cpfInput) });
      await refreshUser();
    } catch (err) {
      setErro(describeError(err, 'Não foi possível salvar o CPF'));
    } finally {
      setSalvandoCpf(false);
    }
  }

  async function onResendVerification() {
    setReenviandoEmail(true);
    setErro('');
    try {
      await api.post('/auth/resend-verification', {});
      setEmailReenviado(true);
    } catch (err) {
      setErro(describeError(err, 'Não foi possível reenviar o e-mail de confirmação'));
    } finally {
      setReenviandoEmail(false);
    }
  }

  const guestContatoValido =
    guestContato.nome.trim().length >= 3 && /\S+@\S+\.\S+/.test(guestContato.email) && cpfValido(guestContato.cpf);

  const guestEnderecoValido =
    guestEndereco.cep.trim().length >= 8 &&
    guestEndereco.rua.trim().length >= 3 &&
    guestEndereco.numero.trim().length >= 1 &&
    guestEndereco.bairro.trim().length >= 2 &&
    guestEndereco.cidade.trim().length >= 2 &&
    guestEndereco.estado.trim().length === 2;

  async function onAdvanceToPayment() {
    const cep = modo === 'conta' ? addresses.find(a => a.id === enderecoId)?.cep : guestEndereco.cep;
    if (!cep) {
      setErro(modo === 'conta' ? 'Selecione ou cadastre um endereço de entrega' : 'Preencha o endereço de entrega');
      return;
    }
    setErro('');
    try {
      const { data } = await api.post<{ opcoes: ShippingOption[]; estimado?: boolean }>('/shipping/quote', { cep, subtotal: cart?.resumo.subtotal });
      setShippingOptions(data.opcoes);
      setFreteEstimado(Boolean(data.estimado));
      // Os ids reais vêm do Melhor Envio (numéricos) ou da contingência, então o
      // valor inicial nunca corresponde a uma opção: seleciona a primeira para o
      // radio não ficar vazio.
      setEnvioId(atual => (data.opcoes.some(o => o.id === atual) ? atual : data.opcoes[0]?.id || ''));
      setStep(3);
    } catch (err) {
      setErro(describeError(err, 'Não foi possível calcular o frete'));
    }
  }

  async function onConfirm() {
    setLoading(true);
    setErro('');
    try {
      const endereco = modo === 'conta' ? addresses.find(a => a.id === enderecoId) : guestEndereco;
      if (!endereco) throw new Error('Endereço não encontrado');

      const contatoTitular =
        modo === 'conta'
          ? { nome: user!.nome, email: user!.email, cpf: user!.cpf || '', telefone: user!.telefone || undefined }
          : { nome: guestContato.nome, email: guestContato.email, cpf: guestContato.cpf, telefone: guestContato.telefone || undefined };

      const guestPayload =
        modo === 'convidado'
          ? { ...guestContato, ...guestEndereco, telefone: guestContato.telefone || undefined, complemento: guestEndereco.complemento || undefined }
          : undefined;

      let creditCardToken: string | undefined;
      let cartaoFallback: typeof cartao | undefined;
      if (formaPagamento === 'CARTAO_CREDITO') {
        try {
          const { data: customerData } = await api.post<{ asaasCustomerId: string }>(
            '/payments/asaas-customer',
            modo === 'conta' ? { enderecoId } : { guest: guestPayload },
          );
          creditCardToken = await tokenizeCard({
            customerId: customerData.asaasCustomerId,
            cartao,
            titular: {
              nome: contatoTitular.nome,
              email: contatoTitular.email,
              cpf: contatoTitular.cpf,
              cep: endereco.cep,
              numero: endereco.numero,
              telefone: contatoTitular.telefone,
            },
          });
        } catch {
          // Tokenização indisponível (ex: script bloqueado por adblock) — segue com o fluxo
          // anterior, que envia os dados do cartão ao backend para repassar ao Asaas.
          cartaoFallback = cartao;
        }
      }

      const { data } = await api.post<{ order: { numero: string }; pagamento: any }>('/orders', {
        ...(modo === 'conta' ? { enderecoId } : { guest: guestPayload }),
        formaPagamento,
        parcelas: formaPagamento === 'CARTAO_CREDITO' ? parcelas : 1,
        cep: endereco.cep,
        envioId,
        creditCardToken,
        cartao: cartaoFallback,
      });
      // O carrinho é limpo logo abaixo, então os itens são capturados aqui.
      // Disparado na criação do pedido, não na confirmação do pagamento: Pix e
      // boleto confirmam só depois, via webhook (ver ressalva no CHECKLIST-GAPS).
      if (cart) {
        trackPurchase({
          numero: data.order.numero,
          total: formaPagamento === 'PIX' ? cart.resumo.totalPix : cart.resumo.total,
          frete: cart.resumo.frete,
          itens: cart.items.map(i => ({
            id: i.id,
            nome: i.nome,
            preco: i.precoUnitario,
            quantidade: i.quantidade,
            variante: [i.tamanho, i.acabamento].filter(Boolean).join(' / ') || null,
          })),
        });
      }

      setPedidoConcluido({ numero: data.order.numero, pagamento: data.pagamento });
      setStep(5);
      await refreshCart();
    } catch (err) {
      setErro(describeError(err, 'Não foi possível concluir o pedido'));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (modo !== 'escolha' && !cart)) {
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

  if (modo === 'escolha') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-20 text-center">
        <h1 className="font-serif text-3xl text-ink">Como você quer continuar?</h1>
        <p className="text-sm text-ink-muted">Você pode comprar sem criar conta, informando só os dados necessários para a entrega.</p>
        <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setModo('convidado')}
            className="flex-1 rounded-full bg-gold px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-ink shadow-sm transition-all hover:bg-gold-hover hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95"
          >
            Continuar como convidado
          </button>
          <button
            type="button"
            onClick={() => router.push('/login?next=/checkout')}
            className="flex-1 rounded-full border border-gold-soft bg-white px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-gold-text shadow-xs transition-all hover:bg-gold hover:text-ink"
          >
            Entrar / Criar conta
          </button>
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
          <p className="mt-1 text-xs text-ink-tertiary">
            Enviamos a confirmação para {modo === 'conta' ? user?.email : guestContato.email}.
          </p>
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
          {modo === 'conta' && (
            <Link href="/conta/pedidos" className="rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover">
              Ver meus pedidos
            </Link>
          )}
          <Link href="/produtos" className="rounded-full border border-border-soft px-5 py-2.5 text-xs uppercase text-ink-muted">
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  if (!cart) return null;
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
          {step === 1 && modo === 'conta' && user && (
            <div className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
              <h2 className="font-sans text-xl font-semibold text-ink">Identificação</h2>
              <p className="text-sm text-ink-muted">Olá, {user.nome}! Confirme seus dados para continuar.</p>
              <div className="text-sm text-ink-muted">
                <div>E-mail: {user.email}</div>
                {user.cpf && <div>CPF: {formatarCpf(user.cpf)}</div>}
                {user.telefone && <div>Celular: {user.telefone}</div>}
              </div>
              {!user.emailVerified && (
                <div className="flex flex-col gap-2 rounded-md border border-border-subtle p-3">
                  <span className="text-xs text-ink-muted">
                    Confirme seu e-mail para finalizar a compra. Enviamos um link para <strong>{user.email}</strong> — verifique
                    também a caixa de spam.
                  </span>
                  {emailReenviado ? (
                    <span className="text-xs text-gold-text">E-mail de confirmação reenviado.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={onResendVerification}
                      disabled={reenviandoEmail}
                      className="self-start rounded-full border border-border-soft px-3 py-2 text-xs font-medium uppercase text-ink-muted hover:border-gold-text disabled:opacity-50"
                    >
                      {reenviandoEmail ? 'Enviando...' : 'Reenviar e-mail'}
                    </button>
                  )}
                </div>
              )}
              {!user.cpf && (
                <div className="flex flex-col gap-2 rounded-md border border-border-subtle p-3">
                  <span className="text-xs text-ink-muted">Precisamos do seu CPF para processar o pagamento.</span>
                  <div className="flex gap-2">
                    <input
                      value={cpfInput}
                      onChange={e => setCpfInput(formatarCpf(e.target.value))}
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={onSaveCpf}
                      disabled={salvandoCpf || !cpfValido(cpfInput)}
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
                disabled={!user.cpf || !user.emailVerified}
                className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 1 && modo === 'convidado' && (
            <div className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
              <h2 className="font-sans text-xl font-semibold text-ink">Identificação</h2>
              <p className="text-sm text-ink-muted">Informe seus dados para continuar como convidado.</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome completo" value={guestContato.nome} onChange={v => setGuestContato(c => ({ ...c, nome: v }))} required className="col-span-2" />
                <Field label="E-mail" value={guestContato.email} onChange={v => setGuestContato(c => ({ ...c, email: v }))} required className="col-span-2" />
                <Field label="Celular" value={guestContato.telefone} onChange={v => setGuestContato(c => ({ ...c, telefone: v }))} />
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-ink-muted">CPF</span>
                  <input
                    value={guestContato.cpf}
                    onChange={e => setGuestContato(c => ({ ...c, cpf: formatarCpf(e.target.value) }))}
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!guestContatoValido}
                className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 2 && modo === 'conta' && (
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

          {step === 2 && modo === 'convidado' && (
            <div className="flex flex-col gap-4 rounded-xl shadow-xs p-5">
              <h2 className="font-sans text-xl font-semibold text-ink">Entrega</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CEP" value={guestEndereco.cep} onChange={v => setGuestEndereco(f => ({ ...f, cep: v }))} required />
                <Field label="Número" value={guestEndereco.numero} onChange={v => setGuestEndereco(f => ({ ...f, numero: v }))} required />
                <Field label="Rua" value={guestEndereco.rua} onChange={v => setGuestEndereco(f => ({ ...f, rua: v }))} required className="col-span-2" />
                <Field label="Complemento" value={guestEndereco.complemento} onChange={v => setGuestEndereco(f => ({ ...f, complemento: v }))} />
                <Field label="Bairro" value={guestEndereco.bairro} onChange={v => setGuestEndereco(f => ({ ...f, bairro: v }))} required />
                <Field label="Cidade" value={guestEndereco.cidade} onChange={v => setGuestEndereco(f => ({ ...f, cidade: v }))} required />
                <Field label="Estado (UF)" value={guestEndereco.estado} onChange={v => setGuestEndereco(f => ({ ...f, estado: v.toUpperCase() }))} required />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="self-start rounded-full border border-border-soft px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted hover:border-gold-text">
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={onAdvanceToPayment}
                  disabled={!guestEnderecoValido}
                  className="self-start rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
                >
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
              {freteEstimado && (
                <p className="text-xs text-ink-tertiary">
                  Não foi possível consultar a transportadora agora, então este é um valor estimado.
                  Confirmamos o frete real antes do envio e avisamos se houver qualquer diferença.
                </p>
              )}

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
