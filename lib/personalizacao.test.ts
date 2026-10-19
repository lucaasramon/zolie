import { describe, expect, it } from 'vitest';
import { lerOpcoes, lerPersonalizacao, personalizacaoSchema, precoPersonalizado, resumoPersonalizacao, rotuloOpcao } from './personalizacao';

const OPCOES = [
  { id: 'esc', modelo: 'Escapulário', tamanho: null, preco: 89.9 },
  { id: 'red12', modelo: 'Medalha redonda', tamanho: '12mm', preco: 129.9 },
];

describe('precoPersonalizado', () => {
  const produto = { precoBase: 79.9, opcoes: OPCOES, valorGravacaoVerso: 5 };

  it('usa o preço do modelo escolhido', () => {
    expect(precoPersonalizado(produto, { modeloId: 'red12', verso: false })).toBe(129.9);
  });

  it('soma a gravação no verso', () => {
    expect(precoPersonalizado(produto, { modeloId: 'esc', verso: true })).toBe(94.9);
  });

  it('retorna null para modelo inexistente', () => {
    expect(precoPersonalizado(produto, { modeloId: 'sumiu', verso: false })).toBeNull();
  });

  it('sem modelos cadastrados usa o preço do produto', () => {
    expect(precoPersonalizado({ precoBase: 79.9, opcoes: [], valorGravacaoVerso: null }, { modeloId: null, verso: true })).toBe(79.9);
  });

  it('lê opções e monta o rótulo', () => {
    expect(lerOpcoes('lixo')).toEqual([]);
    expect(lerOpcoes(OPCOES).map(rotuloOpcao)).toEqual(['Escapulário', 'Medalha redonda 12mm']);
  });
});

describe('personalizacaoSchema', () => {
  it('aceita personalização completa', () => {
    const p = personalizacaoSchema.parse({
      imagens: ['https://abc.public.blob.vercel-storage.com/a.png'],
      verso: true,
      textoVerso: '  Te amo  ',
      pingente: false,
      fonte: '03 georgia',
    });
    expect(p).toEqual({
      modeloId: null,
      modelo: null,
      imagens: ['https://abc.public.blob.vercel-storage.com/a.png'],
      verso: true,
      textoVerso: 'Te amo',
      pingente: false,
      fonte: '03 georgia',
      simulacao: null,
    });
  });

  it('recusa fotos fora do nosso storage', () => {
    expect(personalizacaoSchema.safeParse({ verso: false, imagens: ['https://site-qualquer.com/a.png'] }).success).toBe(false);
  });

  it('exige texto quando pediu verso', () => {
    expect(personalizacaoSchema.safeParse({ verso: true, textoVerso: ' ' }).success).toBe(false);
  });

  it('descarta o texto do verso quando respondeu não', () => {
    const p = personalizacaoSchema.parse({ verso: false, textoVerso: 'sobrou' });
    expect(p.textoVerso).toBeNull();
    expect(p.pingente).toBe(true);
    expect(p.imagens).toEqual([]);
  });

  it('exige a resposta do verso', () => {
    expect(personalizacaoSchema.safeParse({}).success).toBe(false);
  });

  it('limita a 2 imagens e às fontes da lista', () => {
    expect(personalizacaoSchema.safeParse({ verso: false, imagens: ['/images/produtos/a.png', '/images/produtos/b.png', '/images/produtos/c.png'] }).success).toBe(false);
    expect(personalizacaoSchema.safeParse({ verso: false, fonte: 'comic sans' }).success).toBe(false);
  });
});

describe('lerPersonalizacao / resumoPersonalizacao', () => {
  it('ignora valor ausente ou malformado', () => {
    expect(lerPersonalizacao(null)).toBeNull();
    expect(lerPersonalizacao({ foo: 1 })).toBeNull();
  });

  it('monta o resumo para exibição', () => {
    const p = lerPersonalizacao({ modelo: 'Escapulário', verso: true, textoVerso: 'Ana', pingente: true, fonte: null, imagens: ['https://abc.public.blob.vercel-storage.com/x.png'] })!;
    expect(resumoPersonalizacao(p)).toEqual([
      { rotulo: 'Modelo', valor: 'Escapulário' },
      { rotulo: 'Gravação no verso', valor: 'Sim — "Ana"' },
      { rotulo: 'Pingente de coração', valor: 'Com pingente' },
      { rotulo: 'Letra', valor: 'Não escolhida' },
      { rotulo: 'Imagens', valor: '1 enviada(s)' },
    ]);
  });
});
