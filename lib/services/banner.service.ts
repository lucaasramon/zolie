import { bannerRepo } from '@/lib/repositories/banner.repo';
import { notFound } from '@/lib/utils/errors';

export const list = () => bannerRepo.list();

export const create = (data: any) => bannerRepo.create(data);

export async function update(id: string, data: any) {
  const banner = await bannerRepo.update(id, data).catch(() => null);
  if (!banner) throw notFound('Banner');
  return banner;
}

export const remove = (id: string) => bannerRepo.remove(id);
