const { randomUUID } = require('crypto');
const { env } = require('../config/env');

/**
 * Gateway mockado. A interface é a que um provedor real (Pagar.me, Mercado Pago,
 * Stripe) expõe — trocar o corpo por chamadas HTTP mantendo o retorno.
 */
async function criarCobranca({ order, formaPagamento, parcelas = 1 }) {
  const id = 'pay_' + randomUUID().slice(0, 12);
  if (formaPagamento === 'PIX') {
    return {
      id, provider: env.paymentProvider || 'mock', metodo: 'PIX', status: 'PENDENTE',
      valor: order.total, expiraEm: new Date(Date.now() + 30 * 60000),
      qrCode: 'MOCK-PIX-' + order.numero,
      copiaECola: '00020126MOCK' + order.numero.replace(/\D/g, '') + '5204000053039865802BR'
    };
  }
  if (formaPagamento === 'BOLETO') {
    return {
      id, provider: 'mock', metodo: 'BOLETO', status: 'PENDENTE', valor: order.total,
      vencimento: new Date(Date.now() + 3 * 86400000),
      linhaDigitavel: '00190.00009 01234.567004 00123.456780 1 99990000' + String(Math.round(order.total * 100)),
      url: 'https://exemplo.mock/boleto/' + order.numero
    };
  }
  return {
    id, provider: 'mock', metodo: 'CARTAO_CREDITO', status: 'APROVADO',
    valor: order.total, parcelas, valorParcela: Math.round((order.total / parcelas) * 100) / 100,
    autorizacao: 'AUTH-' + id.toUpperCase()
  };
}

/** Webhook do provedor -> muda o status do pedido. Assinatura pronta para o real. */
async function processarWebhook(payload) {
  return { recebido: true, evento: payload && payload.evento ? payload.evento : 'desconhecido' };
}

module.exports = { criarCobranca, processarWebhook };
