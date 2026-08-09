import { productRepo } from '@/lib/repositories/product.repo';
import { list as listSupplies } from '@/lib/services/supply.service';
import { PricingWorkbench } from '@/components/admin/PricingWorkbench';

export const dynamic = 'force-dynamic';

export default async function AdminPrecificacaoPage() {
  const [produtos, insumos] = await Promise.all([productRepo.listForPricing(), listSupplies()]);

  const produtosSerialized = produtos.map(p => ({
    id: p.id,
    nome: p.nome,
    imagem: p.imagens[0] ?? null,
    material: p.material,
    preco: Number(p.preco),
    precoCusto: p.precoCusto != null ? Number(p.precoCusto) : null,
    custoSemijoia: p.custoSemijoia != null ? Number(p.custoSemijoia) : null,
    custoEmbalagem: p.custoEmbalagem != null ? Number(p.custoEmbalagem) : null,
    margemDesejada: p.margemDesejada != null ? Number(p.margemDesejada) : null,
    supplyIds: p.productSupplies.map(ps => ps.supplyId),
  }));

  return <PricingWorkbench produtos={produtosSerialized} insumosIniciais={insumos} />;
}
