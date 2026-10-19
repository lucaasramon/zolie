import { env } from '@/lib/env';

/**
 * Cliente mínimo da Evolution API (v2) para os avisos internos da loja.
 * Docs: https://doc.evolution-api.com
 *
 * Usa `console` em vez de `logger` de propósito: `logger.error` dispara alerta
 * no WhatsApp, e uma falha do próprio WhatsApp não pode virar um alerta em loop.
 */

const TIMEOUT_MS = 15_000;

export function whatsappConfigurado(): boolean {
  if (process.env.NODE_ENV === 'test') return false;
  const { apiUrl, apiKey, instancia } = env.whatsapp;
  return Boolean(apiUrl && apiKey && instancia);
}

async function evo(path: string, body: object): Promise<void> {
  const { apiUrl, apiKey } = env.whatsapp;
  const res = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Evolution API POST ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
}

export async function enviarTexto(grupo: string, texto: string): Promise<void> {
  await evo(`/message/sendText/${env.whatsapp.instancia}`, { number: grupo, text: texto });
}

/** Imagem por URL pública (a Evolution baixa o arquivo). */
export async function enviarImagem(grupo: string, url: string, legenda: string): Promise<void> {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  const mimetype = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  await evo(`/message/sendMedia/${env.whatsapp.instancia}`, {
    number: grupo,
    mediatype: 'image',
    mimetype,
    caption: legenda,
    media: url,
    fileName: url.split('?')[0].split('/').pop() || 'imagem.jpg',
  });
}
