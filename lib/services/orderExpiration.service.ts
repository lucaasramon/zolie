import { PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { orderRepo } from '@/lib/repositories/order.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { variantRepo } from '@/lib/repositories/variant.repo';
import { couponRepo } from '@/lib/repositories/coupon.repo';
import * as email from '@/lib/services/email.service';
import * as payments from '@/lib/services/payment.service';
import { logger } from '@/lib/logger';

/**
 * Horas de tolerância por forma de pagamento, contadas a partir da criação do pedido.
 * Ficam acima do `dueDate` enviado ao Asaas (PIX 1 dia, boleto 3 dias — ver
 * payment.service) para dar margem a pagamento em cima do vencimento e ao atraso
 * normal do webhook de confirmação. Cancelar antes disso arriscaria derrubar um
 * pedido que o cliente acabou de pagar.
 */
export const PRAZO_HORAS: Record<PaymentMethod, number> = {
  PIX: 36,
  BOLETO: 96,
  CARTAO_CREDITO: 36,
};

const HORA_MS = 60 * 60 * 1000;

/** Data de corte por forma de pagamento — pura, para poder ser testada sem banco. */
export function calcularLimites(agora: Date) {
  return (Object.keys(PRAZO_HORAS) as PaymentMethod[]).map(formaPagamento => ({
    formaPagamento,
    antesDe: new Date(agora.getTime() - PRAZO_HORAS[formaPagamento] * HORA_MS),
  }));
}

export async function expirarPedidosNaoPagos() {
  const pedidos = await orderRepo.findExpired(calcularLimites(new Date()));
  let expirados = 0;

  for (const pedido of pedidos) {
    try {
      // Remove a cobrança no Asaas antes de cancelar localmente. Sem isso o boleto
      // continuaria pagável depois do pedido cancelado — entraria dinheiro sem
      // pedido ativo. Falhar aqui aborta o cancelamento e o pedido é reprocessado
      // na próxima execução, que é preferível a cancelar deixando a cobrança viva.
      if (pedido.asaasPaymentId) {
        await payments.encerrarCobranca(
          pedido.asaasPaymentId,
          `Pedido ${pedido.numero} cancelado por falta de pagamento no prazo`,
        );
      }

      // Tudo numa transação: a reposição de estoque e o cancelamento precisam
      // acontecer juntos, senão uma falha no meio devolve estoque de um pedido
      // que continua ativo.
      const cancelado = await prisma.$transaction(async tx => {
        // Relê sob a transação e só prossegue se ainda estiver aguardando pagamento.
        // Se o webhook confirmou o pagamento entre a busca e agora, `updateMany`
        // afeta 0 linhas e abortamos sem tocar no estoque — é isso que torna o job
        // seguro para rodar concorrente ou repetido.
        const { count } = await tx.order.updateMany({
          where: { id: pedido.id, status: 'AGUARDANDO_PAGAMENTO' },
          data: { status: 'CANCELADO' },
        });
        if (count === 0) return false;

        await tx.orderEvent.create({
          data: {
            orderId: pedido.id,
            status: 'CANCELADO',
            descricao: 'Cancelado automaticamente por falta de pagamento no prazo',
          },
        });

        for (const item of pedido.items) {
          await variantRepo.incrementStock(
            { productId: item.productId, tamanho: item.tamanho, acabamento: item.acabamento },
            item.quantidade,
            tx,
          );
          await productRepo.incrementStock(item.productId, item.quantidade, tx);
        }

        if (pedido.cupomCodigo) {
          await couponRepo.decrementUseByCode(pedido.cupomCodigo, tx);
        }

        return true;
      });

      if (!cancelado) continue;
      expirados += 1;

      if (pedido.user) {
        await email.enviarPedidoExpirado(pedido.user.email, pedido.user.nome, pedido.numero);
      }
    } catch (err) {
      // Um pedido problemático não pode interromper o lote inteiro.
      logger.error('Falha ao expirar pedido não pago', err, { orderId: pedido.id });
    }
  }

  return { verificados: pedidos.length, expirados };
}
