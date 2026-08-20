'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { LOJA, linhaIdentificacao, linkWhatsApp, formatarTelefone } from '@/lib/loja';

interface Categoria {
  nome: string;
  slug: string;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.8 9.2c.3 2.6 3.4 5.7 6 6l1.4-1.4-2.1-1.4-1 .7c-.9-.4-1.8-1.3-2.2-2.2l.7-1-1.4-2.1-1.4 1.4Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SELOS = [
  { titulo: 'Compra protegida', texto: 'Dados criptografados' },
  { titulo: 'Troca facilitada', texto: '7 dias para trocar' },
  { titulo: 'Envio para todo o Brasil', texto: 'Com código de rastreio' },
  { titulo: 'Garantia do banho', texto: 'Ouro 18k reforçado' },
];

export function Footer({ categorias }: { categorias: Categoria[] }) {
  const { user } = useAuth();
  const whatsapp = linkWhatsApp('Olá! Vim pelo site da Zoliê.');
  const instagram = LOJA.instagram
    ? `https://instagram.com/${LOJA.instagram.replace(/^@/, '')}`
    : null;

  return (
    <footer className="mt-16">
      {/* Faixa de confiança sobre fundo claro, antes do bloco escuro. */}
      <div className="border-t border-border-subtle bg-white">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-5 py-8 lg:grid-cols-4">
          {SELOS.map(s => (
            <div key={s.titulo} className="flex flex-col gap-1">
              <span className="z-eyebrow !text-[9.5px] !tracking-[0.22em]">{s.titulo}</span>
              <span className="pl-[38px] text-xs font-light text-ink-tertiary">{s.texto}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="z-dark-glow text-[#CFC7B8]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image src="/images/zolie.png" alt="Zoliê Semijoias" width={38} height={48} className="h-12 w-auto object-contain" />
              <span className="flex flex-col gap-0.5">
                <span className="font-serif text-[26px] leading-none tracking-[0.14em] text-white">ZOLIÊ</span>
                <span className="text-[8px] font-light uppercase leading-none tracking-[0.34em] text-gold">semijoias</span>
              </span>
            </div>
            <p className="max-w-[260px] text-sm font-light leading-relaxed text-[#A89F8E]">
              Semijoias em prata 925 e banho de ouro 18k para brilhar todos os dias.
            </p>
            <div className="mt-1 flex gap-2.5">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram da Zoliê"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-[#CFC7B8] transition-all hover:border-gold hover:text-gold"
                >
                  <InstagramIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp da Zoliê"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-[#CFC7B8] transition-all hover:border-gold hover:text-gold"
                >
                  <WhatsIcon className="h-[18px] w-[18px]" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-gold">Institucional</span>
            <Link href="/sobre" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Sobre a Zoliê</Link>
            <Link href="/trocas" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Trocas e devoluções</Link>
            <Link href="/privacidade" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Política de privacidade</Link>
            <Link href="/faq" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Perguntas frequentes</Link>
            <Link href="/contato" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Contato</Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-gold">Categorias</span>
            {categorias.slice(0, 6).map(c => (
              <Link key={c.slug} href={`/produtos?categoria=${c.slug}`} className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">
                {c.nome}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-gold">Minha conta</span>
            <Link href="/login" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Entrar</Link>
            <Link href="/conta/pedidos" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Meus pedidos</Link>
            <Link href="/conta/favoritos" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Favoritos</Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-sm font-light text-[#CFC7B8] transition-colors hover:text-white">Painel administrativo</Link>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Visa', 'Mastercard', 'Elo', 'Pix', 'Boleto'].map(n => (
                <span key={n} className="rounded-md border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-light tracking-wide text-[#A89F8E]">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/8">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-1.5 px-5 py-5 text-center text-[11px] font-light text-[#8B8271]">
            <div>{linhaIdentificacao()}</div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {LOJA.email && (
                <a href={`mailto:${LOJA.email}`} className="text-[#8B8271] transition-colors hover:text-gold">{LOJA.email}</a>
              )}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="text-[#8B8271] transition-colors hover:text-gold">
                  WhatsApp {formatarTelefone(LOJA.whatsapp)}
                </a>
              )}
              <Link href="/termos" className="text-[#8B8271] transition-colors hover:text-gold">Termos de uso</Link>
              <Link href="/privacidade" className="text-[#8B8271] transition-colors hover:text-gold">Privacidade</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
