/**
 * Cupom ganho na página do anúncio, guardado no navegador para ser aplicado
 * sozinho no carrinho e no checkout. Quem vem do Instagram não vai lembrar de
 * copiar e colar um código: se precisar digitar, o desconto se perde.
 *
 * O prazo de 48h vale por pessoa e é contado da primeira visita. É só do lado
 * do navegador; o limite real do cupom (validade da campanha, usos) é o que
 * estiver cadastrado no admin.
 */

const CHAVE = 'zolie:cupom-anuncio';
export const VALIDADE_CUPOM_MS = 48 * 3_600_000;

export interface CupomGuardado {
  codigo: string;
  expiraEm: number;
}

export function lerCupomGuardado(agora = Date.now()): CupomGuardado | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const c = JSON.parse(bruto) as CupomGuardado;
    if (typeof c?.codigo !== 'string' || typeof c?.expiraEm !== 'number') return null;
    if (c.expiraEm <= agora) {
      localStorage.removeItem(CHAVE);
      return null;
    }
    return c;
  } catch {
    // Armazenamento bloqueado: segue sem cupom automático.
    return null;
  }
}

/**
 * Guarda o cupom na primeira visita e devolve o que vale. Voltar à página não
 * renova o prazo — senão as 48h nunca acabariam.
 */
export function garantirCupomGuardado(codigo: string, agora = Date.now()): CupomGuardado {
  const atual = lerCupomGuardado(agora);
  if (atual && atual.codigo === codigo) return atual;
  const novo = { codigo, expiraEm: agora + VALIDADE_CUPOM_MS };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(novo));
  } catch {}
  return novo;
}

/** A cliente tirou o cupom no checkout: não reaplicar sozinho. */
export function esquecerCupomGuardado() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {}
}
