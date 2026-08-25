'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { PrevisaoEntrega } from '@/components/ui/PrevisaoEntrega';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

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
  formaPagamento: string;
  items: {
    id: string;
    nomeProduto: string;
    tamanho: string | null;
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

export default function DetalhePedidoConvidadoPage() {
  const { token, id } = useParams<{ token: string; id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [erro, setErro] = useState('');
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [erroPagamento, setErroPagamento] = useState('');
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState('');

  function carregarPedido() {
    return api
      .get<OrderDetail>(`/orders/publico/${id}?token=${encodeURIComponent(token)}`)
      .then(({ data }) => setOrder(data))
      .catch(err => setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar o pedido'));
  }

  useEffect(() => {
    carregarPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  async function onCancelar() {
    setCancelando(true);
    setErroCancelamento('');
    try {
      await api.post(`/orders/publico/${id}/cancel?token=${encodeURIComponent(token)}`, {});
      await carregarPedido();
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
      const { data } = await api.get<Pagamento>(`/orders/publico/${id}/payment?token=${encodeURIComponent(token)}`);
      setPagamento(data);
    } catch (err) {
      setErroPagamento(err instanceof ApiError ? err.message : 'Não foi possível carregar o pagamento');
    } finally {
      setCarregandoPagamento(false);
    }
  }

  if (erro) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorMessage className="text-sm text-danger">{erro}</ErrorMessage>
        <Link href={`/pedidos-convidado/${token}`} className="mt-3 inline-block text-sm text-gold-text hover:text-gold-text-hover">
          Voltar aos meus pedidos
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const style = STATUS_STYLE[order.status];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href={`/pedidos-convidado/${token}`} className="mb-4 inline-block text-xs text-ink-tertiary hover:text-ink-muted">
        ← Meus pedidos
      </Link>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="z-title text-2xl sm:text-[28px]">Pedido {order.numero}</h1>
          <span className={`rounded-full border px-3 py-1 text-xs ${style.text} ${style.border} ${style.bg}`}>
            {STATUS_LABEL[order.status]}
          </span>
          <span className="text-sm">
            <PrevisaoEntrega createdAt={order.createdAt} prazoDiasEnvio={order.prazoDiasEnvio} status={order.status} />
          </span>
        </div>

        {order.status === 'AGUARDANDO_PAGAMENTO' && (
          <div className="flex flex-col gap-3 rounded-lg border border-gold-soft bg-hoverbg p-4">
            {!pagamento ? (
              <>
                <p className="text-sm text-ink-muted">Este pedido ainda não foi pago.</p>
                <button
                  type="button"
                  onClick={onContinuarPagamento}
                  disabled={carregandoPagamento}
                  className="self-start rounded-full bg-gold px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink shadow-xs hover:bg-gold-hover disabled:opacity-50"
                >
                  {carregandoPagamento ? 'Carregando...' : 'Continuar pagamento'}
                </button>
                {erroPagamento && <ErrorMessage className="text-xs text-danger">{erroPagamento}</ErrorMessage>}
              </>
            ) : (
              <>
                {pagamento.metodo === 'PIX' && (
                  <div className="flex flex-col items-center gap-2">
                    {pagamento.qrCode && (
                      <img src={`data:image/png;base64,${pagamento.qrCode}`} alt="QR Code Pix" className="h-40 w-40" />
                    )}
                    <p className="text-xs text-ink-tertiary">Copia e cola:</p>
                    <input readOnly value={pagamento.copiaECola || ''} onFocus={e => e.target.select()} className="w-full rounded-md border border-border-subtle px-3 py-2 text-xs" />
                  </div>
                )}
                {pagamento.metodo === 'BOLETO' && (
                  <div className="flex flex-col items-center gap-1 text-xs text-ink-tertiary">
                    {pagamento.url && (
                      <a href={pagamento.url} target="_blank" rel="noreferrer" className="text-gold-text hover:text-gold-text-hover">
                        Ver boleto
                      </a>
                    )}
                    {pagamento.linhaDigitavel && <span>{pagamento.linhaDigitavel}</span>}
                  </div>
                )}
                {pagamento.metodo === 'CARTAO_CREDITO' && (
                  <p className="text-xs text-ink-tertiary">Status do pagamento: {pagamento.status}</p>
                )}
              </>
            )}

            <div className="border-t border-border-subtle pt-3">
              {!confirmandoCancelamento ? (
                <button
                  type="button"
                  onClick={() => setConfirmandoCancelamento(true)}
                  className="text-xs text-ink-tertiary underline hover:text-danger"
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
                  {erroCancelamento && <ErrorMessage className="text-xs text-danger">{erroCancelamento}</ErrorMessage>}
                </div>
              )}
            </div>
          </div>
        )}

        {order.codigoRastreio && (
          <div className="flex flex-col gap-1 rounded-lg border border-gold-soft bg-hoverbg p-4">
            <span className="text-xs uppercase tracking-wider text-gold-text">Código de rastreio</span>
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
            className="self-start text-sm text-gold-text underline hover:text-gold-text-hover"
          >
            Baixar nota fiscal{order.notaFiscalNumero ? ` nº ${order.notaFiscalNumero}` : ''}
          </a>
        )}

        <div className="flex flex-col gap-3">
          {order.items.map(item => {
            const imagem = item.product?.imagens?.[0];
            return (
            <div key={item.id} className="flex items-center gap-4 rounded-lg shadow-xs p-3">
              {imagem ? (
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-sm">
                  <Image src={imagem} alt={item.nomeProduto} fill sizes="64px" className="object-cover" />
                </div>
              ) : (
                <div className="img-placeholder h-16 w-16 flex-none rounded-sm" />
              )}
              <div className="flex-1">
                <span className="text-sm font-medium text-ink">{item.nomeProduto}</span>
                <div className="text-xs text-ink-tertiary">
                  {[item.tamanho].filter(Boolean).join(' · ')} · {item.quantidade}x {brl(item.precoUnitario)}
                </div>
              </div>
              <span className="font-medium text-ink">{brl(item.subtotal)}</span>
            </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg shadow-xs p-4 text-sm">
          <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{brl(order.subtotal)}</span></div>
          <div className="flex justify-between text-ink-muted"><span>Frete</span><span>{brl(order.frete)}</span></div>
          {order.desconto > 0 && <div className="flex justify-between text-ink-muted"><span>Desconto</span><span>- {brl(order.desconto)}</span></div>}
          <div className="mt-1 flex justify-between border-t border-border-subtle pt-2 text-base font-medium text-ink">
            <span>Total</span><span>{brl(order.total)}</span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-sans text-lg font-semibold text-ink">Histórico</h3>
          <div className="flex flex-col gap-2">
            {order.events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <span className="h-2 w-2 flex-none rounded-full bg-gold" />
                <span className="text-ink">{STATUS_LABEL[ev.status]}</span>
                {ev.descricao && <span className="text-ink-tertiary">— {ev.descricao}</span>}
                <span className="ml-auto text-xs text-ink-tertiary">{new Date(ev.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
