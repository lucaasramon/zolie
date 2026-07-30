import { listPending } from '@/lib/services/review.service';
import { ReviewModerationCard } from '@/components/admin/ReviewModerationCard';

export const dynamic = 'force-dynamic';

export default async function AdminAvaliacoesPage() {
  const { items } = await listPending({ skip: 0, take: 50 });
  const serialized = items.map((r: any) => ({
    id: r.id,
    nota: r.nota,
    titulo: r.titulo,
    comentario: r.comentario,
    createdAt: r.createdAt.toISOString(),
    user: { nome: r.user.nome },
    product: { nome: r.product.nome },
  }));

  return (
    <div className="flex flex-col gap-3">
      {serialized.length === 0 ? (
        <p className="text-sm text-ink-tertiary">Não há avaliações pendentes de moderação.</p>
      ) : (
        serialized.map(r => <ReviewModerationCard key={r.id} review={r} />)
      )}
    </div>
  );
}
