import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

export interface JwtPayload {
  sub: string;
  role: 'CUSTOMER' | 'ADMIN';
  nome: string;
}

export function signToken(user: { id: string; role: string; nome: string }): string {
  return jwt.sign({ sub: user.id, role: user.role, nome: user.nome }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
}
