import { randomUUID } from 'crypto';
import { guestEmailVerificationRepo } from '@/lib/repositories/guestEmailVerification.repo';
import { userRepo } from '@/lib/repositories/user.repo';
import { enviarConfirmacaoEmailConvidado } from '@/lib/services/email.service';
import { AppError } from '@/lib/utils/errors';

// Curto de propósito: essa confirmação existe só para segurar a etapa 1 do
// checkout enquanto o convidado confirma o e-mail, não para durar dias como o
// token de verificação de conta.
const TTL_MINUTES = 60;

export async function enviar(emailBruto: string) {
  const email = emailBruto.trim().toLowerCase();

  // Convidado com e-mail que já tem conta usa o fluxo de login, não este —
  // criar um token aqui só confundiria (e vazaria e-mail pra quem não é dono).
  if (await userRepo.findByEmail(email)) {
    throw new AppError('Este e-mail já tem uma conta na Zoliê', 409, 'EMAIL_HAS_ACCOUNT');
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000);
  await guestEmailVerificationRepo.create(email, token, expiresAt);
  await enviarConfirmacaoEmailConvidado(email, token);
  return { enviado: true };
}

export async function confirmar(token: string) {
  const record = await guestEmailVerificationRepo.findValidByToken(token);
  if (!record) throw new AppError('Link inválido ou expirado', 410, 'GUEST_EMAIL_TOKEN_INVALID');
  await guestEmailVerificationRepo.confirm(token);
  return { confirmado: true, email: record.email };
}

export async function status(emailBruto: string) {
  const email = emailBruto.trim().toLowerCase();
  const record = await guestEmailVerificationRepo.findLatestConfirmed(email);
  return { confirmado: Boolean(record) };
}
