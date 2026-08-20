'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { ReturnRequestForm } from '@/components/account/ReturnRequestForm';
import { ReviewForm } from '@/components/product/ReviewForm';
import { PrevisaoEntrega } from '@/components/ui/PrevisaoEntrega';

interface OrderDetail {
  numero: string;
  status: string;
  createdAt: string;
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  transportadora: string | null;
  prazoDiasEnvio: number | null;
  codigoRastreio: string | null;
  notaFiscalUrl: string | null;
  notaFiscalNumero: string | null;
  returnRequests?: { id: string; tipo: string; status: string }[];
  formaPagamento: string;
  items: {
    id: string;
    productId: string;
    nomeProduto: string;
    tamanho: string | null;
    acabamento: string | null;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    product?: { slug: string; imagens: string[] } | null;
  }[];
  events: { id: string; status: string; descricao: string | null; createdAt: string }[];
}

interface Pagamento {
  metodo: string;
  status: string;
  qrCode?: string;
  copiaECola?: string;
  url?: string;
  linhaDigitavel?: string;
}

const JORNADA = ['PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE'];

const STATUS_ICON: Record<string, React.ReactNode> = {
  AGUARDANDO_PAGAMENTO: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 8.25v9a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-9M2.25 8.25v-1.5A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v1.5M6 15h3" />
  ),
  PROCESSANDO: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
  SEPARANDO: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5 12 12m0 0L3.75 7.5M12 12v9m8.25-4.5V7.5a2.25 2.25 0 0 0-1.125-1.948l-6.75-3.9a2.25 2.25 0 0 0-2.25 0l-6.75 3.9A2.25 2.25 0 0 0 2.25 7.5v6.75a2.25 2.25 0 0 0 1.125 1.948l6.75 3.9a2.25 2.25 0 0 0 2.25 0l6.75-3.9A2.25 2.25 0 0 0 20.25 12.75Z" />
  ),
  ENVIADO: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.02.75.75 0 0 0-.62-.327H14.25M16.5 18.75h-2.25m0-11.25h4.5v8.25M12 8.25v3.75m0 0h4.5m-4.5 0-1.5 3.75h6.75" />
  ),
  ENTREGUE: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
  CANCELADO: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75 14.25 14.25M14.25 9.75 9.75 14.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
};

