import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('zolie_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL(`/login?next=${req.nextUrl.pathname}`, req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-nao-use-em-producao');
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  } catch {
    return NextResponse.redirect(new URL(`/login?next=${req.nextUrl.pathname}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
