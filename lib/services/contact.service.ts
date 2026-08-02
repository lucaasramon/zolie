import { prisma } from '@/lib/prisma';
import * as email from '@/lib/services/email.service';
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
