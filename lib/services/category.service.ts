import { categoryRepo } from '@/lib/repositories/category.repo';
import { notFound } from '@/lib/utils/errors';
import { slugify } from '@/lib/utils/slug';

export const list = () => categoryRepo.list();

export const create = (data: any) => categoryRepo.create({ ...data, slug: data.slug || slugify(data.nome) });

export async function update(id: string, data: any) {
  const category = await categoryRepo.update(id, data).catch(() => null);
  if (!category) throw notFound('Categoria');
  return category;
}

export const remove = (id: string) => categoryRepo.remove(id);
