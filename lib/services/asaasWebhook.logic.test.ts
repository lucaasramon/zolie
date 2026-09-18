import { describe, expect, it } from 'vitest';
import { isValidWebhookToken, decideWebhookAction, extractPaymentEvent } from './asaasWebhook.logic';

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

describe('extractPaymentEvent', () => {
  it('ignora ACCESS_TOKEN_CREATED (evento real que derrubou o webhook com 500)', () => {
    const payload = {
      id: 'evt_848100dd833f724812f6d2c02262b1b1&1482909985',
      event: 'ACCESS_TOKEN_CREATED',
      dateCreated: '2026-08-25 11:22:18',
      account: { id: 'be487f65-ab9f-4ae9-b5b4-cc9b4daa0ade', ownerId: null },
      accessToken: { id: '88870cad-e2ae-48ab-a9a0-2e6d0125c46e', name: 'zolieOficial', enabled: true },
    };
    expect(extractPaymentEvent(payload)).toBeNull();
  });

  it('ignora corpos que não são objetos', () => {
    expect(extractPaymentEvent(null)).toBeNull();
    expect(extractPaymentEvent(undefined)).toBeNull();
    expect(extractPaymentEvent('texto')).toBeNull();
    expect(extractPaymentEvent(42)).toBeNull();
  });

  it('ignora evento de cobrança com payment incompleto', () => {
    expect(extractPaymentEvent({ event: 'PAYMENT_CONFIRMED' })).toBeNull();
    expect(extractPaymentEvent({ event: 'PAYMENT_CONFIRMED', payment: null })).toBeNull();
    expect(extractPaymentEvent({ event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_1' } })).toBeNull();
    expect(extractPaymentEvent({ event: 'PAYMENT_CONFIRMED', payment: { status: 'CONFIRMED' } })).toBeNull();
    expect(extractPaymentEvent({ payment: { id: 'pay_1', status: 'CONFIRMED' } })).toBeNull();
  });

  it('extrai apenas os campos usados de um evento de cobrança válido', () => {
    const extracted = extractPaymentEvent({
      id: 'evt_1',
      event: 'PAYMENT_CONFIRMED',
      payment: { id: 'pay_1', status: 'CONFIRMED', value: 100, customer: 'cus_1' },
    });
    expect(extracted).toEqual({ event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_1', status: 'CONFIRMED' } });
  });
});
