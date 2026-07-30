import { ZodError } from 'zod';
import { AppError } from '@/lib/utils/errors';
import { env } from '@/lib/env';
import { fail } from '@/lib/http/envelope';

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(422, 'Dados inválidos', 'VALIDATION_ERROR', err.issues);
  }
  if (err instanceof AppError) {
    return fail(err.status, err.message, err.code);
  }
  console.error(err);
  const message = env.nodeEnv === 'production' ? 'Erro interno' : (err as Error)?.message || 'Erro interno';
  return fail(500, message, 'INTERNAL_ERROR');
}
