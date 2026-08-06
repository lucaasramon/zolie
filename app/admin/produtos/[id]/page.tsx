import { notFound } from 'next/navigation';
import { productRepo } from '@/lib/repositories/product.repo';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { ProductForm } from '@/components/admin/ProductForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarProdutoPage({ params }: Props) {
  const { id } = await params;
  const [produto, categorias] = await Promise.all([productRepo.findById(id), categoryRepo.list()]);
  if (!produto) return notFound();

  const serializedCategorias = categorias.map(c => ({ id: c.id, nome: c.nome }));

  return (
    <ProductForm
      categorias={serializedCategorias}
      initialData={{
        id: produto.id,
        nome: produto.nome,
        sku: produto.sku,
        precoCusto: produto.precoCusto ? Number(produto.precoCusto) : null,
        descricao: produto.descricao,
        cuidados: produto.cuidados,
        preco: Number(produto.preco),
        precoPromocional: produto.precoPromocional ? Number(produto.precoPromocional) : null,
        material: produto.material,
        categoriaId: produto.categoriaId,
        estoque: produto.estoque,
        pesoGramas: produto.pesoGramas ? Number(produto.pesoGramas) : null,
        pedra: produto.pedra,
        tamanhos: produto.tamanhos,
        imagens: produto.imagens,
        destaque: produto.destaque,
        lancamento: produto.lancamento,
        ativo: produto.ativo,
      }}
    />
  );
}
