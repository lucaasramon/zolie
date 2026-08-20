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

/** Data prevista de entrega — null quando o pedido não tem prazo gravado. */
export function dataPrevisaoEntrega(createdAt: Date, prazoDiasEnvio: number | null): Date | null {
  if (prazoDiasEnvio == null) return null;
  return somarDiasUteis(createdAt, prazoDiasEnvio);
}
