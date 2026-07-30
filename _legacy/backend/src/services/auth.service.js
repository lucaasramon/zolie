const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { repositories } = require('../repositories');
const { env } = require('../config/env');
const { AppError, unauthorized, conflict, notFound } = require('../utils/errors');

const publicUser = u => ({
  id: u.id, nome: u.nome, email: u.email, telefone: u.telefone, cpf: u.cpf, role: u.role, createdAt: u.createdAt
});

const signToken = u => jwt.sign({ sub: u.id, role: u.role, nome: u.nome }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

async function register({ nome, email, senha, telefone, cpf }) {
  if (await repositories.users.findByEmail(email)) throw conflict('Este e-mail já tem conta na Zoliê');
  const senhaHash = await bcrypt.hash(senha, env.bcryptRounds);
  const user = await repositories.users.create({ nome, email, senhaHash, telefone, cpf });
  return { user: publicUser(user), token: signToken(user) };
}

async function login({ email, senha }) {
  const user = await repositories.users.findByEmail(email);
  if (!user) throw unauthorized();
  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) throw unauthorized();
  return { user: publicUser(user), token: signToken(user) };
}

async function adminLogin(credentials) {
  const result = await login(credentials);
  if (result.user.role !== 'ADMIN') throw unauthorized('Esta conta não tem acesso administrativo');
  return result;
}

async function me(userId) {
  const user = await repositories.users.findById(userId);
  if (!user) throw notFound('Usuário');
  return publicUser(user);
}

async function forgotPassword(email) {
  const user = await repositories.users.findByEmail(email);
  // resposta sempre igual, para não revelar quais e-mails existem
  if (!user) return { enviado: true };
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + env.resetTokenTtlMinutes * 60000);
  await repositories.users.createResetToken(user.id, token, expiresAt);
  // TODO: enviar e-mail de verdade (MAIL_PROVIDER). Em dev devolvemos o token.
  return { enviado: true, tokenDev: env.nodeEnv === 'development' ? token : undefined };
}

async function resetPassword({ token, novaSenha }) {
  const record = await repositories.users.findResetToken(token);
  if (!record) throw new AppError('Token inválido ou expirado', 410, 'RESET_TOKEN_INVALID');
  const senhaHash = await bcrypt.hash(novaSenha, env.bcryptRounds);
  await repositories.users.update(record.userId, { senhaHash });
  await repositories.users.consumeResetToken(token);
  return { alterado: true };
}

async function updateProfile(userId, data) {
  const user = await repositories.users.update(userId, data);
  if (!user) throw notFound('Usuário');
  return publicUser(user);
}

module.exports = { register, login, adminLogin, me, forgotPassword, resetPassword, updateProfile, publicUser };
