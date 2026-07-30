import Link from 'next/link';

interface Categoria {
  nome: string;
  slug: string;
}

interface Props {
  categorias: Categoria[];
  searchParams: Record<string, string | undefined>;
}

function buildHref(sp: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...changes };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/produtos?${qs}` : '/produtos';
}

const MATERIAIS = [
  { value: 'PRATA_925', label: 'Prata 925' },
  { value: 'BANHADO_OURO', label: 'Banhado a Ouro 18k' },
];

const PEDRAS = [
  { value: 'zirconia', label: 'Zircônia' },
  { value: 'cristal', label: 'Cristal' },
  { value: 'perola', label: 'Pérola' },
];

const FAIXAS_PRECO = [
  { label: 'Até R$ 100', min: undefined, max: '100' },
  { label: 'R$ 100 a R$ 200', min: '100', max: '200' },
  { label: 'Acima de R$ 200', min: '200', max: undefined },
];

export function ProductFiltersSidebar({ categorias, searchParams: sp }: Props) {
  const hasFilters = Boolean(sp.categoria || sp.material || sp.pedra || sp.notaMin || sp.precoMin || sp.precoMax || sp.promocao);

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-[220px] lg:flex-none">
      {hasFilters && (
        <Link href="/produtos" className="text-xs font-medium uppercase tracking-wider text-gold-text hover:text-gold-text-hover">
          Limpar filtros
        </Link>
      )}

      <FilterGroup title="Categoria">
        {categorias.map(c => (
          <FilterOption key={c.slug} label={c.nome} active={sp.categoria === c.slug} href={buildHref(sp, { categoria: sp.categoria === c.slug ? undefined : c.slug })} />
        ))}
      </FilterGroup>

      <FilterGroup title="Material">
        {MATERIAIS.map(m => (
          <FilterOption key={m.value} label={m.label} active={sp.material === m.value} href={buildHref(sp, { material: sp.material === m.value ? undefined : m.value })} />
        ))}
      </FilterGroup>

      <FilterGroup title="Preço">
        {FAIXAS_PRECO.map(f => {
          const active = sp.precoMin === f.min && sp.precoMax === f.max;
          return (
            <FilterOption
              key={f.label}
              label={f.label}
              active={active}
              href={buildHref(sp, { precoMin: active ? undefined : f.min, precoMax: active ? undefined : f.max })}
            />
          );
        })}
      </FilterGroup>

      <FilterGroup title="Pedra">
        {PEDRAS.map(p => (
          <FilterOption key={p.value} label={p.label} active={sp.pedra === p.value} href={buildHref(sp, { pedra: sp.pedra === p.value ? undefined : p.value })} />
        ))}
      </FilterGroup>

      <FilterGroup title="Avaliação">
        {['4', '4.5'].map(n => (
          <FilterOption key={n} label={`${n}+ estrelas`} active={sp.notaMin === n} href={buildHref(sp, { notaMin: sp.notaMin === n ? undefined : n })} />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-medium uppercase tracking-wider text-ink">{title}</span>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function FilterOption({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-gold-text">
      <span
        className={`grid h-[15px] w-[15px] flex-none place-items-center rounded-sm border ${
          active ? 'border-gold-soft bg-gold-soft text-white' : 'border-border-soft bg-white'
        }`}
      >
        {active && <span className="text-[10px] leading-none">✓</span>}
      </span>
      {label}
    </Link>
  );
}
