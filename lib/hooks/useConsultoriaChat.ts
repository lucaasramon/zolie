'use client';

import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import type { DecoratedProduct } from '@/components/product/ZolieCard';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: string[];
  recommendations?: DecoratedProduct[];
};

const MENSAGEM_INICIAL: ChatMessage = {
  role: 'assistant',
  content: 'Olá! Sou o assistente de compras da Zoliê 💛 Me conta: essa peça é para você ou é um presente?',
  quickReplies: ['É para mim', 'É um presente', 'Não sei, me ajuda a escolher'],
};

export function useConsultoriaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([MENSAGEM_INICIAL]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const conteudo = text.trim();
      if (!conteudo || loading) return;

      setError(null);
      const historico = [...messages, { role: 'user' as const, content: conteudo }];
      setMessages(historico);
      setLoading(true);

      try {
        const { data } = await api.post<{ reply: string; quickReplies: string[]; recommendations: DecoratedProduct[] }>(
          '/consultoria/chat',
          { messages: historico.map(({ role, content }) => ({ role, content })) },
        );
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            quickReplies: data.quickReplies,
            recommendations: data.recommendations,
          },
        ]);
      } catch (err) {
        const mensagem = err instanceof ApiError ? err.message : 'Não foi possível falar com a consultora agora.';
        setError(mensagem);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading],
  );

  return { messages, sendMessage, loading, error };
}
