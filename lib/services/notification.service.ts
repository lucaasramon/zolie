import { notificationRepo } from '@/lib/repositories/notification.repo';
import { notFound } from '@/lib/utils/errors';
import { NotificationType } from '@prisma/client';

interface CriarInput {
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  link?: string | null;
}

export const criar = (userId: string, data: CriarInput) => notificationRepo.create(userId, data);

export const criarBroadcast = (data: CriarInput) => notificationRepo.createManyForAllCustomers(data);

export const listarPorUsuario = (userId: string, pagination: { skip?: number; take?: number }) =>
  notificationRepo.listByUser(userId, pagination);

export const contarNaoLidas = (userId: string) => notificationRepo.countUnread(userId);

export async function marcarLida(id: string, userId: string) {
  const { count } = await notificationRepo.markRead(id, userId);
  if (count === 0) throw notFound('Notificação');
}

export const marcarTodasLidas = (userId: string) => notificationRepo.markAllRead(userId);

export const listarAdmin = (opts?: { take?: number }) => notificationRepo.listAllAdmin(opts);
