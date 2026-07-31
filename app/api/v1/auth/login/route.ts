import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validation/schemas';
import { login } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { GUEST_CART_COOKIE } from '@/lib/http/cartOwner';
import { cartRepo } from '@/lib/repositories/cart.repo';

export async function POST(req: NextRequest) {
  try {
    assertRateLimit(req, 'auth:login', { windowMs: 60_000, max: 5 });
    const body = loginSchema.parse(await req.json());
    const result = await login(body);

    const guestSessionId = req.cookies.get(GUEST_CART_COOKIE)?.value;
    if (guestSessionId) await cartRepo.mergeSessionIntoUser(guestSessionId, result.user.id);

    const res = ok(result);
    res.cookies.set('zolie_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    if (guestSessionId) res.cookies.delete(GUEST_CART_COOKIE);
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
