import { categoryRepo } from '@/lib/repositories/category.repo';
import { prisma } from '@/lib/prisma';
import { notFound } from '@/lib/utils/errors';
import { slugify } from '@/lib/utils/slug';

export const list = () => categoryRepo.list();

/**
 * "Personalizados" não é uma categoria do banco: é um atalho para todos os
 * produtos marcados como personalizados no admin, que continuam cada um na sua
 * categoria real (um colar personalizado segue em Colares). O slug é tratado
 * na busca de produtos (ver productRepo.search).
 */
export const SLUG_PERSONALIZADOS = 'personalizados';
export const CATEGORIA_PERSONALIZADOS = { id: SLUG_PERSONALIZADOS, nome: 'Personalizados', slug: SLUG_PERSONALIZADOS };

/** Categorias da vitrine (menu, rodapé, home, filtros): "Personalizados" sempre em primeiro. */
export async function listParaLoja(): Promise<{ id: string; nome: string; slug: string }[]> {
  const [categorias, personalizados] = await Promise.all([
    categoryRepo.list(),
    prisma.product.count({ where: { personalizado: true, ativo: true } }),
  ]);
  const reais = categorias.map(({ id, nome, slug }) => ({ id, nome, slug })).filter(c => c.slug !== SLUG_PERSONALIZADOS);
  // Sem nenhum anúncio personalizado ativo, o atalho levaria a uma página vazia.
  return personalizados > 0 ? [CATEGORIA_PERSONALIZADOS, ...reais] : reais;
}

export const create = (data: any) => categoryRepo.create({ ...data, slug: data.slug || slugify(data.nome) });

export async function update(id: string, data: any) {
  const category = await categoryRepo.update(id, data).catch(() => null);
  if (!category) throw notFound('Categoria');
  return category;
}

export const remove = (id: string) => categoryRepo.remove(id);
