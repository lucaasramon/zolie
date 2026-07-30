import { cartRepo } from '@/lib/repositories/cart.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { AppError, notFound } from '@/lib/utils/errors';
import * as pricing from '@/lib/services/pricing.service';
import * as shipping from '@/lib/services/shipping.service';
import * as coupons from '@/lib/services/coupon.service';

interface CartOpts {
  cep?: string;
  cupom?: string;
}

export async function get(userId: string, { cep, cupom }: CartOpts = {}) {
  const cart = await cartRepo.getByUser(userId);
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
    const r = await coupons.validar(cupom, { subtotal: subtotalBruto, userId, frete });
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

export async function addItem(userId: string, payload: { productId: string; quantidade: number; tamanho?: string | null; acabamento?: string | null }) {
  const product = await productRepo.findById(payload.productId);
  if (!product) throw notFound('Produto');
  if (product.estoque < payload.quantidade) throw new AppError('Estoque insuficiente para esta peça', 422, 'OUT_OF_STOCK');
  await cartRepo.addItem(userId, payload);
  return get(userId);
}

async function assertOwnedItem(userId: string, itemId: string) {
  const item = await cartRepo.findItem(itemId);
  if (!item || item.cart.userId !== userId) throw notFound('Item do carrinho');
}

export async function updateItem(userId: string, itemId: string, quantidade: number) {
  await assertOwnedItem(userId, itemId);
  await cartRepo.updateItem(userId, itemId, quantidade);
  return get(userId);
}

export async function removeItem(userId: string, itemId: string) {
  await assertOwnedItem(userId, itemId);
  await cartRepo.removeItem(userId, itemId);
  return get(userId);
}

export const clear = (userId: string) => cartRepo.clear(userId);
