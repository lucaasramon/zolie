import { cartRepo } from '@/lib/repositories/cart.repo';
import { addressRepo } from '@/lib/repositories/address.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { orderRepo } from '@/lib/repositories/order.repo';
import { couponRepo } from '@/lib/repositories/coupon.repo';
import { userRepo } from '@/lib/repositories/user.repo';
import { AppError, notFound, forbidden } from '@/lib/utils/errors';
import * as pricing from '@/lib/services/pricing.service';
import * as shipping from '@/lib/services/shipping.service';
import * as coupons from '@/lib/services/coupon.service';
import * as payments from '@/lib/services/payment.service';
import * as email from '@/lib/services/email.service';
import { OrderStatus } from '@prisma/client';

export const STATUS_FLOW: OrderStatus[] = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE'];

interface CartaoInput {
  numero: string;
  nomeImpresso: string;
  validadeMes: string;
  validadeAno: string;
  cvv: string;
}

interface CreateOrderInput {
  enderecoId: string;
  formaPagamento: 'CARTAO_CREDITO' | 'PIX' | 'BOLETO';
  parcelas?: number;
  cep?: string;
  cupom?: string;
  envioId?: string;
  cartao?: CartaoInput;
  remoteIp: string;
}

export async function create(userId: string, { enderecoId, formaPagamento, parcelas = 1, cep, cupom, envioId = 'pac', cartao, remoteIp }: CreateOrderInput) {
  const user = await userRepo.findById(userId);
  if (!user) throw notFound('Usuário');
  if (!user.cpf) throw new AppError('Cadastre seu CPF antes de finalizar a compra', 422, 'CPF_REQUIRED');

  const cart = await cartRepo.getByUser(userId);
  const items = cart.items.filter(i => i.product);
  if (!items.length) throw new AppError('Sua sacola está vazia', 422, 'EMPTY_CART');

  const endereco = await addressRepo.findById(enderecoId);
  if (!endereco) throw notFound('Endereço');
  if (endereco.userId !== userId) throw forbidden();

  for (const i of items) {
    if (i.product.estoque < i.quantidade) {
      throw new AppError(`Estoque insuficiente: ${i.product.nome}`, 422, 'OUT_OF_STOCK');
    }
  }

  const base = pricing.resumo(items);
  const cotacao = await shipping.cotar(cep || endereco.cep, base.subtotal);
  const opcao = cotacao.opcoes.find(o => o.id === envioId) || cotacao.opcoes[0];
  let frete = opcao.valor;
  let desconto = 0;
  let cupomCodigo: string | null = null;

  if (cupom) {
    const r = await coupons.validar(cupom, { subtotal: base.subtotal, userId, frete });
    desconto = r.desconto;
    if (r.freteGratis) frete = 0;
    cupomCodigo = r.cupom.codigo;
    await couponRepo.incrementUse(r.cupom.id);
  }

  const resumo = pricing.resumo(items, { frete, desconto, formaPagamento });
  const total = formaPagamento === 'PIX' ? resumo.totalPix : resumo.total;

  const numero = await orderRepo.nextNumber();
  const order = await orderRepo.create(
    {
      numero,
      userId,
      enderecoId,
      status: 'AGUARDANDO_PAGAMENTO',
      formaPagamento,
      parcelas: formaPagamento === 'CARTAO_CREDITO' ? parcelas : 1,
      subtotal: resumo.subtotal,
      frete: resumo.frete,
      desconto: resumo.desconto,
      total,
      cupomCodigo,
      transportadora: opcao.nome,
      codigoRastreio: null,
    },
    items.map(i => ({
      productId: i.productId,
      nomeProduto: i.product.nome,
      precoUnitario: pricing.precoEfetivo(i.product),
      quantidade: i.quantidade,
      tamanho: i.tamanho,
      acabamento: i.acabamento,
      subtotal: pricing.precoEfetivo(i.product) * i.quantidade,
    })),
  );

  const pagamento = await payments.criarCobranca({
    order: { id: order.id, total: order.total, numero: order.numero },
    formaPagamento,
    parcelas,
    cartao,
    remoteIp,
    user: { id: user.id, nome: user.nome, email: user.email, cpf: user.cpf, telefone: user.telefone },
    endereco: { cep: endereco.cep, rua: endereco.rua, numero: endereco.numero, bairro: endereco.bairro, complemento: endereco.complemento },
  });

  await orderRepo.setAsaasPayment(order.id, pagamento.asaasPaymentId as string, pagamento.asaasStatus as string);

  for (const i of items) await productRepo.decrementStock(i.productId, i.quantidade);
  await cartRepo.clear(userId);

  await email.enviarConfirmacaoPedido(user.email, user.nome, order.numero, order.items, order.total);

  return { order: { ...order, asaasPaymentId: pagamento.asaasPaymentId, asaasStatus: pagamento.asaasStatus }, pagamento };
}

export async function listMine(userId: string, pagination: { skip?: number; take?: number }) {
  return orderRepo.listByUser(userId, pagination);
}

export async function detail(userId: string, id: string, isAdmin = false) {
  const order = await orderRepo.findById(id);
  if (!order) throw notFound('Pedido');
  if (!isAdmin && order.userId !== userId) throw forbidden();
  return order;
}

export async function retomarPagamento(userId: string, id: string, isAdmin = false) {
  const order = await orderRepo.findById(id);
  if (!order) throw notFound('Pedido');
  if (!isAdmin && order.userId !== userId) throw forbidden();
  if (order.status !== 'AGUARDANDO_PAGAMENTO') {
    throw new AppError('Este pedido não está aguardando pagamento', 422, 'ORDER_NOT_PENDING');
  }
  if (!order.asaasPaymentId) {
    throw new AppError('Nenhuma cobrança encontrada para este pedido', 404, 'PAYMENT_NOT_FOUND');
  }
  return payments.consultarCobranca({
    asaasPaymentId: order.asaasPaymentId,
    formaPagamento: order.formaPagamento,
    parcelas: order.parcelas,
  });
}

export async function updateStatus(id: string, status: OrderStatus, descricao?: string, motivo?: 'PAGAMENTO_CONFIRMADO') {
  if (!STATUS_FLOW.includes(status) && status !== 'CANCELADO') {
    throw new AppError('Status inválido', 422, 'INVALID_STATUS');
  }
  const order = await orderRepo.updateStatus(id, status, descricao);
  if (!order) throw notFound('Pedido');
  if (order.user) {
    if (motivo === 'PAGAMENTO_CONFIRMADO') {
      await email.enviarConfirmacaoPagamento(order.user.email, order.user.nome, order.numero);
    } else {
      await email.enviarMudancaStatus(order.user.email, order.user.nome, order.numero, status, descricao);
    }
  }
  return order;
}
