/**
 * Dias úteis entre o pagamento e a postagem. A peça personalizada é gravada
 * depois da compra, então demora mais para sair do que a de pronta entrega.
 */
export const DIAS_PREPARO = { prontaEntrega: 2, personalizado: 5 } as const;

/** Prazo de preparo de um pedido: o da peça mais demorada (uma personalizada segura o pacote todo). */
export function diasPreparo(itens: { personalizacao?: unknown }[] | boolean | undefined): number {
  const personalizado = typeof itens === 'boolean' ? itens : (itens ?? []).some(i => i.personalizacao != null);
  return personalizado ? DIAS_PREPARO.personalizado : DIAS_PREPARO.prontaEntrega;
}

/**
 * Soma dias úteis (seg-sex, sem considerar feriados) a uma data — usado para
 * estimar a data de entrega a partir do prazo da transportadora, que é sempre
 * informado em dias úteis pelo Melhor Envio.
 */
export function somarDiasUteis(base: Date, dias: number): Date {
  const resultado = new Date(base);
  let restantes = dias;
  while (restantes > 0) {
    resultado.setDate(resultado.getDate() + 1);
    const diaSemana = resultado.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) restantes -= 1;
  }
  return resultado;
}

/** Volta `dias` úteis a partir de uma data (inverso de `somarDiasUteis`). */
export function subtrairDiasUteis(base: Date, dias: number): Date {
  const resultado = new Date(base);
  let restantes = dias;
  while (restantes > 0) {
    resultado.setDate(resultado.getDate() - 1);
    const diaSemana = resultado.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) restantes -= 1;
  }
  return resultado;
}

/**
 * Data prevista de entrega: preparo da peça + prazo da transportadora, a
 * partir da criação do pedido. null quando o pedido não tem prazo gravado.
 */
export function dataPrevisaoEntrega(createdAt: Date, prazoDiasEnvio: number | null, diasDePreparo = 0): Date | null {
  if (prazoDiasEnvio == null) return null;
  return somarDiasUteis(createdAt, diasDePreparo + prazoDiasEnvio);
}
