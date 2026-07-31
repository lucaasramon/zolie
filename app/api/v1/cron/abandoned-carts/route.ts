import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { enviarLembretesDeCarrinhoAbandonado } from '@/lib/services/cartReminder.service';
import { ok, fail } from '@/lib/http/envelope';
import { logger } from '@/lib/logger';

// Endpoint acionado por um agendador externo (ex: Vercel Cron) uma vez por dia,
// não por um usuário autenticado — protegido por um secret compartilhado.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!env.cronSecret || authHeader !== `Bearer ${env.cronSecret}`) {
    return fail(401, 'Não autorizado', 'UNAUTHORIZED');
  }

  try {
    const resultado = await enviarLembretesDeCarrinhoAbandonado();
    return ok(resultado);
  } catch (err) {
    logger.error('Falha ao processar lembretes de carrinho abandonado', err);
    return fail(500, 'Erro ao processar lembretes', 'INTERNAL_ERROR');
  }
}
