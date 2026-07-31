import { cartRepo } from '@/lib/repositories/cart.repo';
import { enviarCarrinhoAbandonado } from '@/lib/services/email.service';
import { logger } from '@/lib/logger';

const ABANDONED_AFTER_HOURS = 24;

export async function enviarLembretesDeCarrinhoAbandonado() {
  const carrinhos = await cartRepo.findAbandoned(ABANDONED_AFTER_HOURS);
  let enviados = 0;

  for (const cart of carrinhos) {
    if (!cart.user) continue; // por construção (findAbandoned filtra userId != null) sempre existe, checagem só para o TypeScript
    const itens = cart.items.filter(i => i.product).map(i => ({ nomeProduto: i.product!.nome }));
    if (!itens.length) continue;
    try {
      await enviarCarrinhoAbandonado(cart.user.email, cart.user.nome, itens);
      await cartRepo.markAbandonedEmailSent(cart.id);
      enviados += 1;
    } catch (err) {
      logger.error('Falha ao enviar lembrete de carrinho abandonado', err, { cartId: cart.id });
    }
  }

  return { verificados: carrinhos.length, enviados };
}
