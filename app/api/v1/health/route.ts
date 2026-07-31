import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ data: { status: 'ok', dataSource: 'postgres', checkedAt: new Date().toISOString() } });
  } catch (err) {
    logger.error('Health check falhou ao conectar no banco', err);
    return NextResponse.json(
      { data: { status: 'error', dataSource: 'postgres', checkedAt: new Date().toISOString() } },
      { status: 503 },
    );
  }
}
