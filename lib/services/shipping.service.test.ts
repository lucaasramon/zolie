import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cotar, _limparCacheFrete } from './shipping.service';

const OPCOES_OK = [
  { id: 1, name: 'PAC', price: '25.50', delivery_time: 8 },
  { id: 2, name: 'SEDEX', price: '45.00', delivery_time: 3 },
];

function mockFetchOk(opcoes: unknown = OPCOES_OK) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => opcoes });
}

beforeEach(() => {
  _limparCacheFrete();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('cotar — validação', () => {
  it('rejeita CEP com tamanho inválido', async () => {
    await expect(cotar('123')).rejects.toMatchObject({ code: 'INVALID_CEP' });
  });

  it('formata o CEP na resposta', async () => {
    vi.stubGlobal('fetch', mockFetchOk());
    const r = await cotar('61887810');
    expect(r.cep).toBe('61887-810');
  });
});

describe('cotar — cache', () => {
  it('não repete a chamada para o mesmo CEP e peso', async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal('fetch', fetchMock);

    await cotar('61887810', 0, { itens: [{ quantidade: 1, pesoGramas: 100 }] });
    await cotar('61887810', 0, { itens: [{ quantidade: 1, pesoGramas: 100 }] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('consulta de novo quando o peso muda', async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal('fetch', fetchMock);

    await cotar('61887810', 0, { itens: [{ quantidade: 1, pesoGramas: 100 }] });
    await cotar('61887810', 0, { itens: [{ quantidade: 5, pesoGramas: 100 }] });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('aplica frete grátis sobre o valor cacheado, sem nova chamada', async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal('fetch', fetchMock);

    const pagante = await cotar('61887810', 50);
    const gratuito = await cotar('61887810', 100000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(pagante.opcoes[0].valor).toBeGreaterThan(0);
    expect(gratuito.opcoes[0].valor).toBe(0);
    expect(gratuito.freteGratisAplicado).toBe(true);
  });
});

describe('cotar — resiliência', () => {
  it('cai na contingência quando o provedor responde erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const r = await cotar('01310100');

    // O checkout precisa continuar funcionando durante uma queda da API.
    expect(r.estimado).toBe(true);
    expect(r.opcoes).toHaveLength(1);
    expect(r.opcoes[0].valor).toBeGreaterThan(0);
  });

  it('cai na contingência quando a rede falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));
    const r = await cotar('01310100');
    expect(r.estimado).toBe(true);
  });

  it('cai na contingência quando nenhuma opção é retornada', async () => {
    vi.stubGlobal('fetch', mockFetchOk([]));
    const r = await cotar('01310100');
    expect(r.estimado).toBe(true);
  });

  it('ignora opções que vieram com erro do provedor', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOk([
        { id: 1, name: 'PAC', price: '25.50', delivery_time: 8 },
        { id: 2, name: 'SEDEX', price: '0', delivery_time: 0, error: 'Indisponível para o CEP' },
      ]),
    );

    const r = await cotar('61887810');
    expect(r.opcoes).toHaveLength(1);
    expect(r.opcoes[0].nome).toBe('PAC');
    expect(r.estimado).toBeUndefined();
  });

  it('não cacheia resultado de contingência', async () => {
    const falha = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal('fetch', falha);
    const primeira = await cotar('61887810');
    expect(primeira.estimado).toBe(true);

    // Provedor voltou: a próxima cotação precisa buscar de novo, e não servir
    // a estimativa indefinidamente.
    vi.stubGlobal('fetch', mockFetchOk());
    const segunda = await cotar('61887810');
    expect(segunda.estimado).toBeUndefined();
    expect(segunda.opcoes.length).toBeGreaterThan(1);
  });
});

describe('cotar — peso enviado ao provedor', () => {
  it('envia o peso somado dos itens, não um valor fixo', async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal('fetch', fetchMock);

    await cotar('61887810', 0, { itens: [{ quantidade: 4, pesoGramas: 250 }] });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    // 4 x 250g + 80g de embalagem = 1.08kg
    expect(body.package.weight).toBeCloseTo(1.08, 2);
  });
});
