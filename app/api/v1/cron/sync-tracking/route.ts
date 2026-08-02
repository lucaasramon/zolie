import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { sincronizarRastreiosPendentes } from '@/lib/services/melhorEnvio/trackingSync.service';
import { ok, fail } from '@/lib/http/envelope';
import { logger } from '@/lib/logger';

// Acionado por um agendador externo (ex: Vercel Cron), não por um usuário
// autenticado — protegido pelo mesmo secret compartilhado dos demais crons.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!env.cronSecret || authHeader !== `Bearer ${env.cronSecret}`) {
    return fail(401, 'Não autorizado', 'UNAUTHORIZED');
  }

  try {
    const resultado = await sincronizarRastreiosPendentes();
    return ok(resultado);
  } catch (err) {
    logger.error('Falha ao sincronizar rastreios do Melhor Envio', err);
    return fail(500, 'Erro ao sincronizar rastreios', 'INTERNAL_ERROR');
  }
}
