import { notificationCreateSchema } from '@/lib/validation/schemas';
import * as notifications from '@/lib/services/notification.service';
import { userRepo } from '@/lib/repositories/user.repo';
import { notFound } from '@/lib/utils/errors';
import { created } from '@/lib/http/envelope';
import { withAdmin } from '@/lib/http/withAuth';

export const POST = withAdmin(async req => {
  const body = notificationCreateSchema.parse(await req.json());

  if ('broadcast' in body) {
    const result = await notifications.criarBroadcast({ tipo: 'ADMIN_MANUAL', titulo: body.titulo, mensagem: body.mensagem, link: body.link });
    return created(result);
  }

  const cliente = await userRepo.findById(body.userId);
  if (!cliente) throw notFound('Cliente');

  const notificacao = await notifications.criar(body.userId, {
    tipo: 'ADMIN_MANUAL',
    titulo: body.titulo,
    mensagem: body.mensagem,
    link: body.link,
  });
  return created(notificacao);
});
