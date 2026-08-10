import { prisma } from '@/lib/prisma';

export const userRepo = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  findByCpf: (cpf: string) => prisma.user.findUnique({ where: { cpf } }),
  create: (data: { nome: string; email: string; senhaHash: string; telefone?: string; cpf?: string }) =>
    prisma.user.create({ data: { ...data, email: data.email.toLowerCase() } }),
  update: (id: string, data: Partial<{ nome: string; telefone: string; cpf: string; senhaHash: string; asaasCustomerId: string }>) =>
    prisma.user.update({ where: { id }, data }),
  /** Só pedidos pagos (exclui aguardando pagamento e cancelados) — usado para
   * decidir se é a 1ª/2ª compra do cliente em regras de cupom. */
  countOrders: (userId: string) =>
    prisma.order.count({ where: { userId, status: { notIn: ['AGUARDANDO_PAGAMENTO', 'CANCELADO'] } } }),
  createResetToken: (userId: string, token: string, expiresAt: Date) =>
    prisma.passwordResetToken.create({ data: { userId, token, expiresAt } }),
  findResetToken: (token: string) =>
    prisma.passwordResetToken.findFirst({ where: { token, usedAt: null, expiresAt: { gt: new Date() } } }),
  consumeResetToken: (token: string) =>
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  createVerificationToken: (userId: string, token: string, expiresAt: Date) =>
    prisma.emailVerificationToken.create({ data: { userId, token, expiresAt } }),
  findVerificationToken: (token: string) =>
    prisma.emailVerificationToken.findFirst({ where: { token, usedAt: null, expiresAt: { gt: new Date() } } }),
  consumeVerificationToken: (token: string) =>
    prisma.emailVerificationToken.update({ where: { token }, data: { usedAt: new Date() } }),
  markEmailVerified: (id: string) => prisma.user.update({ where: { id }, data: { emailVerified: true } }),
  listAll: async ({ skip = 0, take = 20 }: { skip?: number; take?: number } = {}) => {
    const [total, items] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, items };
  },
};
