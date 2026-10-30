import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandling } from '@/lib/http/withAuth';
import { assertRateLimit } from '@/lib/http/rateLimit';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/utils/errors';
import { EventoSimulacao, prepararSimulacao } from '@/lib/services/simulacao.service';

// Análise + duas gerações de imagem + verificação (e às vezes uma correção) levam
// de 1 a 3 minutos. 300s é o teto da Vercel com Fluid Compute.
export const maxDuration = 300;

const bodySchema = z.object({
  productId: z.string().min(1),
  tamanho: z.string().max(60).nullable().optional(),
  personalizacao: z.unknown(),
});

// Cada simulação custa geração de imagem na OpenAI: limite por IP para evitar abuso.
export const POST = withErrorHandling(async (req) => {
  assertRateLimit(req, 'personalizacao:simulacao', { windowMs: 60 * 60_000, max: 6 });
  const body = bodySchema.parse(await req.json());
  const executar = await prepararSimulacao(body);

  // Uma linha JSON por evento, para as prévias chegarem à cliente durante a geração.
  // Com a resposta já aberta o status não muda mais, então a falha vira um evento.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enviar = (evento: EventoSimulacao) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(evento)}\n`));
        } catch {
          // A cliente fechou a página: a simulação termina sem ter para quem enviar.
        }
      };
      try {
        enviar({ tipo: 'concluida', ...(await executar(enviar)) });
      } catch (err) {
        if (!(err instanceof AppError)) logger.error('Falha ao concluir simulação de peça personalizada', err);
        enviar({
          tipo: 'erro',
          mensagem: err instanceof AppError ? err.message : 'Não conseguimos gerar a simulação agora. Tente de novo em instantes.',
        });
      }
      try {
        controller.close();
      } catch {
        // Já fechada pela desconexão da cliente.
      }
    },
  });

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' },
  });
});
