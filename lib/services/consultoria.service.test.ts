import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/services/product.service', () => ({
  list: vi.fn(),
  decorate: vi.fn((p: any) => ({ ...p, decorado: true })),
}));
vi.mock('@/lib/repositories/product.repo', () => ({
  productRepo: { findBySlug: vi.fn() },
}));
vi.mock('@/lib/repositories/category.repo', () => ({
  categoryRepo: { list: vi.fn() },
}));
vi.mock('@/lib/openai-client', () => ({
  getOpenAIClient: vi.fn(),
}));

import { list as listProdutos, decorate } from '@/lib/services/product.service';
import { productRepo } from '@/lib/repositories/product.repo';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { getOpenAIClient } from '@/lib/openai-client';
import { buildProductContext, chat } from './consultoria.service';

const produtoBase = {
  id: 'p1',
  nome: 'Anel Solitário',
  slug: 'anel-solitario',
  categoria: { nome: 'Anéis' },
  material: 'PRATA_925',
  precoEfetivo: 129.9,
  disponivel: true,
};

beforeEach(() => {
  vi.mocked(listProdutos).mockReset().mockResolvedValue({ total: 1, items: [produtoBase] } as any);
  vi.mocked(decorate).mockReset().mockImplementation((p: any) => ({ ...p, decorado: true }));
  vi.mocked(productRepo.findBySlug).mockReset();
  vi.mocked(categoryRepo.list).mockReset().mockResolvedValue([{ nome: 'Anéis', slug: 'aneis' }] as any);
  vi.mocked(getOpenAIClient).mockReset();
});

describe('consultoria.service.buildProductContext', () => {
  it('busca produtos filtrando por categoria mencionada na conversa', async () => {
    await buildProductContext([{ role: 'user', content: 'quero um anel de prata' }]);

    expect(listProdutos).toHaveBeenCalledWith(
      { categoria: 'aneis', material: 'PRATA_925' },
      'relevancia',
      { skip: 0, take: 18 },
    );
  });

  it('sem sinais na conversa, busca produtos em destaque', async () => {
    vi.mocked(listProdutos).mockResolvedValueOnce({ total: 0, items: [] } as any);
    vi.mocked(listProdutos).mockResolvedValueOnce({ total: 1, items: [produtoBase] } as any);

    const contexto = await buildProductContext([{ role: 'user', content: 'oi' }]);

    expect(listProdutos).toHaveBeenLastCalledWith({ destaque: true }, 'relevancia', { skip: 0, take: 18 });
    expect(contexto).toHaveLength(1);
  });

  it('achata o produto para o formato enxuto usado no prompt', async () => {
    const [contexto] = await buildProductContext([{ role: 'user', content: 'colar' }]);
    expect(contexto).toEqual({
      nome: 'Anel Solitário',
      slug: 'anel-solitario',
      categoria: 'Anéis',
      material: 'PRATA_925',
      preco: 129.9,
      disponivel: true,
    });
  });
});

describe('consultoria.service.chat', () => {
  function mockOpenAI(content: string) {
    const create = vi.fn().mockResolvedValue({ choices: [{ message: { content } }] });
    vi.mocked(getOpenAIClient).mockReturnValue({ chat: { completions: { create } } } as any);
    return create;
  }

  it('filtra slugs recomendados que não existem/estão inativos (proteção contra alucinação)', async () => {
    mockOpenAI(JSON.stringify({
      reply: 'Aqui vão minhas sugestões!',
      quickReplies: [],
      recommendationSlugs: ['anel-solitario', 'produto-inventado-pela-ia'],
    }));
    vi.mocked(productRepo.findBySlug).mockImplementation(((slug: string) =>
      Promise.resolve(slug === 'anel-solitario' ? produtoBase : null)) as any);

    const resultado = await chat([{ role: 'user', content: 'quero um anel de prata para presentear' }]);

    expect(resultado.recommendations).toHaveLength(1);
    expect(resultado.recommendations[0]).toMatchObject({ slug: 'anel-solitario', decorado: true });
  });

  it('não busca produtos quando a IA não recomenda nada ainda', async () => {
    mockOpenAI(JSON.stringify({ reply: 'Me conta mais sobre a ocasião?', quickReplies: ['Presente', 'Uso próprio'] }));

    const resultado = await chat([{ role: 'user', content: 'oi' }]);

    expect(productRepo.findBySlug).not.toHaveBeenCalled();
    expect(resultado.recommendations).toEqual([]);
    expect(resultado.quickReplies).toEqual(['Presente', 'Uso próprio']);
  });

  it('lança erro tratável quando a chamada à OpenAI falha', async () => {
    vi.mocked(getOpenAIClient).mockImplementation(() => {
      throw new Error('OPENAI_API_KEY não configurada');
    });

    await expect(chat([{ role: 'user', content: 'oi' }])).rejects.toMatchObject({
      status: 503,
      code: 'CONSULTORIA_INDISPONIVEL',
    });
  });

  it('lança erro tratável quando a resposta da IA não é um JSON válido', async () => {
    mockOpenAI('isso não é json');

    await expect(chat([{ role: 'user', content: 'oi' }])).rejects.toMatchObject({
      status: 503,
      code: 'CONSULTORIA_INDISPONIVEL',
    });
  });
});
