const { repositories } = require('../repositories');

async function dashboard() {
  const vendas = await repositories.orders.salesSummary();
  const { total: totalProdutos, items } = await repositories.products.search({}, 'relevancia', { skip: 0, take: 1000 });
  const semEstoque = items.filter(p => p.estoque === 0).length;
  const estoqueBaixo = items.filter(p => p.estoque > 0 && p.estoque <= 8).length;
  const categorias = await repositories.categories.list();
  return {
    vendas,
    catalogo: { totalProdutos, semEstoque, estoqueBaixo, totalCategorias: categorias.length },
    // >>> POSTGRES <<< com o banco, trocar por GROUP BY date_trunc('day', created_at)
    vendasPorDia: [
      { dia: 'seg', total: 4820 }, { dia: 'ter', total: 6210 }, { dia: 'qua', total: 5540 },
      { dia: 'qui', total: 7830 }, { dia: 'sex', total: 9610 }, { dia: 'sáb', total: 8420 },
      { dia: 'dom', total: 4110 }
    ]
  };
}

module.exports = { dashboard };
