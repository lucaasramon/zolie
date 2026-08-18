import { NextRequest } from 'next/server';
import { z } from 'zod';
import { email } from '@/lib/validation/schemas';
import { statusPublico } from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

const querySchema = z.object({ numero: z.string().trim().min(1), email });

// Usado pela tela de sucesso do checkout (Pix/boleto) para saber, sem login,
// quando o pagamento foi confirmado e trocar a tela sozinha via polling. O
// e-mail funciona como segredo compartilhado: sem ele, dava pra descobrir o
// status de qualquer pedido só incrementando o número sequencial na URL.
export const GET = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'orders:status-publico', { windowMs: 60_000, max: 30 });
  const { numero, email } = querySchema.parse({
    numero: req.nextUrl.searchParams.get('numero') ?? '',
    email: req.nextUrl.searchParams.get('email') ?? '',
  });
  return ok(await statusPublico(numero, email));
});
