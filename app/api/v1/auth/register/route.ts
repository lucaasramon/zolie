import { NextRequest } from 'next/server';
import { registerSchema } from '@/lib/validation/schemas';
import { register } from '@/lib/services/auth.service';
import { created } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());
    const result = await register(body);
    const res = created(result);
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
