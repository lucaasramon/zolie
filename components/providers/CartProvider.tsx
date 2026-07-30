'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';

interface CartSummary {
  itemCount: number;
  totalFmt: string;
}

interface CartContextValue {
  itemCount: number;
  totalFmt: string;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<CartSummary>({ itemCount: 0, totalFmt: 'R$ 0,00' });

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary({ itemCount: 0, totalFmt: 'R$ 0,00' });
      return;
    }
    try {
      const { data } = await api.get<{ items: { quantidade: number }[]; resumo: { total: number } }>('/cart');
      const itemCount = data.items.reduce((a, i) => a + i.quantidade, 0);
      setSummary({
        itemCount,
        totalFmt: data.resumo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      });
    } catch {
      setSummary({ itemCount: 0, totalFmt: 'R$ 0,00' });
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <CartContext.Provider value={{ ...summary, refresh }}>{children}</CartContext.Provider>;
}
