import { ReturnStatus, ReturnType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError, notFound, forbidden } from '@/lib/utils/errors';
import * as email from '@/lib/services/email.service';
import { logger } from '@/lib/logger';

/**
 * Trocas e devoluções de pedido JÁ ENTREGUE. Cancelamento de pedido em andamento
 * é outro fluxo (order.service.cancelar) — aqui a mercadoria está com o cliente.
 *
 * Prazo de 30 dias corridos após a entrega, conforme a política publicada em
 * /trocas e o art. 49 do CDC (que garante 7 dias; a loja oferece mais).
 */
export const PRAZO_DIAS = 30;

/** Só pedido entregue admite troca/devolução. */
const STATUS_ELEGIVEL = 'ENTREGUE';

function dataEntrega(events: { status: string; createdAt: Date }[]): Date | null {
  const entrega = events.filter(e => e.status === STATUS_ELEGIVEL).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return entrega?.createdAt ?? null;
}

export function diasDesdeEntrega(entregaEm: Date, agora = new Date()): number {
  return Math.floor((agora.getTime() - entregaEm.getTime()) / 86_400_000);
}

interface CriarInput {
  tipo: ReturnType;
  motivo: string;
  descricao?: string;
  imagens?: string[];
  itens?: { orderItemId: string; quantidade: number }[];
}

export async function criar(userId: string, orderId: string, dados: CriarInput) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, events: true, user: { select: { nome: true, email: true } } },
  });
  if (!order) throw notFound('Pedido');
  if (order.userId !== userId) throw forbidden();

  if (order.status !== STATUS_ELEGIVEL) {
    throw new AppError(
      'Só é possível solicitar troca ou devolução de pedidos já entregues. Pedidos a caminho podem ser cancelados em Meus Pedidos.',
      422,
      'ORDER_NOT_DELIVERED',
    );
  }

  const entregaEm = dataEntrega(order.events);
  if (entregaEm) {
    const dias = diasDesdeEntrega(entregaEm);
    if (dias > PRAZO_DIAS) {
      throw new AppError(
        `O prazo de ${PRAZO_DIAS} dias para troca ou devolução venceu (entrega há ${dias} dias).`,
        422,
        'RETURN_WINDOW_EXPIRED',
      );
    }
  }

  // Uma solicitação em aberto por vez, para não duplicar atendimento do mesmo caso.
  const emAberto = await prisma.returnRequest.findFirst({
    where: { orderId, status: { in: ['SOLICITADA', 'APROVADA', 'RECEBIDA'] } },
  });
  if (emAberto) {
    throw new AppError('Já existe uma solicitação em andamento para este pedido', 422, 'RETURN_ALREADY_OPEN');
  }

  // Itens vazios = pedido inteiro.
  const itensSolicitados = dados.itens?.length
    ? dados.itens
    : order.items.map(i => ({ orderItemId: i.id, quantidade: i.quantidade }));

  const idsValidos = new Set(order.items.map(i => i.id));
  for (const item of itensSolicitados) {
    if (!idsValidos.has(item.orderItemId)) {
      throw new AppError('Item não pertence a este pedido', 422, 'INVALID_ORDER_ITEM');
    }
  }

  const solicitacao = await prisma.returnRequest.create({
    data: {
      orderId,
      userId,
      tipo: dados.tipo,
      motivo: dados.motivo,
      descricao: dados.descricao,
      imagens: dados.imagens ?? [],
      items: { create: itensSolicitados },
    },
    include: { items: true },
  });

  if (order.user) {
    await email.enviarSolicitacaoTrocaRecebida(order.user.email, order.user.nome, order.numero, dados.tipo);
  }

  logger.info('Solicitação de troca/devolução criada', { returnId: solicitacao.id, orderId, tipo: dados.tipo });

  return solicitacao;
}

export const listarDoUsuario = (userId: string) =>
  prisma.returnRequest.findMany({
    where: { userId },
    include: { order: { select: { numero: true } } },
    orderBy: { createdAt: 'desc' },
  });

export const listarTodas = (status?: ReturnStatus) =>
  prisma.returnRequest.findMany({
    where: status ? { status } : {},
    include: {
      order: { select: { numero: true, total: true } },
      user: { select: { nome: true, email: true } },
      items: { include: { orderItem: { select: { nomeProduto: true, tamanho: true, acabamento: true } } } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

interface DecidirInput {
  status: ReturnStatus;
  respostaAdmin?: string;
  codigoReversa?: string;
}

export async function decidir(id: string, { status, respostaAdmin, codigoReversa }: DecidirInput) {
  const atual = await prisma.returnRequest.findUnique({
    where: { id },
    include: { order: { select: { numero: true } }, user: { select: { nome: true, email: true } } },
  });
  if (!atual) throw notFound('Solicitação');

  if (atual.status === 'CONCLUIDA' || atual.status === 'RECUSADA') {
    throw new AppError('Esta solicitação já foi encerrada', 422, 'RETURN_ALREADY_CLOSED');
  }

  const solicitacao = await prisma.returnRequest.update({
    where: { id },
    data: {
      status,
      ...(respostaAdmin !== undefined && { respostaAdmin }),
      ...(codigoReversa !== undefined && { codigoReversa }),
    },
  });

  // Avisa o cliente nas duas decisões que encerram a análise.
  if ((status === 'APROVADA' || status === 'RECUSADA') && atual.user) {
    await email.enviarRespostaTroca(
      atual.user.email,
      atual.user.nome,
      atual.order.numero,
      atual.tipo,
      status === 'APROVADA',
      respostaAdmin,
    );
  }

  logger.info('Solicitação de troca/devolução atualizada', { returnId: id, status });

  return solicitacao;
}
