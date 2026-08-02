import { orderRepo } from '@/lib/repositories/order.repo';
import { sincronizarRastreio } from '@/lib/services/melhorEnvio/label.service';
import { logger } from '@/lib/logger';

/**
 * Varre os pedidos com etiqueta comprada e rastreio ainda vazio. O código não sai
 * junto com a compra da etiqueta — o Melhor Envio leva um tempo para emiti-lo —,
 * então é este job que fecha o ciclo e preenche o campo.
 */
export async function sincronizarRastreiosPendentes() {
  const pendentes = await orderRepo.findAguardandoRastreio();
  let preenchidos = 0;

  for (const pedido of pendentes) {
    try {
      const codigo = await sincronizarRastreio(pedido.id);
      if (codigo) preenchidos += 1;
    } catch (err) {
      // Um pedido problemático não pode interromper o lote.
      logger.error('Falha ao sincronizar rastreio', err, { orderId: pedido.id });
    }
  }

  return { verificados: pendentes.length, preenchidos };
}
