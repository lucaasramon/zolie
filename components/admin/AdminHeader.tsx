'use client';

import Link from 'next/link';
import { useAdminMobileNav } from '@/components/admin/AdminMobileNav';

export function AdminHeader({ titulo, nome }: { titulo: string; nome: string }) {
  const { setOpen } = useAdminMobileNav();
  const iniciais = nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white px-4 py-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="grid h-9 w-9 flex-none place-items-center rounded-md text-ink hover:bg-hoverbg lg:hidden"
        >
          <span className="sr-only">Abrir menu</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="truncate font-sans text-lg font-semibold text-ink sm:text-2xl">{titulo}</h1>
      </div>
      <div className="flex flex-none items-center gap-2 sm:gap-3">
        <Link
          href="/admin/produtos/novo"
          className="whitespace-nowrap rounded-full bg-gold px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink hover:bg-gold-hover sm:px-4 sm:text-xs"
        >
          <span className="hidden sm:inline">+ Novo anúncio</span>
          <span className="sm:hidden">+ Novo</span>
        </Link>
        <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#EADFC6] text-xs font-medium text-gold-text-hover">
          {iniciais}
        </div>
      </div>
    </header>
  );
}
