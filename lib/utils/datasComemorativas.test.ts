import { describe, expect, it } from 'vitest';
import { avisoDataComemorativa } from './datasComemorativas';

const dia = (iso: string) => new Date(`${iso}T10:00:00`);
const ddmm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

describe('avisoDataComemorativa', () => {
  it('não mostra nada fora da janela de nenhuma data', () => {
    expect(avisoDataComemorativa(dia('2026-08-10'))).toBeNull();
  });

  it('calcula os limites do Natal a partir da véspera (24/12, quinta)', () => {
    const aviso = avisoDataComemorativa(dia('2026-11-20'));
    expect(aviso?.nome).toBe('Natal');
    expect(aviso?.fase).toBe('todas');
    // 24/12 menos 15 dias úteis (5 de preparo + 10 de frete) = 03/12
    expect(ddmm(aviso!.limitePersonalizado)).toBe('03/12');
    // 24/12 menos 12 dias úteis (2 + 10) = 08/12
    expect(ddmm(aviso!.limiteProntaEntrega)).toBe('08/12');
    expect(aviso?.diasRestantes).toBe(13);
  });

  it('no último dia das personalizadas ainda mostra as duas opções', () => {
    const aviso = avisoDataComemorativa(dia('2026-12-03'));
    expect(aviso?.fase).toBe('todas');
    expect(aviso?.diasRestantes).toBe(0);
  });

  it('depois do limite das personalizadas, fala só da pronta entrega', () => {
    const aviso = avisoDataComemorativa(dia('2026-12-04'));
    expect(aviso?.fase).toBe('pronta');
    expect(aviso?.diasRestantes).toBe(4);
  });

  it('some quando nem a pronta entrega chega mais a tempo', () => {
    expect(avisoDataComemorativa(dia('2026-12-09'))).toBeNull();
  });

  it('acha o Dia das Mães no 2º domingo de maio', () => {
    // Dia das Mães 2027 = domingo 09/05; chegada na sexta 07/05
    const aviso = avisoDataComemorativa(dia('2027-04-10'));
    expect(aviso?.nome).toBe('Dia das Mães');
    expect(ddmm(aviso!.limitePersonalizado)).toBe('16/04');
  });
});

describe('janela de exibição', () => {
  it('já mostra o Natal em 22/10 (64 dias antes)', () => {
    const aviso = avisoDataComemorativa(dia('2026-10-22'));
    expect(aviso?.nome).toBe('Natal');
    expect(aviso?.fase).toBe('todas');
  });
});
