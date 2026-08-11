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

  return (
    <section
      className="relative overflow-hidden bg-ink animate-zfade"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/8]">
        {banners.map((b, i) => {
          const conteudo = (
            <>
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
            </>
          );
          return (
            <div
              key={b.id}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none' }}
              aria-hidden={i !== index}
            >
              {b.link ? (
                <Link href={b.link} aria-label={b.titulo} className="block h-full w-full">
                  {conteudo}
                </Link>
              ) : (
                conteudo
              )}
            </div>
          );
        })}
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
