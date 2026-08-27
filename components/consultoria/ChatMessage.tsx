'use client';

import { ZolieCard } from '@/components/product/ZolieCard';
import type { ChatMessage as ChatMessageType } from '@/lib/hooks/useConsultoriaChat';

interface Props {
  message: ChatMessageType;
  onQuickReply?: (texto: string) => void;
  isLast: boolean;
}

export function ChatMessage({ message, onQuickReply, isLast }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
          isUser ? 'bg-ink text-white' : 'border border-border-subtle bg-white text-ink'
        }`}
      >
        {message.content}
      </div>

      {isLast && !isUser && message.quickReplies && message.quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.quickReplies.map(opcao => (
            <button
              key={opcao}
              type="button"
              onClick={() => onQuickReply?.(opcao)}
              className="rounded-full border border-gold/40 bg-white px-3.5 py-1.5 text-[12px] font-medium text-gold-text transition-colors hover:bg-gold/10"
            >
              {opcao}
            </button>
          ))}
        </div>
      )}

      {message.recommendations && message.recommendations.length > 0 && (
        <div className="grid w-full grid-cols-2 gap-3 pt-1">
          {message.recommendations.map(produto => (
            <ZolieCard key={produto.id} product={produto} />
          ))}
        </div>
      )}
    </div>
  );
}
