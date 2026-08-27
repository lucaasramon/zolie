'use client';

import { useEffect, useRef, useState } from 'react';
import { useConsultoriaChat } from '@/lib/hooks/useConsultoriaChat';
import { ChatMessage } from '@/components/consultoria/ChatMessage';

interface Props {
  onClose: () => void;
  whatsappHref: string | null;
}

export function ConsultoriaPanel({ onClose, whatsappHref }: Props) {
  const { messages, sendMessage, loading, error } = useConsultoriaChat();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  }

  return (
    <div className="fixed inset-0 z-[60] flex bg-black/45">
      <div className="flex h-full w-[min(400px,92vw)] flex-col bg-bg shadow-lg animate-zfade">
        <div className="flex items-center justify-between border-b border-border-subtle bg-white px-5 py-4">
          <div>
            <span className="block font-serif text-[17px] font-medium text-ink">Assistente de compras</span>
            <span className="block text-[11px] font-light text-ink-tertiary">Te ajudo a achar a peça perfeita</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente de compras"
            className="text-xl text-ink-tertiary hover:text-ink"
          >
            ×
          </button>
        </div>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.map((message, i) => (
            <ChatMessage
              key={i}
              message={message}
              isLast={i === messages.length - 1}
              onQuickReply={sendMessage}
            />
          ))}

          {loading && (
            <div className="flex items-center gap-1.5 px-1 text-ink-tertiary">
              <span className="h-1.5 w-1.5 animate-zpulse rounded-full bg-gold" />
              <span className="h-1.5 w-1.5 animate-zpulse rounded-full bg-gold [animation-delay:0.15s]" />
              <span className="h-1.5 w-1.5 animate-zpulse rounded-full bg-gold [animation-delay:0.3s]" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-border-subtle bg-white px-4 py-3 text-[13px] text-ink-tertiary">
              {error}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-2 block font-medium text-gold-text hover:text-gold-text-hover">
                  Falar no WhatsApp →
                </a>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border-subtle bg-white px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escreva sua resposta..."
            disabled={loading}
            className="flex-1 rounded-full border border-border-soft bg-bg-alt px-4 py-2.5 text-[13.5px] text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Enviar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-ink transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </div>

      <div onClick={onClose} className="flex-1" />
    </div>
  );
}
