import { prisma } from '@/lib/prisma';
import { StockRow } from '@/components/admin/StockRow';

export const dynamic = 'force-dynamic';

const LIMITE_BAIXO = 3;

function rotuloVariacao(tamanho: string | null, acabamento: string | null) {
  const partes = [tamanho, acabamento].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Único';
}

export default async function AdminEstoquePage() {
  const produtos = await prisma.product.findMany({
    where: { ativo: true },
    include: {
      categoria: { select: { nome: true } },
      variants: { orderBy: [{ tamanho: 'asc' }, { acabamento: 'asc' }] },
    },
  });

  // Ordena pelos que precisam de atenção primeiro.
  const ordenados = [...produtos].sort((a, b) => a.estoque - b.estoque);

  const variacoes = produtos.flatMap(p => p.variants);
  const semEstoque = variacoes.filter(v => v.estoque === 0).length;
  const estoqueBaixo = variacoes.filter(v => v.estoque > 0 && v.estoque <= LIMITE_BAIXO).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Kpi label="Peças cadastradas" value={produtos.length} />
        <Kpi label="Variações" value={variacoes.length} />
        <Kpi label="Estoque baixo" value={estoqueBaixo} highlight="gold" />
        <Kpi label="Sem estoque" value={semEstoque} highlight="danger" />
      </div>

      <p className="text-xs text-ink-tertiary">
        O estoque é controlado por variação. O total de cada produto é a soma das
        variações e se atualiza sozinho.
      </p>

      <div className="overflow-x-auto rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estoque por variação</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map(p => (
              <tr key={p.id} className="border-t border-border-subtle align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{p.nome}</div>
                  <div className="text-xs text-ink-tertiary">{p.slug}</div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{p.categoria?.nome}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${p.estoque === 0 ? 'text-danger' : 'text-ink'}`}>
                    {p.estoque}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.variants.length ? (
                    <div className="flex flex-col">
                      {p.variants.map(v => (
                        <StockRow
                          key={v.id}
                          variantId={v.id}
                          initialEstoque={v.estoque}
                          rotulo={rotuloVariacao(v.tamanho, v.acabamento)}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-ink-tertiary">
                      Sem variações cadastradas
                    </span>
                  )}
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
