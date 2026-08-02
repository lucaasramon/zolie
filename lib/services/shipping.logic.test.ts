import { describe, expect, it } from 'vitest';
import {
  calcularPesoKg,
  calcularDimensoes,
  freteContingencia,
  limparCep,
  PESO_PADRAO_GRAMAS,
  PESO_EMBALAGEM_GRAMAS,
  PACOTE_MINIMO,
} from './shipping.logic';

describe('calcularPesoKg', () => {
  it('usa o peso real do produto quando cadastrado', () => {
    // 200g + 80g de embalagem
    expect(calcularPesoKg([{ quantidade: 1, pesoGramas: 200 }])).toBeCloseTo(0.28, 3);
  });

  it('multiplica pela quantidade', () => {
    // 3 x 200g + 80g
    expect(calcularPesoKg([{ quantidade: 3, pesoGramas: 200 }])).toBeCloseTo(0.68, 3);
  });

  it('soma itens diferentes', () => {
    // 100g + 2x50g + 80g
    const peso = calcularPesoKg([
      { quantidade: 1, pesoGramas: 100 },
      { quantidade: 2, pesoGramas: 50 },
    ]);
    expect(peso).toBeCloseTo(0.28, 3);
  });

  it('cai no peso padrão quando o produto não tem peso cadastrado', () => {
    const esperado = (PESO_PADRAO_GRAMAS + PESO_EMBALAGEM_GRAMAS) / 1000;
    expect(calcularPesoKg([{ quantidade: 1 }])).toBeCloseTo(esperado, 3);
    expect(calcularPesoKg([{ quantidade: 1, pesoGramas: null }])).toBeCloseTo(esperado, 3);
  });

  it('aceita peso vindo como string (Decimal do Prisma serializado)', () => {
    expect(calcularPesoKg([{ quantidade: 1, pesoGramas: '200' }])).toBeCloseTo(0.28, 3);
  });

  it('sempre inclui o peso da embalagem', () => {
    expect(calcularPesoKg([{ quantidade: 1, pesoGramas: 10 }])).toBeGreaterThan(
      PESO_EMBALAGEM_GRAMAS / 1000,
    );
  });

  it('nunca devolve peso zero, que o Melhor Envio recusa', () => {
    expect(calcularPesoKg([])).toBeGreaterThan(0);
    expect(calcularPesoKg([{ quantidade: 0, pesoGramas: 0 }])).toBeGreaterThan(0);
  });

  it('cresce com o pedido — regressão do bug do pacote fixo de 150g', () => {
    const uma = calcularPesoKg([{ quantidade: 1, pesoGramas: 150 }]);
    const dez = calcularPesoKg([{ quantidade: 10, pesoGramas: 150 }]);
    expect(dez).toBeGreaterThan(uma * 5);
  });
});

describe('calcularDimensoes', () => {
  it('usa as dimensões mínimas para uma peça', () => {
    expect(calcularDimensoes(1)).toEqual(PACOTE_MINIMO);
  });

  it('aumenta a altura conforme a quantidade', () => {
    expect(calcularDimensoes(10).height).toBeGreaterThan(calcularDimensoes(1).height);
  });

  it('mantém largura e comprimento fixos', () => {
    const d = calcularDimensoes(20);
    expect(d.width).toBe(PACOTE_MINIMO.width);
    expect(d.length).toBe(PACOTE_MINIMO.length);
  });
});

describe('freteContingencia', () => {
  it('marca o valor como estimado', () => {
    expect(freteContingencia('01310100', false).estimado).toBe(true);
  });

  it('cobra mais caro e com prazo maior para regiões distantes', () => {
    const sp = freteContingencia('01310100', false); // São Paulo
    const norte = freteContingencia('69000000', false); // Amazonas
    expect(norte.valor).toBeGreaterThan(sp.valor);
    expect(norte.prazoDias).toBeGreaterThan(sp.prazoDias);
  });

  it('respeita o frete grátis', () => {
    expect(freteContingencia('01310100', true).valor).toBe(0);
  });

  it('não quebra com CEP fora das faixas conhecidas', () => {
    expect(freteContingencia('', false).valor).toBeGreaterThan(0);
  });
});

describe('limparCep', () => {
  it('remove máscara e caracteres não numéricos', () => {
    expect(limparCep('61887-810')).toBe('61887810');
    expect(limparCep(' 61.887-810 ')).toBe('61887810');
  });
});
