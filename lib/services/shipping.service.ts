import { env } from '@/lib/env';
import { round } from '@/lib/utils/money';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/logger';
import {
  calcularPesoKg,
  calcularDimensoes,
  limparCep,
  freteContingencia,
  ItemParaFrete,
} from '@/lib/services/shipping.logic';

const CACHE_TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;

interface MelhorEnvioOption {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  error?: string;
}

export interface OpcaoFrete {
  id: string;
  nome: string;
  prazoDias: number;
  valor: number;
  estimado?: boolean;
}

export interface CotacaoFrete {
  cep: string;
  opcoes: OpcaoFrete[];
  freteGratisAplicado: boolean;
  /** true quando as opções vieram da tabela de contingência, não do Melhor Envio. */
  estimado?: boolean;
}

interface EntradaCache {
  expiraEm: number;
  opcoes: OpcaoFrete[];
}

/**
 * Cache em memória do processo. Em serverless cada instância tem o próprio, o que
 * reduz — sem eliminar — as chamadas repetidas. As opções são guardadas com o
 * valor bruto; a regra de frete grátis é aplicada depois, porque depende do
 * subtotal do carrinho e não da rota.
 */
const cache = new Map<string, EntradaCache>();

function chaveCache(cep: string, pesoKg: number) {
  return `${cep}:${pesoKg}`;
}

function lerCache(chave: string): OpcaoFrete[] | null {
  const entrada = cache.get(chave);
  if (!entrada) return null;
  if (Date.now() > entrada.expiraEm) {
    cache.delete(chave);
    return null;
  }
  return entrada.opcoes;
}

function gravarCache(chave: string, opcoes: OpcaoFrete[]) {
  // Limite simples de tamanho: evita crescimento indefinido em processos longos.
  if (cache.size > 500) cache.clear();
  cache.set(chave, { expiraEm: Date.now() + CACHE_TTL_MS, opcoes });
}

async function consultarMelhorEnvio(cepDestino: string, pesoKg: number, dimensoes: ReturnType<typeof calcularDimensoes>) {
  // Timeout explícito: sem ele uma API pendurada seguraria o checkout até o
  // timeout padrão da plataforma.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${env.melhorEnvio.baseUrl}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.melhorEnvio.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Zoliê Semijoias (contato@zolie.com.br)',
      },
      body: JSON.stringify({
        from: { postal_code: limparCep(env.melhorEnvio.cepOrigem) },
        to: { postal_code: cepDestino },
        package: { ...dimensoes, weight: pesoKg },
      }),
    });

    if (!res.ok) {
      throw new Error(`Melhor Envio respondeu ${res.status}`);
    }

    const data: MelhorEnvioOption[] = await res.json();
    return data
      .filter(o => !o.error)
      .map(o => ({
        id: String(o.id),
        nome: o.name,
        prazoDias: o.delivery_time,
        valor: round(o.price),
      }));
  } finally {
    clearTimeout(timer);
  }
}

interface CotarOpts {
  /** Itens do carrinho, para calcular o peso real. Sem eles, usa o peso padrão de uma peça. */
  itens?: ItemParaFrete[];
}

export async function cotar(cep: string, subtotal = 0, { itens }: CotarOpts = {}): Promise<CotacaoFrete> {
  const limpo = limparCep(cep);
  if (limpo.length !== 8) {
    throw new AppError('CEP inválido', 422, 'INVALID_CEP');
  }
  const cepFormatado = limpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  const gratis = subtotal >= env.business.freeShippingThreshold;

  const itensParaPeso = itens?.length ? itens : [{ quantidade: 1 }];
  const pesoKg = calcularPesoKg(itensParaPeso);
  const totalPecas = itensParaPeso.reduce((s, i) => s + i.quantidade, 0);
  const dimensoes = calcularDimensoes(totalPecas);

  const chave = chaveCache(limpo, pesoKg);
  const cacheado = lerCache(chave);

  const aplicarGratis = (opcoes: OpcaoFrete[]) =>
    opcoes.map(o => ({ ...o, valor: gratis ? 0 : o.valor }));

  if (cacheado) {
    return { cep: cepFormatado, opcoes: aplicarGratis(cacheado), freteGratisAplicado: gratis };
  }

  try {
    const opcoes = await consultarMelhorEnvio(limpo, pesoKg, dimensoes);

    if (!opcoes.length) {
      // Sem opção real para o CEP: cai na contingência em vez de bloquear a venda.
      throw new Error('Nenhuma opção de frete retornada');
    }

    gravarCache(chave, opcoes);
    return { cep: cepFormatado, opcoes: aplicarGratis(opcoes), freteGratisAplicado: gratis };
  } catch (err) {
    // Falha do provedor não pode derrubar o checkout: devolve a tabela de
    // contingência marcada como estimativa. Ver CHECKLIST-GAPS item 6.
    logger.error('Cotação de frete indisponível; usando tabela de contingência', err, { cep: cepFormatado, pesoKg });
    return {
      cep: cepFormatado,
      opcoes: [freteContingencia(limpo, gratis)],
      freteGratisAplicado: gratis,
      estimado: true,
    };
  }
}

/** Só para os testes: garante isolamento entre casos. */
export function _limparCacheFrete() {
  cache.clear();
}
