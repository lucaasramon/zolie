import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

interface NotificationInput {
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  link?: string | null;
}

export const notificationRepo = {
  create: (userId: string, data: NotificationInput) =>
    prisma.notification.create({ data: { userId, ...data } }),
  createManyForAllCustomers: async (data: NotificationInput) => {
    const clientes = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true } });
    if (clientes.length === 0) return { count: 0 };
    return prisma.notification.createMany({
      data: clientes.map(c => ({ userId: c.id, ...data })),
    });
  },
  listByUser: async (userId: string, { skip = 0, take = 20 }: { skip?: number; take?: number } = {}) => {
    const [total, items] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, items };
  },
  countUnread: (userId: string) => prisma.notification.count({ where: { userId, lida: false } }),
  markRead: (id: string, userId: string) =>
    prisma.notification.updateMany({ where: { id, userId }, data: { lida: true } }),
  markAllRead: (userId: string) =>
    prisma.notification.updateMany({ where: { userId, lida: false }, data: { lida: true } }),
  /** Últimas notificações manuais enviadas pelo admin — tela /admin/notificacoes. */
  listAllAdmin: ({ take = 50 }: { take?: number } = {}) =>
    prisma.notification.findMany({
      where: { tipo: 'ADMIN_MANUAL' },
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nome: true, email: true } } },
    }),
};
