import { cartRepo, CartOwner } from '@/lib/repositories/cart.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { variantRepo } from '@/lib/repositories/variant.repo';
import { AppError, notFound } from '@/lib/utils/errors';
import * as pricing from '@/lib/services/pricing.service';
import * as shipping from '@/lib/services/shipping.service';
import * as coupons from '@/lib/services/coupon.service';

interface CartOpts {
  cep?: string;
  cupom?: string;
}

export async function get(owner: CartOwner, { cep, cupom }: CartOpts = {}) {
  const cart = await cartRepo.getByOwner(owner);
  const items = cart.items.filter(i => i.product);
  let frete = 0;
  let cotacao = null;
  if (cep) {
    const subtotalBruto = pricing.resumo(items).subtotal;
    cotacao = await shipping.cotar(cep, subtotalBruto, {
      itens: items.map(i => ({ quantidade: i.quantidade, pesoGramas: i.product.pesoGramas })),
    });
    frete = cotacao.opcoes[0].valor;
  }
  let desconto = 0;
  let cupomAplicado = null;
  if (cupom) {
    const subtotalBruto = pricing.resumo(items).subtotal;
    const r = await coupons.validar(cupom, { subtotal: subtotalBruto, userId: 'userId' in owner ? owner.userId : null, frete });
    desconto = r.desconto;
    if (r.freteGratis) frete = 0;
    cupomAplicado = { codigo: r.cupom.codigo, descricao: r.cupom.descricao };
  }
  return {
    id: cart.id,
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      nome: i.product.nome,
      slug: i.product.slug,
      imagem: (i.product.imagens || [])[0] || null,
      material: i.product.material,
      tamanho: i.tamanho,
      acabamento: i.acabamento,
      quantidade: i.quantidade,
      // Exposto para o cálculo de peso do frete (ver shipping.logic).
      pesoGramas: i.product.pesoGramas != null ? Number(i.product.pesoGramas) : null,
      precoUnitario: pricing.precoEfetivo(i.product),
      subtotal: pricing.precoEfetivo(i.product) * i.quantidade,
    })),
    cotacaoFrete: cotacao,
    cupom: cupomAplicado,
    resumo: pricing.resumo(items, { frete, desconto }),
  };
}

export async function addItem(owner: CartOwner, payload: { productId: string; quantidade: number; tamanho?: string | null; acabamento?: string | null }) {
  const product = await productRepo.findById(payload.productId);
  if (!product) throw notFound('Produto');
  if (product.estoque < payload.quantidade) throw new AppError('Estoque insuficiente para esta peça', 422, 'OUT_OF_STOCK');

  // A variação escolhida pode estar esgotada mesmo com o produto tendo saldo
  // total. Produtos sem variação cadastrada seguem só pelo estoque do produto.
  const variante = await variantRepo.find({
    productId: payload.productId,
    tamanho: payload.tamanho,
    acabamento: payload.acabamento,
  });
  if (variante && (!variante.ativo || variante.estoque < payload.quantidade)) {
    throw new AppError('Estoque insuficiente para esta combinação de tamanho e acabamento', 422, 'OUT_OF_STOCK_VARIANT');
  }

  await cartRepo.addItem(owner, payload);
  return get(owner);
}

async function assertOwnedItem(owner: CartOwner, itemId: string) {
  const item = await cartRepo.findItem(itemId);
  if (!item) throw notFound('Item do carrinho');
  const ownsIt = 'userId' in owner ? item.cart.userId === owner.userId : item.cart.sessionId === owner.sessionId;
  if (!ownsIt) throw notFound('Item do carrinho');
}

export async function updateItem(owner: CartOwner, itemId: string, quantidade: number) {
  await assertOwnedItem(owner, itemId);
  await cartRepo.updateItem(itemId, quantidade);
  return get(owner);
}

export async function removeItem(owner: CartOwner, itemId: string) {
  await assertOwnedItem(owner, itemId);
  await cartRepo.removeItem(itemId);
  return get(owner);
}

export const clear = (owner: CartOwner) => cartRepo.clear(owner);
