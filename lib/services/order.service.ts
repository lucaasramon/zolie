import { cartRepo, CartOwner } from '@/lib/repositories/cart.repo';
import { addressRepo } from '@/lib/repositories/address.repo';
import { productRepo } from '@/lib/repositories/product.repo';
import { orderRepo } from '@/lib/repositories/order.repo';
import { couponRepo } from '@/lib/repositories/coupon.repo';
import { userRepo } from '@/lib/repositories/user.repo';
import { AppError, notFound, forbidden } from '@/lib/utils/errors';
import * as pricing from '@/lib/services/pricing.service';
import * as shipping from '@/lib/services/shipping.service';
import * as siteConfig from '@/lib/services/site-config.service';
import * as coupons from '@/lib/services/coupon.service';
import * as payments from '@/lib/services/payment.service';
import * as email from '@/lib/services/email.service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export const STATUS_FLOW: OrderStatus[] = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE'];

interface CartaoInput {
  numero: string;
  nomeImpresso: string;
  validadeMes: string;
  validadeAno: string;
  cvv: string;
}

interface GuestInput {
  nome: string;
  email: string;
  telefone?: string;
  cpf: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface CreateOrderInput {
  enderecoId?: string;
  formaPagamento: 'CARTAO_CREDITO' | 'PIX' | 'BOLETO';
  parcelas?: number;
  cep?: string;
  cupom?: string;
  envioId?: string;
  creditCardToken?: string;
  cartao?: CartaoInput;
  remoteIp: string;
  guest?: GuestInput;
}

interface ContatoResolvido {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string | null;
}

interface EnderecoResolvido {
  enderecoId: string | null;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
}

/**
 * Resolve contato e endereço de entrega de forma agnóstica a login: autenticado
 * usa os dados da conta/endereço salvo, convidado usa os dados informados
 * inline no checkout. O resto de `create()` trabalha só com o resultado daqui,
 * sem precisar saber se é convidado ou não.
 */
async function resolveContatoEEndereco(
  userId: string | null,
  { enderecoId, guest }: Pick<CreateOrderInput, 'enderecoId' | 'guest'>,
): Promise<{ contato: ContatoResolvido; endereco: EnderecoResolvido }> {
  if (userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw notFound('Usuário');
    if (!user.emailVerified) {
      throw new AppError('Confirme seu e-mail antes de finalizar a compra', 422, 'EMAIL_NOT_VERIFIED');
    }
    if (!user.cpf) throw new AppError('Cadastre seu CPF antes de finalizar a compra', 422, 'CPF_REQUIRED');
    if (!enderecoId) throw new AppError('Selecione um endereço de entrega', 422, 'ENDERECO_REQUIRED');

    // Endereço removido não pode receber pedido novo, mesmo que o id ainda exista.
    const endereco = await addressRepo.findAtivoById(enderecoId);
    if (!endereco) throw notFound('Endereço');
    if (endereco.userId !== userId) throw forbidden();

    return {
      contato: { nome: user.nome, email: user.email, cpf: user.cpf, telefone: user.telefone },
      endereco: { enderecoId, cep: endereco.cep, rua: endereco.rua, numero: endereco.numero, complemento: endereco.complemento, bairro: endereco.bairro, cidade: endereco.cidade, estado: endereco.estado },
    };
  }

  if (!guest) throw new AppError('Informe seus dados para finalizar a compra', 422, 'GUEST_DATA_REQUIRED');

  return {
    contato: { nome: guest.nome, email: guest.email, cpf: guest.cpf, telefone: guest.telefone },
    endereco: { enderecoId: null, cep: guest.cep, rua: guest.rua, numero: guest.numero, complemento: guest.complemento, bairro: guest.bairro, cidade: guest.cidade, estado: guest.estado },
  };
}

export async function create(userId: string | null, cartOwner: CartOwner, { enderecoId, formaPagamento, parcelas = 1, cep, cupom, envioId = 'pac', creditCardToken, cartao, remoteIp, guest }: CreateOrderInput) {
  await siteConfig.preparar();
  const { contato, endereco } = await resolveContatoEEndereco(userId, { enderecoId, guest });

  const cart = await cartRepo.getByOwner(cartOwner);
  const items = cart.items.filter(i => i.product);
  if (!items.length) throw new AppError('Sua sacola está vazia', 422, 'EMPTY_CART');

  for (const i of items) {
    if (i.product.estoque < i.quantidade) {
      throw new AppError(`Estoque insuficiente: ${i.product.nome}`, 422, 'OUT_OF_STOCK');
    }
  }

  const base = pricing.resumo(items);
  const cotacao = await shipping.cotar(cep || endereco.cep, base.subtotal, {
    itens: items.map(i => ({ quantidade: i.quantidade, pesoGramas: i.product.pesoGramas })),
  });
  const opcao = cotacao.opcoes.find(o => o.id === envioId) || cotacao.opcoes[0];
  let frete = opcao.valor;
  let desconto = 0;
  let cupomCodigo: string | null = null;

  // O uso do cupom é incrementado DENTRO da transação, mais abaixo: fazê-lo aqui
  // consumia o cupom mesmo quando a criação do pedido falhava em seguida.
  let cupomId: string | null = null;
  if (cupom) {
    const r = await coupons.validar(cupom, { subtotal: base.subtotal, userId, frete });
    desconto = r.desconto;
    if (r.freteGratis) frete = 0;
    cupomCodigo = r.cupom.codigo;
    cupomId = r.cupom.id;
  }

  const resumo = pricing.resumo(items, { frete, desconto, formaPagamento });
  const total = formaPagamento === 'PIX' ? resumo.totalPix : resumo.total;

  const numero = await orderRepo.nextNumber();

  // Cria o pedido, baixa o estoque e limpa o carrinho atomicamente: se qualquer
  // passo falhar (ex: estoque mudou entre a checagem e agora), nada é persistido.
  const order = await prisma.$transaction(async (tx) => {
    const created = await orderRepo.create(
      {
        numero,
        userId,
        enderecoId: endereco.enderecoId,
        status: 'AGUARDANDO_PAGAMENTO',
        formaPagamento,
        parcelas: formaPagamento === 'CARTAO_CREDITO' ? parcelas : 1,
        subtotal: resumo.subtotal,
        frete: resumo.frete,
        desconto: resumo.desconto,
        total,
        cupomCodigo,
        transportadora: opcao.nome,
        // `contingencia` é um id interno da tabela de fallback, não um serviço do
        // Melhor Envio: gravá-lo faria a compra de etiqueta enviar um id inválido.
        envioServicoId: opcao.id === 'contingencia' ? null : opcao.id,
        codigoRastreio: null,
        guestNome: userId ? null : contato.nome,
        guestEmail: userId ? null : contato.email,
        guestTelefone: userId ? null : contato.telefone,
        guestCpf: userId ? null : contato.cpf,
        guestCep: userId ? null : endereco.cep,
        guestRua: userId ? null : endereco.rua,
        guestNumero: userId ? null : endereco.numero,
        guestComplemento: userId ? null : endereco.complemento,
        guestBairro: userId ? null : endereco.bairro,
        guestCidade: userId ? null : endereco.cidade,
        guestEstado: userId ? null : endereco.estado,
      },
      items.map(i => ({
        productId: i.productId,
        nomeProduto: i.product.nome,
        precoUnitario: pricing.precoEfetivo(i.product),
        quantidade: i.quantidade,
        tamanho: i.tamanho,
        subtotal: pricing.precoEfetivo(i.product) * i.quantidade,
      })),
      tx,
    );

    for (const i of items) {
      // A checagem `< 0` depois do decremento é o que impede venda de estoque
      // que outro checkout consumiu entre a validação e esta transação.
      const updated = await productRepo.decrementStock(i.productId, i.quantidade, tx);
      if (updated.estoque < 0) {
        throw new AppError(`Estoque insuficiente: ${i.product.nome}`, 422, 'OUT_OF_STOCK');
      }
    }

    if (cupomId) await couponRepo.incrementUse(cupomId, tx);
    if (cupomId && userId) await couponRepo.recordRedemption(cupomId, userId, created.id, tx);

    await cartRepo.clear(cartOwner, tx);
    return created;
  });

  // A chamada ao gateway fica fora da transação de banco (é uma chamada de rede externa).
  // Se falhar, compensamos manualmente: repõe estoque e marca o pedido como cancelado.
  let pagamento: Awaited<ReturnType<typeof payments.criarCobranca>>;
  try {
    pagamento = await payments.criarCobranca({
      order: { id: order.id, total: order.total, numero: order.numero },
      formaPagamento,
      parcelas,
      creditCardToken,
      cartao,
      remoteIp,
      user: { id: userId, nome: contato.nome, email: contato.email, cpf: contato.cpf, telefone: contato.telefone },
      endereco: { cep: endereco.cep, rua: endereco.rua, numero: endereco.numero, bairro: endereco.bairro, complemento: endereco.complemento },
    });
  } catch (err) {
    await prisma.$transaction(async (tx) => {
      for (const i of items) await productRepo.incrementStock(i.productId, i.quantidade, tx);
      await orderRepo.updateStatus(order.id, 'CANCELADO', 'Falha ao criar cobrança no gateway de pagamento', tx);
    });
    logger.error('Falha ao criar cobrança Asaas; pedido cancelado e estoque revertido', err, { orderId: order.id });
    throw err;
  }

  await orderRepo.setAsaasPayment(order.id, pagamento.asaasPaymentId as string, pagamento.asaasStatus as string);

  await email.enviarConfirmacaoPedido(contato.email, contato.nome, order.numero, order.items, order.total);

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

/** Estados em que o cliente ainda pode cancelar sozinho, sem falar com o suporte. */
const CANCELAVEL_PELO_CLIENTE: OrderStatus[] = ['AGUARDANDO_PAGAMENTO'];

/** Estados em que a mercadoria já saiu — cancelar vira troca/devolução, não cancelamento. */
const NAO_CANCELAVEL: OrderStatus[] = ['ENVIADO', 'ENTREGUE', 'CANCELADO'];

interface CancelarOpts {
  /** Quem pediu: o cliente (com restrições) ou o admin. */
  porAdmin?: boolean;
  /** userId de quem pediu — usado para checar posse quando não é admin. */
  userId?: string;
  motivo?: string;
  /**
   * Se deve devolver o dinheiro quando o pedido já foi pago. O admin decide caso
   * a caso: um cancelamento logístico (reenvio, troca) não estorna.
   */
  estornar?: boolean;
}

/**
 * Cancela um pedido de forma completa: repõe estoque, devolve o uso do cupom,
 * encerra a cobrança no Asaas e avisa o cliente.
 *
 * É o único caminho de cancelamento do sistema — webhook, admin e cliente passam
 * todos por aqui, para que nenhum deles esqueça de repor estoque.
 */
export async function cancelar(id: string, { porAdmin = false, userId, motivo, estornar = false }: CancelarOpts = {}) {
  const order = await orderRepo.findById(id);
  if (!order) throw notFound('Pedido');
  if (!porAdmin && order.userId !== userId) throw forbidden();

  if (order.status === 'CANCELADO') {
    throw new AppError('Este pedido já foi cancelado', 422, 'ORDER_ALREADY_CANCELLED');
  }
  if (porAdmin) {
    if (NAO_CANCELAVEL.includes(order.status)) {
      throw new AppError(
        'Pedido já enviado ou entregue: use o fluxo de troca/devolução',
        422,
        'ORDER_NOT_CANCELLABLE',
      );
    }
  } else if (!CANCELAVEL_PELO_CLIENTE.includes(order.status)) {
    throw new AppError(
      'Este pedido já está em preparação e não pode ser cancelado pelo site. Fale com nosso atendimento.',
      422,
      'ORDER_NOT_CANCELLABLE_BY_CUSTOMER',
    );
  }

  // Encerra a cobrança ANTES de mexer no banco: se o gateway falhar, o pedido
  // continua ativo e a operação pode ser repetida. Cancelar primeiro deixaria um
  // pedido cancelado com cobrança viva — o pior dos dois estados.
  let resultadoCobranca: payments.ResultadoEstorno | null = null;
  if (order.asaasPaymentId && (estornar || order.status === 'AGUARDANDO_PAGAMENTO')) {
    resultadoCobranca = await payments.encerrarCobranca(
      order.asaasPaymentId,
      motivo || `Cancelamento do pedido ${order.numero}`,
    );
  }

  const descricao = motivo
    ? `Pedido cancelado: ${motivo}`
    : 'Pedido cancelado';

  await prisma.$transaction(async (tx) => {
    // Releitura sob a transação: se outro fluxo (webhook, cron) cancelou nesse
    // meio-tempo, afeta 0 linhas e não repomos estoque duas vezes.
    const { count } = await tx.order.updateMany({
      where: { id, status: { not: 'CANCELADO' } },
      data: { status: 'CANCELADO' },
    });
    if (count === 0) throw new AppError('Este pedido já foi cancelado', 422, 'ORDER_ALREADY_CANCELLED');

    await tx.orderEvent.create({ data: { orderId: id, status: 'CANCELADO', descricao } });

    for (const item of order.items) {
      await productRepo.incrementStock(item.productId, item.quantidade, tx);
    }
    if (order.cupomCodigo) {
      await couponRepo.decrementUseByCode(order.cupomCodigo, tx);
      if (order.userId) await couponRepo.removeRedemptionByCode(order.cupomCodigo, order.userId, tx);
    }
  });

  const emailCancelamento = order.user?.email ?? order.guestEmail;
  const nomeCancelamento = order.user?.nome ?? order.guestNome;
  if (emailCancelamento) {
    await email.enviarPedidoCancelado(
      emailCancelamento,
      nomeCancelamento || '',
      order.numero,
      motivo,
      resultadoCobranca === 'ESTORNADO',
    );
  }

  logger.info('Pedido cancelado', { orderId: id, porAdmin, resultadoCobranca });

  return { id, status: 'CANCELADO' as OrderStatus, cobranca: resultadoCobranca };
}

interface UpdateStatusOpts {
  descricao?: string;
  motivo?: 'PAGAMENTO_CONFIRMADO';
  codigoRastreio?: string | null;
  transportadora?: string | null;
}

export async function updateStatus(id: string, status: OrderStatus, opts: UpdateStatusOpts = {}) {
  const { descricao, motivo, codigoRastreio, transportadora } = opts;

  if (!STATUS_FLOW.includes(status) && status !== 'CANCELADO') {
    throw new AppError('Status inválido', 422, 'INVALID_STATUS');
  }

  // Marcar como ENVIADO sem rastreio deixa o cliente sem como acompanhar a entrega,
  // então exigimos o código — a não ser que o pedido já tivesse um gravado.
  if (status === 'ENVIADO' && codigoRastreio === undefined) {
    const atual = await orderRepo.findById(id);
    if (!atual) throw notFound('Pedido');
    if (!atual.codigoRastreio) {
      throw new AppError('Informe o código de rastreio para marcar o pedido como enviado', 422, 'TRACKING_CODE_REQUIRED');
    }
  }

  const order = await orderRepo.updateStatus(id, status, descricao, undefined, { codigoRastreio, transportadora });
  if (!order) throw notFound('Pedido');

  const emailStatus = order.user?.email ?? order.guestEmail;
  const nomeStatus = order.user?.nome ?? order.guestNome ?? '';
  if (emailStatus) {
    if (motivo === 'PAGAMENTO_CONFIRMADO') {
      await email.enviarConfirmacaoPagamento(emailStatus, nomeStatus, order.numero);

      // Se esta confirmação tornou este o 1º pedido pago do cliente, envia o
      // cupom de "volte na 2ª compra" — convidado (sem userId) fica de fora,
      // não há como amarrar a regra de uso único sem conta.
      if (order.userId) {
        const pedidosPagos = await userRepo.countOrders(order.userId);
        if (pedidosPagos === 1) {
          const cupomVoltei = await couponRepo.findActiveComebackCoupon();
          if (cupomVoltei) await email.enviarCupomVoltei10(emailStatus, nomeStatus, cupomVoltei.codigo);
        }
      }
    } else {
      await email.enviarMudancaStatus(emailStatus, nomeStatus, order.numero, status, descricao, {
        codigoRastreio: order.codigoRastreio,
        transportadora: order.transportadora,
      });
    }
  }
  return order;
}
