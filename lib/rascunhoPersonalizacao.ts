import type { PersonalizacaoState } from '@/components/product/PersonalizacaoForm';
import type { ResultadoSimulacao } from '@/components/product/SimulacaoIA';

/**
 * Rascunho da personalização guardado no navegador, por produto. A página do
 * produto o restaura ao abrir; a página do anúncio (/s/gravacao) o escreve
 * para a cliente chegar ao produto com a peça que montou já preenchida.
 */

/** A personalização em andamento fica guardada no navegador por uma semana. */
export const RASCUNHO_VALIDADE_MS = 7 * 86_400_000;

export const chaveRascunho = (productId: string) => `zolie:personalizacao:${productId}`;

export interface Rascunho {
  personalizacao: PersonalizacaoState;
  tamanho: string;
  simulacao: ResultadoSimulacao | null;
  salvoEm: number;
}

export function salvarRascunho(productId: string, rascunho: Rascunho) {
  try {
    localStorage.setItem(chaveRascunho(productId), JSON.stringify(rascunho));
  } catch {
    // Sem armazenamento: a cliente só não chega com a peça preenchida.
  }
}
