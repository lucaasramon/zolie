'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';

interface Categoria {
  nome: string;
  slug: string;
}

export function Footer({ categorias }: { categorias: Categoria[] }) {
  const { user } = useAuth();
  return (
    <footer className="border-t border-border-subtle bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink">
              <Image src="/images/zolie-logo-transparent.png" alt="Zoliê Semijoias" width={30} height={30} className="object-contain" />
            </span>
            <span className="font-serif text-2xl tracking-[0.14em] text-ink">ZOLIÊ</span>
          </div>
          <p className="text-sm font-light text-ink-tertiary">Semijoias em prata 925 e banho de ouro 18k para brilhar todos os dias.</p>
          <div className="flex gap-2 pt-1">
            {['Instagram', 'TikTok', 'WhatsApp'].map(n => (
              <span key={n} className="rounded-full bg-bg-alt px-3 py-1 text-[11px] text-ink-muted">
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-1 font-sans text-sm font-semibold text-ink">Institucional</span>
          <Link href="/sobre" className="text-sm text-ink-muted hover:text-gold-text">Sobre a Zoliê</Link>
          <Link href="/trocas" className="text-sm text-ink-muted hover:text-gold-text">Trocas e devoluções</Link>
          <Link href="/privacidade" className="text-sm text-ink-muted hover:text-gold-text">Política de privacidade</Link>
          <Link href="/faq" className="text-sm text-ink-muted hover:text-gold-text">Perguntas frequentes</Link>
          <Link href="/contato" className="text-sm text-ink-muted hover:text-gold-text">Contato</Link>
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-1 font-sans text-sm font-semibold text-ink">Categorias</span>
          {categorias.slice(0, 6).map(c => (
            <Link key={c.slug} href={`/produtos?categoria=${c.slug}`} className="text-sm text-ink-muted hover:text-gold-text">
              {c.nome}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-1 font-sans text-sm font-semibold text-ink">Minha conta</span>
          <Link href="/login" className="text-sm text-ink-muted hover:text-gold-text">Entrar</Link>
          <Link href="/conta/pedidos" className="text-sm text-ink-muted hover:text-gold-text">Meus pedidos</Link>
          <Link href="/conta/favoritos" className="text-sm text-ink-muted hover:text-gold-text">Favoritos</Link>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm text-ink-muted hover:text-gold-text">Painel administrativo</Link>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Visa', 'Mastercard', 'Elo', 'Pix', 'Boleto'].map(n => (
              <span key={n} className="rounded-full border border-border-soft px-2.5 py-1 text-[10px] text-ink-muted">
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle px-5 py-4 text-center text-[11px] text-ink-tertiary">
        Zoliê Semijoias · CNPJ 00.000.000/0001-00 · Protótipo de demonstração · dados fictícios
      </div>
    </footer>
  );
}
