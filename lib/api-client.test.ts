import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api-client';

function corpoEmPedacos(pedacos: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of pedacos) controller.enqueue(encoder.encode(p));
      controller.close();
    },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('api.stream', () => {
  it('monta eventos que chegam em pedaços, juntos ou com acento partido', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(corpoEmPedacos(['{"a":1}\n{"a"', ':2}\n', '{"a":"ç"}\n']))));

    const recebidos: unknown[] = [];
    await api.stream('/x', {}, e => recebidos.push(e));

    expect(recebidos).toEqual([{ a: 1 }, { a: 2 }, { a: 'ç' }]);
  });

  it('transforma resposta de erro em ApiError', async () => {
    const corpo = JSON.stringify({ error: { message: 'Limite', code: 'RATE_LIMITED' } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(corpo, { status: 429 })));

    const erro = await api.stream('/x', {}, () => {}).catch(e => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ status: 429, message: 'Limite' });
  });
});
