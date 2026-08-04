'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface HeroBanner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  tag: string | null;
  cta: string | null;
  link: string | null;
  imagem: string | null;
}

const AUTOPLAY_MS = 6000;

export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex(((i % banners.length) + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length < 2 || paused) return;
    timerRef.current = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, paused, banners.length, goTo]);

  if (banners.length === 0) return null;

  const banner = banners[index];

  return (
    <section
      className="relative overflow-hidden bg-ink animate-zfade"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/7] w-full sm:aspect-[21/8]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
            aria-hidden={i !== index}
          >
            {b.imagem && (
              <Image
                src={b.imagem}
                alt={b.titulo}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
            <div className="relative flex h-full w-full items-center">
              <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-3 px-6 sm:gap-5">
                {b.tag && (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#F0E4C4]">{b.tag}</span>
                )}
                <h1 className="max-w-[520px] font-serif text-2xl leading-tight text-white sm:text-4xl">
                  {b.titulo}
                </h1>
                {b.subtitulo && (
                  <p className="hidden max-w-[400px] font-light text-[15px] leading-relaxed text-[#E3D9C4] sm:block">
                    {b.subtitulo}
                  </p>
                )}
                {b.cta && (
                  <Link
                    href={b.link || '/produtos'}
                    className="mt-1.5 rounded-full bg-white px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-ink shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md sm:px-[30px] sm:py-4"
                  >
                    {b.cta}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="relative flex justify-center gap-1.5 pb-5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Ir para o banner ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-[3px] w-[26px] rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/35 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
