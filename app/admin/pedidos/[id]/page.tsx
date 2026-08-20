import { notFound } from 'next/navigation';
import Image from 'next/image';
import { orderRepo } from '@/lib/repositories/order.repo';
import { brl } from '@/lib/utils/money';
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/utils/format';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';
import { LabelPanel } from '@/components/admin/LabelPanel';
import { CancelOrderButton } from '@/components/admin/CancelOrderButton';
import { InvoicePanel } from '@/components/admin/InvoicePanel';
import { PrevisaoEntrega } from '@/components/ui/PrevisaoEntrega';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const order: any = await orderRepo.findById(id);
  if (!order) return notFound();

  const style = STATUS_STYLE[order.status];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-sans text-2xl font-semibold text-ink">Pedido {order.numero}</h2>
          <span className={`rounded-full border px-3 py-1 text-xs ${style.text} ${style.border} ${style.bg}`}>
            {STATUS_LABEL[order.status]}
          </span>
          <span className="text-sm">
            <PrevisaoEntrega createdAt={order.createdAt} prazoDiasEnvio={order.prazoDiasEnvio} status={order.status} />
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {order.items.map((item: any) => {
            const imagem = item.product?.imagens?.[0];
            return (
            <div key={item.id} className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-xs">
              {imagem ? (
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg">
                  <Image src={imagem} alt={item.nomeProduto} fill sizes="64px" className="object-cover" />
                </div>
              ) : (
                <div className="img-placeholder h-16 w-16 flex-none rounded-lg" />
              )}
              <div className="flex-1">
                <span className="text-sm font-medium text-ink">{item.nomeProduto}</span>
                <div className="text-xs text-ink-tertiary">
                  {[item.tamanho, item.acabamento].filter(Boolean).join(' · ')} · {item.quantidade}x {brl(item.precoUnitario)}
                </div>
              </div>
              <span className="font-medium text-ink">{brl(item.subtotal)}</span>
            </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl bg-white p-4 text-sm shadow-xs">
          <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{brl(order.subtotal)}</span></div>
          <div className="flex justify-between text-ink-muted"><span>Frete</span><span>{brl(order.frete)}</span></div>
          {Number(order.desconto) > 0 && <div className="flex justify-between text-ink-muted"><span>Descontos</span><span>- {brl(order.desconto)}</span></div>}
          <div className="mt-1 flex justify-between border-t border-border-subtle pt-2 text-base font-medium text-ink">
            <span>Total</span><span>{brl(order.total)}</span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-sans text-lg font-semibold text-ink">Histórico</h3>
          <div className="flex flex-col gap-2">
            {order.events.map((ev: any) => (
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

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-xs">
          <h3 className="font-sans text-lg font-semibold text-ink">Atualizar status</h3>
          <OrderStatusSelect
            orderId={order.id}
            status={order.status}
            codigoRastreio={order.codigoRastreio}
            transportadora={order.transportadora}
          />
        </div>

        <LabelPanel
          orderId={order.id}
          status={order.status}
          melhorEnvioId={order.melhorEnvioId}
          etiquetaUrl={order.etiquetaUrl}
          codigoRastreio={order.codigoRastreio}
        />

        <div className="flex flex-col gap-2 rounded-xl bg-white p-4 text-sm shadow-xs">
          <h3 className="font-sans text-lg font-semibold text-ink">
            Cliente e entrega
            {!order.user && <span className="ml-1.5 rounded-full bg-hoverbg px-1.5 py-0.5 text-[10px] uppercase text-ink-tertiary">Convidado</span>}
          </h3>
          <div className="text-ink-muted">
            <div>{order.user?.nome ?? order.guestNome}</div>
            <div>{order.user?.email ?? order.guestEmail}</div>
            {(order.user?.telefone ?? order.guestTelefone) && <div>{order.user?.telefone ?? order.guestTelefone}</div>}
            {(order.user?.cpf ?? order.guestCpf) && <div>CPF: {order.user?.cpf ?? order.guestCpf}</div>}
          </div>
          <div className="border-t border-border-subtle pt-2 text-ink-muted">
            {order.endereco?.rua ?? order.guestRua}, {order.endereco?.numero ?? order.guestNumero} · {order.endereco?.bairro ?? order.guestBairro} · {order.endereco?.cidade ?? order.guestCidade}/{order.endereco?.estado ?? order.guestEstado} · {order.endereco?.cep ?? order.guestCep}
          </div>
          <div className="border-t border-border-subtle pt-2 text-ink-muted">
            Pagamento: {order.formaPagamento} {order.parcelas > 1 ? `em ${order.parcelas}x` : ''}
          </div>
        </div>

        <InvoicePanel
          orderId={order.id}
          notaFiscalUrl={order.notaFiscalUrl}
          notaFiscalChave={order.notaFiscalChave}
          notaFiscalNumero={order.notaFiscalNumero}
        />

        <CancelOrderButton
          orderId={order.id}
          status={order.status}
          pago={order.status !== 'AGUARDANDO_PAGAMENTO'}
        />
      </div>
    </div>
  );
}
