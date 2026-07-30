import { orderRepo } from '@/lib/repositories/order.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { categoryRepo } from '@/lib/repositories/category.repo';

const DIA_LABEL = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export async function dashboard() {
  const vendas = await orderRepo.salesSummary();
  const { total: totalProdutos, items } = await productRepo.search({}, 'relevancia', { skip: 0, take: 1000 });
  const semEstoque = items.filter(p => p.estoque === 0).length;
  const estoqueBaixo = items.filter(p => p.estoque > 0 && p.estoque <= 8).length;
  const categorias = await categoryRepo.list();
  const vendasPorDiaRaw = await orderRepo.salesByDay(7);
  const vendasPorDia = vendasPorDiaRaw.map(v => ({ dia: DIA_LABEL[new Date(v.dia).getDay()], total: v.total }));
  return {
    vendas,
    catalogo: { totalProdutos, semEstoque, estoqueBaixo, totalCategorias: categorias.length },
    vendasPorDia,
  };
}
