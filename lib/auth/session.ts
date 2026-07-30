import { cookies } from 'next/headers';
import { verifyToken, JwtPayload } from '@/lib/auth/jwt';

export async function getSession(): Promise<JwtPayload | null> {
  const store = await cookies();
  const token = store.get('zolie_token')?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
