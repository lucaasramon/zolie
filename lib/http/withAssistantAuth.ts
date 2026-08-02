import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { unauthorized } from '@/lib/utils/errors';
import { handleRouteError } from '@/lib/http/errorHandler';

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>;

function isValidKey(expected: string, received: string | null): boolean {
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  // Comparação em tempo constante: mesmo padrão do token de webhook do Asaas
  // (asaasWebhook.logic.ts) — evita vazar a chave por diferença de timing.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Protege as rotas /api/v1/assistant/* consumidas pelo bot de atendimento
 * (n8n). Chave fixa via header `x-assistant-key`, não o JWT de usuário: quem
 * chama é uma automação server-to-server, não uma sessão de cliente.
 */
export function withAssistantAuth(handler: Handler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      const received = req.headers.get('x-assistant-key');
      if (!isValidKey(env.assistantApiKey, received)) {
        throw unauthorized('Chave do assistente ausente ou inválida');
      }
      return await handler(req, ctx);
    } catch (err) {
      return handleRouteError(err);
    }
  };
}
