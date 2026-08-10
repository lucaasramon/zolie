import { env } from '@/lib/env';
import { round } from '@/lib/utils/money';
import * as siteConfig from '@/lib/services/site-config.service';

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
  const config = siteConfig.get();
  const subtotal = round(items.reduce((a, i) => a + precoEfetivo(i.product) * i.quantidade, 0));
  const freteGratisAtivo = config.freteGratisAtivo && subtotal >= env.business.freeShippingThreshold;
  const freteFinal = freteGratisAtivo ? 0 : round(frete);
  const total = round(Math.max(0, subtotal - desconto + freteFinal));
  const pixDiscountPercent = config.descontoPixAtivo ? env.business.pixDiscountPercent : 0;
  const pix = round(total * (1 - pixDiscountPercent / 100));
  return {
    subtotal,
    frete: freteFinal,
    freteGratis: freteFinal === 0,
    faltaParaFreteGratis: config.freteGratisAtivo ? round(Math.max(0, env.business.freeShippingThreshold - subtotal)) : 0,
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
