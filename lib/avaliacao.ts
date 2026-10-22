/**
 * Recompensa por avaliação com foto: ao aprovar a avaliação no admin, a cliente
 * ganha um cupom pessoal (só ela vê e usa). Compartilhado entre o servidor, que
 * gera o cupom, e o formulário de avaliação, que anuncia a recompensa.
 */
export const CUPOM_AVALIACAO_FOTO = {
  percentual: 10,
  validadeDias: 60,
  prefixo: 'FOTO',
} as const;

/** Quantos dias depois da entrega o e-mail pedindo avaliação sai (dá tempo de usar a peça). */
export const DIAS_APOS_ENTREGA_PARA_PEDIR_AVALIACAO = 5;

/** Entregas mais antigas que isso não recebem o pedido (evita e-mail fora de contexto). */
export const JANELA_PEDIDO_AVALIACAO_DIAS = 30;
