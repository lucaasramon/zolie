import { prisma } from '@/lib/prisma';
import * as email from '@/lib/services/email.service';
import * as notifications from '@/lib/services/notification.service';
import { userRepo } from '@/lib/repositories/user.repo';
import { notFound } from '@/lib/utils/errors';
import { logger } from '@/lib/logger';

interface ContatoInput {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  pedido?: string | null;
}

export async function registrar(dados: ContatoInput) {
  // Grava primeiro: se o e-mail falhar, a mensagem não se perde e continua
  // visível no admin. O inverso deixaria o cliente sem resposta e sem registro.
  const registro = await prisma.contactMessage.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      assunto: dados.assunto,
      mensagem: dados.mensagem,
      pedido: dados.pedido || null,
    },
  });

  try {
    await email.enviarMensagemContato(dados);
  } catch (err) {
    logger.error('Mensagem de contato salva, mas o e-mail de aviso falhou', err, {
      contactMessageId: registro.id,
    });
  }

  return { id: registro.id, recebida: true };
}

export const listar = (apenasPendentes = false) =>
  prisma.contactMessage.findMany({
    where: apenasPendentes ? { respondida: false } : {},
    orderBy: [{ respondida: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

export const marcarRespondida = (id: string, respondida: boolean) =>
  prisma.contactMessage.update({ where: { id }, data: { respondida } });

/**
 * Resposta do admin enviada dentro do sistema: grava o texto, envia por e-mail
 * ao remetente e, se existir uma conta cadastrada com aquele e-mail, cria
 * também uma notificação in-app. `ContactMessage` não tem `userId` (o
 * formulário é público, sem exigir login), então a conta é resolvida pelo
 * e-mail informado no momento da resposta.
 */
export async function responder(id: string, resposta: string) {
  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) throw notFound('Mensagem');

  const atualizado = await prisma.contactMessage.update({
    where: { id },
    data: { resposta, respondidaEm: new Date(), respondida: true },
  });

  try {
    await email.enviarRespostaContato(msg.email, msg.nome, msg.assunto, resposta);
  } catch (err) {
    logger.error('Resposta de contato salva, mas o e-mail falhou', err, { contactMessageId: id });
  }

  const user = await userRepo.findByEmail(msg.email);
  if (user) {
    try {
      await notifications.criar(user.id, {
        tipo: 'CONTATO_RESPONDIDO',
        titulo: 'Sua mensagem foi respondida',
        mensagem: resposta,
        link: '/conta/notificacoes',
      });
    } catch (err) {
      logger.error('Resposta de contato enviada, mas a notificação in-app falhou', err, { contactMessageId: id });
    }
  }

  return atualizado;
}
