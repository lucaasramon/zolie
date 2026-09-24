import { listAdmin } from '@/lib/services/product.service';
import { VendaPresencialForm } from '@/components/admin/VendaPresencialForm';

export const dynamic = 'force-dynamic';

export default async function AdminNovaVendaPage() {
  const { items } = await listAdmin({}, 'relevancia', { skip: 0, take: 500 });

  // O formulário só precisa do essencial para escolher a peça e sugerir preço —
  // mandar o produto inteiro (descrição, imagens, 3D) para o cliente seria peso
  // sem uso nenhum na tela. `listAdmin` agora traz produtos pausados também (para
  // a listagem em /admin/produtos), então filtra aqui: venda manual não deve
  // oferecer uma peça que o time pausou de propósito.
  const produtos = items
    .filter(p => p.ativo)
    .map(p => ({
      id: p.id,
      nome: p.nome,
      sku: p.sku,
      estoque: p.estoque,
      preco: p.precoEfetivo,
    }));

  return <VendaPresencialForm produtos={produtos} />;
}
