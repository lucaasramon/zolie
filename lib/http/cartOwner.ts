import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { JwtPayload } from '@/lib/auth/jwt';
import { CartOwner } from '@/lib/repositories/cart.repo';

export const GUEST_CART_COOKIE = 'zolie_guest_cart';

/** Dono do carrinho: usuário logado, ou sessão anônima identificada por cookie. */
export function resolveCartOwner(req: NextRequest, user: JwtPayload | null): { owner: CartOwner; newSessionId: string | null } {
  if (user) return { owner: { userId: user.sub }, newSessionId: null };

  const existing = req.cookies.get(GUEST_CART_COOKIE)?.value;
  if (existing) return { owner: { sessionId: existing }, newSessionId: null };

  const sessionId = randomUUID();
  return { owner: { sessionId }, newSessionId: sessionId };
}

export function withGuestCartCookie(res: NextResponse, newSessionId: string | null): NextResponse {
  if (newSessionId) {
    res.cookies.set(GUEST_CART_COOKIE, newSessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
