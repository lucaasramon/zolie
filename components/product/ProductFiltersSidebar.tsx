'use client';

import { useEffect, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const hasFilters = Boolean(sp.categoria || sp.material || sp.pedra || sp.notaMin || sp.precoMin || sp.precoMax || sp.promocao);

  // Fecha o drawer automaticamente sempre que os filtros mudam (usuário navegou por um link de filtro).
  useEffect(() => {
    setOpen(false);
  }, [sp]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const conteudo = (
    <>
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
    </>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border-soft px-4 py-2.5 text-sm font-medium text-ink-muted"
        >
          <FilterIcon className="h-4 w-4" />
          Filtros
          {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-[min(320px,86vw)] flex-col gap-6 overflow-y-auto bg-white p-6 shadow-lg animate-zfade">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[13px] font-medium uppercase tracking-[0.2em] text-ink">Filtros</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar filtros" className="text-xl text-ink-tertiary">
                ×
              </button>
            </div>
            {conteudo}
          </div>
        </div>
      )}

      <aside className="hidden w-[220px] flex-none flex-col gap-6 lg:flex">{conteudo}</aside>
    </>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
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
