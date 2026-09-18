import { timingSafeEqual } from 'crypto';
import { OrderStatus } from '@prisma/client';

const CONFIRMED_EVENTS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);
const CANCELLED_EVENTS = new Set(['PAYMENT_REFUNDED', 'PAYMENT_DELETED', 'PAYMENT_CHARGEBACK_REQUESTED']);

export function isValidWebhookToken(expectedToken: string, received: string | null): boolean {
  if (!expectedToken || !received) return false;
  const expected = Buffer.from(expectedToken);
  const actual = Buffer.from(received);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export interface AsaasPaymentEvent {
  event: string;
  payment: { id: string; status: string };
}

/**
 * Extrai um evento de cobrança do corpo bruto enviado pelo Asaas, ou `null` quando o
 * corpo não é um evento de cobrança.
 *
 * O Asaas envia pela MESMA URL eventos que não têm o objeto `payment` (ex:
 * ACCESS_TOKEN_CREATED, TRANSFER_*, INVOICE_*, ...). Antes desta validação a rota
 * acessava `payload.payment.status` cegamente e estourava com 500. Como a fila do
 * Asaas é sequencial, um único evento desses travado no início da fila bloqueava a
 * entrega de TODAS as confirmações de pagamento seguintes.
 */
export function extractPaymentEvent(payload: unknown): AsaasPaymentEvent | null {
  if (!payload || typeof payload !== 'object') return null;
  const { event, payment } = payload as { event?: unknown; payment?: unknown };
  if (typeof event !== 'string' || !event) return null;
  if (!payment || typeof payment !== 'object') return null;
  const { id, status } = payment as { id?: unknown; status?: unknown };
  if (typeof id !== 'string' || !id) return null;
  if (typeof status !== 'string' || !status) return null;
  return { event, payment: { id, status } };
}

export interface WebhookDecisionInput {
  event: string;
  paymentStatus: string;
  order: { asaasStatus: string | null; status: OrderStatus } | null;
}

export type WebhookDecision =
  | { action: 'ignore_unknown_order' }
  | { action: 'ignore_duplicate' }
  | { action: 'confirm_payment' }
  | { action: 'cancel_order' }
  | { action: 'sync_status_only' };

/** Decide a ação a partir do evento recebido e do estado atual do pedido — pura, sem I/O. */
export function decideWebhookAction({ event, paymentStatus, order }: WebhookDecisionInput): WebhookDecision {
  if (!order) return { action: 'ignore_unknown_order' };
  if (order.asaasStatus === paymentStatus) return { action: 'ignore_duplicate' };

  if (CONFIRMED_EVENTS.has(event) && order.status === 'AGUARDANDO_PAGAMENTO') {
    return { action: 'confirm_payment' };
  }
  if (CANCELLED_EVENTS.has(event)) {
    return { action: 'cancel_order' };
  }
  return { action: 'sync_status_only' };
}
