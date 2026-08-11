import { couponRepo } from '@/lib/repositories/coupon.repo';
import { userRepo } from '@/lib/repositories/user.repo';
import { AppError } from '@/lib/utils/errors';
import { round } from '@/lib/utils/money';

interface ValidarOpts {
  subtotal: number;
  userId?: string | null;
  frete?: number;
}

/** Valida o cupom e devolve o desconto em reais para o subtotal informado. */
export async function validar(codigo: string, { subtotal, userId = null, frete = 0 }: ValidarOpts) {
  const cupom = await couponRepo.findByCode(codigo);
  if (!cupom || !cupom.ativo) throw new AppError('Cupom inválido', 404, 'COUPON_NOT_FOUND');
  if (cupom.validade && new Date(cupom.validade) < new Date()) throw new AppError('Cupom expirado', 410, 'COUPON_EXPIRED');
  if (cupom.usoMaximo != null && cupom.usos >= cupom.usoMaximo) throw new AppError('Cupom esgotado', 410, 'COUPON_EXHAUSTED');
  if (cupom.minimoPedido != null && subtotal < Number(cupom.minimoPedido)) {
    throw new AppError(
      `Este cupom vale em pedidos acima de R$ ${Number(cupom.minimoPedido).toFixed(2)}`,
      422,
      'COUPON_MIN_ORDER',
    );
  }
  if (cupom.restricaoCompra) {
    // Sem conta não há como verificar em qual compra o cliente está: em vez de
    // liberar o cupom sem checagem, exige login (evita reuso ilimitado por convidado).
    if (!userId) {
      throw new AppError('Este cupom é exclusivo para clientes com conta. Crie uma conta gratuita para usá-lo.', 422, 'COUPON_REQUIRES_ACCOUNT');
    }
    const pedidos = await userRepo.countOrders(userId);
    if (cupom.restricaoCompra === 'PRIMEIRA' && pedidos > 0) {
      throw new AppError('Cupom exclusivo para a primeira compra', 422, 'COUPON_FIRST_ORDER_ONLY');
    }
    if (cupom.restricaoCompra === 'SEGUNDA' && pedidos !== 1) {
      throw new AppError('Cupom exclusivo para a segunda compra', 422, 'COUPON_SECOND_ORDER_ONLY');
    }
  }

  // Uso único por pessoa: o contador `usos` acima é só global (soma todo mundo),
  // então sem essa checagem qualquer cliente logado poderia reaplicar o mesmo
  // código em toda compra. Convidado não passa por aqui — não há identidade
  // fixa pra checar, e cupons restritos por etapa de compra já exigem login acima.
  if (userId) {
    const jaResgatado = await couponRepo.hasRedeemed(cupom.id, userId);
    if (jaResgatado) throw new AppError('Você já utilizou este cupom', 422, 'COUPON_ALREADY_USED');
  }

  let desconto = 0;
  let freteGratis = false;
  if (cupom.tipoDesconto === 'PERCENT') desconto = round((subtotal * Number(cupom.valor)) / 100);
  else if (cupom.tipoDesconto === 'FIXED') desconto = round(Math.min(subtotal, Number(cupom.valor)));
  else if (cupom.tipoDesconto === 'FREE_SHIPPING') {
    freteGratis = true;
    desconto = 0;
  }

  return { cupom, desconto, freteGratis, freteAplicado: freteGratis ? 0 : frete };
}

/** Cupons que o usuário logado pode usar agora: ativos, válidos, não esgotados,
 * compatíveis com a etapa de compra dele e ainda não resgatados por ele. */
export async function listarDisponiveis(userId: string) {
  const [ativos, pedidos] = await Promise.all([
    couponRepo.listActive(),
    userRepo.countOrders(userId),
  ]);

  const elegiveis = ativos.filter(c => {
    if (c.usoMaximo != null && c.usos >= c.usoMaximo) return false;
    if (c.restricaoCompra === 'PRIMEIRA' && pedidos > 0) return false;
    if (c.restricaoCompra === 'SEGUNDA' && pedidos !== 1) return false;
    return true;
  });

  const resgates = await Promise.all(elegiveis.map(c => couponRepo.hasRedeemed(c.id, userId)));
  return elegiveis.filter((_, i) => !resgates[i]);
}
