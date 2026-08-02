import { NextResponse } from 'next/server';
import { exportarDados } from '@/lib/services/privacy.service';
import { withAuth } from '@/lib/http/withAuth';

/** LGPD art. 18, II — portabilidade: devolve os dados do titular como JSON para download. */
export const GET = withAuth(async (_req, _ctx, user) => {
  const dados = await exportarDados(user.sub);
  const arquivo = `zolie-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${arquivo}"`,
      // Dados pessoais nunca devem ficar em cache de CDN ou navegador.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
});
