import Link from 'next/link';
import Image from 'next/image';
import { list } from '@/lib/services/product.service';
import { categoryRepo } from '@/lib/repositories/category.repo';
import { brl } from '@/lib/utils/money';
import { MATERIAL_LABEL } from '@/lib/utils/format';
import { ProductStatusToggle } from '@/components/admin/ProductStatusToggle';
import { ProductDeleteButton } from '@/components/admin/ProductDeleteButton';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ categoria?: string; status?: string }>;
}

export default async function AdminProdutosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categorias = await categoryRepo.list();

  const filters: any = {};
  if (sp.categoria) filters.categoria = sp.categoria;
  if (sp.status === 'estoque_baixo') filters.notaMin = undefined;

  const { items } = await list(filters, 'relevancia', { skip: 0, take: 200 });

  const filtered = items.filter(p => {
    if (sp.status === 'ativos') return p.ativo;
    if (sp.status === 'pausados') return !p.ativo;
    if (sp.status === 'estoque_baixo') return p.estoqueBaixo;
    if (sp.status === 'sem_estoque') return p.estoque === 0;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex items-center gap-2 text-sm">
            <select name="categoria" defaultValue={sp.categoria || ''} className="rounded-md border border-border-subtle px-3 py-2">
              <option value="">Todas as categorias</option>
              {categorias.map(c => (
                <option key={c.slug} value={c.slug}>{c.nome}</option>
              ))}
            </select>
            <select name="status" defaultValue={sp.status || ''} className="rounded-md border border-border-subtle px-3 py-2">
              <option value="">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="pausados">Pausados</option>
              <option value="estoque_baixo">Estoque baixo</option>
              <option value="sem_estoque">Sem estoque</option>
            </select>
          </form>
          <span className="text-sm text-ink-tertiary">{filtered.length} resultado{filtered.length === 1 ? '' : 's'}</span>
        </div>
        <Link href="/admin/produtos/novo" className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover">
          + Novo anúncio
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-hoverbg text-left text-xs uppercase tracking-wider text-ink-tertiary">
            <tr>
              <th className="px-4 py-3">Anúncio</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-border-subtle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imagens?.[0] ? (
                      <div className="relative h-10 w-10 flex-none overflow-hidden rounded-sm">
                        <Image src={p.imagens[0]} alt={p.nome} fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="img-placeholder h-10 w-10 flex-none rounded-sm" />
                    )}
                    <div>
                      <div className="font-medium text-ink">{p.nome}</div>
                      <div className="text-xs text-ink-tertiary">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{p.categoria?.nome}</td>
                <td className="px-4 py-3 text-ink-muted">{MATERIAL_LABEL[p.material]}</td>
                <td className="px-4 py-3">
                  {p.temDesconto && <div className="text-xs text-ink-tertiary line-through">{brl(p.preco)}</div>}
                  <div className="font-medium text-ink">{brl(p.precoEfetivo)}</div>
                </td>
                <td className={`px-4 py-3 font-medium ${p.estoque === 0 ? 'text-danger' : p.estoqueBaixo ? 'text-gold-text' : 'text-ink'}`}>
                  {p.estoque}
                </td>
                <td className="px-4 py-3">
                  <ProductStatusToggle productId={p.id} ativo={p.ativo} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <Link href={`/admin/produtos/${p.id}`} className="text-gold-text hover:text-gold-text-hover">Editar</Link>
                    <ProductDeleteButton productId={p.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="border-t border-dashed border-border-soft py-10 text-center text-sm text-ink-tertiary">
            Nenhum produto encontrado com esses filtros.
          </div>
        )}
      </div>
    </div>
  );
}
