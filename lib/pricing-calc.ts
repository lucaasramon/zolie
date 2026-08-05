import { round } from '@/lib/utils/money';

export interface CalcularPrecoInput {
  custoSemijoia: number;
  custoEmbalagem: number;
  markupPercent: number;
}

export interface CalcularPrecoResult {
  custoTotal: number;
  precoSugerido: number;
  lucro: number;
}

// Markup sobre o custo: preco = custoTotal * (1 + markup%). Ex.: custo R$30 com
// markup de 200% = 30 * 3 = R$90 (o markup soma; a antiga "margem sobre venda"
// dividia e exigia converter a % mentalmente, então foi trocada por essa).
export function calcularPreco({ custoSemijoia, custoEmbalagem, markupPercent }: CalcularPrecoInput): CalcularPrecoResult {
  const custoTotal = round(Math.max(0, custoSemijoia) + Math.max(0, custoEmbalagem));
  const markup = Math.max(0, markupPercent);
  const precoSugerido = round(custoTotal * (1 + markup / 100));
  return { custoTotal, precoSugerido, lucro: round(precoSugerido - custoTotal) };
}
