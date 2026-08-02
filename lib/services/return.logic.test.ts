import { describe, expect, it } from 'vitest';
import { diasDesdeEntrega, PRAZO_DIAS } from './return.service';

const DIA_MS = 86_400_000;
const AGORA = new Date('2026-08-02T12:00:00.000Z');

function entregaHa(dias: number) {
  return new Date(AGORA.getTime() - dias * DIA_MS);
}

describe('diasDesdeEntrega', () => {
  it('conta zero no mesmo dia da entrega', () => {
    expect(diasDesdeEntrega(AGORA, AGORA)).toBe(0);
  });

  it('conta os dias corridos desde a entrega', () => {
    expect(diasDesdeEntrega(entregaHa(10), AGORA)).toBe(10);
    expect(diasDesdeEntrega(entregaHa(45), AGORA)).toBe(45);
  });

  it('aceita solicitação no último dia do prazo', () => {
    // A regra do serviço recusa quando `dias > PRAZO_DIAS`, então exatamente
    // no dia 30 ainda deve passar.
    expect(diasDesdeEntrega(entregaHa(PRAZO_DIAS), AGORA)).toBe(PRAZO_DIAS);
    expect(diasDesdeEntrega(entregaHa(PRAZO_DIAS), AGORA) > PRAZO_DIAS).toBe(false);
  });

  it('recusa a partir do dia seguinte ao prazo', () => {
    expect(diasDesdeEntrega(entregaHa(PRAZO_DIAS + 1), AGORA) > PRAZO_DIAS).toBe(true);
  });

  it('o prazo da loja é maior que os 7 dias do CDC', () => {
    // /trocas e /termos prometem 30 dias; o CDC art. 49 garante 7.
    expect(PRAZO_DIAS).toBeGreaterThan(7);
    expect(PRAZO_DIAS).toBe(30);
  });
});
