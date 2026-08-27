import { NextRequest } from 'next/server';
import { consultoriaChatSchema } from '@/lib/validation/schemas';
import { chat } from '@/lib/services/consultoria.service';
import { ok } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

/**
 * Chat de consultoria de estilo via IA — público (funciona logada ou visitante),
 * stateless: o client reenvia o histórico completo a cada chamada.
 * Rate limit mais apertado que outras rotas públicas: cada mensagem custa uma
 * chamada à API da OpenAI.
 */
export const POST = withOptionalAuth(async req => {
  assertRateLimit(req as NextRequest, 'consultoria:chat', { windowMs: 5 * 60_000, max: 15 });

  const { messages } = consultoriaChatSchema.parse(await req.json());
  const resultado = await chat(messages);

  return ok(resultado);
});
