import { beforeEach, describe, expect, it, vi } from 'vitest';
import { esquecerCupomGuardado, garantirCupomGuardado, lerCupomGuardado, VALIDADE_CUPOM_MS } from './cupomGuardado';

beforeEach(() => {
  const dados = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
  });
});

describe('cupom guardado do anúncio', () => {
  it('guarda na primeira visita com 48h de prazo', () => {
    const c = garantirCupomGuardado('PRESENTE10', 1_000);
    expect(c).toEqual({ codigo: 'PRESENTE10', expiraEm: 1_000 + VALIDADE_CUPOM_MS });
    expect(lerCupomGuardado(2_000)?.codigo).toBe('PRESENTE10');
  });

  it('voltar à página não renova o prazo', () => {
    garantirCupomGuardado('PRESENTE10', 1_000);
    const depois = garantirCupomGuardado('PRESENTE10', 1_000 + VALIDADE_CUPOM_MS / 2);
    expect(depois.expiraEm).toBe(1_000 + VALIDADE_CUPOM_MS);
  });

  it('some depois de vencer', () => {
    garantirCupomGuardado('PRESENTE10', 1_000);
    expect(lerCupomGuardado(1_000 + VALIDADE_CUPOM_MS)).toBeNull();
  });

  it('não volta a ser aplicado depois que a cliente o remove', () => {
    garantirCupomGuardado('PRESENTE10', 1_000);
    esquecerCupomGuardado();
    expect(lerCupomGuardado(2_000)).toBeNull();
  });

  it('armazenamento bloqueado não quebra', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('bloqueado'); },
      setItem: () => { throw new Error('bloqueado'); },
      removeItem: () => { throw new Error('bloqueado'); },
    });
    expect(lerCupomGuardado()).toBeNull();
    expect(garantirCupomGuardado('PRESENTE10', 1_000).codigo).toBe('PRESENTE10');
  });
});
