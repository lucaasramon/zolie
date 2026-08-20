'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useUnreadNotifications } from '@/lib/hooks/useUnreadNotifications';
import { api } from '@/lib/api-client';
import { brl } from '@/lib/utils/money';
import { SearchIcon, UserIcon, HeartIcon, BagIcon, MenuIcon, TagIcon, BellIcon } from '@/components/layout/HeaderIcons';
import { CategoryIcon } from '@/components/product/CategoryIcon';

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
  const [catOpen, setCatOpen] = useState(false);
  const [catPos, setCatPos] = useState({ top: 0, left: 0 });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const catBoxRef = useRef<HTMLDivElement>(null);
  const catButtonRef = useRef<HTMLButtonElement>(null);
  const catPanelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount, totalFmt } = useCart();
  const { count: unreadCount } = useUnreadNotifications();
  const [bagPulse, setBagPulse] = useState(false);
  const prevItemCount = useRef(itemCount);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (itemCount > prevItemCount.current) {
      setBagPulse(true);
      const timer = setTimeout(() => setBagPulse(false), 400);
      prevItemCount.current = itemCount;
      return () => clearTimeout(timer);
    }
    prevItemCount.current = itemCount;
  }, [itemCount]);

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
      const target = e.target as Node;
      const insideButton = catButtonRef.current?.contains(target);
      const insidePanel = catPanelRef.current?.contains(target);
      if (!insideButton && !insidePanel) {
        setCatOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!catOpen) return;
    function updatePos() {
      const rect = catButtonRef.current?.getBoundingClientRect();
      if (rect) setCatPos({ top: rect.bottom + 8, left: rect.left });
    }
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [catOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setCatOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
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
      <header
        className={`sticky top-0 z-40 border-b bg-white/85 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? 'border-border-subtle shadow-sm' : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-[22px] gap-y-3.5 px-5 py-3.5">
          <Link href="/" className="group flex items-center gap-2.5">
            <Image
              src="/images/zolie.png"
              alt="Zoliê Semijoias"
              width={38}
              height={48}
              className="h-11 w-auto flex-none object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="flex flex-col items-start gap-px">
              <span className="font-serif text-[26px] leading-none tracking-[0.14em] text-ink">ZOLIÊ</span>
              <span className="text-[8px] font-light uppercase leading-none tracking-[0.34em] text-gold-text">semijoias</span>
            </span>
          </Link>

          <div ref={searchBoxRef} className="relative flex flex-1 basis-[280px] items-center">
            <div className="flex w-full items-center gap-1 rounded-full border border-transparent bg-bg-alt pl-[18px] pr-1.5 shadow-xs transition-all focus-within:border-gold-soft focus-within:bg-white focus-within:shadow-sm">
              <SearchIcon className="h-4 w-4 flex-none text-ink-tertiary" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                placeholder="Buscar colares, brincos, anéis..."
                aria-label="Buscar produtos"
                className="flex-1 border-none bg-transparent px-2.5 py-[11px] text-sm text-ink outline-none"
              />
              <button
                type="button"
                onClick={onSearch}
                aria-label="Buscar"
                className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gold text-ink transition-all hover:bg-gold-hover active:scale-90"
              >
                <SearchIcon className="h-4 w-4" />
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col overflow-hidden rounded-xl bg-white py-1.5 shadow-lg animate-zfade">
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

          <div className="flex items-center gap-1">
            <Link
              href={user ? '/conta' : '/login'}
              className="group flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-hoverbg"
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-bg-alt text-ink-muted transition-colors group-hover:bg-gold group-hover:text-ink">
                <UserIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="hidden flex-col items-start leading-none sm:flex">
                <span className="text-[10px] font-light text-ink-tertiary">{saudacao}</span>
                <span className="text-xs font-medium tracking-wide text-ink">{contaLabel}</span>
              </span>
            </Link>

            <Link
              href="/conta/favoritos"
              className="group flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-hoverbg"
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-bg-alt text-ink-muted transition-colors group-hover:bg-gold group-hover:text-ink">
                <HeartIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="hidden text-xs font-medium tracking-wide text-ink sm:inline">Favoritos</span>
            </Link>

            {user && (
              <Link
                href="/conta/notificacoes"
                className="group flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-hoverbg"
              >
                <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full bg-bg-alt text-ink-muted transition-colors group-hover:bg-gold group-hover:text-ink">
                  <BellIcon className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-[18px] text-ink shadow-xs group-hover:bg-ink group-hover:text-white">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <span className="hidden text-xs font-medium tracking-wide text-ink sm:inline">Notificações</span>
              </Link>
            )}

            <Link
              href="/conta/cupons"
              className="group flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-hoverbg"
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-bg-alt text-ink-muted transition-colors group-hover:bg-gold group-hover:text-ink">
                <TagIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="hidden text-xs font-medium tracking-wide text-ink sm:inline">Cupons</span>
            </Link>

            <Link
              href="/carrinho"
              className="group flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-hoverbg"
            >
              <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full bg-bg-alt text-ink-muted transition-colors group-hover:bg-gold group-hover:text-ink">
                <BagIcon className="h-[18px] w-[18px]" />
                <span
                  className={`absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-[18px] text-ink shadow-xs group-hover:bg-ink group-hover:text-white ${bagPulse ? 'animate-zpulse' : ''}`}
                >
                  {itemCount}
                </span>
              </span>
              <span className="hidden text-xs font-medium tracking-wide text-ink sm:inline">{totalFmt}</span>
            </Link>
          </div>
        </div>

        <div className="relative border-t border-border-subtle">
          <div className="mx-auto flex max-w-[1280px] items-stretch gap-1 overflow-x-auto px-5">
            <div ref={catBoxRef} className="relative">
              <button
                ref={catButtonRef}
                type="button"
                onClick={() => {
                  if (window.matchMedia('(min-width: 768px)').matches) {
                    setCatOpen(o => !o);
                  } else {
                    setMenuOpen(true);
                  }
                }}
                className={`flex flex-none items-center gap-2 whitespace-nowrap py-3 pr-4 text-xs font-medium uppercase tracking-[0.1em] transition-colors ${catOpen ? 'text-gold-text-hover' : 'text-gold-text hover:text-gold-text-hover'}`}
              >
                <MenuIcon className="h-4 w-4" />
                Categorias
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`hidden h-3 w-3 transition-transform duration-300 md:block ${catOpen ? '-rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>

            <span className="my-2 w-px flex-none bg-border-subtle" />
            {categorias.map(c => (
              <Link
                key={c.slug}
                href={`/produtos?categoria=${c.slug}`}
                className="relative flex-none whitespace-nowrap px-3.5 py-3 text-[13px] text-ink-muted transition-colors after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-[2px] after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-gold-text hover:after:scale-x-100"
              >
                {c.nome}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {catOpen && (
        <div
          ref={catPanelRef}
          style={{ top: catPos.top, left: catPos.left }}
          className="fixed z-50 hidden w-[560px] animate-zfade overflow-hidden rounded-xl border border-border-subtle bg-white shadow-lg md:block"
        >
          <div className="grid grid-cols-3 gap-1 p-3">
            {categorias.map(c => (
              <Link
                key={c.slug}
                href={`/produtos?categoria=${c.slug}`}
                onClick={() => setCatOpen(false)}
                className="group flex flex-col items-center gap-2 rounded-lg px-3 py-4 text-center transition-colors hover:bg-hoverbg"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-bg-alt text-gold-text transition-all group-hover:scale-110 group-hover:bg-gold group-hover:text-ink">
                  <CategoryIcon slug={c.slug} className="h-5 w-5" />
                </span>
                <span className="text-[13px] font-medium text-ink">{c.nome}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border-subtle bg-bg-alt px-4 py-2.5">
            <span className="text-[11px] font-light text-ink-tertiary">Não achou o que procurava?</span>
            <Link
              href="/produtos"
              onClick={() => setCatOpen(false)}
              className="text-[11px] font-medium uppercase tracking-wide text-gold-text hover:text-gold-text-hover"
            >
              Ver tudo →
            </Link>
          </div>
        </div>
      )}

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
