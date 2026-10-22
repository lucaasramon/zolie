import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { enviarPedidosDeAvaliacao } from '@/lib/services/reviewRequest.service';
import { ok, fail } from '@/lib/http/envelope';
import { logger } from '@/lib/logger';

// Acionado uma vez por dia pelo Vercel Cron, protegido pelo mesmo secret dos demais crons.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!env.cronSecret || authHeader !== `Bearer ${env.cronSecret}`) {
    return fail(401, 'Não autorizado', 'UNAUTHORIZED');
  }

  try {
    return ok(await enviarPedidosDeAvaliacao());
  } catch (err) {
    logger.error('Falha ao processar pedidos de avaliação', err);
    return fail(500, 'Erro ao processar pedidos de avaliação', 'INTERNAL_ERROR');
  }
}

// A Vercel Cron chama a rota com GET (e envia o mesmo `Authorization: Bearer CRON_SECRET`);
// POST continua valendo para disparo manual.
export const GET = POST;
