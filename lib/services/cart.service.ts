import { cartRepo, CartOwner } from '@/lib/repositories/cart.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { AppError, notFound } from '@/lib/utils/errors';
import * as pricing from '@/lib/services/pricing.service';
import * as shipping from '@/lib/services/shipping.service';
import * as coupons from '@/lib/services/coupon.service';
import * as siteConfig from '@/lib/services/site-config.service';
import { CORRENTES_PADRAO, lerOpcoes, lerPersonalizacao, Personalizacao, personalizacaoSchema, rotuloOpcao } from '@/lib/personalizacao';

interface CartOpts {
  cep?: string;
  cupom?: string;
}

export async function get(owner: CartOwner, { cep, cupom }: CartOpts = {}) {
  await siteConfig.preparar();
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
    cupomAplicado = { codigo: r.cupom.codigo, descricao: r.cupom.descricao, freteGratis: r.freteGratis };
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
      personalizacao: lerPersonalizacao(i.personalizacao),
      quantidade: i.quantidade,
      // Exposto para o cálculo de peso do frete (ver shipping.logic).
      pesoGramas: i.product.pesoGramas != null ? Number(i.product.pesoGramas) : null,
      precoUnitario: pricing.precoItem(i),
      subtotal: pricing.precoItem(i) * i.quantidade,
    })),
    cotacaoFrete: cotacao,
    cupom: cupomAplicado,
    resumo: pricing.resumo(items, { frete, desconto }),
  };
}

export async function addItem(
  owner: CartOwner,
  payload: { productId: string; quantidade: number; tamanho?: string | null; personalizacao?: unknown },
) {
  const product = await productRepo.findById(payload.productId);
  if (!product) throw notFound('Produto');
  if (product.estoque < payload.quantidade) throw new AppError('Estoque insuficiente para esta peça', 422, 'OUT_OF_STOCK');

  // Produto personalizado só entra na sacola com as escolhas da cliente — sem elas
  // a peça não tem como ser produzida. Nos demais, qualquer personalização é ignorada.
  let personalizacao: Personalizacao | null = null;
  const tamanho = payload.tamanho ?? null;
  if (product.personalizado) {
    if (payload.personalizacao == null) {
      throw new AppError('Preencha a personalização da peça na página do produto', 422, 'PERSONALIZATION_REQUIRED');
    }
    personalizacao = personalizacaoSchema.parse(payload.personalizacao);
    const opcoes = lerOpcoes(product.opcoesPersonalizacao);
    if (opcoes.length > 0) {
      const modeloId = personalizacao.modeloId;
      const opcao = opcoes.find(o => o.id === modeloId);
      if (!opcao) throw new AppError('Escolha o modelo da peça', 422, 'INVALID_PERSONALIZATION_OPTION');
      // O nome vem do anúncio, não da requisição — o cliente só informa o id.
      personalizacao = { ...personalizacao, modelo: rotuloOpcao(opcao) };
    } else {
      personalizacao = { ...personalizacao, modeloId: null, modelo: null };
    }
    const correntes = product.tamanhos.length > 0 ? product.tamanhos : CORRENTES_PADRAO;
    if (!tamanho || !correntes.includes(tamanho)) {
      throw new AppError('Escolha o tamanho da corrente', 422, 'INVALID_SIZE');
    }
  }

  await cartRepo.addItem(owner, { productId: payload.productId, quantidade: payload.quantidade, tamanho, personalizacao });
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
