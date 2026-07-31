import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { userRepo } from '@/lib/repositories/user.repo';
import { env } from '@/lib/env';
import { AppError, unauthorized, conflict, notFound } from '@/lib/utils/errors';
import { signToken } from '@/lib/auth/jwt';
import { enviarRecuperacaoSenha, enviarVerificacaoEmail } from '@/lib/services/email.service';

export function publicUser(u: any) {
  return { id: u.id, nome: u.nome, email: u.email, telefone: u.telefone, cpf: u.cpf, role: u.role, emailVerified: u.emailVerified, createdAt: u.createdAt };
}

export async function register({ nome, email, senha, telefone, cpf }: { nome: string; email: string; senha: string; telefone?: string; cpf?: string }) {
  if (await userRepo.findByEmail(email)) throw conflict('Este e-mail já tem conta na Zoliê');
  const senhaHash = await bcrypt.hash(senha, env.bcryptRounds);
  const user = await userRepo.create({ nome, email, senhaHash, telefone, cpf });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60000);
  await userRepo.createVerificationToken(user.id, token, expiresAt);
  await enviarVerificacaoEmail(user.email, user.nome, token);

  return { user: publicUser(user), token: signToken(user) };
}

export async function verifyEmail(token: string) {
  const record = await userRepo.findVerificationToken(token);
  if (!record) throw new AppError('Token inválido ou expirado', 410, 'VERIFICATION_TOKEN_INVALID');
  await userRepo.markEmailVerified(record.userId);
  await userRepo.consumeVerificationToken(token);
  return { verificado: true };
}

export async function resendVerification(userId: string) {
  const user = await userRepo.findById(userId);
  if (!user) throw notFound('Usuário');
  if (user.emailVerified) return { enviado: false, jaVerificado: true };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60000);
  await userRepo.createVerificationToken(user.id, token, expiresAt);
  await enviarVerificacaoEmail(user.email, user.nome, token);
  return { enviado: true };
}

export async function login({ email, senha }: { email: string; senha: string }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw unauthorized();
  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) throw unauthorized();
  return { user: publicUser(user), token: signToken(user) };
}

export async function adminLogin(credentials: { email: string; senha: string }) {
  const result = await login(credentials);
  if (result.user.role !== 'ADMIN') throw unauthorized('Esta conta não tem acesso administrativo');
  return result;
}

export async function me(userId: string) {
  const user = await userRepo.findById(userId);
  if (!user) throw notFound('Usuário');
  return publicUser(user);
}

export async function forgotPassword(email: string) {
  const user = await userRepo.findByEmail(email);
  // resposta sempre igual, para não revelar quais e-mails existem
  if (!user) return { enviado: true };
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + env.resetTokenTtlMinutes * 60000);
  await userRepo.createResetToken(user.id, token, expiresAt);
  await enviarRecuperacaoSenha(user.email, user.nome, token);
  return { enviado: true, tokenDev: env.nodeEnv === 'development' ? token : undefined };
}

export async function resetPassword({ token, novaSenha }: { token: string; novaSenha: string }) {
  const record = await userRepo.findResetToken(token);
  if (!record) throw new AppError('Token inválido ou expirado', 410, 'RESET_TOKEN_INVALID');
  const senhaHash = await bcrypt.hash(novaSenha, env.bcryptRounds);
  await userRepo.update(record.userId, { senhaHash });
  await userRepo.consumeResetToken(token);
  return { alterado: true };
}

export async function updateProfile(userId: string, data: { nome?: string; telefone?: string; cpf?: string }) {
  const user = await userRepo.update(userId, data);
  if (!user) throw notFound('Usuário');
  return publicUser(user);
}
