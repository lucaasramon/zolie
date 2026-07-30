import { categoryRepo } from '@/lib/repositories/category.repo';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NovoProdutoPage() {
  const categorias = await categoryRepo.list();
  const serialized = categorias.map(c => ({ id: c.id, nome: c.nome }));
  return <ProductForm categorias={serialized} />;
}
