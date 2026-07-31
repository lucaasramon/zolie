import { ok } from '@/lib/http/envelope';

export async function POST() {
  const res = ok({ loggedOut: true });
  res.cookies.set('zolie_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
