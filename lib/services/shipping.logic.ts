import { round } from '@/lib/utils/money';

/**
 * Caixa de envio (cm). As transportadoras cobram pelo volume da CAIXA, não da
 * semijoia — e todo pedido vai na mesma caixa de 16 x 11 x 5 cm, qualquer que
 * seja o tipo ou a quantidade de peças. Usada na cotação e na etiqueta.
 */
export const CAIXA_ENVIO = { length: 16, width: 11, height: 5 };

/** Peso considerado por peça quando o produto não tem `pesoGramas` cadastrado. */
export const PESO_PADRAO_GRAMAS = 150;

/** Peso da embalagem (caixa, papel, plástico-bolha) somado a todo envio. */
export const PESO_EMBALAGEM_GRAMAS = 80;

export interface ItemParaFrete {
  quantidade: number;
  /**
   * Aceita `Decimal` do Prisma (que expõe `toString`) além de number/string —
   * `Number()` converte os três corretamente.
   */
  pesoGramas?: number | string | { toString(): string } | null;
}

/**
 * Peso total do envio em kg. Antes o pacote era fixo em 150g independentemente do
 * conteúdo — um pedido com várias peças ia subdimensionado, e a transportadora
 * cobrava a diferença depois.
 */
export function calcularPesoKg(itens: ItemParaFrete[]): number {
  const gramas = itens.reduce((total, item) => {
    const peso = Number(item.pesoGramas) || PESO_PADRAO_GRAMAS;
    return total + peso * item.quantidade;
  }, PESO_EMBALAGEM_GRAMAS);

  // O Melhor Envio recusa peso 0 e trabalha com 3 casas em kg.
  return Math.max(0.05, Number((gramas / 1000).toFixed(3)));
}

/** Dimensões do pacote: sempre a caixa padrão da loja (ver CAIXA_ENVIO). */
export function calcularDimensoes() {
  return { ...CAIXA_ENVIO };
}

export function limparCep(cep: string): string {
  return String(cep || '').replace(/\D/g, '');
}

/**
 * Valores de contingência por região, usados só quando o Melhor Envio está
 * indisponível. Deliberadamente conservadores: é melhor absorver a diferença em
 * uma venda do que perder o checkout inteiro durante uma queda da API.
 *
 * Faixas conforme o primeiro dígito do CEP (padrão dos Correios).
 */
const FRETE_CONTINGENCIA: { faixa: [number, number]; regiao: string; valor: number; prazo: number }[] = [
  { faixa: [0, 1], regiao: 'São Paulo', valor: 24.9, prazo: 6 },
  { faixa: [2, 2], regiao: 'Rio de Janeiro / Espírito Santo', valor: 27.9, prazo: 7 },
  { faixa: [3, 3], regiao: 'Minas Gerais', valor: 27.9, prazo: 7 },
  { faixa: [4, 4], regiao: 'Bahia / Sergipe', valor: 31.9, prazo: 9 },
  { faixa: [5, 5], regiao: 'Nordeste', valor: 31.9, prazo: 9 },
  { faixa: [6, 6], regiao: 'Norte / Nordeste', valor: 34.9, prazo: 10 },
  { faixa: [7, 7], regiao: 'Centro-Oeste', valor: 31.9, prazo: 9 },
  { faixa: [8, 9], regiao: 'Sul', valor: 27.9, prazo: 8 },
];

export function freteContingencia(cep: string, gratis: boolean) {
  const primeiroDigito = Number(limparCep(cep)[0] ?? 9);
  const faixa =
    FRETE_CONTINGENCIA.find(f => primeiroDigito >= f.faixa[0] && primeiroDigito <= f.faixa[1]) ||
    FRETE_CONTINGENCIA[FRETE_CONTINGENCIA.length - 1];

  return {
    id: 'contingencia',
    nome: 'Frete padrão',
    prazoDias: faixa.prazo,
    valor: gratis ? 0 : round(faixa.valor),
    // Sinaliza para a UI que o valor é estimado, não uma cotação real.
    estimado: true as const,
  };
}
