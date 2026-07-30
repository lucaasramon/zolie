const { repositories } = require('../repositories');
const { AppError, notFound, forbidden } = require('../utils/errors');
const pricing = require('./pricing.service');
const shipping = require('./shipping.service');
const coupons = require('./coupon.service');
const payments = require('./payment.service');

const STATUS_FLOW = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE'];

async function create(userId, { enderecoId, formaPagamento, parcelas = 1, cep, cupom, envioId = 'pac' }) {
  const cart = await repositories.carts.getByUser(userId);
  const items = cart.items.filter(i => i.product);
  if (!items.length) throw new AppError('Sua sacola está vazia', 422, 'EMPTY_CART');

  const endereco = await repositories.addresses.findById(enderecoId);
  if (!endereco) throw notFound('Endereço');
  if (endereco.userId !== userId) throw forbidden();

  for (const i of items) {
    if (i.product.estoque < i.quantidade) {
      throw new AppError('Estoque insuficiente: ' + i.product.nome, 422, 'OUT_OF_STOCK');
    }
  }

  const base = pricing.resumo(items);
  const cotacao = await shipping.cotar(cep || endereco.cep, base.subtotal);
  const opcao = cotacao.opcoes.find(o => o.id === envioId) || cotacao.opcoes[0];
  let frete = opcao.valor;
  let desconto = 0;
  let cupomCodigo = null;

  if (cupom) {
    const r = await coupons.validar(cupom, { subtotal: base.subtotal, userId, frete });
    desconto = r.desconto;
    if (r.freteGratis) frete = 0;
    cupomCodigo = r.cupom.codigo;
    await repositories.coupons.incrementUse(r.cupom.id);
  }

  const resumo = pricing.resumo(items, { frete, desconto, formaPagamento });
  const total = formaPagamento === 'PIX' ? resumo.totalPix : resumo.total;

  const numero = await repositories.orders.nextNumber();
  const order = await repositories.orders.create(
    {
      numero, userId, enderecoId, status: 'AGUARDANDO_PAGAMENTO', formaPagamento,
      parcelas: formaPagamento === 'CARTAO_CREDITO' ? parcelas : 1,
      subtotal: resumo.subtotal, frete: resumo.frete, desconto: resumo.desconto, total,
      cupomCodigo, transportadora: opcao.nome, codigoRastreio: null
    },
    items.map(i => ({
      productId: i.productId, nomeProduto: i.product.nome,
      precoUnitario: pricing.precoEfetivo(i.product), quantidade: i.quantidade,
      tamanho: i.tamanho, acabamento: i.acabamento,
      subtotal: pricing.precoEfetivo(i.product) * i.quantidade
    }))
  );

  for (const i of items) await repositories.products.decrementStock(i.productId, i.quantidade);
  await repositories.carts.clear(userId);

  const pagamento = await payments.criarCobranca({ order, formaPagamento, parcelas });
  return { order, pagamento };
}

async function listMine(userId, pagination) { return repositories.orders.listByUser(userId, pagination); }

async function detail(userId, id, isAdmin = false) {
  const order = await repositories.orders.findById(id);
  if (!order) throw notFound('Pedido');
  if (!isAdmin && order.userId !== userId) throw forbidden();
  return order;
}

async function updateStatus(id, status, descricao) {
  if (!STATUS_FLOW.includes(status) && status !== 'CANCELADO') {
    throw new AppError('Status inválido', 422, 'INVALID_STATUS');
  }
  const order = await repositories.orders.updateStatus(id, status, descricao);
  if (!order) throw notFound('Pedido');
  return order;
}

module.exports = { create, listMine, detail, updateStatus, STATUS_FLOW };
