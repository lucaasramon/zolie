import { productRepo } from '@/lib/repositories/product.repo';
import { reviewRepo } from '@/lib/repositories/review.repo';
import { orderRepo } from '@/lib/repositories/order.repo';
import { AppError, notFound } from '@/lib/utils/errors';

export async function list(productId: string, pagination: { skip?: number; take?: number }) {
  const product = await productRepo.findById(productId);
  if (!product) throw notFound('Produto');
  return reviewRepo.listByProduct(productId, pagination);
}

/**
 * Checa se um usuário pode avaliar um produto: precisa ter recebido a peça
 * (pedido ENTREGUE com esse item) e ainda não ter avaliado antes. Usado tanto
 * para bloquear o envio (`create`) quanto para a consulta de elegibilidade que
 * decide se o frontend mostra o botão "Avaliar esta peça".
 */
export async function elegibilidade(userId: string, productId: string) {
  const [jaAvaliou, recebeu] = await Promise.all([
    reviewRepo.findByUserAndProduct(userId, productId).then(Boolean),
    orderRepo.hasDeliveredItem(userId, productId),
  ]);
  if (jaAvaliou) return { podeAvaliar: false, motivo: 'REVIEW_EXISTS' as const };
  if (!recebeu) return { podeAvaliar: false, motivo: 'REVIEW_REQUIRES_DELIVERY' as const };
  return { podeAvaliar: true, motivo: null };
}

export async function create(
  userId: string,
  productId: string,
  { nota, titulo, comentario, imagens }: { nota: number; titulo?: string; comentario?: string; imagens?: string[] },
) {
  const product = await productRepo.findById(productId);
  if (!product) throw notFound('Produto');
  const existing = await reviewRepo.findByUserAndProduct(userId, productId);
  if (existing) throw new AppError('Você já avaliou esta peça', 409, 'REVIEW_EXISTS');
  // Só quem já recebeu a peça pode avaliar — evita avaliação sem ter o produto
  // em mãos (ex: baseada só na expectativa antes da entrega).
  const recebeu = await orderRepo.hasDeliveredItem(userId, product.id);
  if (!recebeu) {
    throw new AppError('Você só pode avaliar peças que já recebeu', 403, 'REVIEW_REQUIRES_DELIVERY');
  }
  const review = await reviewRepo.create({ userId, productId, nota, titulo, comentario, imagens });
  return { review, mensagem: 'Avaliação enviada para moderação' };
}

export async function listPending(pagination: { skip?: number; take?: number }) {
  return reviewRepo.listPending(pagination);
}

export async function moderar(reviewId: string, aprovado: boolean) {
  const review = await reviewRepo.findById(reviewId);
  if (!review) throw notFound('Avaliação');
  await reviewRepo.setAprovado(reviewId, aprovado);
  if (aprovado) await reviewRepo.recalcProduct(review.productId);
  return { aprovado, reviewId };
}
