import { describe, expect, it } from 'vitest';
import { precoEfetivo, resumo } from './pricing.service';

describe('precoEfetivo', () => {
  it('usa o preço promocional quando existe', () => {
    expect(precoEfetivo({ preco: 100, precoPromocional: 80 })).toBe(80);
  });

  it('usa o preço cheio quando não há promoção', () => {
    expect(precoEfetivo({ preco: 100, precoPromocional: null })).toBe(100);
  });

  it('converte valores Decimal (string) do Prisma para number', () => {
    expect(precoEfetivo({ preco: '150.50', precoPromocional: null })).toBe(150.5);
  });
});

describe('resumo', () => {
  const item = (preco: number, quantidade: number, precoPromocional: number | null = null) => ({
    product: { preco, precoPromocional },
    quantidade,
  });

  it('soma subtotal a partir do preço efetivo de cada item', () => {
    const r = resumo([item(100, 2), item(50, 1)]);
    expect(r.subtotal).toBe(250);
  });

  it('zera o frete quando o subtotal atinge o limiar de frete grátis', () => {
    const r = resumo([item(199, 1)], { frete: 30 });
    expect(r.frete).toBe(0);
    expect(r.freteGratis).toBe(true);
  });

  it('cobra o frete informado quando abaixo do limiar', () => {
    const r = resumo([item(50, 1)], { frete: 30 });
    expect(r.frete).toBe(30);
    expect(r.freteGratis).toBe(false);
    expect(r.faltaParaFreteGratis).toBe(149);
  });

  it('nunca deixa o total ficar negativo mesmo com desconto maior que o subtotal', () => {
    const r = resumo([item(50, 1)], { desconto: 1000 });
    expect(r.total).toBeGreaterThanOrEqual(0);
    expect(r.total).toBe(0);
  });

  it('aplica o desconto do Pix sobre o total, não sobre o subtotal', () => {
    const r = resumo([item(100, 1)]);
    expect(r.totalPix).toBeLessThan(r.total);
  });

  it('divide o total em parcelas iguais até o máximo configurado', () => {
    const r = resumo([item(120, 1)]);
    expect(r.parcelamento.valorParcela * r.parcelamento.maxParcelas).toBeCloseTo(r.total, 1);
  });
});
