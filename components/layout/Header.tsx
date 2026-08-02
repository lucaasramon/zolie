'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { api } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';

interface Categoria {
  nome: string;
  slug: string;
}

interface Suggestion {
  id: string;
  nome: string;
  slug: string;
  imagem: string | null;
  precoEfetivo: number;
}

export function Header({ categorias }: { categorias: Categoria[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount, totalFmt } = useCart();

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get<Suggestion[]>(`/products/suggestions?q=${encodeURIComponent(term)}`)
        .then(({ data }) => setSuggestions(data))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function onSearch() {
    if (!query.trim()) return;
    setShowSuggestions(false);
    router.push(`/produtos?q=${encodeURIComponent(query.trim())}`);
  }

  const contaLabel = user ? user.nome.split(' ')[0] : 'Entrar';
  const saudacao = user ? 'Olá,' : 'Bem-vinda(o)';

  const institLinks = [
    { label: 'Sobre a Zoliê', href: '/sobre' },
    { label: 'Trocas e devoluções', href: '/trocas' },
    { label: 'Política de privacidade', href: '/privacidade' },
    { label: 'Perguntas frequentes', href: '/faq' },
    { label: 'Contato', href: '/contato' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-[22px] gap-y-3.5 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/zolie.png"
              alt="Zoliê Semijoias"
              width={38}
              height={48}
              className="h-12 w-auto flex-none object-contain"
            />
            <span className="flex flex-col items-start gap-px">
              <span className="font-serif text-[30px] leading-none tracking-[0.14em] text-ink">ZOLIÊ</span>
              <span className="text-[8px] font-light uppercase leading-none tracking-[0.34em] text-gold-text">semijoias</span>
            </span>
          </Link>

          <div ref={searchBoxRef} className="relative flex flex-1 basis-[280px] items-center">
            <div className="flex w-full items-center overflow-hidden rounded-full bg-bg-alt shadow-xs transition-shadow focus-within:shadow-sm">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                placeholder="Buscar colares, brincos, anéis..."
                aria-label="Buscar produtos"
                className="flex-1 border-none bg-transparent px-[18px] py-[13px] text-ink outline-none"
              />
              <button
                type="button"
                onClick={onSearch}
                className="whitespace-nowrap rounded-full bg-gold px-5 py-[13px] text-[11px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:bg-gold-hover"
              >
                Buscar
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col overflow-hidden rounded-xl bg-white py-1.5 shadow-lg">
                {suggestions.map(s => (
                  <Link
                    key={s.id}
                    href={`/produtos/${s.slug}`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-hoverbg"
                  >
                    {s.imagem ? (
                      <div className="relative h-10 w-10 flex-none overflow-hidden rounded-md">
                        <Image src={s.imagem} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="img-placeholder h-10 w-10 flex-none rounded-md" />
                    )}
                    <span className="flex-1 truncate text-sm text-ink">{s.nome}</span>
                    <span className="flex-none text-xs text-ink-tertiary">{brl(s.precoEfetivo)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={user ? '/conta' : '/login'}
              className="flex flex-col items-start gap-0.5 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-hoverbg"
            >
              <span className="text-[10px] font-light text-ink-tertiary">{saudacao}</span>
              <span className="text-xs font-medium tracking-wide text-ink">{contaLabel}</span>
            </Link>
            <Link
              href="/conta/favoritos"
              className="flex flex-col items-start gap-0.5 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-hoverbg"
            >
              <span className="text-[10px] font-light text-ink-tertiary">♡ Meus</span>
              <span className="text-xs font-medium tracking-wide text-ink">Favoritos</span>
            </Link>
            <Link
              href="/carrinho"
              className="flex items-center gap-2.5 rounded-full bg-white px-3.5 py-2.5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <span className="flex flex-col items-start gap-0.5 text-left">
                <span className="text-[10px] font-light text-ink-tertiary">Sacola</span>
                <span className="text-xs font-medium tracking-wide text-ink">{totalFmt}</span>
              </span>
              <span className="min-w-[22px] rounded-full bg-gold px-1.5 text-center text-[11px] font-medium leading-[22px] text-ink">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>

        <div>
          <div className="mx-auto flex max-w-[1280px] items-stretch gap-1 overflow-x-auto px-5 pb-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex flex-none items-center gap-2.5 whitespace-nowrap py-[13px] pr-4 text-xs font-medium uppercase tracking-[0.1em] text-gold-text"
            >
              <span className="flex w-4 flex-col gap-[3px]">
                <span className="h-[1.5px] rounded-sm bg-gold-soft" />
                <span className="h-[1.5px] rounded-sm bg-gold-soft" />
                <span className="h-[1.5px] rounded-sm bg-gold-soft" />
              </span>
              Categorias
            </button>
            {categorias.map(c => (
              <Link
                key={c.slug}
                href={`/produtos?categoria=${c.slug}`}
                className="flex-none whitespace-nowrap rounded-full px-3.5 py-[9px] text-[13px] text-ink-muted transition-colors hover:bg-hoverbg hover:text-gold-text"
              >
                {c.nome}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex bg-black/45">
          <nav className="flex h-full w-[min(320px,86vw)] flex-col gap-1 overflow-y-auto bg-white p-6 shadow-lg animate-zfade">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-sans text-[13px] font-medium uppercase tracking-[0.2em] text-ink">Menu</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" className="text-xl text-ink-tertiary">
                ×
              </button>
            </div>
            {categorias.map(c => (
              <Link
                key={c.slug}
                href={`/produtos?categoria=${c.slug}`}
                onClick={() => setMenuOpen(false)}
                className="border-b border-border-subtle py-3.5 text-[15px] text-ink hover:text-gold-text"
              >
                {c.nome}
              </Link>
            ))}
            {institLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-[11px] text-[13px] font-light text-ink-tertiary hover:text-gold-text"
              >
                {l.label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="mt-3.5 rounded-lg bg-bg-alt p-3 text-xs uppercase tracking-[0.08em] text-gold-text"
              >
                Painel administrativo
              </Link>
            )}
          </nav>
          <div onClick={() => setMenuOpen(false)} className="flex-1" />
        </div>
      )}
    </>
  );
}
