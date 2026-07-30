'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

const NAV = [
  { href: '/conta', label: 'Meus dados' },
  { href: '/conta/pedidos', label: 'Meus pedidos' },
  { href: '/conta/enderecos', label: 'Meus endereços' },
  { href: '/conta/favoritos', label: 'Meus favoritos' },
];

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${pathname}`);
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return <div className="mx-auto max-w-[1280px] px-5 py-16 text-center text-ink-tertiary">Carregando...</div>;
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <h1 className="mb-6 font-sans text-3xl font-semibold text-ink">Minha conta</h1>
      <div className="flex flex-col gap-8 lg:flex-row">
        <nav className="flex w-full flex-row gap-1 overflow-x-auto lg:w-[220px] lg:flex-none lg:flex-col">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm ${
                pathname === n.href ? 'bg-hoverbg font-medium text-gold-text' : 'text-ink-muted hover:bg-hoverbg'
              }`}
            >
              {n.label}
            </Link>
          ))}
          <button type="button" onClick={logout} className="whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-bg">
            Sair da conta
          </button>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
