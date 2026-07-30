import { wishlistRepo } from '@/lib/repositories/wishlist.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { notFound } from '@/lib/utils/errors';
import { decorate } from '@/lib/services/product.service';

export async function list(userId: string) {
  const items = await wishlistRepo.listByUser(userId);
  return items.filter(i => i.product).map(i => decorate(i.product));
}

export async function add(userId: string, productId: string) {
  const product = await productRepo.findById(productId);
  if (!product) throw notFound('Produto');
  await wishlistRepo.add(userId, productId);
  return list(userId);
}

export async function remove(userId: string, productId: string) {
  await wishlistRepo.remove(userId, productId);
  return list(userId);
}
