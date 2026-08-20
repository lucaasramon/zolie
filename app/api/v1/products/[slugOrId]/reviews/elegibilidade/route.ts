import { elegibilidade } from '@/lib/services/review.service';
import { ok } from '@/lib/http/envelope';
import { withOptionalAuth } from '@/lib/http/withAuth';

// Usado pelo ReviewForm para decidir se mostra o botão "Avaliar esta peça" —
// sem usuário logado, simplesmente não é elegível (sem erro).
export const GET = withOptionalAuth(async (_req, ctx, user) => {
  const { slugOrId } = await ctx.params;
  if (!user) return ok({ podeAvaliar: false, motivo: 'NOT_LOGGED_IN' });
  return ok(await elegibilidade(user.sub, slugOrId));
});
