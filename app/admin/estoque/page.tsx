import { productRepo } from '@/lib/repositories/product.repo';
import { StockRow } from '@/components/admin/StockRow';

export const dynamic = 'force-dynamic';

export default async function AdminEstoquePage() {
  const { items } = await productRepo.search({}, 'relevancia', { skip: 0, take: 1000 });
  const ordenados = [...items].sort((a, b) => a.estoque - b.estoque);
  const semEstoque = items.filter(p => p.estoque === 0).length;
  const estoqueBaixo = items.filter(p => p.estoque > 0 && p.estoque <= 8).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Peças cadastradas" value={items.length} />
        <Kpi label="Estoque baixo" value={estoqueBaixo} highlight="gold" />
        <Kpi label="Sem estoque" value={semEstoque} highlight="danger" />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map(p => (
              <tr key={p.id} className="border-t border-border-subtle">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{p.nome}</div>
                  <div className="text-xs text-ink-tertiary">{p.slug}</div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{p.categoria?.nome}</td>
                <td className="px-4 py-3">
                  <StockRow productId={p.id} initialEstoque={p.estoque} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, highlight }: { label: string; value: number; highlight?: 'gold' | 'danger' }) {
  const color = highlight === 'gold' ? 'text-gold-text' : highlight === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div className="rounded-xl bg-white p-5 shadow-xs">
      <span className="text-xs uppercase tracking-wider text-ink-tertiary">{label}</span>
      <div className={`mt-1 font-sans text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
