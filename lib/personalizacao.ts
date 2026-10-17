import { z } from 'zod';

/**
 * Estrutura de personalização dos produtos marcados como `personalizado` no
 * admin. É a mesma para todas as peças personalizadas: a página do produto
 * mostra estas perguntas, a resposta vai junto do item na sacola e fica gravada
 * (como snapshot) no item do pedido, para a produção da peça.
 *
 * O tamanho da corrente não fica aqui: usa o `tamanho` normal do item (com as
 * opções vindas de `Product.tamanhos`), que já é exibido em todo o fluxo.
 */

export const LIMITE_IMAGENS_PERSONALIZACAO = 2;

export const FONTES_PERSONALIZACAO = [
  '01 verdana',
  '02 baskerville',
  '03 georgia',
  '04 pingfangTC-ligth',
  '05 timesnewromannPSmt',
  '06 savoyeLetPlain',
] as const;

/** Usado quando o produto personalizado não tem tamanhos cadastrados. */
export const CORRENTES_PADRAO = ['Corrente 45 cm'];

export const PERGUNTAS_PERSONALIZACAO = {
  imagens: 'Sua personalização tem imagens',
  imagensAjuda: `Inserir imagem (fique tranquilo, enviaremos a prévia para aprovação em 2 dias no seu WhatsApp) (Limite de ${LIMITE_IMAGENS_PERSONALIZACAO} arquivos)`,
  verso: 'Personalização no verso?',
  textoVerso: 'Deseja personalização no verso? Escreva aqui',
  pingente: 'Pingente zircônia de coração (cor aleatória - grátis)',
  fonte: 'Escolha a letra usada (caso possua escrita) - Verifique as opções na imagem do produto',
  corrente: 'Escolha o tamanho da corrente',
};

export const personalizacaoSchema = z
  .object({
    imagens: z.array(z.string().min(1).max(500)).max(LIMITE_IMAGENS_PERSONALIZACAO).default([]),
    verso: z.boolean({ required_error: 'Informe se deseja personalização no verso' }),
    textoVerso: z.string().trim().max(200).nullable().optional().transform(v => (v ? v : null)),
    pingente: z.boolean().default(true),
    fonte: z.enum(FONTES_PERSONALIZACAO).nullable().optional().transform(v => v ?? null),
  })
  .superRefine((p, ctx) => {
    if (p.verso && !p.textoVerso) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['textoVerso'], message: 'Escreva a personalização do verso' });
    }
  })
  // Sem verso, um texto digitado antes de trocar para "não" não deve ir para a produção.
  .transform(p => ({ ...p, textoVerso: p.verso ? p.textoVerso : null }));

export type Personalizacao = z.output<typeof personalizacaoSchema>;

/** Leitura tolerante do JSON gravado no banco (itens antigos ou malformados viram null). */
export function lerPersonalizacao(valor: unknown): Personalizacao | null {
  if (valor == null) return null;
  const r = personalizacaoSchema.safeParse(valor);
  return r.success ? r.data : null;
}

/** Linhas "pergunta: resposta" para exibir no carrinho, pedido e admin. */
export function resumoPersonalizacao(p: Personalizacao): { rotulo: string; valor: string }[] {
  return [
    { rotulo: 'Verso', valor: p.verso ? `Sim — "${p.textoVerso}"` : 'Não' },
    { rotulo: 'Pingente de coração', valor: p.pingente ? 'Com pingente' : 'Sem pingente' },
    { rotulo: 'Letra', valor: p.fonte || 'Não escolhida' },
    { rotulo: 'Imagens', valor: p.imagens.length > 0 ? `${p.imagens.length} enviada(s)` : 'Nenhuma' },
  ];
}