export default function DetalhePedidoPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [erroPagamento, setErroPagamento] = useState('');
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState('');

  useEffect(() => {
    api.get<OrderDetail>(`/orders/${id}`).then(({ data }) => setOrder(data));
  }, [id]);

  async function onCancelar() {
    setCancelando(true);
    setErroCancelamento('');
    try {
      await api.post(`/orders/${id}/cancel`, {});
      const { data } = await api.get<OrderDetail>(`/orders/${id}`);
      setOrder(data);
      setConfirmandoCancelamento(false);
    } catch (err) {
      setErroCancelamento(err instanceof ApiError ? err.message : 'Não foi possível cancelar o pedido');
    } finally {
      setCancelando(false);
    }
  }

  async function onContinuarPagamento() {
    setCarregandoPagamento(true);
    setErroPagamento('');
    try {
      const { data } = await api.get<Pagamento>(`/orders/${id}/payment`);
      setPagamento(data);
    } catch (err) {
      setErroPagamento(err instanceof ApiError ? err.message : 'Não foi possível carregar o pagamento');
    } finally {
      setCarregandoPagamento(false);
    }
  }

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const style = STATUS_STYLE[order.status];
  const passoAtual = JORNADA.indexOf(order.status);
  const cancelado = order.status === 'CANCELADO';
  const aguardandoPagamento = order.status === 'AGUARDANDO_PAGAMENTO';

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/conta/pedidos"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-tertiary transition-colors hover:text-gold-text"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Meus pedidos
      </Link>

      {/* Header do pedido */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-ink-tertiary">Pedido</span>
            <h1 className="z-title text-2xl sm:text-[28px]">{order.numero}</h1>
            <p className="mt-1 text-xs text-ink-tertiary">
              Realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium ${style.text} ${style.border} ${style.bg}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                {STATUS_ICON[order.status]}
              </svg>
              {STATUS_LABEL[order.status]}
            </span>
            <span className="text-xs text-ink-tertiary">
              <PrevisaoEntrega createdAt={order.createdAt} prazoDiasEnvio={order.prazoDiasEnvio} status={order.status} />
            </span>
          </div>
        </div>

        {/* Timeline de progresso */}
        {!cancelado && !aguardandoPagamento && (
          <div className="mt-6">
            <div className="flex items-center">
              {JORNADA.map((etapa, i) => {
                const concluido = i <= passoAtual;
                const ultimo = i === JORNADA.length - 1;
                return (
                  <div key={etapa} className={`flex items-center ${ultimo ? '' : 'flex-1'}`}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 transition-colors ${
                          concluido ? 'border-gold bg-gold' : 'border-border-soft bg-white'
                        }`}
                      >
                        {concluido && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <span className={`hidden text-[11px] sm:block ${concluido ? 'font-medium text-ink' : 'text-ink-tertiary'}`}>
                        {STATUS_LABEL[etapa]}
                      </span>
                    </div>
                    {!ultimo && (
                      <div className={`mx-1.5 h-0.5 flex-1 rounded-full transition-colors ${i < passoAtual ? 'bg-gold' : 'bg-border-soft'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {aguardandoPagamento && (
        <div className="flex flex-col gap-4 rounded-2xl border border-gold-soft bg-hoverbg p-5 sm:p-6">
          {!pagamento ? (
            <>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-gold-text shadow-xs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                    <path d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Este pedido ainda não foi pago</p>
                  <p className="text-xs text-ink-tertiary">Finalize o pagamento para que possamos preparar sua peça.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onContinuarPagamento}
                disabled={carregandoPagamento}
                className="self-start rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs transition-colors hover:bg-gold-hover disabled:opacity-50"
              >
                {carregandoPagamento ? 'Carregando...' : 'Continuar pagamento'}
              </button>
              {erroPagamento && <p className="text-xs text-danger">{erroPagamento}</p>}
            </>
          ) : (
            <>
              {pagamento.metodo === 'PIX' && (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-xs">
                  {pagamento.qrCode && (
                    <img src={`data:image/png;base64,${pagamento.qrCode}`} alt="QR Code Pix" className="h-40 w-40 rounded-lg" />
                  )}
                  <p className="text-xs text-ink-tertiary">Copia e cola:</p>
                  <input readOnly value={pagamento.copiaECola || ''} onFocus={e => e.target.select()} className="w-full rounded-lg border border-border-subtle px-3 py-2.5 text-xs" />
                </div>
              )}
              {pagamento.metodo === 'BOLETO' && (
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-5 text-xs text-ink-tertiary shadow-xs">
                  {pagamento.url && (
                    <a href={pagamento.url} target="_blank" rel="noreferrer" className="text-gold-text hover:text-gold-text-hover">
                      Ver boleto
                    </a>
                  )}
                  {pagamento.linhaDigitavel && <span className="font-mono">{pagamento.linhaDigitavel}</span>}
                </div>
              )}
              {pagamento.metodo === 'CARTAO_CREDITO' && (
                <p className="rounded-xl bg-white p-4 text-xs text-ink-tertiary shadow-xs">Status do pagamento: {pagamento.status}</p>
              )}
            </>
          )}

          <div className="border-t border-border-soft pt-4">
            {!confirmandoCancelamento ? (
              <button
                type="button"
                onClick={() => setConfirmandoCancelamento(true)}
                className="text-xs text-ink-tertiary underline underline-offset-2 hover:text-danger"
              >
                Cancelar este pedido
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-ink-muted">
                  Tem certeza? As peças voltam para o estoque e o pedido não poderá ser retomado.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCancelar}
                    disabled={cancelando}
                    className="rounded-full border border-danger px-4 py-2 text-xs uppercase tracking-wider text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
                  >
                    {cancelando ? 'Cancelando...' : 'Sim, cancelar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoCancelamento(false)}
                    disabled={cancelando}
                    className="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-wider text-ink-muted"
                  >
                    Voltar
                  </button>
                </div>
                {erroCancelamento && <p className="text-xs text-danger">{erroCancelamento}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {(order.codigoRastreio || order.notaFiscalUrl) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {order.codigoRastreio && (
            <div className="flex flex-col gap-1 rounded-2xl border border-gold-soft bg-hoverbg p-5">
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.02.75.75 0 0 0-.62-.327H14.25M16.5 18.75h-2.25m0-11.25h4.5v8.25M12 8.25v3.75m0 0h4.5m-4.5 0-1.5 3.75h6.75" />
                </svg>
                Código de rastreio
              </span>
              <span className="font-mono text-lg font-medium tracking-wide text-ink">{order.codigoRastreio}</span>
              {order.transportadora && (
                <span className="text-xs text-ink-tertiary">Transportadora: {order.transportadora}</span>
              )}
            </div>
          )}

          {order.notaFiscalUrl && (
            <a
              href={order.notaFiscalUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-hoverbg text-gold-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <span className="block text-sm font-medium text-ink">Nota fiscal</span>
                <span className="text-xs text-ink-tertiary">
                  {order.notaFiscalNumero ? `Nº ${order.notaFiscalNumero} · ` : ''}Baixar PDF
                </span>
              </div>
            </a>
          )}
        </div>
      )}

      {/* Itens do pedido */}
      <div className="rounded-2xl border border-border-subtle bg-white shadow-xs">
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="font-sans text-base font-semibold text-ink">Itens do pedido</h2>
        </div>
        <div className="flex flex-col divide-y divide-border-subtle">
          {order.items.map(item => {
            const imagem = item.product?.imagens?.[0];
            return (
              <div key={item.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-4">
                  {imagem ? (
                    <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg bg-hoverbg">
                      <Image src={imagem} alt={item.nomeProduto} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="img-placeholder h-16 w-16 flex-none rounded-lg" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-ink">{item.nomeProduto}</span>
                    <div className="mt-0.5 text-xs text-ink-tertiary">
                      {[item.tamanho, item.acabamento].filter(Boolean).join(' · ')}
                      {[item.tamanho, item.acabamento].filter(Boolean).length > 0 && ' · '}
                      {item.quantidade}x {brl(item.precoUnitario)}
                    </div>
                  </div>
                  <span className="font-medium text-ink">{brl(item.subtotal)}</span>
                </div>
                {order.status === 'ENTREGUE' && (
                  <div className="border-t border-border-subtle pt-3">
                    <ReviewForm productId={item.productId} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumo de valores */}
        <div className="flex flex-col gap-1.5 border-t border-border-subtle bg-hoverbg/40 p-5 text-sm">
          <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{brl(order.subtotal)}</span></div>
          <div className="flex justify-between text-ink-muted"><span>Frete</span><span>{brl(order.frete)}</span></div>
          {order.desconto > 0 && <div className="flex justify-between text-ink-muted"><span>Desconto</span><span>- {brl(order.desconto)}</span></div>}
          <div className="mt-1.5 flex justify-between border-t border-border-soft pt-2.5 text-base font-semibold text-ink">
            <span>Total</span><span>{brl(order.total)}</span>
          </div>
        </div>
      </div>

      {order.status === 'ENTREGUE' && (
        <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-xs sm:p-6">
          <ReturnRequestForm
            orderId={id}
            solicitacaoAberta={order.returnRequests?.[0] ?? null}
          />
        </div>
      )}

      {/* Histórico */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-xs sm:p-6">
        <h3 className="mb-4 font-sans text-base font-semibold text-ink">Histórico do pedido</h3>
        <div className="flex flex-col">
          {order.events.map((ev, i) => (
            <div key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`h-2.5 w-2.5 flex-none rounded-full ${i === 0 ? 'bg-gold ring-4 ring-hoverbg' : 'bg-border-soft'}`} />
                {i < order.events.length - 1 && <span className="w-px flex-1 bg-border-subtle" />}
              </div>
              <div className={`flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 ${i < order.events.length - 1 ? 'pb-4' : ''}`}>
                <div>
                  <span className={`text-sm ${i === 0 ? 'font-medium text-ink' : 'text-ink-muted'}`}>{STATUS_LABEL[ev.status]}</span>
                  {ev.descricao && <span className="ml-1.5 text-xs text-ink-tertiary">— {ev.descricao}</span>}
                </div>
                <span className="text-xs text-ink-tertiary">{new Date(ev.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
