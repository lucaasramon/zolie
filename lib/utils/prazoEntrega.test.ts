import { describe, expect, it } from 'vitest';
import { somarDiasUteis, dataPrevisaoEntrega } from './prazoEntrega';

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
