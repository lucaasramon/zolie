'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export function ProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm('Remover este anúncio? Ele deixará de aparecer na vitrine.')) return;
    await api.delete(`/products/${productId}`);
    router.refresh();
  }

  return (
    <button type="button" onClick={onDelete} className="text-danger hover:underline">
      Excluir
    </button>
  );
}
