import { describe, expect, it } from 'vitest';
import { calcularLimites, PRAZO_HORAS } from './orderExpiration.service';

const HORA_MS = 60 * 60 * 1000;
const AGORA = new Date('2026-08-01T12:00:00.000Z');

function limitePara(forma: 'PIX' | 'BOLETO' | 'CARTAO_CREDITO') {
  const limite = calcularLimites(AGORA).find(l => l.formaPagamento === forma);
  if (!limite) throw new Error(`Sem limite calculado para ${forma}`);
  return limite.antesDe;
}

describe('calcularLimites', () => {
  it('cobre todas as formas de pagamento', () => {
    const formas = calcularLimites(AGORA).map(l => l.formaPagamento).sort();
    expect(formas).toEqual(['BOLETO', 'CARTAO_CREDITO', 'PIX']);
  });

  it('recua exatamente o prazo configurado de cada forma', () => {
    for (const [forma, horas] of Object.entries(PRAZO_HORAS)) {
      const esperado = new Date(AGORA.getTime() - horas * HORA_MS);
      expect(limitePara(forma as 'PIX').toISOString()).toBe(esperado.toISOString());
    }
  });

  it('dá ao boleto um prazo maior que ao pix, porque o vencimento é mais longo', () => {
    expect(limitePara('BOLETO').getTime()).toBeLessThan(limitePara('PIX').getTime());
  });

  it('mantém folga sobre o vencimento enviado ao Asaas (pix 1 dia, boleto 3 dias)', () => {
    // A folga evita cancelar um pedido pago em cima do vencimento, cujo webhook
    // de confirmação ainda não chegou.
    expect(PRAZO_HORAS.PIX).toBeGreaterThan(24);
    expect(PRAZO_HORAS.BOLETO).toBeGreaterThan(72);
  });

  it('não expira um pedido criado agora', () => {
    for (const limite of calcularLimites(AGORA)) {
      expect(AGORA.getTime()).toBeGreaterThan(limite.antesDe.getTime());
    }
  });

  it('expira um pix criado há 48h mas preserva um boleto da mesma idade', () => {
    const criadoHa48h = new Date(AGORA.getTime() - 48 * HORA_MS);
    expect(criadoHa48h.getTime()).toBeLessThan(limitePara('PIX').getTime());
    expect(criadoHa48h.getTime()).toBeGreaterThan(limitePara('BOLETO').getTime());
  });
});
