'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { ZolieCard, DecoratedProduct } from '@/components/product/ZolieCard';

export default function MeusFavoritosPage() {
  const [items, setItems] = useState<DecoratedProduct[] | null>(null);

  useEffect(() => {
    api.get<DecoratedProduct[]>('/wishlist').then(({ data }) => setItems(data));
  }, []);

  if (!items) return <p className="text-sm text-ink-tertiary">Carregando favoritos...</p>;

  if (items.length === 0) {
    return <p className="text-sm text-ink-tertiary">Você ainda não favoritou nenhuma peça. Toque no ♡ nos produtos para salvá-los aqui.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(p => (
        <ZolieCard key={p.id} product={p} wished />
      ))}
    </div>
  );
}
