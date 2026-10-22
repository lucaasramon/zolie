import { describe, expect, it } from 'vitest';
import { somarDiasUteis, subtrairDiasUteis, dataPrevisaoEntrega, diasPreparo, DIAS_PREPARO } from './prazoEntrega';

describe('somarDiasUteis', () => {
  it('soma dias úteis simples sem cruzar fim de semana', () => {
    // Segunda-feira 2026-08-17 + 3 dias úteis = quinta 2026-08-20
    const base = new Date('2026-08-17T12:00:00');
    const resultado = somarDiasUteis(base, 3);
    expect(resultado.getDay()).toBe(4); // quinta
    expect(resultado.getDate()).toBe(20);
  });

  it('pula sábado e domingo ao cruzar o fim de semana', () => {
    // Sexta-feira 2026-08-21 + 1 dia útil = segunda 2026-08-24 (pula sáb/dom)
    const base = new Date('2026-08-21T12:00:00');
    const resultado = somarDiasUteis(base, 1);
    expect(resultado.getDay()).toBe(1); // segunda
    expect(resultado.getDate()).toBe(24);
  });

  it('soma um prazo longo cruzando mais de um fim de semana', () => {
    // Segunda 2026-08-17 + 8 dias úteis = quinta 2026-08-27
    const base = new Date('2026-08-17T12:00:00');
    const resultado = somarDiasUteis(base, 8);
    expect(resultado.getDay()).toBe(4); // quinta
    expect(resultado.getDate()).toBe(27);
  });
});

describe('dataPrevisaoEntrega', () => {
  it('retorna null quando não há prazo gravado', () => {
    expect(dataPrevisaoEntrega(new Date(), null)).toBeNull();
  });

  it('calcula a data a partir da criação do pedido', () => {
    const criado = new Date('2026-08-17T12:00:00');
    const resultado = dataPrevisaoEntrega(criado, 3);
    expect(resultado?.getDate()).toBe(20);
  });
});

describe('subtrairDiasUteis', () => {
  it('volta pulando o fim de semana', () => {
    // Segunda 2026-08-24 - 1 dia útil = sexta 2026-08-21
    const resultado = subtrairDiasUteis(new Date('2026-08-24T12:00:00'), 1);
    expect(resultado.getDay()).toBe(5);
    expect(resultado.getDate()).toBe(21);
  });
});

describe('diasPreparo', () => {
  it('usa o prazo da personalizada quando qualquer item é personalizado', () => {
    expect(diasPreparo([{ personalizacao: null }, { personalizacao: { verso: false } }])).toBe(DIAS_PREPARO.personalizado);
  });

  it('usa o prazo de pronta entrega sem item personalizado', () => {
    expect(diasPreparo([{ personalizacao: null }])).toBe(DIAS_PREPARO.prontaEntrega);
    expect(diasPreparo(undefined)).toBe(DIAS_PREPARO.prontaEntrega);
  });

  it('soma o preparo ao prazo do frete na previsão', () => {
    // Segunda 2026-08-17 + (2 + 3) dias úteis = segunda 2026-08-24
    const resultado = dataPrevisaoEntrega(new Date('2026-08-17T12:00:00'), 3, 2);
    expect(resultado?.getDate()).toBe(24);
  });
});
