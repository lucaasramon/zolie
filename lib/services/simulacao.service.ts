import { randomUUID } from 'crypto';
import { unstable_cache } from 'next/cache';
import { BadRequestError, toFile } from 'openai';
import { env } from '@/lib/env';
import { getOpenAIClient } from '@/lib/openai-client';
import { productRepo } from '@/lib/repositories/product.repo';
import { storage } from '@/lib/storage';
import { AppError, notFound } from '@/lib/utils/errors';
import { detectImageMime } from '@/lib/utils/fileSignature';
import { logger } from '@/lib/logger';
import { lerOpcoes, personalizacaoSchema, rotuloOpcao } from '@/lib/personalizacao';
import {
  ANALISE_SCHEMA,
  AnalisePeca,
  aprovada,
  comCorrecoes,
  ContextoSimulacao,
  Lado,
  descreverModelo,
  promptAnalise,
  promptFrente,
  promptVerificacao,
  promptVerso,
  VERIFICACAO_SCHEMA,
  Verificacao,
} from '@/lib/simulacao/prompt';

/**
 * Simulação com IA de como vai ficar a peça personalizada (frente e verso).
 *
 * Pipeline, pensado para a peça sair IGUAL ao anúncio:
 *  1. análise: um modelo de visão descreve a peça da foto do anúncio com precisão
 *     (cacheada por foto) — essa descrição vira o "contrato" do prompt de imagem;
 *  2. geração: o modelo de imagem EDITA a foto do anúncio (nunca gera do zero),
 *     frente e verso em paralelo;
 *  3. verificação: a visão compara cada resultado com a foto oficial (modelo,
 *     texto letra a letra, foto da cliente, extras);
 *  4. correção: o lado reprovado é refeito uma vez com a lista de problemas,
 *     se ainda houver tempo dentro do limite da função.
 *
 * A geração é o que mais demora, então as prévias vão para a cliente enquanto a
 * imagem se forma. O resultado final só sai depois da verificação e da correção.
 */

const MAX_FOTOS_PRODUTO = 3;
const MAX_BYTES_IMAGEM = 15 * 1024 * 1024;
// Limite da função na Vercel é 300s (ver maxDuration na rota). Cada geração tem
// teto próprio e a correção só roda se ainda couber mais uma geração inteira —
// melhor entregar a 1ª versão do que estourar o tempo e não entregar nada.
const TIMEOUT_GERACAO_MS = 110_000;
const TIMEOUT_VISAO_MS = 30_000;
const PRAZO_PARA_CORRECAO_MS = 120_000;
const PREVIAS_POR_LADO = 2;

export type EventoSimulacao =
  | { tipo: 'previa'; lado: Lado; imagem: string }
  | { tipo: 'concluida'; frente: string; verso: string }
  | { tipo: 'erro'; mensagem: string };

interface ImagemBaixada {
  bytes: Buffer;
  mime: string;
  /** URL pública (enviada direto à visão) ou data URL quando a imagem é local. */
  urlParaVisao: string;
}

const urlAbsoluta = (url: string) => (/^https?:\/\//i.test(url) ? url : `${env.appUrl}${url.startsWith('/') ? '' : '/'}${url}`);

async function baixarImagem(url: string): Promise<ImagemBaixada> {
  const abs = urlAbsoluta(url);
  const res = await fetch(abs, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Falha ao baixar imagem ${abs}: ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES_IMAGEM) throw new AppError('Imagem muito grande para simular', 422, 'IMAGE_TOO_LARGE');
  const mime = detectImageMime(bytes);
  if (!mime) throw new AppError('Formato de imagem não suportado na simulação', 422, 'INVALID_FILE_TYPE');
  const publica = /^https:\/\//i.test(abs) && !abs.includes('localhost');
  return { bytes, mime, urlParaVisao: publica ? abs : `data:${mime};base64,${bytes.toString('base64')}` };
}

const extensao = (mime: string) => (mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg');

async function visao<T>(prompt: string, imagens: string[], schema: { name: string; strict: boolean; schema: object }): Promise<T> {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: env.simulacao.modeloVisao,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imagens.map(url => ({ type: 'image_url' as const, image_url: { url, detail: 'high' as const } })),
        ],
      },
    ],
    response_format: { type: 'json_schema', json_schema: schema as never },
  }, { timeout: TIMEOUT_VISAO_MS, maxRetries: 0 });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Resposta vazia do modelo de visão');
  return JSON.parse(raw) as T;
}

// Análise por foto de capa: a peça não muda entre simulações, então reaproveita.
// O Map evita ida ao cache na mesma instância; o cache do Next vale entre instâncias
// e deploys. A chave já muda quando o produto é editado.
const cacheAnalise = new Map<string, AnalisePeca>();

