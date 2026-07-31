import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/http/withAuth';
import { env } from '@/lib/env';
import { unauthorized } from '@/lib/utils/errors';
import { orderRepo } from '@/lib/repositories/order.repo';
import * as orderService from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { isValidWebhookToken, decideWebhookAction } from '@/lib/services/asaasWebhook.logic';

interface AsaasWebhookPayload {
  id: string;
  event: string;
  payment: { id: string; status: string };
}

// Não testável end-to-end sem URL pública: o Asaas precisa alcançar esta rota via internet.
// Para testar em dev local, exponha um túnel (ex: `ngrok http 3000`) e cadastre a URL gerada
// em Asaas > Integrações > Webhooks, definindo o mesmo valor de ASAAS_WEBHOOK_TOKEN como authToken.
// A lógica de decisão (validação de token, mapeamento evento -> ação) é pura e testada em
// lib/services/asaasWebhook.logic.test.ts.
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'payments:webhook', { windowMs: 60_000, max: 60 });

  const receivedToken = req.headers.get('asaas-access-token');
  if (!isValidWebhookToken(env.asaas.webhookToken, receivedToken)) {
    throw unauthorized('Webhook não autorizado');
  }

  const payload = (await req.json()) as AsaasWebhookPayload;
  const order = await orderRepo.findByAsaasPaymentId(payload.payment?.id);

  const decision = decideWebhookAction({
    event: payload.event,
    paymentStatus: payload.payment.status,
    order: order ? { asaasStatus: order.asaasStatus, status: order.status } : null,
  });

  if (decision.action === 'ignore_unknown_order') return ok({ recebido: true, ignorado: true });
  if (decision.action === 'ignore_duplicate') return ok({ recebido: true, duplicado: true });

  // order é garantidamente não-nulo aqui: as duas ações acima já cobrem order === null
  if (decision.action === 'confirm_payment') {
    await orderService.updateStatus(order!.id, 'PROCESSANDO', `Pagamento confirmado via Asaas (${payload.event})`, 'PAGAMENTO_CONFIRMADO');
  } else if (decision.action === 'cancel_order') {
    await orderService.updateStatus(order!.id, 'CANCELADO', `Pagamento cancelado/estornado via Asaas (${payload.event})`);
  }

  await orderRepo.updateAsaasStatus(order!.id, payload.payment.status);

  return ok({ recebido: true });
});
