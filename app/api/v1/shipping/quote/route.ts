import { z } from 'zod';
import * as shipping from '@/lib/services/shipping.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';

const quoteSchema = z.object({ cep: z.string().min(8), subtotal: z.number().min(0).optional() });

export const POST = withErrorHandling(async req => {
  const { cep, subtotal } = quoteSchema.parse(await req.json());
  return ok(await shipping.cotar(cep, subtotal ?? 0));
});
