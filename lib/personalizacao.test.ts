import { describe, expect, it } from 'vitest';
import { lerPersonalizacao, personalizacaoSchema, resumoPersonalizacao } from './personalizacao';

describe('personalizacaoSchema', () => {
  it('aceita personalização completa', () => {
    const p = personalizacaoSchema.parse({
      imagens: ['/uploads/a.png'],
      verso: true,
      textoVerso: '  Te amo  ',
      pingente: false,
      fonte: '03 georgia',
    });
    expect(p).toEqual({ imagens: ['/uploads/a.png'], verso: true, textoVerso: 'Te amo', pingente: false, fonte: '03 georgia' });
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
    expect(personalizacaoSchema.safeParse({ verso: false, imagens: ['a', 'b', 'c'] }).success).toBe(false);
    expect(personalizacaoSchema.safeParse({ verso: false, fonte: 'comic sans' }).success).toBe(false);
  });
});

describe('lerPersonalizacao / resumoPersonalizacao', () => {
  it('ignora valor ausente ou malformado', () => {
    expect(lerPersonalizacao(null)).toBeNull();
    expect(lerPersonalizacao({ foo: 1 })).toBeNull();
  });

  it('monta o resumo para exibição', () => {
    const p = lerPersonalizacao({ verso: true, textoVerso: 'Ana', pingente: true, fonte: null, imagens: ['x'] })!;
    expect(resumoPersonalizacao(p)).toEqual([
      { rotulo: 'Verso', valor: 'Sim — "Ana"' },
      { rotulo: 'Pingente de coração', valor: 'Com pingente' },
      { rotulo: 'Letra', valor: 'Não escolhida' },
      { rotulo: 'Imagens', valor: '1 enviada(s)' },
    ]);
  });
});
