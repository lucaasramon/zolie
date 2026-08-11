'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';

interface WishlistContextValue {
  isWished: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist deve ser usado dentro de WishlistProvider');
  return ctx;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    try {
      const { data } = await api.get<{ id: string }[]>('/wishlist');
      setIds(new Set(data.map(p => p.id)));
    } catch {
      setIds(new Set());
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string) => {
      const wished = ids.has(productId);
      // Otimista: a UI responde na hora, e desfaz se a chamada falhar.
      setIds(prev => {
        const next = new Set(prev);
        if (wished) next.delete(productId);
        else next.add(productId);
        return next;
      });
      try {
        if (wished) await api.delete(`/wishlist/${productId}`);
        else await api.post(`/wishlist/${productId}`);
      } catch {
        setIds(prev => {
          const next = new Set(prev);
          if (wished) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw new Error('Não foi possível atualizar os favoritos');
      }
    },
    [ids],
  );

  const isWished = useCallback((productId: string) => ids.has(productId), [ids]);

  return <WishlistContext.Provider value={{ isWished, toggle }}>{children}</WishlistContext.Provider>;
}
