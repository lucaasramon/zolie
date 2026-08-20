import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus, PaymentMethod, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

export const orderRepo = {
  create: (order: Prisma.OrderUncheckedCreateInput, items: Prisma.OrderItemCreateManyOrderInput[], db: Db = prisma) =>
    db.order.create({
      data: {
        ...order,
        items: { create: items },
        events: { create: { status: order.status as OrderStatus, descricao: 'Pedido criado' } },
      },
      include: { items: true, events: true, endereco: true },
    }),
  /** Usado para liberar avaliação: só quem já recebeu o produto pode avaliá-lo. */
  hasDeliveredItem: async (userId: string, productId: string) => {
    const count = await prisma.orderItem.count({
      where: { productId, order: { userId, status: 'ENTREGUE' } },
    });
    return count > 0;
  },
  listByUser: async (userId: string, { skip = 0, take = 10 }: { skip?: number; take?: number } = {}) => {
    const [total, items] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' }, include: { items: true } }),
    ]);
    return { total, items };
  },
  /** Pedidos de convidado (sem conta) pelo e-mail — usado no acesso público via token. */
  listByGuestEmail: async (email: string, { skip = 0, take = 10 }: { skip?: number; take?: number } = {}) => {
    const [total, items] = await Promise.all([
      prisma.order.count({ where: { userId: null, guestEmail: email } }),
      prisma.order.findMany({
        where: { userId: null, guestEmail: email },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
    ]);
    return { total, items };
  },
  listAll: async ({ skip = 0, take = 20, status }: { skip?: number; take?: number; status?: string | OrderStatus[] } = {}) => {
    const where = !status
      ? {}
      : Array.isArray(status)
        ? { status: { in: status } }
        : { status: status as OrderStatus };
    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: true, user: { select: { nome: true, email: true } } },
      }),
    ]);
    return { total, items };
  },
  findById: (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: {
        // A imagem do produto não faz parte do snapshot do pedido (que preserva
        // nome/preço da época da compra) — é buscada ao vivo do produto atual,
        // então reflete a foto de capa mais recente, não a de quando foi comprado.
        items: { include: { product: { select: { slug: true, imagens: true } } } },
        events: true,
        endereco: true,
        user: { select: { nome: true, email: true, telefone: true, cpf: true } },
        returnRequests: {
          select: { id: true, tipo: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
  updateStatus: (
    id: string,
    status: OrderStatus,
    descricao?: string,
    db: Db = prisma,
    rastreio?: { codigoRastreio?: string | null; transportadora?: string | null },
  ) =>
    db.order.update({
      where: { id },
      // Só entram no update os campos de rastreio realmente enviados: `undefined`
      // preserva o valor atual, `null` limpa.
      data: {
        status,
        ...(rastreio?.codigoRastreio !== undefined && { codigoRastreio: rastreio.codigoRastreio }),
        ...(rastreio?.transportadora !== undefined && { transportadora: rastreio.transportadora }),
        events: { create: { status, descricao } },
      },
      include: { items: true, events: true, user: { select: { nome: true, email: true } } },
    }),
  setAsaasPayment: (id: string, asaasPaymentId: string, asaasStatus: string) =>
    prisma.order.update({ where: { id }, data: { asaasPaymentId, asaasStatus } }),
  setNotaFiscal: (
    id: string,
    dados: { notaFiscalUrl?: string | null; notaFiscalChave?: string | null; notaFiscalNumero?: string | null },
  ) =>
    prisma.order.update({
      where: { id },
      // `undefined` preserva o valor atual; `null` limpa.
      data: {
        ...(dados.notaFiscalUrl !== undefined && { notaFiscalUrl: dados.notaFiscalUrl }),
        ...(dados.notaFiscalChave !== undefined && { notaFiscalChave: dados.notaFiscalChave }),
        ...(dados.notaFiscalNumero !== undefined && { notaFiscalNumero: dados.notaFiscalNumero }),
      },
    }),
  setMelhorEnvioId: (id: string, melhorEnvioId: string) =>
    prisma.order.update({ where: { id }, data: { melhorEnvioId } }),
  setEtiquetaUrl: (id: string, etiquetaUrl: string) =>
    prisma.order.update({ where: { id }, data: { etiquetaUrl } }),
  setRastreio: (id: string, codigoRastreio: string, transportadora?: string | null) =>
    prisma.order.update({
      where: { id },
      data: { codigoRastreio, ...(transportadora && { transportadora }) },
    }),
  /** Pedidos com etiqueta comprada mas rastreio ainda não emitido pelo Melhor Envio. */
  findAguardandoRastreio: () =>
    prisma.order.findMany({
      where: { melhorEnvioId: { not: null }, codigoRastreio: null, status: { not: 'CANCELADO' } },
      select: { id: true, melhorEnvioId: true },
    }),
  findByAsaasPaymentId: (asaasPaymentId: string) =>
    prisma.order.findUnique({ where: { asaasPaymentId } }),
  /**
   * Busca por número + e-mail do titular (conta ou convidado) — usada pela
   * consulta pública de status de pagamento (sem autenticação), então o e-mail
   * funciona como segredo compartilhado: impede que alguém descubra o status de
   * outro pedido só incrementando o número sequencial.
   */
  findByNumeroAndEmail: (numero: string, email: string) =>
    prisma.order.findFirst({
      where: {
        numero,
        OR: [{ user: { email } }, { guestEmail: email }],
      },
      select: { status: true, asaasStatus: true, formaPagamento: true },
    }),
  updateAsaasStatus: (id: string, asaasStatus: string) =>
    prisma.order.update({ where: { id }, data: { asaasStatus } }),
  /**
   * Número do pedido via sequence do Postgres. O `COUNT(*)` anterior fazia dois
   * checkouts simultâneos gerarem o mesmo número, e o `@unique` derrubava a
   * segunda compra — falha que só aparecia sob carga.
   */
  nextNumber: async (db: Db = prisma) => {
    const [{ numero }] = await db.$queryRaw<{ numero: bigint }[]>`SELECT nextval('order_number_seq') AS numero`;
    return `ZL-${numero}`;
  },
  /**
   * Pedidos ainda aguardando pagamento cujo prazo já venceu. O limite é por forma
   * de pagamento porque o `dueDate` enviado ao Asaas também é (ver payment.service).
   */
  findExpired: (limites: { formaPagamento: PaymentMethod; antesDe: Date }[]) =>
    prisma.order.findMany({
      where: {
        status: 'AGUARDANDO_PAGAMENTO',
        OR: limites.map(l => ({ formaPagamento: l.formaPagamento, createdAt: { lt: l.antesDe } })),
      },
      include: { items: true, user: { select: { nome: true, email: true } } },
    }),
  salesSummary: async () => {
    const agg = await prisma.order.aggregate({
      where: { status: { not: 'CANCELADO' } },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    });
    return {
      pedidos: agg._count,
      faturamento: Number(agg._sum.total || 0),
      ticketMedio: Number(agg._avg.total || 0),
    };
  },
  salesByDay: async (days = 7) => {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);
    const rows = await prisma.$queryRaw<{ dia: Date; total: Prisma.Decimal }[]>`
      SELECT date_trunc('day', "created_at") AS dia, SUM("total") AS total
      FROM "orders"
      WHERE "created_at" >= ${since} AND "status" != 'CANCELADO'
      GROUP BY dia
      ORDER BY dia ASC
    `;
    return rows.map(r => ({ dia: r.dia, total: Number(r.total) }));
  },
};
