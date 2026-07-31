import { describe, expect, it } from 'vitest';
import { isValidWebhookToken, decideWebhookAction } from './asaasWebhook.logic';

describe('isValidWebhookToken', () => {
  it('rejeita quando o token esperado não está configurado', () => {
    expect(isValidWebhookToken('', 'qualquer-coisa')).toBe(false);
  });

  it('rejeita quando nenhum token foi recebido', () => {
    expect(isValidWebhookToken('segredo', null)).toBe(false);
  });

  it('rejeita token com tamanho diferente', () => {
    expect(isValidWebhookToken('segredo-longo', 'curto')).toBe(false);
  });

  it('rejeita token de mesmo tamanho mas conteúdo diferente', () => {
    expect(isValidWebhookToken('abcdefgh', 'zzzzzzzz')).toBe(false);
  });

  it('aceita quando o token bate exatamente', () => {
    expect(isValidWebhookToken('meu-segredo-webhook', 'meu-segredo-webhook')).toBe(true);
  });
});

describe('decideWebhookAction', () => {
  it('ignora quando não encontra o pedido correspondente ao pagamento', () => {
    const decision = decideWebhookAction({ event: 'PAYMENT_CONFIRMED', paymentStatus: 'CONFIRMED', order: null });
    expect(decision.action).toBe('ignore_unknown_order');
  });

  it('ignora como duplicado quando o status já é o mesmo já registrado (idempotência)', () => {
    const decision = decideWebhookAction({
      event: 'PAYMENT_CONFIRMED',
      paymentStatus: 'CONFIRMED',
      order: { asaasStatus: 'CONFIRMED', status: 'PROCESSANDO' },
    });
    expect(decision.action).toBe('ignore_duplicate');
  });

  it('confirma pagamento quando o evento é de confirmação e o pedido ainda aguarda pagamento', () => {
    const decision = decideWebhookAction({
      event: 'PAYMENT_CONFIRMED',
      paymentStatus: 'CONFIRMED',
      order: { asaasStatus: 'PENDING', status: 'AGUARDANDO_PAGAMENTO' },
    });
    expect(decision.action).toBe('confirm_payment');
  });

  it('também confirma em PAYMENT_RECEIVED (Pix/boleto pago)', () => {
    const decision = decideWebhookAction({
      event: 'PAYMENT_RECEIVED',
      paymentStatus: 'RECEIVED',
      order: { asaasStatus: 'PENDING', status: 'AGUARDANDO_PAGAMENTO' },
    });
    expect(decision.action).toBe('confirm_payment');
  });

  it('não reconfirma um pedido que já saiu de AGUARDANDO_PAGAMENTO (evita retroceder status)', () => {
    const decision = decideWebhookAction({
      event: 'PAYMENT_CONFIRMED',
      paymentStatus: 'CONFIRMED',
      order: { asaasStatus: 'PENDING', status: 'ENVIADO' },
    });
    expect(decision.action).toBe('sync_status_only');
  });

  it('cancela o pedido em estorno/chargeback mesmo que já estivesse processando', () => {
    const decision = decideWebhookAction({
      event: 'PAYMENT_REFUNDED',
      paymentStatus: 'REFUNDED',
      order: { asaasStatus: 'CONFIRMED', status: 'PROCESSANDO' },
    });
    expect(decision.action).toBe('cancel_order');
  });

  it('trata eventos desconhecidos apenas sincronizando o status bruto, sem mudar o pedido', () => {
    const decision = decideWebhookAction({
      event: 'PAYMENT_UPDATED',
      paymentStatus: 'PENDING',
      order: { asaasStatus: 'CREATED', status: 'AGUARDANDO_PAGAMENTO' },
    });
    expect(decision.action).toBe('sync_status_only');
  });
});
