'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export function StockRow({ productId, initialEstoque }: { productId: string; initialEstoque: number }) {
  const [estoque, setEstoque] = useState(initialEstoque);
  const router = useRouter();

  async function ajustar(delta: number) {
    const novo = Math.max(0, estoque + delta);
    setEstoque(novo);
    await api.put(`/products/${productId}`, { estoque: novo });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => ajustar(-1)} className="rounded-full bg-bg-alt px-2 py-1 text-xs text-ink-muted hover:bg-hoverbg">−</button>
      <span className={`w-8 text-center font-medium ${estoque === 0 ? 'text-danger' : estoque <= 8 ? 'text-gold-text' : 'text-ink'}`}>{estoque}</span>
      <button type="button" onClick={() => ajustar(1)} className="rounded-full bg-bg-alt px-2 py-1 text-xs text-ink-muted hover:bg-hoverbg">+</button>
      <button type="button" onClick={() => ajustar(10)} className="rounded-full bg-[#FBF7EA] px-2 py-1 text-xs text-gold-text hover:bg-[#F5EFD9]">+10</button>
    </div>
  );
}
