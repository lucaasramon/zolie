import { prisma } from '@/lib/prisma';

export const guestOrderAccessRepo = {
  findByEmail: (email: string) => prisma.guestOrderAccess.findUnique({ where: { email } }),

  findByToken: (token: string) => prisma.guestOrderAccess.findUnique({ where: { token } }),

  create: (email: string, token: string) => prisma.guestOrderAccess.create({ data: { email, token } }),
};
