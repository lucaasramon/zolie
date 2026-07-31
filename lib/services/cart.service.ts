import { cartRepo, CartOwner } from '@/lib/repositories/cart.repo';
import { productRepo } from '@/lib/repositories/product.repo';
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
    cotacao = await shipping.cotar(cep, subtotalBruto);
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
