import { supplyRepo } from '@/lib/repositories/supply.repo';
import { notFound } from '@/lib/utils/errors';
import { round } from '@/lib/utils/money';

export function decorate(s: any) {
  return {
    ...s,
    valorPago: Number(s.valorPago),
    custoUnitario: round(Number(s.valorPago) / s.quantidadeLote),
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  };
}

export async function list() {
  const supplies = await supplyRepo.list();
  return supplies.map(decorate);
}

export async function create(data: any) {
  return decorate(await supplyRepo.create(data));
}

export async function update(id: string, data: any) {
  const supply = await supplyRepo.update(id, data).catch(() => null);
  if (!supply) throw notFound('Insumo');
  return decorate(supply);
}

export const remove = (id: string) => supplyRepo.remove(id);
