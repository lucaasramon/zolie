'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Skeleton } from '@/components/ui/Skeleton';

const NAV = [
  { href: '/conta', label: 'Meus dados' },
  { href: '/conta/pedidos', label: 'Meus pedidos' },
  { href: '/conta/enderecos', label: 'Meus endereços' },
  { href: '/conta/favoritos', label: 'Meus favoritos' },
  { href: '/conta/cupons', label: 'Meus cupons' },
  { href: '/conta/notificacoes', label: 'Notificações' },
];

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${pathname}`);
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-8">
        <Skeleton className="mb-6 h-9 w-48" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <Skeleton className="h-40 w-full lg:w-[220px] lg:flex-none" />
          <Skeleton className="h-64 flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <div className="mb-7 flex flex-col gap-1">
        <span className="z-eyebrow">Olá, {user.nome.split(' ')[0]}</span>
        <h1 className="z-title text-[32px] sm:text-4xl">Minha conta</h1>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <nav className="z-card flex w-full flex-row gap-1 self-start overflow-x-auto p-2.5 lg:w-[230px] lg:flex-none lg:flex-col">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`relative whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                pathname === n.href
                  ? 'bg-hoverbg font-medium text-gold-text lg:pl-5'
                  : 'text-ink-muted hover:bg-hoverbg hover:text-ink'
              }`}
            >
              {pathname === n.href && (
                <span className="absolute left-1.5 top-1/2 hidden h-4 w-[3px] -translate-y-1/2 rounded-full bg-gold lg:block" aria-hidden="true" />
              )}
              {n.label}
            </Link>
          ))}
          <span className="mx-2 my-1 hidden h-px bg-border-subtle lg:block" aria-hidden="true" />
          <button type="button" onClick={logout} className="whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-bg">
            Sair da conta
          </button>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
