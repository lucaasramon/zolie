import { prisma } from '@/lib/prisma';

export const userRepo = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  create: (data: { nome: string; email: string; senhaHash: string; telefone?: string; cpf?: string }) =>
    prisma.user.create({ data: { ...data, email: data.email.toLowerCase() } }),
  update: (id: string, data: Partial<{ nome: string; telefone: string; cpf: string; senhaHash: string; asaasCustomerId: string }>) =>
    prisma.user.update({ where: { id }, data }),
  countOrders: (userId: string) => prisma.order.count({ where: { userId } }),
  createResetToken: (userId: string, token: string, expiresAt: Date) =>
    prisma.passwordResetToken.create({ data: { userId, token, expiresAt } }),
  findResetToken: (token: string) =>
    prisma.passwordResetToken.findFirst({ where: { token, usedAt: null, expiresAt: { gt: new Date() } } }),
  consumeResetToken: (token: string) =>
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  listAll: async ({ skip = 0, take = 20 }: { skip?: number; take?: number } = {}) => {
    const [total, items] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, items };
  },
};
