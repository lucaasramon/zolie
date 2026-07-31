import { NextRequest } from 'next/server';
import { registerSchema } from '@/lib/validation/schemas';
import { register } from '@/lib/services/auth.service';
import { created } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { GUEST_CART_COOKIE } from '@/lib/http/cartOwner';
import { cartRepo } from '@/lib/repositories/cart.repo';

export async function POST(req: NextRequest) {
  try {
    assertRateLimit(req, 'auth:register', { windowMs: 60_000, max: 5 });
    const body = registerSchema.parse(await req.json());
    const result = await register(body);

    const guestSessionId = req.cookies.get(GUEST_CART_COOKIE)?.value;
    if (guestSessionId) await cartRepo.mergeSessionIntoUser(guestSessionId, result.user.id);

    const res = created(result);
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
