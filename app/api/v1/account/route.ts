import { excluirConta } from '@/lib/services/privacy.service';
import { ok } from '@/lib/http/envelope';
import { withAuth } from '@/lib/http/withAuth';

/**
 * LGPD art. 18, VI — exclusão. A conta é anonimizada e não apagada: os pedidos
 * são documento fiscal com guarda obrigatória (ver privacy.service).
 */
export const DELETE = withAuth(async (_req, _ctx, user) => {
  const resultado = await excluirConta(user.sub);

  // Encerra a sessão: o token continuaria válido apontando para a conta anonimizada.
  const res = ok(resultado);
  res.cookies.set('zolie_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
});
