'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api-client';

export function ProductStatusToggle({ productId, ativo }: { productId: string; ativo: boolean }) {
  const [current, setCurrent] = useState(ativo);
  const router = useRouter();

  async function toggle() {
    await api.put(`/products/${productId}`, { ativo: !current });
    setCurrent(v => !v);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-full px-3 py-1 text-xs ${
        current ? 'bg-success-bg text-success' : 'bg-hoverbg text-ink-tertiary'
      }`}
    >
      {current ? 'Ativo' : 'Pausado'}
    </button>
  );
}
