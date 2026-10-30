import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestError } from 'openai';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));
vi.mock('@/lib/env', () => ({
  env: {
    appUrl: 'https://loja.test',
    openai: { apiKey: 'chave' },
    simulacao: { modeloImagem: 'gpt-image-2', modeloVisao: 'gpt-5.4', qualidade: 'high' },
  },
}));
vi.mock('@/lib/openai-client', () => ({ getOpenAIClient: vi.fn() }));
vi.mock('@/lib/repositories/product.repo', () => ({ productRepo: { findById: vi.fn() } }));
vi.mock('@/lib/storage', () => ({ storage: { save: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { unstable_cache } from 'next/cache';
import { getOpenAIClient } from '@/lib/openai-client';
import { productRepo } from '@/lib/repositories/product.repo';
import { storage } from '@/lib/storage';
import { EventoSimulacao, prepararSimulacao } from './simulacao.service';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const b64 = (texto: string) => Buffer.from(texto).toString('base64');

// Serve tanto para a análise da peça quanto para a verificação do resultado.
function respostaVisao(verificacao: { mesmoModelo: boolean; problemas: string[] } = { mesmoModelo: true, problemas: [] }) {
  const analise = {
    tipo: 'colar',
    formato: 'redondo',
    contorno: 'liso',
    argola: 'simples',
    corrente: 'fina',
    corMetal: 'prata',
    acabamento: 'polido',
    detalhesFixos: [],
    areaGravavelFrente: 'centro',
    temPersonalizacaoDeExemplo: false,
    personalizacaoDeExemplo: '',
    estiloGravacao: 'laser',
    fundoEFoto: 'neutro',
  };
  const conteudo = { ...analise, conteudoCorreto: true, semExtras: true, ...verificacao };
  return { choices: [{ message: { content: JSON.stringify(conteudo) } }] };
}

async function* eventos(lista: object[]) {
  yield* lista;
}

function clienteOpenAI(edit: ReturnType<typeof vi.fn>, create = vi.fn().mockResolvedValue(respostaVisao())) {
  vi.mocked(getOpenAIClient).mockReturnValue({ images: { edit }, chat: { completions: { create } } } as never);
}

async function rodar() {
  const executar = await prepararSimulacao({ productId: 'p1', personalizacao: { verso: false } });
  const recebidos: EventoSimulacao[] = [];
  const resultado = await executar(e => recebidos.push(e));
  return { recebidos, resultado };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JPEG)));
  vi.mocked(productRepo.findById).mockReset().mockResolvedValue({
    // Id novo por teste: a análise fica guardada em memória por produto.
    id: `p-${randomUUID()}`,
    nome: 'Colar',
    ativo: true,
    personalizado: true,
    imagens: ['https://cdn.test/a.jpg'],
    opcoesPersonalizacao: [],
    material: 'PRATA_925',
    tamanhos: [],
    updatedAt: new Date(0),
  } as never);
  vi.mocked(storage.save).mockReset().mockImplementation(async (nome: string) => ({ url: `https://blob.test/${nome}` }) as never);
});

describe('simulacao.service', () => {
  it('envia as prévias durante a geração e entrega depois da verificação', async () => {
    const edit = vi.fn().mockImplementation(async () =>
      eventos([
        { type: 'image_edit.partial_image', b64_json: b64('parcial') },
        { type: 'image_edit.completed', b64_json: b64('final') },
      ]),
    );
    clienteOpenAI(edit);

    const { recebidos, resultado } = await rodar();

    expect(edit.mock.calls[0][0]).toMatchObject({ stream: true, partial_images: 2, quality: 'high', model: 'gpt-image-2' });
    const previasFrente = recebidos.filter(e => e.tipo === 'previa' && e.lado === 'frente');
    expect(previasFrente).toEqual([
      { tipo: 'previa', lado: 'frente', imagem: `data:image/jpeg;base64,${b64('parcial')}` },
      { tipo: 'previa', lado: 'frente', imagem: `data:image/jpeg;base64,${b64('final')}` },
    ]);
    expect(resultado.frente).toMatch(/frente\.jpg$/);
    expect(resultado.verso).toMatch(/verso\.jpg$/);
  });

  it('gera sem prévias quando a OpenAI recusa o streaming', async () => {
    const edit = vi.fn().mockImplementation(async (params: { stream?: boolean }) => {
      if (params.stream) throw new BadRequestError(400, {}, 'stream não suportado', new Headers());
      return { data: [{ b64_json: b64('sem-stream') }] };
    });
    clienteOpenAI(edit);

    const { recebidos, resultado } = await rodar();

    expect(edit).toHaveBeenCalledTimes(4);
    expect(recebidos.filter(e => e.tipo === 'previa')).toHaveLength(2);
    expect(resultado.frente).toMatch(/frente\.jpg$/);
  });

  it('falta de crédito na OpenAI vira erro amigável, sem tentar de novo', async () => {
    const edit = vi.fn().mockRejectedValue(new Error('429 no credits'));
    clienteOpenAI(edit);

    await expect(rodar()).rejects.toThrow('Não conseguimos gerar a simulação agora');
    expect(edit).toHaveBeenCalledTimes(2);
  });

  it('falha quando o stream termina sem a imagem final', async () => {
    clienteOpenAI(vi.fn().mockImplementation(async () => eventos([{ type: 'image_edit.partial_image', b64_json: b64('parcial') }])));

    await expect(rodar()).rejects.toThrow('Não conseguimos gerar a simulação agora');
  });

  it('corrige o lado reprovado e só entrega a versão corrigida', async () => {
    const edit = vi.fn().mockImplementation(async (params: { stream?: boolean }) =>
      params.stream ? eventos([{ type: 'image_edit.completed', b64_json: b64('primeira') }]) : { data: [{ b64_json: b64('corrigida') }] },
    );
    const create = vi.fn().mockResolvedValue(respostaVisao({ mesmoModelo: false, problemas: ['texto errado'] }));
    clienteOpenAI(edit, create);

    await rodar();

    const salvas = vi.mocked(storage.save).mock.calls.map(([, bytes]) => (bytes as Buffer).toString());
    expect(salvas).toEqual(['corrigida', 'corrigida']);
  });

  it('guarda a análise da peça no cache compartilhado', async () => {
    clienteOpenAI(vi.fn().mockImplementation(async () => eventos([{ type: 'image_edit.completed', b64_json: b64('final') }])));

    await rodar();

    expect(unstable_cache).toHaveBeenCalledWith(expect.any(Function), ['simulacao-analise', expect.stringMatching(/^p-.+:null:0$/)]);
  });
});
