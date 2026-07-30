const { repositories } = require('../repositories');
const { AppError } = require('../utils/errors');
const { round } = require('../utils/money');

/** Valida o cupom e devolve o desconto em reais para o subtotal informado. */
async function validar(codigo, { subtotal, userId = null, frete = 0 }) {
  const cupom = await repositories.coupons.findByCode(codigo);
  if (!cupom || !cupom.ativo) throw new AppError('Cupom inválido', 404, 'COUPON_NOT_FOUND');
  if (cupom.validade && new Date(cupom.validade) < new Date()) throw new AppError('Cupom expirado', 410, 'COUPON_EXPIRED');
  if (cupom.usoMaximo != null && cupom.usos >= cupom.usoMaximo) throw new AppError('Cupom esgotado', 410, 'COUPON_EXHAUSTED');
  if (cupom.minimoPedido != null && subtotal < Number(cupom.minimoPedido)) {
    throw new AppError('Este cupom vale em pedidos acima de R$ ' + Number(cupom.minimoPedido).toFixed(2), 422, 'COUPON_MIN_ORDER');
  }
  if (cupom.primeiraCompra && userId) {
    const pedidos = await repositories.users.countOrders(userId);
    if (pedidos > 0) throw new AppError('Cupom exclusivo para a primeira compra', 422, 'COUPON_FIRST_ORDER_ONLY');
  }

  let desconto = 0;
  let freteGratis = false;
  if (cupom.tipoDesconto === 'PERCENT') desconto = round(subtotal * Number(cupom.valor) / 100);
  else if (cupom.tipoDesconto === 'FIXED') desconto = round(Math.min(subtotal, Number(cupom.valor)));
  else if (cupom.tipoDesconto === 'FREE_SHIPPING') { freteGratis = true; desconto = 0; }

  return { cupom, desconto, freteGratis, freteAplicado: freteGratis ? 0 : frete };
}

module.exports = { validar };
