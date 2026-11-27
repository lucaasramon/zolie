import { NextRequest } from 'next/server';
import { z } from 'zod';
import { email } from '@/lib/validation/schemas';
import { cpfValido, normalizarCpf } from '@/lib/utils/cpf';
import { statusPublico } from '@/lib/services/order.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

const querySchema = z
  .object({
    numero: z.string().trim().min(1),
    email: email.optional(),
    cpf: z.string().transform(normalizarCpf).refine(cpfValido, 'CPF inválido').optional(),
  })
  .refine(q => q.email || q.cpf, { message: 'Informe o e-mail ou o CPF do pedido', path: ['email'] });

// Usado pela tela de sucesso do checkout (Pix/boleto) para saber, sem login,
// quando o pagamento foi confirmado e trocar a tela sozinha via polling. O
// e-mail funciona como segredo compartilhado: sem ele, dava pra descobrir o
// status de qualquer pedido só incrementando o número sequencial na URL. Na
// retirada o e-mail é opcional, então o CPF da cliente cumpre o mesmo papel.
export const GET = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'orders:status-publico', { windowMs: 60_000, max: 30 });
  const sp = req.nextUrl.searchParams;
  const { numero, email, cpf } = querySchema.parse({
    numero: sp.get('numero') ?? '',
    email: sp.get('email') || undefined,
    cpf: sp.get('cpf') || undefined,
  });
  return ok(await statusPublico(numero, { email, cpf }));
});