async function analisarPeca(chave: string, modelo: string | null, fotos: ImagemBaixada[]): Promise<AnalisePeca | null> {
  const emCache = cacheAnalise.get(chave);
  if (emCache) return emCache;
  try {
    const analise = await unstable_cache(
      () => visao<AnalisePeca>(promptAnalise(modelo), fotos.map(f => f.urlParaVisao), ANALISE_SCHEMA),
      ['simulacao-analise', chave],
    )();
    if (cacheAnalise.size > 200) cacheAnalise.clear();
    cacheAnalise.set(chave, analise);
    return analise;
  } catch (err) {
    // Sem a análise o prompt continua completo (só perde o reforço descritivo).
    logger.warn('Análise da peça para simulação falhou; seguindo sem ela', { erro: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

async function parametrosGeracao(prompt: string, entradas: ImagemBaixada[]) {
  const arquivos = await Promise.all(
    entradas.map((img, i) => toFile(img.bytes, `entrada-${i + 1}.${extensao(img.mime)}`, { type: img.mime })),
  );
  return {
    model: env.simulacao.modeloImagem,
    image: arquivos,
    prompt,
    size: '1024x1024' as const,
    quality: env.simulacao.qualidade,
    output_format: 'jpeg' as const,
    output_compression: 90,
    n: 1,
  };
}

async function gerar(prompt: string, entradas: ImagemBaixada[]): Promise<Buffer> {
  const openai = getOpenAIClient();
  const res = await openai.images.edit(await parametrosGeracao(prompt, entradas), { timeout: TIMEOUT_GERACAO_MS, maxRetries: 0 });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error('Modelo de imagem não retornou imagem');
  return Buffer.from(b64, 'base64');
}

/** Mesma geração de `gerar`, avisando cada prévia enquanto a imagem se forma. */
async function gerarComPrevias(prompt: string, entradas: ImagemBaixada[], aoPrevia: (b64: string) => void): Promise<Buffer> {
  const openai = getOpenAIClient();
  try {
    // `signal` porque o `timeout` do SDK não cobre a leitura de todo o stream: ao
    // abortar, o stream só termina em silêncio e cai no erro de "não retornou imagem".
    const stream = await openai.images.edit(
      { ...(await parametrosGeracao(prompt, entradas)), stream: true, partial_images: PREVIAS_POR_LADO },
      { signal: AbortSignal.timeout(TIMEOUT_GERACAO_MS), maxRetries: 0 },
    );
    for await (const evento of stream) {
      if (evento.type === 'image_edit.partial_image') aoPrevia(evento.b64_json);
      else if (evento.type === 'image_edit.completed') return Buffer.from(evento.b64_json, 'base64');
    }
    throw new Error('Modelo de imagem não retornou imagem');
  } catch (err) {
    if (!(err instanceof BadRequestError)) throw err;
    // Modelo sem suporte a prévias (a OpenAI não garante isso em todos): perde só a
    // prévia. Uma recusa real volta a falhar na geração normal e segue como erro.
    logger.warn('Geração com prévias recusada; gerando sem prévias', { erro: err.message });
    return gerar(prompt, entradas);
  }
}

async function verificar(
  lado: Lado,
  ctx: ContextoSimulacao,
  fotosProduto: ImagemBaixada[],
  fotosCliente: ImagemBaixada[],
  gerada: Buffer,
): Promise<Verificacao | null> {
  try {
    const imagens = [
      ...fotosProduto.map(f => f.urlParaVisao),
      ...(lado === 'frente' ? fotosCliente.map(f => f.urlParaVisao) : []),
      `data:image/jpeg;base64,${gerada.toString('base64')}`,
    ];
    const prompt = promptVerificacao(
      {
        lado,
        modelo: ctx.modelo,
        textoVerso: ctx.textoVerso,
        fotosCliente: ctx.fotosCliente,
      },
      fotosProduto.length,
    );
    return await visao<Verificacao>(prompt, imagens, VERIFICACAO_SCHEMA);
  } catch (err) {
    logger.warn('Verificação da simulação falhou; mantendo a imagem gerada', { lado, erro: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

async function gerarLado(
  lado: Lado,
  ctx: ContextoSimulacao,
  fotosProduto: ImagemBaixada[],
  fotosCliente: ImagemBaixada[],
  inicio: number,
  aoEvento: (evento: EventoSimulacao) => void,
): Promise<{ imagem: Buffer; aprovada: boolean | null }> {
  // A foto oficial vai sempre primeiro: é a imagem editada (Image 1 nos prompts).
  // As fotos da cliente só entram na frente — no verso elas não podem aparecer.
  const entradas = lado === 'frente' ? [...fotosProduto, ...fotosCliente] : fotosProduto;
  const promptLado = lado === 'frente' ? promptFrente(ctx) : promptVerso({ ...ctx, fotosCliente: 0 });

  const enviarPrevia = (b64: string) => aoEvento({ tipo: 'previa', lado, imagem: `data:image/jpeg;base64,${b64}` });
  const primeira = await gerarComPrevias(promptLado, entradas, enviarPrevia);
  enviarPrevia(primeira.toString('base64'));
  const v = await verificar(lado, ctx, fotosProduto, fotosCliente, primeira);
  if (!v || aprovada(v)) return { imagem: primeira, aprovada: v ? true : null };

  if (Date.now() - inicio > PRAZO_PARA_CORRECAO_MS) return { imagem: primeira, aprovada: false };
  logger.info('Simulação reprovada na verificação; gerando de novo com correções', { lado, problemas: v.problemas });
  try {
    const segunda = await gerar(comCorrecoes(promptLado, v.problemas), entradas);
    return { imagem: segunda, aprovada: null };
  } catch (err) {
    logger.warn('Correção da simulação falhou; entregando a 1ª versão', { lado, erro: err instanceof Error ? err.message : String(err) });
    return { imagem: primeira, aprovada: false };
  }
}

export interface SimularInput {
  productId: string;
  tamanho?: string | null;
  personalizacao?: unknown;
}

/**
 * Valida, baixa as fotos e analisa a peça: o que dá errado aqui ainda vira uma
 * resposta HTTP normal. A função devolvida faz a geração, já com a resposta aberta.
 */
export async function prepararSimulacao({ productId, tamanho, personalizacao }: SimularInput) {
  if (!env.openai.apiKey) throw new AppError('Simulação indisponível no momento', 503, 'SIMULATION_UNAVAILABLE');

  const produto = await productRepo.findById(productId);
  if (!produto || !produto.ativo) throw notFound('Produto');
  if (!produto.personalizado) throw new AppError('Este produto não é personalizado', 422, 'NOT_PERSONALIZED');
  if (!produto.imagens?.length) throw new AppError('Este anúncio ainda não tem foto para simular', 422, 'NO_PRODUCT_IMAGE');

  // O schema já recusa fotos que não vieram do nosso upload.
  const p = personalizacaoSchema.parse(personalizacao);
  const opcoes = lerOpcoes(produto.opcoesPersonalizacao);
  const opcao = opcoes.find(o => o.id === p.modeloId);
  if (opcoes.length > 0 && !opcao) throw new AppError('Escolha o modelo da peça', 422, 'INVALID_PERSONALIZATION_OPTION');

  const inicio = Date.now();
  const [fotosProduto, fotosCliente] = await Promise.all([
    Promise.all(produto.imagens.slice(0, MAX_FOTOS_PRODUTO).map(baixarImagem)),
    Promise.all(p.imagens.map(baixarImagem)),
  ]);

  // Nome do modelo + significado em inglês (ex: "Medalha Coração" → heart-shaped).
  const modelo = opcao ? descreverModelo(rotuloOpcao(opcao)) : null;
  const analise = await analisarPeca(`${produto.id}:${modelo}:${produto.updatedAt.getTime()}`, modelo, fotosProduto);

  const ctx: ContextoSimulacao = {
    nomeProduto: produto.nome,
    material: produto.material,
    modelo,
    corrente: tamanho || produto.tamanhos[0] || null,
    fotosProduto: fotosProduto.length,
    fotosCliente: fotosCliente.length,
    textoVerso: p.verso ? p.textoVerso : null,
    analise,
  };

  return async function executar(aoEvento: (evento: EventoSimulacao) => void) {
    let frente, verso;
    try {
      [frente, verso] = await Promise.all([
        gerarLado('frente', ctx, fotosProduto, fotosCliente, inicio, aoEvento),
        gerarLado('verso', ctx, fotosProduto, fotosCliente, inicio, aoEvento),
      ]);
    } catch (err) {
      logger.error('Falha ao gerar simulação de peça personalizada', err, { productId, produto: produto.nome });
      throw new AppError('Não conseguimos gerar a simulação agora. Tente de novo em instantes.', 502, 'SIMULATION_FAILED');
    }

    const id = randomUUID();
    const [urlFrente, urlVerso] = await Promise.all([
      storage.save(`simulacao-${id}-frente.jpg`, frente.imagem),
      storage.save(`simulacao-${id}-verso.jpg`, verso.imagem),
    ]);

    logger.info('Simulação de peça personalizada gerada', {
      productId,
      segundos: Math.round((Date.now() - inicio) / 1000),
      frenteAprovada: frente.aprovada,
      versoAprovada: verso.aprovada,
    });

    return {
      frente: urlFrente.url,
      verso: urlVerso.url,
    };
  };
}
