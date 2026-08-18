import { guestOrderAccessRepo } from '@/lib/repositories/guestOrderAccess.repo';
import { orderRepo } from '@/lib/repositories/order.repo';
import { AppError, notFound } from '@/lib/utils/errors';
import * as payments from '@/lib/services/payment.service';
import * as orderService from '@/lib/services/order.service';

// A criação/reuso do token (na 1ª compra de um e-mail como convidado) acontece
// em order.service.ts::create, não aqui — importar order.service dali para cá
// criaria um ciclo, já que `cancelar` abaixo já depende dele.

async function resolveEmail(token: string) {
  const acesso = await guestOrderAccessRepo.findByToken(token);
  if (!acesso) throw new AppError('Link inválido', 404, 'GUEST_ORDER_ACCESS_NOT_FOUND');
  return acesso.email;
}

export async function listar(token: string, pagination: { skip?: number; take?: number }) {
  const email = await resolveEmail(token);
  return orderRepo.listByGuestEmail(email, pagination);
}

async function findOwnedOrder(token: string, orderId: string) {
  const email = await resolveEmail(token);
  const order = await orderRepo.findById(orderId);
  if (!order || order.userId !== null || order.guestEmail !== email) throw notFound('Pedido');
  return order;
}

export async function detalhe(token: string, orderId: string) {
  return findOwnedOrder(token, orderId);
}

export async function retomarPagamento(token: string, orderId: string) {
  const order = await findOwnedOrder(token, orderId);
  if (order.status !== 'AGUARDANDO_PAGAMENTO') {
    throw new AppError('Este pedido não está aguardando pagamento', 422, 'ORDER_NOT_PENDING');
  }
  if (!order.asaasPaymentId) {
    throw new AppError('Nenhuma cobrança encontrada para este pedido', 404, 'PAYMENT_NOT_FOUND');
  }
  return payments.consultarCobranca({
    asaasPaymentId: order.asaasPaymentId,
    formaPagamento: order.formaPagamento,
    parcelas: order.parcelas,
  });
}

export async function cancelar(token: string, orderId: string, motivo?: string) {
  const email = await resolveEmail(token);
  // A checagem de posse acontece dentro de orderService.cancelar (via guestEmail);
  // aqui só resolvemos o token no e-mail correspondente.
  return orderService.cancelar(orderId, { guestEmail: email, motivo });
}
