import OpenAI from 'openai';
import { env } from '@/lib/env';

let client: OpenAI | null = null;

/** Instancia sob demanda — evita quebrar o boot da app quando a chave não está configurada. */
export function getOpenAIClient(): OpenAI {
  if (!env.openai.apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }
  if (!client) {
    client = new OpenAI({ apiKey: env.openai.apiKey });
  }
  return client;
}
