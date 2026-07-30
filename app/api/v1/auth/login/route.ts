import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validation/schemas';
import { login } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const result = await login(body);
    const res = ok(result);
    res.cookies.set('zolie_token', result.token, {
      httpOnly: false,
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
