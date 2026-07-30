import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from '@/lib/auth/jwt';
import { unauthorized, forbidden } from '@/lib/utils/errors';
import { handleRouteError } from '@/lib/http/errorHandler';

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: NextRequest, ctx: RouteContext, user: JwtPayload) => Promise<NextResponse>;
type OptionalHandler = (req: NextRequest, ctx: RouteContext, user: JwtPayload | null) => Promise<NextResponse>;
type PublicHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>;

function extractToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  const cookieToken = req.cookies.get('zolie_token')?.value;
  return cookieToken || null;
}

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      const token = extractToken(req);
      if (!token) throw unauthorized('Token ausente');
      let user: JwtPayload;
      try {
        user = verifyToken(token);
      } catch {
        throw unauthorized('Token inválido ou expirado');
      }
      return await handler(req, ctx, user);
    } catch (err) {
      return handleRouteError(err);
    }
  };
}

export function withOptionalAuth(handler: OptionalHandler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      const token = extractToken(req);
      let user: JwtPayload | null = null;
      if (token) {
        try {
          user = verifyToken(token);
        } catch {
          user = null;
        }
      }
      return await handler(req, ctx, user);
    } catch (err) {
      return handleRouteError(err);
    }
  };
}

export function withAdmin(handler: Handler) {
  return withAuth(async (req, ctx, user) => {
    if (user.role !== 'ADMIN') throw forbidden('Rota exclusiva de administrador');
    return handler(req, ctx, user);
  });
}

export function withErrorHandling(handler: PublicHandler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return handleRouteError(err);
    }
  };
}
