import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validation/schemas';
import { adminLogin } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';
import { assertRateLimit } from '@/lib/http/rateLimit';

export async function POST(req: NextRequest) {
  try {
    assertRateLimit(req, 'auth:admin-login', { windowMs: 60_000, max: 5 });
    const body = loginSchema.parse(await req.json());
    const result = await adminLogin(body);
    const res = ok(result);
    res.cookies.set('zolie_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
