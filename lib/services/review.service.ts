import { productRepo } from '@/lib/repositories/product.repo';
import { reviewRepo } from '@/lib/repositories/review.repo';
import { AppError, notFound } from '@/lib/utils/errors';

export async function list(productId: string, pagination: { skip?: number; take?: number }) {
  const product = await productRepo.findById(productId);
  if (!product) throw notFound('Produto');
  return reviewRepo.listByProduct(productId, pagination);
}

export async function create(userId: string, productId: string, { nota, titulo, comentario }: { nota: number; titulo?: string; comentario?: string }) {
  const product = await productRepo.findById(productId);
  if (!product) throw notFound('Produto');
  const existing = await reviewRepo.findByUserAndProduct(userId, productId);
  if (existing) throw new AppError('Você já avaliou esta peça', 409, 'REVIEW_EXISTS');
  const review = await reviewRepo.create({ userId, productId, nota, titulo, comentario });
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
