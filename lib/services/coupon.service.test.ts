import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/repositories/coupon.repo', () => ({
  couponRepo: { findByCode: vi.fn() },
}));
vi.mock('@/lib/repositories/user.repo', () => ({
  userRepo: { countOrders: vi.fn() },
}));

import { couponRepo } from '@/lib/repositories/coupon.repo';
import { userRepo } from '@/lib/repositories/user.repo';
import { validar } from './coupon.service';

const baseCupom = {
  id: 'c1',
  codigo: 'BRILHE10',
  ativo: true,
  validade: null,
  usoMaximo: null,
  usos: 0,
  minimoPedido: null,
  primeiraCompra: false,
  tipoDesconto: 'PERCENT' as const,
  valor: 10,
};

beforeEach(() => {
  vi.mocked(couponRepo.findByCode).mockReset();
  vi.mocked(userRepo.countOrders).mockReset();
});

describe('coupon.service.validar', () => {
  it('rejeita cupom inexistente', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue(null as any);
    await expect(validar('NAOEXISTE', { subtotal: 100 })).rejects.toThrow('Cupom inválido');
  });

  it('rejeita cupom inativo', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, ativo: false } as any);
    await expect(validar('BRILHE10', { subtotal: 100 })).rejects.toThrow('Cupom inválido');
  });

  it('rejeita cupom expirado', async () => {
    const ontem = new Date(Date.now() - 86400000);
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, validade: ontem } as any);
    await expect(validar('BRILHE10', { subtotal: 100 })).rejects.toThrow('Cupom expirado');
  });

  it('rejeita cupom com uso esgotado', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, usoMaximo: 5, usos: 5 } as any);
    await expect(validar('BRILHE10', { subtotal: 100 })).rejects.toThrow('Cupom esgotado');
  });

  it('rejeita quando o subtotal não atinge o pedido mínimo', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, minimoPedido: 200 } as any);
    await expect(validar('BRILHE10', { subtotal: 100 })).rejects.toThrow(/acima de/);
  });

  it('rejeita cupom de primeira compra para quem já tem pedidos', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, primeiraCompra: true } as any);
    vi.mocked(userRepo.countOrders).mockResolvedValue(2);
    await expect(validar('BRILHE10', { subtotal: 100, userId: 'u1' })).rejects.toThrow('primeira compra');
  });

  it('aceita cupom de primeira compra para quem nunca comprou', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, primeiraCompra: true } as any);
    vi.mocked(userRepo.countOrders).mockResolvedValue(0);
    const r = await validar('BRILHE10', { subtotal: 100, userId: 'u1' });
    expect(r.desconto).toBe(10);
  });

  it('calcula desconto percentual sobre o subtotal', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, tipoDesconto: 'PERCENT', valor: 15 } as any);
    const r = await validar('BRILHE10', { subtotal: 200 });
    expect(r.desconto).toBe(30);
    expect(r.freteGratis).toBe(false);
  });

  it('limita desconto fixo ao valor do subtotal (não deixa desconto negativo restante)', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, tipoDesconto: 'FIXED', valor: 500 } as any);
    const r = await validar('BRILHE10', { subtotal: 100 });
    expect(r.desconto).toBe(100);
  });

  it('cupom de frete grátis zera o frete sem gerar desconto monetário', async () => {
    vi.mocked(couponRepo.findByCode).mockResolvedValue({ ...baseCupom, tipoDesconto: 'FREE_SHIPPING', valor: 0 } as any);
    const r = await validar('BRILHE10', { subtotal: 100, frete: 30 });
    expect(r.freteGratis).toBe(true);
    expect(r.desconto).toBe(0);
    expect(r.freteAplicado).toBe(0);
  });
});
