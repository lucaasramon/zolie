import { NextResponse } from 'next/server';

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status });
}

export function created<T>(data: T, meta?: Record<string, unknown>) {
  return ok(data, meta, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(status: number, message: string, code: string, issues?: unknown) {
  return NextResponse.json({ error: { message, code, issues } }, { status });
}
