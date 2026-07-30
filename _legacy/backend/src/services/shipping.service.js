const { env } = require('../config/env');
const { round } = require('../utils/money');

/**
 * Cálculo de frete mockado. Trocar por integração real (Correios/Melhor Envio)
 * mantendo esta mesma assinatura.
 */
async function cotar(cep, subtotal = 0) {
  const limpo = String(cep || '').replace(/\D/g, '');
  if (limpo.length !== 8) {
    const err = new Error('CEP inválido');
    err.status = 422;
    throw err;
  }
  const regiao = Number(limpo[0]);
  const fator = regiao <= 1 ? 1 : regiao <= 3 ? 1.2 : 1.45;
  const gratis = subtotal >= env.business.freeShippingThreshold;
  return {
    cep: limpo.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
    opcoes: [
      { id: 'pac', nome: 'Correios PAC', prazoDias: Math.ceil(5 * fator), valor: gratis ? 0 : round(21.9 * fator) },
      { id: 'sedex', nome: 'Sedex', prazoDias: Math.ceil(2 * fator), valor: gratis ? 0 : round(32.9 * fator) }
    ],
    freteGratisAplicado: gratis
  };
}

module.exports = { cotar };
