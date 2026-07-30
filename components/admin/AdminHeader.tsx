import Link from 'next/link';

export function AdminHeader({ titulo, nome }: { titulo: string; nome: string }) {
  const iniciais = nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
      <h1 className="font-sans text-2xl font-semibold text-ink">{titulo}</h1>
      <div className="flex items-center gap-3">
        <Link
          href="/admin/produtos/novo"
          className="whitespace-nowrap rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover"
        >
          + Novo anúncio
        </Link>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#EADFC6] text-xs font-medium text-gold-text-hover">
          {iniciais}
        </div>
      </div>
    </header>
  );
}
