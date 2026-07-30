import { NextRequest } from 'next/server';
import { resetSchema } from '@/lib/validation/schemas';
import { resetPassword } from '@/lib/services/auth.service';
import { ok } from '@/lib/http/envelope';
import { handleRouteError } from '@/lib/http/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const body = resetSchema.parse(await req.json());
    return ok(await resetPassword(body));
  } catch (err) {
    return handleRouteError(err);
  }
}
