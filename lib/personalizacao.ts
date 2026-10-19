import { z } from 'zod';

/**
 * Estrutura de personalização dos produtos marcados como `personalizado` no
 * admin. As perguntas são as mesmas para todas as peças personalizadas; o que
 * muda por anúncio é configurado no cadastro:
 *  - os modelos vendidos, cada um com preço próprio (`Product.opcoesPersonalizacao`);
 *  - o acréscimo da gravação no verso (`Product.valorGravacaoVerso`);
 *  - os tamanhos de corrente (`Product.tamanhos`).
 *
 * A resposta da cliente vai junto do item na sacola e fica gravada (como
 * snapshot) no item do pedido, para a produção da peça. O tamanho da corrente
 * usa o `tamanho` normal do item, que já é exibido em todo o fluxo.
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

/** Tamanhos de corrente que o admin pode marcar no anúncio. */
export const CORRENTES_DISPONIVEIS = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map(cm => `Corrente ${cm} cm`);

/** Usado quando o produto personalizado não tem tamanhos cadastrados. */
export const CORRENTES_PADRAO = ['Corrente 45 cm'];

/** Tamanhos de medalha/pingente oferecidos no cadastro de cada modelo. */
export const TAMANHOS_MODELO = ['8mm', '10mm', '12mm', '14mm', '15mm', '16mm', '18mm', '20mm', '22mm', '25mm', '30mm'];

/** Sugestões de nome de modelo no cadastro (o campo aceita qualquer texto). */
export const MODELOS_SUGERIDOS = ['Escapulário', 'Placa retangular', 'Medalha redonda', 'Medalha coração'];

export const PERGUNTAS_PERSONALIZACAO = {
  modelo: 'Escolha o modelo',
  imagens: 'Sua personalização tem imagens',
  imagensAjuda: `Inserir imagem (fique tranquilo, enviaremos a prévia para aprovação em 2 dias no seu WhatsApp) (Limite de ${LIMITE_IMAGENS_PERSONALIZACAO} arquivos)`,
  verso: 'Personalização no verso?',
  textoVerso: 'Deseja personalização no verso? Escreva aqui',
  pingente: 'Pingente zircônia de coração (cor aleatória - grátis)',
  fonte: 'Escolha a letra usada (caso possua escrita) - Verifique as opções na imagem do produto',
  corrente: 'Escolha o tamanho da corrente',
};

// ---------------------------------------------------------------------------
// Modelos do anúncio (cadastro no admin)
// ---------------------------------------------------------------------------

export const opcaoPersonalizacaoSchema = z.object({
  id: z.string().min(1).max(50),
  modelo: z.string().trim().min(1, 'Informe o nome do modelo').max(80),
  tamanho: z.string().trim().max(20).nullable().optional().transform(v => (v ? v : null)),
  preco: z.number().positive('Informe o preço do modelo'),
});

export type OpcaoPersonalizacao = z.output<typeof opcaoPersonalizacaoSchema>;

/** Leitura tolerante do JSON do produto (malformado vira lista vazia). */
export function lerOpcoes(valor: unknown): OpcaoPersonalizacao[] {
  const r = z.array(opcaoPersonalizacaoSchema).safeParse(valor);
  return r.success ? r.data : [];
}

export function rotuloOpcao(o: Pick<OpcaoPersonalizacao, 'modelo' | 'tamanho'>): string {
  return o.tamanho ? `${o.modelo} ${o.tamanho}` : o.modelo;
}

// ---------------------------------------------------------------------------
// Escolhas da cliente (item da sacola / do pedido)
// ---------------------------------------------------------------------------

/** Só aceita arquivos que subiram pelo nosso upload (Vercel Blob ou storage local de dev). */
export function urlDoNossoStorage(url: string): boolean {
  if (url.startsWith('/images/produtos/')) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

const urlStorage = z.string().min(1).max(500).refine(urlDoNossoStorage, 'Arquivo de origem inválida');

export const personalizacaoSchema = z
  .object({
    modeloId: z.string().max(50).nullable().optional().transform(v => v ?? null),
    // Nome do modelo gravado pelo servidor no momento da compra (snapshot para o
    // pedido continuar legível mesmo se o modelo for removido do anúncio depois).
    modelo: z.string().max(120).nullable().optional().transform(v => v ?? null),
    imagens: z.array(urlStorage).max(LIMITE_IMAGENS_PERSONALIZACAO).default([]),
    verso: z.boolean({ required_error: 'Informe se deseja personalização no verso' }),
    textoVerso: z.string().trim().max(200).nullable().optional().transform(v => (v ? v : null)),
    pingente: z.boolean().default(true),
    fonte: z.enum(FONTES_PERSONALIZACAO).nullable().optional().transform(v => v ?? null),
    // Simulação com IA que a cliente viu antes de comprar (frente e verso).
    simulacao: z
      .object({ frente: urlStorage, verso: urlStorage })
      .nullable()
      .optional()
      .transform(v => v ?? null),
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

/**
 * Preço unitário de uma peça personalizada: preço do modelo escolhido (ou o
 * preço do produto, quando o anúncio não tem modelos) + acréscimo da gravação
 * no verso. `null` quando o anúncio tem modelos e o escolhido não existe mais.
 */
export function precoPersonalizado(
  produto: { precoBase: number; opcoes: OpcaoPersonalizacao[]; valorGravacaoVerso: number | null },
  escolha: { modeloId: string | null; verso: boolean | null },
): number | null {
  let base = produto.precoBase;
  if (produto.opcoes.length > 0) {
    const opcao = produto.opcoes.find(o => o.id === escolha.modeloId);
    if (!opcao) return null;
    base = opcao.preco;
  }
  const gravacao = escolha.verso ? produto.valorGravacaoVerso ?? 0 : 0;
  return Math.round((base + gravacao) * 100) / 100;
}

/** Linhas "pergunta: resposta" para exibir no carrinho, pedido e admin. */
export function resumoPersonalizacao(p: Personalizacao): { rotulo: string; valor: string }[] {
  return [
    ...(p.modelo ? [{ rotulo: 'Modelo', valor: p.modelo }] : []),
    { rotulo: 'Gravação no verso', valor: p.verso ? `Sim — "${p.textoVerso}"` : 'Não' },
    { rotulo: 'Pingente de coração', valor: p.pingente ? 'Com pingente' : 'Sem pingente' },
    { rotulo: 'Letra', valor: p.fonte || 'Não escolhida' },
    { rotulo: 'Imagens', valor: p.imagens.length > 0 ? `${p.imagens.length} enviada(s)` : 'Nenhuma' },
    ...(p.simulacao ? [{ rotulo: 'Simulação com IA', valor: 'Vista pela cliente antes da compra' }] : []),
  ];
}
