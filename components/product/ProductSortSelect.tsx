'use client';

import { useRouter } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'menor_preco', label: 'Menor preço' },
  { value: 'maior_preco', label: 'Maior preço' },
  { value: 'mais_vendidos', label: 'Mais vendidos' },
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'melhor_avaliados', label: 'Melhor avaliados' },
];

interface Props {
  sort: string;
  searchParams: Record<string, string | undefined>;
}

export function ProductSortSelect({ sort, searchParams: sp }: Props) {
  const router = useRouter();

  function onChange(value: string) {
    const params = new URLSearchParams();
    const merged = { ...sp, sort: value, page: undefined };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `/produtos?${qs}` : '/produtos');
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort" className="text-ink-tertiary">Ordenar por</label>
      <select
        id="sort"
        value={sort}
        onChange={e => onChange(e.target.value)}
        className="rounded-md border border-border-subtle bg-white px-3 py-2 text-ink"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
