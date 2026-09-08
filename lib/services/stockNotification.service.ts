import { stockNotificationRepo } from '@/lib/repositories/stockNotification.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { AppError, notFound } from '@/lib/utils/errors';
import { enviarConfirmacaoAvisoEstoque, enviarProdutoDisponivel } from '@/lib/services/email.service';

export async function inscrever(productId: string, email: string) {
  const produto = await productRepo.findById(productId);
  if (!produto) throw notFound('Produto');
  if (produto.estoque > 0) throw new AppError('Esta peça já está disponível em estoque', 409, 'PRODUCT_IN_STOCK');

  await stockNotificationRepo.create(productId, email);
  await enviarConfirmacaoAvisoEstoque(email, produto.nome, produto.slug);
}

/**
 * Dispara o e-mail de "voltou ao estoque" para quem pediu aviso deste produto,
 * e marca os pedidos como notificados. Chamado quando o admin edita o produto e
 * o estoque sai de zero para positivo (ver product.service.update) — a reposição
 * de estoque por cancelamento/expiração de pedido (order.service, orderExpiration.service)
 * não dispara aviso: é o mesmo produto "voltando" à venda por ter sobrado de um
 * pedido desfeito, não uma reposição real de mercadoria.
 */
export async function notificarReposicao(productId: string) {
  const pendentes = await stockNotificationRepo.listPendentesByProduct(productId);
  if (pendentes.length === 0) return;

  const produto = await productRepo.findById(productId);
  if (!produto) return;

  await Promise.all(pendentes.map(p => enviarProdutoDisponivel(p.email, produto.nome, produto.slug)));
  await stockNotificationRepo.marcarNotificados(pendentes.map(p => p.id));
}

export const listPendentesAgrupado = stockNotificationRepo.listPendentesAgrupado;
