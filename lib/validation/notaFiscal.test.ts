import { describe, expect, it } from 'vitest';
import { notaFiscalSchema } from './schemas';

describe('notaFiscalSchema', () => {
  it('aceita chave de 44 dígitos', () => {
    const chave = '1'.repeat(44);
    expect(notaFiscalSchema.parse({ notaFiscalChave: chave }).notaFiscalChave).toBe(chave);
  });

  it('remove máscara da chave antes de validar', () => {
    const comMascara = '1234 5678 9012 3456 7890 1234 5678 9012 3456 7890 1234';
    expect(notaFiscalSchema.parse({ notaFiscalChave: comMascara }).notaFiscalChave).toBe('1'.repeat(0) + comMascara.replace(/\D/g, ''));
  });

  it('rejeita chave com número de dígitos errado', () => {
    expect(() => notaFiscalSchema.parse({ notaFiscalChave: '123' })).toThrow();
    expect(() => notaFiscalSchema.parse({ notaFiscalChave: '1'.repeat(43) })).toThrow();
  });

  it('converte string vazia em null, permitindo limpar o campo', () => {
    expect(notaFiscalSchema.parse({ notaFiscalChave: '' }).notaFiscalChave).toBeNull();
    expect(notaFiscalSchema.parse({ notaFiscalNumero: '  ' }).notaFiscalNumero).toBeNull();
  });

  it('rejeita URL inválida', () => {
    expect(() => notaFiscalSchema.parse({ notaFiscalUrl: 'não-e-url' })).toThrow();
  });

  it('aceita payload vazio — os campos são opcionais', () => {
    expect(() => notaFiscalSchema.parse({})).not.toThrow();
  });
});
