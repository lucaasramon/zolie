import { env } from '@/lib/env';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/logger';

interface MelhorEnvioErrorBody {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/** Extrai a mensagem mais útil do corpo de erro, que varia de formato por endpoint. */
function extrairMensagem(body: MelhorEnvioErrorBody, status: number): string {
  const primeiroCampo = body.errors && Object.values(body.errors)[0]?.[0];
  return (
    primeiroCampo ||
    body.error ||
    body.message ||
    `Erro ao comunicar com o Melhor Envio (status ${status})`
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!env.melhorEnvio.token) {
    throw new AppError('Integração de envio não configurada', 503, 'SHIPPING_NOT_CONFIGURED');
  }

  const res = await fetch(`${env.melhorEnvio.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.melhorEnvio.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Zoliê Semijoias (contato@zolie.com.br)',
      ...init.headers,
    },
  });

  if (!res.ok) {
    const rawText = await res.text().catch(() => '');
    let body: MelhorEnvioErrorBody = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      // corpo não é JSON (ex: html de erro do proxy) — segue com body vazio
    }
    logger.error(`Erro do Melhor Envio em ${init.method || 'GET'} ${path}`, undefined, {
      status: res.status,
      body: rawText.slice(0, 500),
    });

    // 401/403 quase sempre é escopo faltando no token, não credencial errada —
    // vale dizer isso explicitamente para não perder tempo depurando o payload.
    if (res.status === 401 || res.status === 403) {
      throw new AppError(
        'Token do Melhor Envio sem permissão para esta operação. Verifique os escopos de carrinho, checkout, etiqueta e rastreio.',
        502,
        'SHIPPING_TOKEN_SCOPE',
      );
    }
    throw new AppError(extrairMensagem(body, res.status), 502, 'SHIPPING_PROVIDER_ERROR');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface CartItemResponse {
  id: string;
  protocol?: string;
}

export interface CheckoutResponse {
  purchase?: { id: string; orders?: { id: string }[] };
}

export interface GenerateResponse {
  [shipmentId: string]: unknown;
}

export interface TrackingInfo {
  id: string;
  status?: string;
  tracking?: string | null;
  protocol?: string;
  melhorenvio_tracking?: string | null;
}

export const melhorEnvioClient = {
  /** Adiciona o envio ao carrinho. Retorna o id do shipment usado nas etapas seguintes. */
  addToCart: (data: Record<string, unknown>) =>
    request<CartItemResponse>('/api/v2/me/cart', { method: 'POST', body: JSON.stringify(data) }),

  /** Paga as etiquetas — debita o saldo da carteira Melhor Envio. */
  checkout: (shipmentIds: string[]) =>
    request<CheckoutResponse>('/api/v2/me/shipment/checkout', {
      method: 'POST',
      body: JSON.stringify({ orders: shipmentIds }),
    }),

  /** Gera as etiquetas já pagas (passo obrigatório antes de imprimir/rastrear). */
  generate: (shipmentIds: string[]) =>
    request<GenerateResponse>('/api/v2/me/shipment/generate', {
      method: 'POST',
      body: JSON.stringify({ orders: shipmentIds }),
    }),

  /** URL do PDF da etiqueta para impressão. */
  print: (shipmentIds: string[]) =>
    request<{ url: string }>('/api/v2/me/shipment/print', {
      method: 'POST',
      body: JSON.stringify({ mode: 'private', orders: shipmentIds }),
    }),

  /** Consulta o rastreio. O código só aparece algum tempo depois do generate. */
  tracking: (shipmentIds: string[]) =>
    request<Record<string, TrackingInfo>>('/api/v2/me/shipment/tracking', {
      method: 'POST',
      body: JSON.stringify({ orders: shipmentIds }),
    }),
};
