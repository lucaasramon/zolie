import { describe, expect, it, vi, beforeEach } from 'vitest';

// O objetivo aqui é a política de encerramento de cobrança: quando estornar
// (dinheiro já entrou) versus quando apenas remover a cobrança (ainda não paga).
const getPayment = vi.fn();
const refundPayment = vi.fn();
const deletePayment = vi.fn();

vi.mock('@/lib/services/asaas', () => ({
  asaasClient: {
    getPayment: (...args: unknown[]) => getPayment(...args),
    refundPayment: (...args: unknown[]) => refundPayment(...args),
    deletePayment: (...args: unknown[]) => deletePayment(...args),
  },
  resolveCustomerId: vi.fn(),
}));

const { encerrarCobranca } = await import('./payment.service');

beforeEach(() => {
  getPayment.mockReset();
  refundPayment.mockReset().mockResolvedValue({});
  deletePayment.mockReset().mockResolvedValue({ deleted: true, id: 'pay_1' });
});

describe('encerrarCobranca', () => {
  it.each(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'])(
    'estorna quando o dinheiro já entrou (status %s)',
    async status => {
      getPayment.mockResolvedValue({ status });
      await expect(encerrarCobranca('pay_1')).resolves.toBe('ESTORNADO');
      expect(refundPayment).toHaveBeenCalledOnce();
      expect(deletePayment).not.toHaveBeenCalled();
    },
  );

  it.each(['PENDING', 'AWAITING_RISK_ANALYSIS', 'OVERDUE'])(
    'remove a cobrança quando ainda não foi paga (status %s)',
    async status => {
      getPayment.mockResolvedValue({ status });
      await expect(encerrarCobranca('pay_1')).resolves.toBe('COBRANCA_REMOVIDA');
      expect(deletePayment).toHaveBeenCalledOnce();
      expect(refundPayment).not.toHaveBeenCalled();
    },
  );

  it.each(['REFUNDED', 'DELETED', 'CHARGEBACK_REQUESTED'])(
    'não faz nada quando a cobrança já está encerrada (status %s)',
    async status => {
      getPayment.mockResolvedValue({ status });
      await expect(encerrarCobranca('pay_1')).resolves.toBe('NADA_A_FAZER');
      expect(refundPayment).not.toHaveBeenCalled();
      expect(deletePayment).not.toHaveBeenCalled();
    },
  );

  it('consulta o status real no gateway em vez de confiar no estado local', async () => {
    getPayment.mockResolvedValue({ status: 'CONFIRMED' });
    await encerrarCobranca('pay_1');
    expect(getPayment).toHaveBeenCalledWith('pay_1');
  });

  it('repassa o motivo como descrição do estorno', async () => {
    getPayment.mockResolvedValue({ status: 'CONFIRMED' });
    await encerrarCobranca('pay_1', 'Cliente desistiu');
    expect(refundPayment).toHaveBeenCalledWith('pay_1', 'Cliente desistiu');
  });

  it('trata status desconhecido como não pago, sem estornar por engano', async () => {
    // Estornar por engano move dinheiro; remover uma cobrança não paga não.
    getPayment.mockResolvedValue({ status: 'ALGUM_STATUS_NOVO' });
    await expect(encerrarCobranca('pay_1')).resolves.toBe('COBRANCA_REMOVIDA');
    expect(refundPayment).not.toHaveBeenCalled();
  });
});
