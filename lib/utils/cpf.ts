/** Remove máscara: pontos, traços e qualquer não-dígito. */
export function normalizarCpf(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Valida CPF pelo algoritmo dos dígitos verificadores (módulo 11).
 * Aceita com ou sem máscara. Rejeita sequências repetidas (000..., 111...),
 * que passam no cálculo mas não são CPFs reais.
 */
export function cpfValido(valor: string): boolean {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digitos = cpf.split('').map(Number);

  for (const [posicao, pesoInicial] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let soma = 0;
    for (let i = 0; i < posicao; i++) soma += digitos[i] * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    const esperado = resto === 10 ? 0 : resto;
    if (esperado !== digitos[posicao]) return false;
  }

  return true;
}

/** Formata 11 dígitos como 000.000.000-00. Devolve a entrada se não for um CPF válido. */
export function formatarCpf(valor: string): string {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11) return valor;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
