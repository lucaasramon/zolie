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
