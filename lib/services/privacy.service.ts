import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { AppError, notFound } from '@/lib/utils/errors';
import { logger } from '@/lib/logger';

/**
 * LGPD art. 18: o titular pode pedir os próprios dados e a exclusão da conta.
 *
 * A exclusão é uma ANONIMIZAÇÃO, não um DELETE: pedidos são documento fiscal e
 * precisam ser mantidos (Código Tributário, 5 anos). Removemos o que identifica
 * a pessoa e preservamos os valores e a numeração.
 */

/** Estados em que o pedido ainda está em curso e impede o encerramento da conta. */
const STATUS_EM_ANDAMENTO = ['AGUARDANDO_PAGAMENTO', 'PROCESSANDO', 'SEPARANDO', 'ENVIADO'] as const;

export async function exportarDados(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      orders: {
        include: { items: true, events: true, endereco: true },
        orderBy: { createdAt: 'desc' },
      },
      reviews: { include: { product: { select: { nome: true, slug: true } } } },
      wishlist: { include: { product: { select: { nome: true, slug: true } } } },
    },
  });
  if (!user) throw notFound('Usuário');

  // `senhaHash` e tokens de sessão nunca saem daqui, mesmo sendo dados do titular:
  // exportá-los criaria um vetor de vazamento sem qualquer utilidade para a pessoa.
  return {
    geradoEm: new Date().toISOString(),
    dadosPessoais: {
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      cpf: user.cpf,
      criadoEm: user.createdAt,
    },
    enderecos: user.addresses.map(a => ({
      apelido: a.apelido,
      cep: a.cep,
      rua: a.rua,
      numero: a.numero,
      complemento: a.complemento,
      bairro: a.bairro,
      cidade: a.cidade,
      estado: a.estado,
      principal: a.principal,
      removidoEm: a.deletedAt,
    })),
    pedidos: user.orders.map(o => ({
      numero: o.numero,
      status: o.status,
      formaPagamento: o.formaPagamento,
      subtotal: Number(o.subtotal),
      frete: Number(o.frete),
      desconto: Number(o.desconto),
      total: Number(o.total),
      cupom: o.cupomCodigo,
      transportadora: o.transportadora,
      codigoRastreio: o.codigoRastreio,
      notaFiscalChave: o.notaFiscalChave,
      criadoEm: o.createdAt,
      itens: o.items.map(i => ({
        produto: i.nomeProduto,
        quantidade: i.quantidade,
        tamanho: i.tamanho,
        acabamento: i.acabamento,
        precoUnitario: Number(i.precoUnitario),
        subtotal: Number(i.subtotal),
      })),
      historico: o.events.map(e => ({ status: e.status, descricao: e.descricao, data: e.createdAt })),
    })),
    avaliacoes: user.reviews.map(r => ({
      produto: r.product.nome,
      nota: r.nota,
      titulo: r.titulo,
      comentario: r.comentario,
      aprovado: r.aprovado,
      criadoEm: r.createdAt,
    })),
    favoritos: user.wishlist.map(w => ({ produto: w.product.nome, adicionadoEm: w.createdAt })),
  };
}

export async function excluirConta(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { orders: { select: { id: true, status: true, numero: true } } },
  });
  if (!user) throw notFound('Usuário');

  const emAndamento = user.orders.filter(o =>
    (STATUS_EM_ANDAMENTO as readonly string[]).includes(o.status),
  );
  if (emAndamento.length) {
    throw new AppError(
      `Você tem ${emAndamento.length} pedido(s) em andamento (${emAndamento.map(o => o.numero).join(', ')}). ` +
        'Aguarde a conclusão ou cancele antes de excluir a conta.',
      422,
      'PENDING_ORDERS',
    );
  }

  // Sufixo único mantém a unicidade de e-mail/CPF sem guardar o valor original.
  const marcador = randomUUID().slice(0, 8);

  await prisma.$transaction(async tx => {
    // Conteúdo livre é apagado: comentário de avaliação pode conter dado pessoal
    // e, ao contrário do pedido, não tem valor fiscal.
    await tx.productReview.deleteMany({ where: { userId } });
    await tx.wishlistItem.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    await tx.cart.deleteMany({ where: { userId } });

    // Endereços são anonimizados, não apagados: pedidos antigos os referenciam.
    await tx.address.updateMany({
      where: { userId },
      data: {
        apelido: null,
        rua: '[removido]',
        numero: '0',
        complemento: null,
        bairro: '[removido]',
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        nome: 'Conta removida',
        email: `removido+${marcador}@zolie.invalid`,
        cpf: null,
        telefone: null,
        senhaHash: randomUUID(),
        asaasCustomerId: null,
      },
    });
  });

  logger.info('Conta anonimizada a pedido do titular (LGPD)', { userId, pedidosPreservados: user.orders.length });

  return { anonimizado: true, pedidosPreservados: user.orders.length };
}
