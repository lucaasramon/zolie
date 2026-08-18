import { NextRequest } from 'next/server';
import { z } from 'zod';
import { userRepo } from '@/lib/repositories/user.repo';
import { ok } from '@/lib/http/envelope';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';

const querySchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.string().email()) });

// Usado no checkout de convidado para avisar antes da compra que aquele e-mail
// já tem conta, em vez do cliente só descobrir isso num erro depois de pagar.
export const GET = withErrorHandling(async (req: NextRequest) => {
  assertRateLimit(req, 'auth:check-email', { windowMs: 60_000, max: 20 });
  const { email } = querySchema.parse({ email: req.nextUrl.searchParams.get('email') ?? '' });
  const user = await userRepo.findByEmail(email);
  return ok({ exists: Boolean(user) });
});
