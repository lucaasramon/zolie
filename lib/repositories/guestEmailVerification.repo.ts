import { prisma } from '@/lib/prisma';

export const guestEmailVerificationRepo = {
  create: (email: string, token: string, expiresAt: Date) =>
    prisma.guestEmailVerification.create({ data: { email, token, expiresAt } }),

  /** Só para o próprio link de confirmação: precisa existir e não ter expirado. */
  findValidByToken: (token: string) =>
    prisma.guestEmailVerification.findFirst({ where: { token, expiresAt: { gt: new Date() } } }),

  confirm: (token: string) =>
    prisma.guestEmailVerification.update({ where: { token }, data: { confirmedAt: new Date() } }),

  /**
   * Usado no polling do checkout: uma vez confirmado, continua valendo mesmo que
   * `expiresAt` já tenha passado — o prazo é só para a janela de clicar no link,
   * não para o checkout inteiro (que pode continuar depois do link expirar).
   */
  findLatestConfirmed: (email: string) =>
    prisma.guestEmailVerification.findFirst({
      where: { email, confirmedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    }),
};
