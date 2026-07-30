import { categoryRepo } from '@/lib/repositories/category.repo';
import { CategoryManager } from '@/components/admin/CategoryManager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriasPage() {
  const categorias = await categoryRepo.list();
  const serialized = categorias.map(c => ({
    id: c.id,
    nome: c.nome,
    slug: c.slug,
    ordem: c.ordem,
    _count: c._count,
  }));
  return <CategoryManager categorias={serialized} />;
}
