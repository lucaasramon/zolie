import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-5 text-center">
      <span className="font-serif text-8xl text-gold/30">404</span>
      <h1 className="font-serif text-3xl font-medium text-ink">Página não encontrada</h1>
      <span className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
      <p className="max-w-md text-sm font-light leading-relaxed text-ink-tertiary">A página que você procura não existe ou foi movida. Que tal continuar navegando pelas nossas peças?</p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-full bg-gold px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover">
          Ir para a home
        </Link>
        <Link href="/produtos" className="rounded-full bg-bg-alt px-6 py-3 text-xs uppercase text-ink-muted shadow-xs hover:shadow-sm">
          Ver ofertas
        </Link>
      </div>
    </div>
  );
}
