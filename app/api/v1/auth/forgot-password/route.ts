import { NextRequest } from 'next/server';
import { forgotSchema } from '@/lib/validation/schemas';
import { forgotPassword } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const { email } = forgotSchema.parse(await req.json());
    return ok(await forgotPassword(email));
  } catch (err) {
    return handleRouteError(err);
  }
}
