'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import Link from 'next/link';

interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

interface ToastContextValue {
  showToast: (message: string, opts?: { actionLabel?: string; actionHref?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, opts?: { actionLabel?: string; actionHref?: string }) => {
    const id = Date.now();
    setToast({ id, message, actionLabel: opts?.actionLabel, actionHref: opts?.actionHref });
    setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-[22px] left-1/2 -translate-x-1/2 z-[100] animate-ztoast">
          <div className="flex items-center gap-3 rounded-sm bg-ink px-5 py-3 text-sm text-bg shadow-xl">
            <span>{toast.message}</span>
            {toast.actionHref && toast.actionLabel && (
              <Link href={toast.actionHref} className="rounded-sm bg-gold px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover">
                {toast.actionLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
