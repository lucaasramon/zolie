'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { stars } from '@/lib/utils/format';

interface Review {
  id: string;
  nota: number;
  titulo: string | null;
  comentario: string | null;
  createdAt: string;
  user: { nome: string };
  product: { nome: string };
}

export function ReviewModerationCard({ review }: { review: Review }) {
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function moderar(aprovado: boolean) {
    await api.patch(`/admin/reviews/${review.id}`, { aprovado });
    setDone(true);
    router.refresh();
  }

  if (done) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gold-text">{stars(review.nota)}</span>
        <span className="rounded-full bg-hoverbg px-2.5 py-0.5 text-xs text-ink-tertiary">Pendente</span>
      </div>
      <div className="text-xs text-ink-tertiary">{review.user.nome} · {review.product.nome} · {new Date(review.createdAt).toLocaleDateString('pt-BR')}</div>
      {review.titulo && <p className="text-sm font-medium text-ink">{review.titulo}</p>}
      {review.comentario && <p className="text-sm text-ink-muted">{review.comentario}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={() => moderar(true)} className="rounded-full bg-success-bg px-3.5 py-1.5 text-xs text-success hover:opacity-80">Aprovar</button>
        <button type="button" onClick={() => moderar(false)} className="rounded-full bg-danger-bg px-3.5 py-1.5 text-xs text-danger hover:opacity-80">Reprovar</button>
      </div>
    </div>
  );
}
