import { z } from 'zod';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { simular } from '@/lib/services/simulacao.service';

// Análise + duas gerações de imagem + verificação (e às vezes uma correção) levam
// de 1 a 3 minutos. 300s é o teto da Vercel com Fluid Compute.
export const maxDuration = 300;

const bodySchema = z.object({
  productId: z.string().min(1),
  tamanho: z.string().max(60).nullable().optional(),
  personalizacao: z.unknown(),
});

// Cada simulação custa geração de imagem na OpenAI: limite por IP para evitar abuso.
export const POST = withErrorHandling(async (req) => {
  assertRateLimit(req, 'personalizacao:simulacao', { windowMs: 60 * 60_000, max: 6 });
  const body = bodySchema.parse(await req.json());
  return ok(await simular(body));
});
