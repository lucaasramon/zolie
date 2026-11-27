import { describe, expect, it } from 'vitest';
import { BLACK_FRIDAY_FIM, emBlackFriday } from './black-friday';

describe('emBlackFriday', () => {
  const durante = new Date('2026-11-27T15:00:00Z');

  it('marca peça da campanha durante a Black', () => {
    expect(emBlackFriday('colar-banhado-a-ouro-duplo-perolas', durante)).toBe(true);
  });

  it('não marca peça fora da campanha', () => {
    expect(emBlackFriday('brinco-prata-infinito', durante)).toBe(false);
  });

  it('para de marcar depois do fim', () => {
    const depois = new Date(BLACK_FRIDAY_FIM.getTime() + 1);
    expect(emBlackFriday('colar-banhado-a-ouro-duplo-perolas', depois)).toBe(false);
  });
});
