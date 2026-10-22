import { orderRepo } from '@/lib/repositories/order.repo';
import { reviewRepo } from '@/lib/repositories/review.repo';
import { enviarPedidoAvaliacao } from '@/lib/services/email.service';
import { CUPOM_AVALIACAO_FOTO, DIAS_APOS_ENTREGA_PARA_PEDIR_AVALIACAO, JANELA_PEDIDO_AVALIACAO_DIAS } from '@/lib/avaliacao';
import { logger } from '@/lib/logger';

const DIA_MS = 86_400_000;

/**
 * Pede avaliação (com o incentivo do cupom da foto) para pedidos entregues há
 * alguns dias. Cada pedido recebe no máximo um e-mail, e só das peças que a
 * cliente ainda não avaliou — se já avaliou tudo, o pedido é só marcado.
 */
export async function enviarPedidosDeAvaliacao() {
  const agora = Date.now();
  const pedidos = await orderRepo.findParaPedirAvaliacao(
    new Date(agora - JANELA_PEDIDO_AVALIACAO_DIAS * DIA_MS),
    new Date(agora - DIAS_APOS_ENTREGA_PARA_PEDIR_AVALIACAO * DIA_MS),
  );
  let enviados = 0;

  for (const pedido of pedidos) {
    if (!pedido.userId || !pedido.user) continue; // filtrado na consulta; checagem só para o TypeScript
    try {
      const avaliados = await reviewRepo.listProductIdsAvaliados(pedido.userId, pedido.items.map(i => i.productId));
      // Mesmo produto em duas linhas (tamanhos diferentes) aparece uma vez só.
      const pendentes = [...new Map(pedido.items.filter(i => !avaliados.has(i.productId)).map(i => [i.productId, i])).values()];
      if (pendentes.length > 0) {
        await enviarPedidoAvaliacao(pedido.user.email, pedido.user.nome, pedido.id, pendentes, CUPOM_AVALIACAO_FOTO.percentual);
        enviados += 1;
      }
      await orderRepo.marcarAvaliacaoSolicitada(pedido.id);
    } catch (err) {
      logger.error('Falha ao pedir avaliação do pedido', err, { orderId: pedido.id });
    }
  }

  return { verificados: pedidos.length, enviados };
}
