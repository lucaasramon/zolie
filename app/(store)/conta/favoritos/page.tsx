'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { ZolieCard, DecoratedProduct } from '@/components/product/ZolieCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useWishlist } from '@/components/providers/WishlistProvider';

export default function MeusFavoritosPage() {
  const [items, setItems] = useState<DecoratedProduct[] | null>(null);
  const { isWished } = useWishlist();

  useEffect(() => {
    api.get<DecoratedProduct[]>('/wishlist').then(({ data }) => setItems(data));
  }, []);

  if (!items) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    );
  }

  // Filtra pelo estado atual do WishlistProvider: quando o cliente remove um item
  // aqui mesmo (clicando no ♡ do card), ele some da lista sem precisar recarregar.
  const visiveis = items.filter(p => isWished(p.id));

  if (visiveis.length === 0) {
    return <p className="text-sm text-ink-tertiary">Você ainda não favoritou nenhuma peça. Toque no ♡ nos produtos para salvá-los aqui.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {visiveis.map(p => (
        <ZolieCard key={p.id} product={p} />
      ))}
    </div>
  );
}
