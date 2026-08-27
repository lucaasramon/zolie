import { z } from 'zod';
import { productRepo } from '@/lib/repositories/product.repo';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { decorate, list as listProdutos } from '@/lib/services/product.service';
import { getOpenAIClient } from '@/lib/openai-client';
import { env } from '@/lib/env';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/logger';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

type ProdutoContexto = {
  nome: string;
  slug: string;
  categoria: string | null;
  material: string;
  preco: number;
  disponivel: boolean;
};

// Palavras-chave simples para direcionar a busca de produtos candidatos a partir
// do texto da cliente — não é NLU de verdade, só reduz o conjunto antes de montar
// o prompt (o catálogo é pequeno o bastante para não precisar de mais que isso).
const PISTAS_CATEGORIA: Record<string, string> = {
  anel: 'aneis',
  aneis: 'aneis',
  colar: 'colares',
  colares: 'colares',
  brinco: 'brincos',
  brincos: 'brincos',
  pulseira: 'pulseiras',
  pulseiras: 'pulseiras',
  conjunto: 'conjuntos',
  conjuntos: 'conjuntos',
};

const PISTAS_MATERIAL: Record<string, string> = {
  prata: 'PRATA_925',
  dourado: 'BANHADO_OURO',
  ouro: 'BANHADO_OURO',
  dourada: 'BANHADO_OURO',
};

function extrairSinais(messages: ChatMessage[]) {
  const texto = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  let categoria: string | undefined;
  for (const [pista, slug] of Object.entries(PISTAS_CATEGORIA)) {
    if (texto.includes(pista)) {
      categoria = slug;
      break;
    }
  }

  let material: string | undefined;
  for (const [pista, valor] of Object.entries(PISTAS_MATERIAL)) {
    if (texto.includes(pista)) {
      material = valor;
      break;
    }
  }

  return { categoria, material };
}

/** Busca produtos candidatos para dar à IA algo real para recomendar — nunca a IA "inventa" um produto fora desta lista. */
export async function buildProductContext(messages: ChatMessage[]): Promise<ProdutoContexto[]> {
  const { categoria, material } = extrairSinais(messages);

  const { items } = await listProdutos(
    { categoria, material },
    categoria || material ? 'relevancia' : 'relevancia',
    { skip: 0, take: 18 },
  );

  // Sem sinal nenhum ainda (início da conversa): não faz sentido devolver 0 produtos.
  const base = items.length > 0 ? items : (await listProdutos({ destaque: true }, 'relevancia', { skip: 0, take: 18 })).items;

  return base.map(p => ({
    nome: p.nome,
    slug: p.slug,
    categoria: p.categoria?.nome ?? null,
    material: p.material,
    preco: p.precoEfetivo,
    disponivel: p.disponivel,
  }));
}

export function buildSystemPrompt(produtos: ProdutoContexto[], categorias: string[]) {
  return `Você é o assistente de compras virtual da Zoliê, uma loja de semijoias. Seu papel é ajudar a cliente a descobrir exatamente qual peça combina com ela, com tom acolhedor, caloroso e sem jargão de moda não explicado — muitas clientes são indecisas ou não têm familiaridade com moda, então trate isso com paciência.

Regras obrigatórias:
1. Faça no máximo UMA pergunta por vez (nunca varias perguntas na mesma mensagem).
2. Sempre que fizer sentido, sugira de 2 a 4 "quickReplies" (respostas rápidas objetivas) para facilitar quem trava diante de um campo de texto livre. Inclua sempre uma opção de escape tipo "Não sei, me ajuda a escolher" quando a pergunta puder confundir.
3. NUNCA mencione produto, preço ou material que não esteja na lista de produtos disponíveis fornecida abaixo. Não invente peças, categorias ou preços.
4. Categorias existentes na loja: ${categorias.join(', ')}.
5. Quando já tiver informação suficiente (tipicamente ocasião + preferência de material ou estilo, geralmente após 3 a 6 mensagens da cliente), conclua a consultoria: escreva uma frase de fechamento calorosa e preencha "recommendationSlugs" com 2 a 4 slugs da lista abaixo que melhor atendem ao que foi conversado.
6. Se a cliente perguntar algo fora do tema (moda, joias, ocasiões, presentes, a loja), redirecione com gentileza de volta ao assunto, sem recusa seca.
7. Se a mensagem da cliente for só um cumprimento ("oi", "olá") ou vaga ("não sei o que quero"), dê boas-vindas e comece com a primeira pergunta (ex: para quem ou qual ocasião é a peça).

Produtos disponíveis agora (use SOMENTE estes; formato JSON):
${JSON.stringify(produtos)}

Responda SEMPRE em JSON válido no formato:
{ "reply": string, "quickReplies": string[], "recommendationSlugs": string[] }

"quickReplies" e "recommendationSlugs" podem ser arrays vazios quando não se aplicam. "recommendationSlugs" só deve ser preenchido quando a consultoria estiver de fato concluída.`;
}

const respostaIaSchema = z.object({
  reply: z.string(),
  quickReplies: z.array(z.string()).max(4).optional().default([]),
  recommendationSlugs: z.array(z.string()).max(6).optional().default([]),
});

export type ConsultoriaChatResult = {
  reply: string;
  quickReplies: string[];
  recommendations: ReturnType<typeof decorate>[];
};

export async function chat(messages: ChatMessage[]): Promise<ConsultoriaChatResult> {
  const [produtos, categorias] = await Promise.all([
    buildProductContext(messages),
    categoryRepo.list(),
  ]);

  const systemPrompt = buildSystemPrompt(produtos, categorias.map(c => c.nome));

  let raw: string | null;
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    logger.error('Falha ao chamar a OpenAI na consultoria de estilo', err);
    throw new AppError(
      'Nosso assistente de compras está indisponível no momento. Tente novamente em instantes ou fale com a gente pelo WhatsApp.',
      503,
      'CONSULTORIA_INDISPONIVEL',
    );
  }

  if (!raw) {
    throw new AppError(
      'Nosso assistente de compras está indisponível no momento. Tente novamente em instantes ou fale com a gente pelo WhatsApp.',
      503,
      'CONSULTORIA_INDISPONIVEL',
    );
  }

  let parsed: z.infer<typeof respostaIaSchema>;
  try {
    parsed = respostaIaSchema.parse(JSON.parse(raw));
  } catch (err) {
    logger.error('Resposta da OpenAI fora do formato esperado na consultoria de estilo', err, { raw });
    throw new AppError(
      'Nosso assistente de compras está indisponível no momento. Tente novamente em instantes ou fale com a gente pelo WhatsApp.',
      503,
      'CONSULTORIA_INDISPONIVEL',
    );
  }

  // Proteção contra alucinação residual: só produtos que realmente existem e
  // estão ativos chegam ao cliente, mesmo que a IA tenha citado outro slug.
  let recommendations: ReturnType<typeof decorate>[] = [];
  if (parsed.recommendationSlugs.length > 0) {
    const encontrados = await Promise.all(parsed.recommendationSlugs.map(slug => productRepo.findBySlug(slug)));
    recommendations = encontrados
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(decorate);
  }

  return {
    reply: parsed.reply,
    quickReplies: parsed.quickReplies,
    recommendations,
  };
}
