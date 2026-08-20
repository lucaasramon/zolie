'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/lib/api-client';

/**
 * Contagem de notificações não lidas do cliente logado. Sem polling — só
 * busca de novo quando a página é carregada/navegada (`pathname` muda), como
 * definido no escopo da feature. Convidado (sem `user`) nunca tem notificação.
 */
export function useUnreadNotifications() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      setCount(data.count);
    } catch {
      setCount(0);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  return { count, refresh };
}
