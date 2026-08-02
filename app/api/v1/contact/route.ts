import { NextRequest } from 'next/server';
import { contactSchema } from '@/lib/validation/schemas';
import { registrar } from '@/lib/services/contact.service';
import { enviarConfirmacaoContato } from '@/lib/services/email.service';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { logger } from '@/lib/logger';

/** Formulário de contato — público, protegido por rate limit contra spam. */
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'contact:send', { windowMs: 10 * 60_000, max: 5 });

  const dados = contactSchema.parse(await req.json());
  const resultado = await registrar(dados);

  // Confirmação ao cliente é best-effort: a mensagem já está registrada.
  try {
    await enviarConfirmacaoContato(dados.email, dados.nome);
  } catch (err) {
    logger.error('Falha ao enviar confirmação de contato ao cliente', err);
  }

  return ok(resultado);
});
