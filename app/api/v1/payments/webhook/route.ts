import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/http/withAuth';
import { env } from '@/lib/env';
import { unauthorized } from '@/lib/utils/errors';
import { orderRepo } from '@/lib/repositories/order.repo';
import * as orderService from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { assertRateLimit } from '@/lib/http/rateLimit';
import {
  isValidWebhookToken,
  decideWebhookAction,
  extractPaymentEvent,
} from '@/lib/services/asaasWebhook.logic';
import { logger } from '@/lib/logger';

// Não testável end-to-end sem URL pública: o Asaas precisa alcançar esta rota via internet.
// Para testar em dev local, exponha um túnel (ex: `ngrok http 3000`) e cadastre a URL gerada
// em Asaas > Integrações > Webhooks, definindo o mesmo valor de ASAAS_WEBHOOK_TOKEN como authToken.
// A lógica de decisão (validação de token, extração do evento, mapeamento evento -> ação)
// é pura e testada em lib/services/asaasWebhook.logic.test.ts.
//
// Regra de ouro desta rota: só devolver erro quando uma RETENTATIVA do Asaas puder
// resolver (ex: banco fora do ar). Qualquer outra resposta que não seja 2xx penaliza
// o webhook e, como a fila é sequencial, trava todos os eventos seguintes.
export const POST = withErrorHandling(async (req: NextRequest) => {
  // O Asaas reenvia a fila inteira em sequência quando ela é reativada; um limite
  // baixo demais devolveria 429 no meio da ressincronização e penalizaria o webhook.
  assertRateLimit(req, 'payments:webhook', { windowMs: 60_000, max: 600 });

  const receivedToken = req.headers.get('asaas-access-token');
  if (!isValidWebhookToken(env.asaas.webhookToken, receivedToken)) {
    // Sem este log a rejeição é invisível: o Asaas apenas vê 401, vai penalizando
    // o webhook e acaba interrompendo a fila — foi assim que uma confirmação de
    // pagamento se perdeu sem deixar rastro. Nunca logar os tokens em si.
    logger.error('Webhook Asaas rejeitado por token inválido', undefined, {
      tokenConfigurado: Boolean(env.asaas.webhookToken),
      tokenRecebido: Boolean(receivedToken),
    });
    throw unauthorized('Webhook não autorizado');
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch (err) {
    logger.warn('Webhook Asaas com corpo inválido (não é JSON); confirmando recebimento', {
      erro: err instanceof Error ? err.message : String(err),
    });
    return ok({ recebido: true, ignorado: true });
  }

  const payload = extractPaymentEvent(raw);
  if (!payload) {
    // Evento que não é de cobrança (ACCESS_TOKEN_CREATED, TRANSFER_*, etc.) ou
    // sem os campos esperados. Nada a fazer com ele — confirma para o Asaas
    // seguir a fila. Foi exatamente um ACCESS_TOKEN_CREATED que derrubou o
    // webhook com 500 e segurou as confirmações de pagamento atrás dele.
    const event = (raw as { event?: unknown } | null)?.event;
    logger.info('Webhook Asaas ignorado: evento sem objeto de cobrança', {
      event: typeof event === 'string' ? event : undefined,
    });
    return ok({ recebido: true, ignorado: true });
  }

  const order = await orderRepo.findByAsaasPaymentId(payload.payment.id);

  const decision = decideWebhookAction({
    event: payload.event,
    paymentStatus: payload.payment.status,
    order: order ? { asaasStatus: order.asaasStatus, status: order.status } : null,
  });

  if (decision.action === 'ignore_unknown_order') return ok({ recebido: true, ignorado: true });
  if (decision.action === 'ignore_duplicate') return ok({ recebido: true, duplicado: true });

  // order é garantidamente não-nulo aqui: as duas ações acima já cobrem order === null
  // Grava o status bruto ANTES de mudar o pedido. Se isto ficasse por último, uma
  // falha no meio (ex: envio de e-mail) deixaria `asaasStatus` defasado e faria a
  // rota responder 500 — o Asaas então penaliza o webhook e pode interromper a fila.
  await orderRepo.updateAsaasStatus(order!.id, payload.payment.status);

  try {
    if (decision.action === 'confirm_payment') {
      await orderService.updateStatus(order!.id, 'PROCESSANDO', {
        descricao: `Pagamento confirmado via Asaas (${payload.event})`,
        motivo: 'PAGAMENTO_CONFIRMADO',
      });
    } else if (decision.action === 'cancel_order') {
      // Passa pelo fluxo completo de cancelamento (repõe estoque, devolve cupom).
      // Antes isto só trocava o status, deixando o estoque permanentemente errado.
      // Sem estornar: o estorno é justamente o que originou este evento.
      await orderService.cancelar(order!.id, {
        porAdmin: true,
        motivo: `Pagamento cancelado/estornado via Asaas (${payload.event})`,
        estornar: false,
      });
    }
  } catch (err) {
    // O pagamento já aconteceu de fato no gateway: devolver erro aqui faria o Asaas
    // reenfileirar e penalizar o webhook sem que a retentativa resolvesse nada.
    // Registra para investigação manual e confirma o recebimento.
    logger.error('Falha ao aplicar ação do webhook Asaas no pedido', err, {
      orderId: order!.id,
      event: payload.event,
      acao: decision.action,
    });
    return ok({ recebido: true, aplicado: false });
  }

  return ok({ recebido: true });
});
