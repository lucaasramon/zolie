import { env } from '@/lib/env';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/logger';

interface AsaasErrorBody {
  errors?: { code: string; description: string }[];
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.asaas.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: env.asaas.apiKey,
      'User-Agent': 'Zolie Semijoias (contato@zolie.com.br)',
      ...init.headers,
    },
  });

  if (!res.ok) {
    const rawText = await res.text().catch(() => '');
    let body: AsaasErrorBody = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      // corpo não é JSON (ex: erro de auth/proxy) — segue com body vazio
    }
    logger.error(`Erro do gateway Asaas em ${init.method || 'GET'} ${path}`, undefined, { status: res.status, body: rawText.slice(0, 500) });
    const message = body.errors?.[0]?.description || `Erro ao comunicar com o gateway de pagamento (status ${res.status})`;
    throw new AppError(message, 502, 'ASAAS_PROVIDER_ERROR');
  }

  return res.json();
}

export const asaasClient = {
  createCustomer: (data: Record<string, unknown>) =>
    request<{ id: string }>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  createPayment: (data: Record<string, unknown>) =>
    request<Record<string, any>>('/payments', { method: 'POST', body: JSON.stringify(data) }),
  getPayment: (paymentId: string) => request<Record<string, any>>(`/payments/${paymentId}`),
  getPixQrCode: (paymentId: string) =>
    request<{ encodedImage: string; payload: string; expirationDate: string }>(`/payments/${paymentId}/pixQrCode`),
  /** Estorna uma cobrança já paga — devolve o dinheiro ao cliente. */
  refundPayment: (paymentId: string, description?: string) =>
    request<Record<string, any>>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(description ? { description } : {}),
    }),
  /** Remove uma cobrança ainda não paga, impedindo que continue pagável. */
  deletePayment: (paymentId: string) =>
    request<{ deleted: boolean; id: string }>(`/payments/${paymentId}`, { method: 'DELETE' }),
};
