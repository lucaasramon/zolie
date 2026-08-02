import { describe, expect, it, vi } from 'vitest';

// isValidKey não é exportada de propósito (só a rota deve usá-la), então o
// teste exercita o comportamento observável via um handler fake.
vi.mock('@/lib/env', () => ({ env: { assistantApiKey: 'chave-secreta-123' } }));

const { withAssistantAuth } = await import('./withAssistantAuth');

function reqCom(header: string | null) {
  return {
    headers: { get: (k: string) => (k === 'x-assistant-key' ? header : null) },
  } as any;
}

describe('withAssistantAuth', () => {
  it('rejeita quando a chave não é enviada', async () => {
    const handler = withAssistantAuth(async () => new Response('ok') as any);
    const res = await handler(reqCom(null), {} as any);
    expect(res.status).toBe(401);
  });

  it('rejeita chave errada', async () => {
    const handler = withAssistantAuth(async () => new Response('ok') as any);
    const res = await handler(reqCom('chave-errada'), {} as any);
    expect(res.status).toBe(401);
  });

  it('rejeita chave de tamanho diferente sem lançar', async () => {
    const handler = withAssistantAuth(async () => new Response('ok') as any);
    const res = await handler(reqCom('curta'), {} as any);
    expect(res.status).toBe(401);
  });

  it('aceita a chave correta e chama o handler', async () => {
    const handlerFn = vi.fn(async () => new Response('ok') as any);
    const handler = withAssistantAuth(handlerFn);
    const res = await handler(reqCom('chave-secreta-123'), {} as any);
    expect(handlerFn).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it('rejeita quando ASSISTANT_API_KEY não está configurada no servidor', async () => {
    vi.doMock('@/lib/env', () => ({ env: { assistantApiKey: '' } }));
    vi.resetModules();
    const { withAssistantAuth: fresh } = await import('./withAssistantAuth');
    const handler = fresh(async () => new Response('ok') as any);
    const res = await handler(reqCom('qualquer-coisa'), {} as any);
    expect(res.status).toBe(401);
  });
});
