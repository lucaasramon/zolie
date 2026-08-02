import { describe, expect, it } from 'vitest';
import { formatarCnpj, formatarTelefone } from './loja';

describe('formatarCnpj', () => {
  it('aplica a máscara padrão', () => {
    expect(formatarCnpj('67187717000165')).toBe('67.187.717/0001-65');
  });

  it('ignora caracteres já mascarados', () => {
    expect(formatarCnpj('67.187.717/0001-65')).toBe('67.187.717/0001-65');
  });

  it('devolve o valor cru quando não tem 14 dígitos, sem inventar máscara', () => {
    expect(formatarCnpj('123')).toBe('123');
    expect(formatarCnpj('')).toBe('');
  });
});

describe('formatarTelefone', () => {
  it('formata celular com 11 dígitos', () => {
    expect(formatarTelefone('85986480963')).toBe('(85) 98648-0963');
  });

  it('formata fixo com 10 dígitos', () => {
    expect(formatarTelefone('8532224444')).toBe('(85) 3222-4444');
  });

  it('devolve o valor cru quando o tamanho é inesperado', () => {
    expect(formatarTelefone('123')).toBe('123');
  });
});
