import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/http/withAuth';
import { env } from '@/lib/env';
import { unauthorized } from '@/lib/utils/errors';
import { orderRepo } from '@/lib/repositories/order.repo';
import * as orderService from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';

interface AsaasWebhookPayload {
  id: string;
  event: string;
  payment: { id: string; status: string };
}

const CONFIRMED_EVENTS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);
const CANCELLED_EVENTS = new Set(['PAYMENT_REFUNDED', 'PAYMENT_DELETED', 'PAYMENT_CHARGEBACK_REQUESTED']);

// Não testável end-to-end sem URL pública: o Asaas precisa alcançar esta rota via internet.
// Para testar em dev local, exponha um túnel (ex: `ngrok http 3000`) e cadastre a URL gerada
// em Asaas > Integrações > Webhooks, definindo o mesmo valor de ASAAS_WEBHOOK_TOKEN como authToken.
export const POST = withErrorHandling(async (req: NextRequest) => {
  const receivedToken = req.headers.get('asaas-access-token');
  if (!env.asaas.webhookToken || receivedToken !== env.asaas.webhookToken) {
    throw unauthorized('Webhook não autorizado');
  }

  const payload = (await req.json()) as AsaasWebhookPayload;
  const order = await orderRepo.findByAsaasPaymentId(payload.payment?.id);
  if (!order) {
    return ok({ recebido: true, ignorado: true });
  }

  if (order.asaasStatus === payload.payment.status) {
    return ok({ recebido: true, duplicado: true });
  }

  if (CONFIRMED_EVENTS.has(payload.event) && order.status === 'AGUARDANDO_PAGAMENTO') {
    await orderService.updateStatus(order.id, 'PROCESSANDO', `Pagamento confirmado via Asaas (${payload.event})`, 'PAGAMENTO_CONFIRMADO');
  } else if (CANCELLED_EVENTS.has(payload.event)) {
    await orderService.updateStatus(order.id, 'CANCELADO', `Pagamento cancelado/estornado via Asaas (${payload.event})`);
  }

  await orderRepo.updateAsaasStatus(order.id, payload.payment.status);

  return ok({ recebido: true });
});
