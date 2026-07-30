import { env } from '@/lib/env';
import { round } from '@/lib/utils/money';

interface PricedProduct {
  preco: unknown;
  precoPromocional: unknown;
}

export function precoEfetivo(p: PricedProduct): number {
  return Number(p.precoPromocional ?? p.preco);
}

interface ResumoItem {
  product: PricedProduct;
  quantidade: number;
}

interface ResumoOpts {
  frete?: number;
  desconto?: number;
  formaPagamento?: string;
}

/** Resumo financeiro de um conjunto de itens. Fonte única de verdade de preço. */
export function resumo(items: ResumoItem[], { frete = 0, desconto = 0, formaPagamento = 'CARTAO_CREDITO' }: ResumoOpts = {}) {
  const subtotal = round(items.reduce((a, i) => a + precoEfetivo(i.product) * i.quantidade, 0));
  const freteFinal = subtotal >= env.business.freeShippingThreshold ? 0 : round(frete);
  const total = round(Math.max(0, subtotal - desconto + freteFinal));
  const pix = round(total * (1 - env.business.pixDiscountPercent / 100));
  return {
    subtotal,
    frete: freteFinal,
    freteGratis: freteFinal === 0,
    faltaParaFreteGratis: round(Math.max(0, env.business.freeShippingThreshold - subtotal)),
    desconto: round(desconto),
    total,
    totalPix: pix,
    formaPagamento,
    parcelamento: {
      maxParcelas: env.business.maxInstallments,
      valorParcela: round(total / env.business.maxInstallments),
    },
  };
}
